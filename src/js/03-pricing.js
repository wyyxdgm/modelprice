let cur=null, view=null, tiers=[], frontier=[], adjusted=[];
const BASELINE=1200; // Arena BT 分数的实用地板：低于此基本等于「随机」

/* ==================== 价格情景引擎 ====================
   Arena 榜面的 Price $/M 是「某个时刻的标价」，而标价本身是a function of time：
     · DeepSeek 自 2026-08-16 起峰谷两档价，peak = 工作日 01:00–04:00 与 06:00–10:00 UTC，其余时段（含整个周末）半价
     · GLM-5.3-Flash 榜上仍是首发促销价，促销已于 2026-09-09 结束，现价约为其 3 倍
   Cost/Task = token 用量 × 单价，而 token 用量不随价格变，所以换算 = 按「加权单价比例」缩放榜面成本。
   m.cRaw 永远是榜面原值，任何情景都从它换算 → 切换无损、可反复。 */
const PRICE_EVENTS=[
  {id:'ds_tod', kind:'tod', conf:'official', name:'DeepSeek peak/off-peak pricing',
   windows:[[1,4],[6,10]], weekdaysOnly:true,
   desc:'Peak = weekdays 01:00–04:00 and 06:00–10:00 UTC; all other hours (incl. weekends) are half price. The board lists 20261017 at off-peak and 20260910 / the V4-Pro family at peak — one family, two conventions, one table.',
   src:'DeepSeek official pricing page; confirmed by four independent sources: datacamp / justinmckelvey / felloai / okamomedia',
   entries:{
     'DeepSeek-V4.1-Flash-20261017 (Max)':{listed:'off', peak:[0.30,1.20], off:[0.15,0.60]},
     'DeepSeek-V4.1-Flash-20260910 (Max)':{listed:'peak',peak:[0.30,1.20], off:[0.15,0.60]},
     'DeepSeek-V4-Pro':                   {listed:'peak',peak:[1.32,3.96], off:[0.66,1.98]},
     'DeepSeek-V4-Pro (High, 20260813)':  {listed:'peak',peak:[1.32,3.96], off:[0.66,1.98]},
     'DeepSeek-V4-Pro Preview (High)':    {listed:'peak',peak:[1.32,3.96], off:[0.66,1.98]}}},
  {id:'glm_promo', kind:'date', conf:'official', name:'GLM-5.3-Flash launch promo expired', date:'2026-09-09',
   desc:'Launch promo ended 2026-09-09: $0.05/$0.18 → $0.15/$0.50. The board (11-11 snapshot) still uses the promo price, so its $0.15 Cost/Task is really ~$0.44.',
   src:'benchr.org/pricing (2026-09-11 snapshot, states the promo end date)',
   entries:{'GLM-5.3-Flash':{listed:'before', before:[0.05,0.18], after:[0.15,0.50]}}},
  {id:'gem_dec1', kind:'date', conf:'official', future:true, name:'Gemini 4 Carbon/Argon hike on 12-01 (announced)', date:'2026-12-01',
   desc:'Intro pricing $2/$10 ends 2026-11-30; from 12-01 it is $4/$20 with cache read price $0.10 → $0.20. The board (11-11 snapshot) uses intro pricing. Drag the pricing date into December to watch Carbon collapse out of the overall_all frontier.',
   src:'Google Gemini API pricing page (benchlm.ai / munderdiffl.in / datastudios.org all agree; checked 2026-11-12/13)',
   entries:{
     'Gemini 4 Carbon (High)':{listed:'before',before:[2,10],after:[4,20]},
     'Gemini 4 Argon (High)': {listed:'before',before:[2,10],after:[4,20]}}},
  {id:'ds_v4flash', kind:'tod', conf:'suspected', name:'Does DeepSeek V4-Flash also split peak/off-peak? (uncertain)',
   windows:[[1,4],[6,10]], weekdaysOnly:true,
   desc:'V4-Flash is retired; public sources only confirm peak/off-peak pricing for V4.1-Flash and V4-Pro. Off by default — tick only for sensitivity analysis.',
   src:'insufficient evidence',
   entries:{
     'DeepSeek-V4-Flash (High)':        {listed:'peak',peak:[0.30,1.20],off:[0.15,0.60]},
     'DeepSeek-V4-Flash Preview (High)':{listed:'peak',peak:[0.30,1.20],off:[0.15,0.60]}}},
  {id:'suspect2x', kind:'date', conf:'suspected', name:'2× off vs a third-party index, no promo explanation (uncertain)', date:'2026-09-11',
   desc:'Mistral Medium 3.5 ($0.75/$3.75 vs index $1.50/$7.50) and GPT-6 Sol ($1/$5 vs $2/$10) are listed at exactly half of a third-party index. Could be a promo, or the index is stale. Off by default.',
   src:'benchr.org/pricing comparison',
   entries:{
     'Mistral Medium 3.5':{listed:'before',before:[0.75,3.75],after:[1.50,7.50]},
     'GPT-6 Sol (Max)':   {listed:'before',before:[1.00,5.00],after:[2.00,10.00]}}}
];
S.evState={}; PRICE_EVENTS.forEach(e=>{ S.evState[e.id] = (e.conf==='official'); });
S.hour=new Date().getUTCHours();          // 默认就是「now」
S.dow=new Date().getUTCDay();             // 0=Sun
S.dateISO=DATA.scraped;                   // 默认对齐数据快照日
S.outShare=1/12;                          // Output token share：Agent 榜实测输入/输出比中位约 11×
S.cacheHit=0.95;                            // Cache hit rate，默认 95%（agent 循环重读同一前缀的常见水平）
S.cacheSrc='pub';                           // Cache read-price source：pub=公布价 / flat=一律 10% / off=关闭
S.tz=0;                                   // 显示用时区偏移（小时）

