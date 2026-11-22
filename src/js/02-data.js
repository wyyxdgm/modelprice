/* ---------- model objects ---------- */
function hydrate(rows){
  return rows.map(a=>{
    const o={}; F.forEach((k,i)=>o[k]=a[i]);
    o.sLo=o.s-o.d95; o.sHi=o.s+o.u95;
    o.ratio = o.c>0 ? o.s/o.c : null;
    /* 榜面原始值：Arena 页面显示的那一版价格。所有时段/日期修正都从这里换算，
       永远不覆盖 cRaw —— 这样切换情景是无损的、可反复的。 */
    o.cRaw=o.c; o.pinRaw=o.pin; o.poutRaw=o.pout;
    return o;
  });
}
const DATASETS={};
for(const k in DATA.datasets){
  const d=DATA.datasets[k];
  DATASETS[k]={...d, models:hydrate(d.rows).filter(m=>m.s!=null)};
}

/* ---------- state ---------- */
const S={ds:'overall_os', mode:'pareto', ci:'point', lo:0, hi:1, minVotes:0, exPrelim:false, exAuto:true, onlyCost:true,
         maxCost:Infinity, sortKey:'s', sortDir:-1, base:null, playing:false};
