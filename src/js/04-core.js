
/* ---------- dataset select ---------- */
const dsSel=$('#ds');
Object.keys(DATASETS).forEach(k=>{
  const d=DATASETS[k];
  const o=document.createElement('option');
  o.value=k;
  /* License口径写在最前面 —— 「仅开源」和「含闭源」两张榜的最高分差 150 分，混看会误判 */
  const lic = d.license==='all' ? T('data.licAll') : T('data.licOS');
  o.textContent=`${lic} ${d.label} · ${d.stats.n}${T('data.optTail')}${d.stats.score_min}–${d.stats.score_max}`;
  dsSel.appendChild(o);
});
dsSel.value=S.ds;

function scoreExtent(){
  const d=DATASETS[S.ds];
  const s=d.models.map(m=>m.s);
  return [Math.min(...s), Math.max(...s)];
}
function loadDataset(resetRange=true){
  const d=DATASETS[S.ds];
  if(resetRange){ const [mn,mx]=scoreExtent(); S.lo=mn; S.hi=mx; }
  S.lo=clamp(S.lo, ...scoreExtent()); S.hi=clamp(S.hi, ...scoreExtent());
  if(S.lo>S.hi)[S.lo,S.hi]=[S.hi,S.lo];
  $('#dsNote').innerHTML=TF('data.dsNote',{meta:d.meta,note:d.note,
    min:d.stats.score_min,max:d.stats.score_max,
    cmin:fmt$(d.stats.cost_min),cmax:fmt$(d.stats.cost_max),
    wc:d.stats.with_cost,n:d.stats.n});
  const [mn,mx]=scoreExtent();
  $('#inLo').min=mn; $('#inLo').max=mx; $('#inHi').min=mn; $('#inHi').max=mx;
  const cs=d.models.filter(m=>m.c!=null).map(m=>m.c);
  $('#maxCost').max=Math.max(20, Math.ceil(Math.max(...cs,1)));
  recompute();
}

/* ---------- filtering + winner logic ---------- */
function candidates(){
  const d=DATASETS[S.ds];
  return d.models.filter(m=>{
    if(S.onlyCost && m.c==null) return false;
    if(S.exPrelim && m.pre) return false;
    if(S.exAuto && m.ae) return false;
    if(m.v!=null && m.v<S.minVotes) return false;
    if(m.c!=null && m.c>S.maxCost) return false;
    return true;
  });
}
function dominates(a,b){ // is a significantly better than b ?
  if(!a||!b) return false;
  if(S.ci==='strict') return a.sLo > b.sHi;
  return a.s > b.s;
}
function inBand(m){ return m.s>=S.lo && m.s<=S.hi; }

/* 门槛制：C(T) = min{ cost : score >= T }
   把Model按分数从高到低扫，只有当它比「已见过的所有更强Model」都cheaper时，才成为一档。
   得到的就是 (score, cost) 平面上的上包络 / 成本-能力 Pareto 前沿：分数越高，成本单调不减。
   每档统治的分数区间 = [下一档分数+1, 本档分数]，即「这个Model是该区间里唯一不被支配的选择」。 */
/* 给每一档标出它**真正统治**的门槛区间。
   推导：门槛为 T 时，达标集合 = {score ≥ T}，赢家 = 其中成本最低者。
   对第 i 档（分数 s_i，下一档更弱更cheaper、分数 s_{i+1}）：
     · T ≤ s_{i+1} 时下一档也达标，而它更cheaper → 赢家是下一档，不是本档；
     · T = s_{i+1}+1 时下一档刚好出局 → 从此起本档获胜；
     · T > s_i 时本档也不达标（除非它是顶档）→ 到 s_i 为止。
   所以 lower = s_{i+1}+1、upper = s_i；顶档 upper = 数据集最高分（门槛再高就是 degraded，
   工具仍返回顶档）；底档 lower = 候选集最低分（比它更弱的Model都更pricier，否则它们也会进前沿）。
   各档首尾相接、无缝无叠，完整覆盖 [候选集最低分, 数据集最高分]。 */
function setBounds(t, floor, mx){
  for(let i=0;i<t.length;i++) t[i].lower = i<t.length-1 ? t[i+1].model.s+1 : floor;
  for(let i=0;i<t.length;i++) t[i].upper = i>0 ? t[i].model.s : mx;
  return t;
}
function buildTiers(cands){
  if(!cands.length) return [];
  const desc=[...cands].sort((a,b)=> b.s-a.s || a.c-b.c);
  /* 区间端点用**滑块口径**（全榜分数域），不是候选集口径：
     被Filters挡掉的Model不参与竞争，但门槛仍能拖到它们的分数上，
     那时赢家还是底档/顶档 —— 标注必须覆盖工具真正能回答的整个范围。 */
  const [floor,mx]=scoreExtent();
  const raw=[]; let bestC=Infinity;
  for(const m of desc){
    if(m.c==null || !(m.c < bestC - 1e-12)) continue;
    bestC=m.c;
    raw.push({model:m, lower:0, upper:m.s});
  }
  setBounds(raw, floor, mx);
  if(S.ci!=='strict') return raw;
  /* 严格模式：若「更强的一档」与「更cheaper的一档」在 95% CI 上不可区分，
     就不该为这份统计噪声多付钱 → 合并，保留更cheaper的那个作为该段代表。 */
  let cur2=raw;
  for(let pass=0; pass<8 && cur2.length>1; pass++){
    const next=[]; let i=0;
    while(i<cur2.length){
      const a2=cur2[i], b2=cur2[i+1];
      if(b2 && !(a2.model.sLo > b2.model.sHi)){ next.push(b2); i+=2; }
      else { next.push(a2); i+=1; }
    }
    if(next.length===cur2.length) break;
    cur2=next;
    setBounds(cur2, floor, mx);
  }
  return cur2;
}
function frontierOf(cands){ return buildTiers(cands).map(t=>t.model); }