/* 加权单价。Cost/Task = token 用量 × 单价，用量不随价格变，
   所以任何价格修正都能折算成「加权单价的比例」：w = Output token share。 */
function blend(pin,pout){ return pin*(1-S.outShare)+pout*S.outShare; }
function isPeakAt(ev,hour,dow){
  if(ev.weekdaysOnly && (dow===0||dow===6)) return false;
  return ev.windows.some(w=> hour>=w[0] && hour<w[1]);
}

/* ==================== 缓存折扣 ====================
   关键前提：Arena 的 Cost/Task 用的是**未命中（cache-miss）标价**——
   Agent 榜反推能对上 $4/$20 这类原价就是证据。所以榜面成本对「前缀会被反复重读」的
   agent 负载是系统性高估的，缓存折扣是往真实账单方向的修正。

   缓存只作用于**输入** token（输出永远不可能命中）。各家的「缓存读取价」都是其
   **输入标价的固定比例**，所以这里存比例而不是绝对值 —— 峰谷价、促销到期、未来涨价
   都会自动带着缓存价一起变（例：DeepSeek off-peak输入 $0.15，缓存价自动就是 $0.003）。

   写入倍率 wm：Anthropic（5 分钟档）与 OpenAI（30 分钟档）的缓存写入**单独计费**，
   = 输入价的 1.25×，未命中的那部分 token 要按写入价付；
   DeepSeek / Z.ai / 小米 / 腾讯 / Google（隐式缓存，不支持显式创建）/ xAI 不单独收写入费 → 1.0×。 */
