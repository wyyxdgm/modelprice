#!/usr/bin/env bash
# deploy.sh — modelprice.damolabs.app 构建 + 部署 + 冒烟（纯静态）
# 用法：scripts/deploy.sh [--verify-only]
#   默认          本地构建（src/ → dist/）→ rsync 到 wd → 冒烟
#   --verify-only 不部署，只对线上跑冒烟清单
# 环境变量 SMOKE_RESOLVE=<ip>：冒烟 curl 全部加 --resolve（本机 DNS 负缓存时绕过解析）
# 前置（一次性，已随 2026-11-21 首次上线完成）：
#   DNS  NameSilo A modelprice.damolabs.app -> <DEPLOY-SERVER-IP>
#   SSL  ssh wd '~/.acme.sh/acme.sh --issue --dns dns_namesilo -d modelprice.damolabs.app --server letsencrypt'
#        ssh wd '~/.acme.sh/acme.sh --install-cert -d modelprice.damolabs.app --ecc
#                --key-file /var/www/ssl/modelprice.damolabs.app.key
#                --fullchain-file /var/www/ssl/modelprice.damolabs.app.pem
#                --reloadcmd "nginx -s reload"'
#   vhost scp docs/deploy/modelprice.damolabs.app.conf wd:/www/server/nginx/conf/vhost/ && nginx -s reload
# 回滚（各自独立可撤）：
#   ssh wd 'rm /www/server/nginx/conf/vhost/modelprice.damolabs.app.conf && nginx -t && nginx -s reload'
#   ssh wd '~/.acme.sh/acme.sh --uninstall-cert -d modelprice.damolabs.app --ecc && rm -f /var/www/ssl/modelprice.damolabs.app.{pem,key}'
#   NameSilo API dnsDeleteRecord（host=modelprice）
set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="wd:/www/wwwroot/modelprice.damolabs.app/"
DOMAIN="https://modelprice.damolabs.app"
mode="${1:-deploy}"

if [[ "$mode" != "--verify-only" ]]; then
  # 构建产物（dist/ 不进 git —— 仓库里只有源；每次发版从 src/ 重建）
  python3 scripts/build_page.py
  python3 build_site.py "$DOMAIN"
  # 部署 = dist/ 整目录（index.html + assets/ + data/v1/all.json + method.html + llms/robots/sitemap）
  rsync -az --delete dist/ "$TARGET" && echo "✅ rsync dist/ → $TARGET"
fi

fail=0
smoke_curl() {
  if [[ -n "${SMOKE_RESOLVE:-}" ]]; then
    curl --resolve "modelprice.damolabs.app:443:$SMOKE_RESOLVE" "$@"
  else
    curl "$@"
  fi
}
check() { local code; code=$(smoke_curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$1") || true; [[ "$code" == "$2" ]] || { echo "❌ $3: $code (期望 $2)"; fail=1; } } || true
B=https://modelprice.damolabs.app

# ① 验收清单：首页 / assets / method / all.json / llms.txt / robots.txt / sitemap 全 200
check "$B/" 200 home
check "$B/assets/style.css" 200 css
check "$B/assets/js/01-util.js" 200 js-first
check "$B/assets/js/09-boot.js" 200 js-last
check "$B/method.html" 200 method
check "$B/data/v1/all.json" 200 alljson
check "$B/llms.txt" 200 llms
check "$B/robots.txt" 200 robots
check "$B/sitemap.xml" 200 sitemap

# ② 首页 title + 新工程结构确认（外链 assets；DATA JSON 内嵌）
home=$(smoke_curl -s --max-time 20 "$B/")
echo "$home" | grep -o '<title>[^<]*</title>' | head -1 | grep -q 'Arena Leaderboard Value Analyzer' \
  || { echo "❌ 首页 title 不含工具名"; fail=1; }
n=$(echo "$home" | grep -c 'src="/assets/js/' || true)
[[ "$n" -ge 9 ]] || { echo "❌ 首页外链 js 引用数异常: $n (期望 ≥9)"; fail=1; }
echo "$home" | grep -q '<script id="DATA" type="application/json">' \
  || { echo "❌ 首页缺 DATA JSON 块"; fail=1; }

# ③ CSP 已收紧：script-src 必须是 'self' 且不含 unsafe-inline（style-src 的 unsafe-inline 是允许的——win 卡有内联 style 属性）
csp=$(smoke_curl -s -o /dev/null -D - --max-time 20 "$B/" | grep -i '^content-security-policy:' | head -1) || true
echo "$csp" | grep -q "script-src 'self'" || { echo "❌ CSP 缺 script-src 'self': $csp"; fail=1; }
ss=$(echo "$csp" | sed -n 's/.*script-src \([^;]*\).*/\1/p')
[[ "$ss" == *'unsafe-inline'* ]] && { echo "❌ script-src 仍含 unsafe-inline: $csp"; fail=1; } || true

# ④ all.json 可解析且 boards=7、models=338
js=$(smoke_curl -s --max-time 20 "$B/data/v1/all.json")
echo "$js" | python3 -c "
import json,sys
d=json.load(sys.stdin)
bs=d['leaderboards'] if 'leaderboards' in d else d.get('boards',[])
n=len(bs)
m=sum(len(b.get('models',[])) for b in bs)
print(f'  all.json: boards={n} models={m}')
sys.exit(0 if n==7 and m==338 else 1)
" || { echo "❌ all.json 解析/计数不符（期望 boards=7 models=338）"; fail=1; }

# ⑤ 证书链无告警（curl -v 无 SSL error 即通过，--fail 挂了会非零）
smoke_curl -s --max-time 20 -o /dev/null "$B/" || { echo "❌ TLS/请求失败"; fail=1; }

# ⑥ 产物内绝对 URL 指向最终域名（防 build 带错域名上线）
u=$(smoke_curl -s --max-time 20 "$B/sitemap.xml" | grep -c 'https://modelprice.damolabs.app' || true)
[[ "$u" -ge 3 ]] || { echo "❌ sitemap.xml 绝对 URL 数异常: $u"; fail=1; }

[[ $fail -eq 0 ]] && echo "🎉 冒烟全过" || { echo "💥 冒烟有失败项"; exit 1; }
