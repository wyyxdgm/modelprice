// analytics.js — pageview + mp_* event tracking (Umami Cloud via first-party proxy)
//
// Playbook from autorev scripts/umami-onboard.sh (D-025 games/tools/cozy 同族): all damolabs
// sites share one Umami Cloud website (Hobby free tier = 1 website), distinguished by hostname
// (modelprice.damolabs.app). Events carry an `mp_` prefix so they never pollute the other
// sites' funnels in the shared dashboard. Injects the official tracker at DOM ready and
// reports over same-origin paths (/js/script.js + /api/send — both reverse-proxied to
// cloud.umami.is in the wd vhost):
//   ① CSP is script-src/connect-src 'self' — a third-party host would be blocked
//   ② bare analytics.*/umami script names are blocked by uBlock/Brave (20-40% loss)
// Until window.umami exists every call is a no-op, so this site never waits on or breaks for it.
// Privacy: aggregate-only, cookieless, no personal data.
// Events (EXP-006 判读指标，见 autorev EXPERIMENTS.md §EXP-006):
//   mp_share_click    — 分享栏（X / Reddit / Copy state link）点击，props.channel = x|reddit|copy
//   mp_calc_complete  — W1 包月 vs API 计算器完成测算时上报（现留桩，见下方 mpCalcComplete）
(function () {
  'use strict';

  function track(name, props) {
    try {
      if (window.umami && typeof window.umami.track === 'function') {
        window.umami.track(name, props || undefined);
      }
    } catch (e) { /* analytics must never break the page */ }
  }
  window.mpTrack = track;

  /* W1 接入点（autorev docs/modelprice-plan.md §W1「包月 vs API 回本计算器」）：
     计算器完成一次测算（用户拿到结论卡）时调用：
       window.mpCalcComplete({ preset: 'dev', monthly: 20 });
     现阶段计算器未上线，此函数为预留桩 —— 先定义事件名与调用面，W1 只需在
     结论卡渲染处补一次调用，事件名即与 EXP-006 预注册一致（mp_calc_complete）。 */
  window.mpCalcComplete = function (props) {
    track('mp_calc_complete', props);
  };

  // Umami Cloud 控制台 → Websites → Website ID（与 cozy/games/tools 共用，见文件头注释）
  var CONFIG = { websiteId: 'ec8b8203-6e94-4b70-8d4f-1ea1bec11c31', scriptPath: '/js/script.js' };

  function injectTracker() {
    if (!CONFIG.websiteId) return;                    // 未配置 → 完全静默
    if (document.getElementById('site-tracker')) return;
    var s = document.createElement('script');
    s.id = 'site-tracker';
    s.defer = true;
    s.src = CONFIG.scriptPath;
    s.setAttribute('data-website-id', CONFIG.websiteId);
    // Umami Cloud 脚本默认上报 gateway.umami.is（跨域）→ 被 CSP connect-src 'self' 拦截
    // 全部丢弃。data-host-url 钉到本站 origin，让上报走同源 /api/send（vhost 已反代）。
    s.setAttribute('data-host-url', location.origin);
    s.onerror = function () { /* analytics down → page keeps working */ };
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTracker);
  } else {
    injectTracker();
  }
})();