const CACHE_RATIO={
  /* DeepSeek：cache-hit = cache-miss 的 2%（V4.1-Flash）/ 3.33%（V4-Pro），峰谷同比例 */
  'DeepSeek-V4.1-Flash-20261017 (Max)':0.02, 'DeepSeek-V4.1-Flash-20260910 (Max)':0.02,
  'DeepSeek-V4-Flash (High)':0.02,           'DeepSeek-V4-Flash Preview (High)':0.02,
  'DeepSeek-V4-Pro':0.0333, 'DeepSeek-V4-Pro (High, 20260813)':0.0333, 'DeepSeek-V4-Pro Preview (High)':0.0333,
  /* Moonshot Kimi：$0.20/$2、$0.30/$3 → 10%；K2.6 $0.16/$0.95 → 16.8%；K2.7 Code $0.19/$0.95 → 20% */
  'Kimi K3.1 Pro (Max)':0.10, 'Kimi K3 (Max)':0.10, 'Kimi K2.6':0.168, 'Kimi K2.7 Code':0.20,
  /* Z.ai GLM：$0.26/$1.40 → 18.6%；GLM-5.3-Flash $0.03/$0.15 → 20%；GLM-4.7 $0.11/$0.60 → 18.3% */
  'GLM-5.3 (Max)':0.186, 'GLM-5.2 (Max)':0.186, 'GLM-5.1':0.186, 'GLM-5.3-Flash':0.20, 'GLM-4.7':0.183,
  /* 小米 MiMo：99% 折扣，$0.0028/$0.14、$0.0036/$0.435 */
  'MiMo-V2.6-Flash':0.02, 'MiMo-V2.6-Pro':0.0083, 'MiMo-V2.5-Pro':0.0083,
  /* 腾讯 Hy3：cache read $0.033 / input $0.132 → 25% */
  'Hy3':0.25,
  /* Anthropic：Opus/Sonnet 5.5 读取 = 输入的 5%，Haiku 5.5 与 Opus 5 = 10%，Fable 系列 = 2.5% */
  'Claude Opus 5.5 (Max)':0.05, 'Claude Sonnet 5.5 (xHigh)':0.05, 'Claude Sonnet 5.5 (High)':0.05,
  'Claude Haiku 5.5 (High)':0.10, 'Claude Opus 5 (Max)':0.10, 'Claude Opus 5 (High)':0.10,
  'Claude Fable 5.2 (xHigh)':0.025, 'Claude Fable 5.1 (Max)':0.025, 'Claude Fable 5 (High)':0.025,
  /* OpenAI：GPT-6.1 Sol/Terra 读取 = 5%，GPT-6 Sol/Astra = 10% */
  'GPT-6.1 Sol (Max)':0.05, 'GPT-6.1 Terra (Max)':0.05, 'GPT-6 Sol (Max)':0.10, 'GPT-6 Astra (Max)':0.10,
  /* Google Gemini 4：$0.10/$2、$0.075/$1.50 → 5%（隐式缓存，≥4096 token 自动生效） */
  'Gemini 4 Argon (High)':0.05, 'Gemini 4 Carbon (High)':0.05, 'Gemini 4 Hydrogen (High)':0.05,
  /* xAI Grok：$0.50/$2 → 25%（≥200K 提示词另有一档 $1/$4，比例不变） */
  'Grok 4.7 (xHigh)':0.25, 'Grok 4.6 (High)':0.25,
  /* Mistral Large 4：$0.07/$0.68 → 10.3% */
  'Mistral Large 4':0.103
};
const CACHE_FALLBACK=0.10;   // 没查到公布价时的行业惯例：读取价 = 输入价的 10%
const CACHE_SRC={pub:'Published cache prices (missing → 10% estimate)', flat:'Flat 10% of input price for all (uniform conservative)', off:'Disable cache discount (= Arena board prices)'};
function cacheRatioOf(m){
  if(S.cacheSrc==='off') return null;
  if(S.cacheSrc==='flat') return {r:CACHE_FALLBACK, est:true};
  if(CACHE_RATIO[m.n]!=null) return {r:CACHE_RATIO[m.n], est:false};
  return {r:CACHE_FALLBACK, est:true};
}
function writeMultOf(m){ return /^(Claude|GPT-)/.test(m.n)?1.25:1.0; }

/* 解析某Model在 (hour, dow, dateISO) 的**标价**（峰谷 / 促销到期 / 已公告的未来涨价）。
   entries 里的 listed 描述的就是榜面显示的那一档，所以直接取目标档的绝对值。 */
