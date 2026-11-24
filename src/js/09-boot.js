
/* ---------- static text ---------- */
$('#scraped').textContent=DATA.scraped; $('#captured').textContent=DATA.captured;
/* 两段大正文（Methodology / Sources）从 per-locale 字典取（构建时由 src/i18n/boot|source/<locale>.html 填入），
   正文里的 %SCRAPED% / %CAPTURED% 在运行时替换为数据快照日期。 */
const bootSub=s=>String(s).replace(/%SCRAPED%/g,DATA.scraped).replace(/%CAPTURED%/g,DATA.captured);
$('#methodBody').innerHTML=bootSub(T('boot.methodBody'));

$('#sourceBody').innerHTML=bootSub(T('boot.sourceBody'));

/* ---------- url state ---------- */
(function(){
  const p=new URLSearchParams(location.search);
  if(p.get('ds')&&DATASETS[p.get('ds')])S.ds=p.get('ds');
  if(p.get('mode'))S.mode=p.get('mode');
  if(p.get('ci'))S.ci=p.get('ci');
  dsSel.value=S.ds; syncSeg($('#mode'),S.mode); syncSeg($('#ci'),S.ci); setModeHint();
  $('#exPrelim').checked=S.exPrelim=p.get('pre')==='1';
  loadDataset(true);
  if(p.get('hr')!=null) S.hour=clamp(+p.get('hr')||0,0,23);
  if(p.get('dow')!=null) S.dow=clamp(+p.get('dow')||0,0,6);
  if(p.get('date')&&/^\d{4}-\d{2}-\d{2}$/.test(p.get('date'))) S.dateISO=p.get('date');
  if(p.get('os')!=null) S.outShare=clamp((+p.get('os')||0)/100,0,1);
  if(p.get('tz')!=null) S.tz=+p.get('tz')||0;
  if(p.get('ch')!=null) S.cacheHit=clamp((+p.get('ch')||0)/100,0,1);
  if(p.get('cs')&&CACHE_SRC[p.get('cs')]) S.cacheSrc=p.get('cs');
  if(p.get('ev')!=null){ const on=new Set(p.get('ev').split(',').filter(Boolean));
    PRICE_EVENTS.forEach(e=>{ S.evState[e.id]=on.has(e.id); }); }
  /* —— 排行榜页签状态（tab=rank|deep；rk=画像预设；ri/ro=画像 in/out k；rd=每天次数；rt=质量门槛；rp=时段快捷） —— */
  if(p.get('tab')==='deep'||p.get('tab')==='rank'){ S.tab=p.get('tab');
    /* 10-rank 的初始显隐在更早加载时就按默认 rank 落了 DOM；URL 改了 S.tab 必须重 apply，
       且要在下方 rAF 首渲之前 —— 深视图容器隐藏时量不到宽度。 */
    if(typeof applyTabUI==='function') applyTabUI(); }
  if(p.get('rk')&&(['light','dev','heavy','board','custom'].includes(p.get('rk')))) S.rankPreset=p.get('rk');
  if(p.get('ri')!=null) S.rankIn=Math.max(0,+p.get('ri')||0);
  if(p.get('ro')!=null) S.rankOut=Math.max(0,+p.get('ro')||0);
  if(p.get('rd')!=null) S.rankPerDay=Math.max(1,+p.get('rd')||1);
  if(p.get('rp')&&['now','peak','off'].includes(p.get('rp'))){
    S.rankPk=p.get('rp');
    if(S.rankPk==='now'){ S.hour=new Date().getUTCHours(); S.dow=new Date().getUTCDay(); }
    else if(S.rankPk==='peak'){ S.hour=2; S.dow=3; }
    else { S.hour=12; S.dow=6; }
  }
  if(p.get('rt')!=null){ S.rankT=+p.get('rt')||0; S.rankTSet=true; }
  /* 一键场景（与首屏卡片共用 SCENARIOS/applyScene）：?scene=coding|agent|offpeak */
  if(p.get('scene')) applyScene(p.get('scene'));
  syncPriceUI();
  if(p.get('lo')&&p.get('hi')){ S.lo=+p.get('lo'); S.hi=+p.get('hi'); }
  /* 首渲延到首帧（布局稳定后再量容器宽）：fresh navigation 下同步首渲会在预布局期量错宽度。
     图表宽渲染在 render 内部，recompute 的数据计算不依赖布局，rAF 只挪渲染时机。 */
  const onResize=()=>{
    if(typeof window==='undefined'||!window.addEventListener) return;
    let t=null;
    window.addEventListener('resize',()=>{ clearTimeout(t); t=setTimeout(()=>{ if(cur)render(); },180); });
  };
  if(typeof requestAnimationFrame==='function')
    requestAnimationFrame(()=>{ recompute(); onResize(); });   // 首帧后再渲：布局稳定，量宽不再错
  else{
    recompute(); onResize();
  }
})();

/* ---------- responsive boot ----------
   手机（≤720px）：答案区已用 CSS order 沉到控制台之前，这里再把控制台分组全部收起，
   需要时展开 —— 首屏只看到 header + 赢家卡 + 图表。宽屏恢复 HTML 里的默认开合状态。
   window/matchMedia 都做了存在性守卫，fake DOM 测试环境直接跳过。 */
(function(){
  const grps=document.querySelectorAll('.panel details.grp');
  grps.forEach(d=>{ d.dataset.dopen=d.hasAttribute('open')?'1':'0'; });
  const method=document.getElementById('method');
  if(typeof matchMedia==='undefined') return;
  const mq=matchMedia('(max-width:720px)');
  const apply=()=>{
    grps.forEach(d=>{ d.open = !mq.matches && d.dataset.dopen==='1'; });
    /* 页面级「Methodology」大折叠：手机同样默认收起，宽屏保持 HTML 的 open */
    if(method) method.open = !mq.matches;
  };
  apply();
  if(mq.addEventListener) mq.addEventListener('change',apply);
  else if(mq.addListener) mq.addListener(apply);
})();

/* ---------- 语言切换器 query 增强（渐进增强，无 JS 时静态链接照常工作） ----------
   切换语言时把当前 URL query（ds/mode/lo/hi… 全部状态）带到目标 locale 页，
   用户切语言不丢分析状态。首页 pathname 前缀互换：/ ↔ /zh/ 等。 */
(function(){
  const nav=document.getElementById('langNav');
  if(!nav||typeof window==='undefined'||!window.addEventListener) return;
  const q=location.search;
  if(!q) return;
  nav.querySelectorAll('a[data-locale-path]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      location.href=a.dataset.localePath+q;
    });
  });
})();