function winnerPareto(cands){
  tiers=buildTiers(cands);
  frontier=tiers.map(t=>t.model);
  if(!tiers.length) return null;
  /* tiers[0] = 分数最高的一档；索引越大 = 分数越低、越cheaper */
  /* tiers 按分数降序（tiers[0] 最强最pricier）。达标集合是前缀 tiers[0..k]，
     其中成本随索引单调递减 → 取最后一个达标者 = 满足 T 的最cheaperModel。 */
  let idx = tiers.map(t=>t.model.s>=S.hi).lastIndexOf(true);
  let degraded=false;
  if(idx<0){ idx=0; degraded=true; }                       // 门槛高于数据集最高分
  const w=tiers[idx].model;
  const nxt = idx>0 ? tiers[idx-1].model : null;             // 更强的一档（升级）
  const prv = idx<tiers.length-1 ? tiers[idx+1].model : null;// 更弱但更cheaper的一档（降级）
  let marginal=null;
  if(nxt && nxt.s>w.s && nxt.c>w.c)
    marginal={ds:nxt.s-w.s, dc:nxt.c-w.c, per:(nxt.c-w.c)/(nxt.s-w.s), model:nxt};
  let downStat=null;
  if(prv && w.s>prv.s && w.c>prv.c)
    downStat={ds:w.s-prv.s, dc:w.c-prv.c, per:(w.c-prv.c)/(w.s-prv.s), model:prv};
  const lo2=Math.max(S.lo,w.s), hi2=Math.min(S.hi,w.s);
  const band = lo2<=hi2 ? [lo2,hi2] : [w.s,w.s];
  return {mode:'pareto', w, band, bandOk:lo2<=hi2, degraded, tierIdx:idx,
          covers:[tiers[idx].lower, tiers[idx].upper],
          nxt, marginal, down:prv, downStat};
}
function winnerRatio(cands, useBaseline){
  tiers=[]; frontier=frontierOf(cands);
  const base = useBaseline ? BASELINE : 0;
  const scored=cands.map(m=>({m, val: useBaseline ? (m.s-base)/m.c : m.s/m.c})).filter(x=>isFinite(x.val)&&x.val>0);
  const inb=scored.filter(x=>inBand(x.m));
  const pool = inb.length?inb:scored;
  pool.sort((a,b)=>b.val-a.val);
  if(!pool.length) return null;
  const top=pool[0];
  const ups=cands.filter(m=>m.s>top.m.s && m.c>top.m.c)
    .map(m=>({m, ds:m.s-top.m.s, dc:m.c-top.m.c, per:(m.c-top.m.c)/(m.s-top.m.s)}))
    .sort((a,b)=>a.per-b.per);
  const dns=cands.filter(m=>m.s<top.m.s && m.c<top.m.c)
    .map(m=>({m, ds:top.m.s-m.s, dc:top.m.c-m.c, per:(top.m.s-m.s)/(top.m.c-m.c)}))
    .sort((a,b)=>b.per-a.per);
  return {mode:useBaseline?'baseline':'ratio', w:top.m, val:top.val, base,
          band:[S.lo,S.hi], bandOk:inb.length>0, nxt:ups[0]?ups[0].m:null,
          marginal:ups[0]?{ds:ups[0].ds,dc:ups[0].dc,per:ups[0].per,model:ups[0].m}:null,
          down:dns[0]?dns[0].m:null, downStat:dns[0]?{ds:dns[0].ds,dc:dns[0].dc,per:dns[0].per,model:dns[0].m}:null,
          inBand: inb.length>0};
}

function recompute(){
  adjusted=applyPriceScenario();   // 先把「now的价格」写进 m.c，后面所有逻辑自动跟随
  cur=candidates();
  cur.forEach(m=>{ m.ratio = m.c>0? m.s/m.c : null; });
  cur.forEach(m=>{ m.baseRatio = m.c>0? (m.s-BASELINE)/m.c : null; });
  const front=new Set(frontierOf(cur).map(m=>m.n));
  cur.forEach(m=>m.pareto=front.has(m.n));
  let res=null;
  if(S.mode==='pareto') res=winnerPareto(cur);
  else if(S.mode==='ratio') res=winnerRatio(cur,false);
  else res=winnerRatio(cur,true);
  view=res;
  render();
}