function listPricesAt(m,hour,dow,dateISO){
  let pin=m.pinRaw, pout=m.poutRaw; const hits=[];
  if(pin==null||pout==null) return {pin,pout,hits};
  for(const ev of PRICE_EVENTS){
    if(!S.evState[ev.id]) continue;
    const e=ev.entries[m.n]; if(!e) continue;
    let want,listed,tag;
    if(ev.kind==='tod'){
      const pk=isPeakAt(ev,hour,dow);
      want=pk?e.peak:e.off; listed=(e.listed==='peak')?e.peak:e.off; tag=pk?'peak':'off-peak';
    }else{
      const after=String(dateISO)>=ev.date;
      want=after?e.after:e.before; listed=(e.listed==='after')?e.after:e.before;
      tag=ev.future?(after?'in effect':'not yet in effect'):(after?'after promo':'promo period');
      if(ev.future&&!after) continue;              // 未来事件在未生效时对List price没有修正意义
    }
    if(want[0]===listed[0]&&want[1]===listed[1]) continue;
    pin=want[0]; pout=want[1];
    hits.push({id:ev.id,name:ev.name,tag,listed,want,
               kIn:want[0]/listed[0], kOut:want[1]/listed[1]});
  }
  return {pin,pout,hits};
}
/* 某Model在 (hour, dow, dateISO) + 当前缓存口径下，榜面成本应乘的系数。
   分母恒为「榜面标价、不含缓存折扣」的加权单价 —— 因为 cRaw 就是这么算出来的。 */
function priceScale(m,hour,dow,dateISO){
  if(m.cRaw==null||m.pinRaw==null||m.poutRaw==null) return {scale:1,hits:[],cache:null};
  const L=listPricesAt(m,hour,dow,dateISO);
  const board=blend(m.pinRaw,m.poutRaw);
  if(!(board>0)) return {scale:1,hits:L.hits,cache:null};
  const cr=cacheRatioOf(m);
  let pinEff=L.pin, cache=null;
  if(cr){
    const wm=writeMultOf(m), h=S.cacheHit;
    pinEff=(1-h)*L.pin*wm + h*L.pin*cr.r;
    cache={r:cr.r,est:cr.est,wm,h,pc:L.pin*cr.r,pin:L.pin};
  }
  const scale=blend(pinEff,L.pout)/board;
  return {scale,hits:L.hits,cache};
}
/* 某Model一周 168 小时里的成本波动区间（与当前 T、Filters无关） */
function weekSpan(m){
  if(m.cRaw==null) return null;
  let lo=Infinity,hi=-Infinity,loAt=null,hiAt=null;
  for(let i=0;i<168;i++){ const {dow,hour}=dowHourOf(i);
    const c=m.cRaw*priceScale(m,hour,dow,S.dateISO).scale;
    if(c<lo){lo=c;loAt={dow,hour};} if(c>hi){hi=c;hiAt={dow,hour};} }
  return {lo,hi,loAt,hiAt,spread:lo>0?hi/lo:1};
}
/* 把当前情景写回全部Model的 m.c（m.cRaw 不动）。返回本数据集里被修正的Model。 */
function applyPriceScenario(){
  const adj=[];
  for(const k in DATASETS) for(const m of DATASETS[k].models){
    if(m.cRaw==null){ m.c=null; m.adj=null; continue; }
    const r=priceScale(m,S.hour,S.dow,S.dateISO);
    m.c=(Math.abs(r.scale-1)<1e-12)?m.cRaw:m.cRaw*r.scale;
    m.adj=(r.hits.length||r.cache)?{scale:r.scale,hits:r.hits,cache:r.cache}:null;
    if(m.adj&&k===S.ds) adj.push(m);
  }
  return adj;
}

/* 纯函数：某时刻下「分数 ≥ T 的最cheaperModel」。时间轴图逐小时调用它，不碰全局状态。 */
function cheapestAt(T,models,hour,dow,dateISO){
  let best=null;
  for(const m of models){
    if(m.s==null||m.s<T||m.cRaw==null) continue;
    const {scale}=priceScale(m,hour,dow,dateISO);
    const c=m.cRaw*scale;
    if(!best||c<best.c-1e-12||(Math.abs(c-best.c)<=1e-12&&m.s>best.m.s)) best={m,c,scale};
  }
  return best;
}
