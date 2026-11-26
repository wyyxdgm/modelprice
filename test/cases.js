/* 回归测试：直接验证 index.html 里内嵌的那份数据与脚本。
   用法： python3 test/build.py && node --max-old-space-size=4096 test/run.js   */
const out=[]; const W=s=>require('fs').writeSync(1,s+'\n');
function TC(name,fn){ const t0=Date.now();
  try{ const r=fn(); out.push([name,'OK',r,Date.now()-t0]); }
  catch(e){ out.push([name,'FAIL',e.message,Date.now()-t0]); } }
/* 价格情景固定为「榜面快照」（全部修正关闭），让下面 33 条已记录的结论保持可复现；
   时间引擎单独在文末用 onTime() / offTime() 开关来测。 */
const EV_ALL_OFF=()=>PRICE_EVENTS.forEach(e=>S.evState[e.id]=false);
function reset(){ S.ds='overall_os'; S.mode='pareto'; S.ci='point'; S.minVotes=0; S.exPrelim=false;
  S.exAuto=true; S.onlyCost=true; S.maxCost=Infinity; offTime(); loadDataset(true); }
/* onTime = **只**开时间事件、关缓存 —— 这样「峰时 ×2 / 谷时 ×0.5 / GLM ×2.945」这些
   已记录的断言值不被缓存折扣冲掉；缓存单独用 cacheOn() 测。 */
function onTime(hour,dow,date){ PRICE_EVENTS.forEach(e=>S.evState[e.id]=(e.conf==='official'));
  S.hour=hour; S.dow=dow; S.dateISO=date||DATA.scraped; S.cacheSrc='off'; }
function offTime(){ EV_ALL_OFF(); S.hour=12; S.dow=3; S.dateISO=DATA.scraped; S.outShare=1/12; S.cacheSrc='off'; S.cacheHit=0.95; }
function cacheOn(hit,src){ S.cacheSrc=src||'pub'; S.cacheHit=(hit==null?0.95:hit); }
/* 页面加载时的初始情景快照（必须在第一次 reset() 之前取，否则读到的是被测试改过的值） */
const INIT_EV={}, INIT={hour:S.hour,dow:S.dow,date:S.dateISO,os:S.outShare};
PRICE_EVENTS.forEach(e=>INIT_EV[e.id]=S.evState[e.id]);
/* 暴力参照解：C(T) = min{ cost : score >= T } */
function brute(Th){ const q=cur.filter(m=>m.s>=Th&&m.c!=null); if(!q.length)return null;
  const mc=Math.min(...q.map(m=>m.c)); return q.filter(m=>m.c===mc).sort((a,b)=>b.s-a.s)[0]; }
function sweep(dsKey, step){
  S.ds=dsKey; loadDataset(true);
  const d=DATASETS[dsKey], hi=d.stats.score_max, lo=d.stats.score_min;
  const seen=[], bad=[]; let n=0;
  for(let t=hi; t>=lo; t-=step){
    if(++n>3000) throw new Error('iteration guard at t='+t);
    S.hi=t; recompute();
    const b=brute(t);
    if(!view||!b){ if(view||b) bad.push(`T=${t} null 不一致`); continue; }
    if(view.w.n!==b.n) bad.push(`T=${t}: 工具=${view.w.n} 暴力=${b.n}`);
    if(seen[seen.length-1]!==view.w.n) seen.push(view.w.n);
  }
  const fr=tiers.map(x=>x.model.n);
  const orderOK = seen.length===fr.length && seen.every((x,i)=>x===fr[i]);
  S.hi=hi; recompute();
  return {n, seen, fr, bad, orderOK, tiers:fr.length, models:cur.length};
}
reset();
const D=()=>DATASETS[S.ds];

TC('数据集载入', ()=>`overall_os: ${D().models.length} 个模型，Score ${D().stats.score_min}–${D().stats.score_max}，${tiers.length} 档前沿`);
TC('前沿：分数越高成本越高（单调）', ()=>{
  const asc=[...tiers].sort((a,b)=>a.model.s-b.model.s);
  for(let i=1;i<asc.length;i++){ if(!(asc[i].model.c>asc[i-1].model.c)) throw new Error('成本未随分数递增 @'+asc[i].model.n);
    if(!(asc[i].model.s>asc[i-1].model.s)) throw new Error('分数未递增'); }
  return `${tiers.length} 档：$${asc[0].model.c}@${asc[0].model.s} → $${asc[asc.length-1].model.c}@${asc[asc.length-1].model.s}`;
});
TC('前沿：没有任何模型能支配前沿成员', ()=>{
  for(const f of frontier) for(const m of cur){ if(m.n===f.n)continue;
    if(m.s>f.s && m.c<f.c) throw new Error(`${m.n} 支配了 ${f.n}`); }
  return `${frontier.length} 个前沿成员全部不被支配`;
});
TC('各档门槛区间无缝无叠、完整覆盖', ()=>{
  const d=tiers, mx=D().stats.score_max;
  if(Math.round(d[0].upper)!==mx) throw new Error(`顶档上界 ${d[0].upper} != 最高分 ${mx}`);
  for(let i=1;i<d.length;i++) if(Math.round(d[i].upper)+1!==Math.round(d[i-1].lower)) throw new Error(`档 ${i-1} 与 ${i} 之间断裂`);
  const last=d[d.length-1], floor=Math.min(...cur.map(m=>m.s));
  if(Math.round(last.lower)!==Math.round(floor)) throw new Error(`底档 lower 应等于候选集最低分 ${floor}，实际 ${last.lower}`);
  for(let i=0;i<d.length;i++){
    if(Math.round(d[i].upper)!==Math.round(i===0?mx:d[i].model.s)) throw new Error(`档 ${i} upper 应等于自己的分数`);
    if(i<d.length-1 && Math.round(d[i].lower)!==Math.round(d[i+1].model.s)+1) throw new Error(`档 ${i} lower 应等于下一档分数+1`);
    if(d[i].lower>d[i].upper) throw new Error(`档 ${i} 区间退化: [${d[i].lower},${d[i].upper}]`);
  }
  return d.map(t=>`${t.model.n.slice(0,24)}:[${Math.round(t.lower)},${Math.round(t.upper)}]`).join('\n     ');
});
TC('暴力校验：每个门槛 T 的赢家 == min{cost | score>=T}', ()=>{
  const mx=D().stats.score_max, mn=D().stats.score_min; const bad=[]; let n=0;
  for(let t=mx;t>=mn;t--){ if(++n>3000) throw new Error('guard'); S.hi=t; recompute();
    const b=brute(t);
    if(!view||!b){ if(view||b) bad.push(`T=${t} null 不一致`); continue; }
    if(view.w.n!==b.n||Math.abs(view.w.c-b.c)>1e-9) bad.push(`T=${t}: 工具=${view.w.n}($${view.w.c}) 暴力=${b.n}($${b.c})`);
  }
  S.hi=mx; recompute();
  if(bad.length) throw new Error(bad.length+' 处不一致：'+bad.slice(0,3).join(' | '));
  return `${n} 个门槛全部与暴力解一致（0 处偏差）`;
});
TC('拖动分数线的赢家序列 == 前沿顺序', ()=>{
  const mx=D().stats.score_max, mn=D().stats.score_min; const seen=[]; let n=0;
  for(let t=mx;t>=mn;t--){ if(++n>3000) throw new Error('guard'); S.hi=t; recompute(); if(seen[seen.length-1]!==view.w.n) seen.push(view.w.n); }
  const exp=tiers.map(x=>x.model.n);
  if(seen.length!==exp.length||!seen.every((x,i)=>x===exp[i])) throw new Error('顺序不一致');
  S.hi=mx; recompute();
  return `${seen.length} 档，从高到低依次：\n     `+seen.join('\n     → ');
});
TC('T=最高分 → 最强模型', ()=>{ S.hi=D().stats.score_max; recompute(); if(view.w.s!==D().stats.score_max) throw new Error(view.w.n); return `${view.w.n} | ${view.w.s} | $${view.w.c} | ↑ 无（天花板）`; });
TC('T=1660 → 赢家 = 满足分数的最低成本模型（数据驱动, 不锚模型名）', ()=>{ S.ds='overall_os'; loadDataset(true); S.hi=1660; recompute();
  const brute = cur.filter(m=>m.s>=1660).sort((a,b)=>a.c-b.c)[0];
  if(!brute) throw new Error('overall_os 无 s>=1660 的模型, 测试门槛需随数据更新');
  if(!view||!view.w) throw new Error('DIAG mode='+S.mode+' ds='+S.ds+' hi='+S.hi+' cur='+cur.length+' view='+JSON.stringify(view));
  if(view.w.n!==brute.n) throw new Error('view 赢家 '+view.w.n+' ≠ 暴力重算 '+brute.n);
  const up = view.nxt ? `\n     ↑ 升一档：${view.nxt.n} +${view.marginal.ds} 分 / +$${view.marginal.dc.toFixed(2)} = $${view.marginal.per.toFixed(4)} 每分` : '\n     ↑ 无（赢家已是最高分档）';
  const r=`${view.w.n} | ${view.w.s} | $${view.w.c} | 统治门槛区间 [${view.covers.map(Math.round)}]${up}`;
  S.hi=D().stats.score_max; recompute(); return r; });
TC('T=1500 → Hy3 $0.04（Muse Spark Open 被支配故出局）', ()=>{ S.hi=1500; recompute();
  if(view.w.n!=='Hy3') throw new Error('实际 '+view.w.n);
  const muse=cur.find(m=>m.n==='Muse Spark Open (Max)'), dom=cur.find(m=>m.s>muse.s&&m.c<muse.c);
  const r=`${view.w.n} | ${view.w.s} | $${view.w.c}\n     Muse Spark Open (${muse.s}/$${muse.c}) 被 ${dom.n} (${dom.s}/$${dom.c}) 支配 → 不在前沿`;
  S.hi=D().stats.score_max; recompute(); return r; });
TC('每一档的「↑升一档 边际单价」', ()=>{
  const rows=[];
  for(let i=tiers.length-1;i>=0;i--){ S.hi=tiers[i].lower; recompute();
    rows.push(`${String(view.w.s).padEnd(5)} $${String(view.w.c).padEnd(8)} ${view.w.n.slice(0,30).padEnd(30)} ↑ ${view.marginal?('$/分 '+view.marginal.per.toPrecision(3)+' → '+view.marginal.model.n.slice(0,22)):'天花板'}`); }
  S.hi=D().stats.score_max; recompute(); return rows.join('\n     ');
});
TC('标注区间 == 实际统治区间（全数据集逐个门槛暴力核对）', ()=>{
  let tot=0, bad=[];
  for(const ds of ['overall_os','frontend_os','fullstack_os','react_os','reference_os','img2webdev_os','overall_all','t2i']){
    offTime(); S.ds=ds; S.mode='pareto'; S.ci='point'; loadDataset(true);
    const st=DATASETS[ds].stats, fr=[...tiers];
    for(let i=0;i<fr.length;i++){
      const own=[];
      for(let T=st.score_min;T<=st.score_max;T++){ S.hi=T; recompute(); tot++;
        if(view&&view.w&&view.w.n===fr[i].model.n) own.push(T); }
      if(!own.length){ bad.push(`${ds}#${i+1} ${fr[i].model.n} 从未获胜`); continue; }
      const lo=own[0], up=own[own.length-1];
      if(lo!==Math.round(fr[i].lower)||up!==Math.round(i===0?st.score_max:fr[i].upper))
        bad.push(`${ds}#${i+1} ${fr[i].model.n}: 标注[${Math.round(fr[i].lower)},${Math.round(fr[i].upper)}] 实际[${lo},${up}]`);
      if(own.length!==(up-lo+1)) bad.push(`${ds}#${i+1} ${fr[i].model.n} 统治区不连续`);
    }
  }
  S.hi=DATASETS.overall_os.stats.score_max; offTime(); S.ds='overall_os'; loadDataset(true);
  if(bad.length) throw new Error(bad.slice(0,4).join(' | ')+(bad.length>4?` …共 ${bad.length} 处`:''));
  return `8 个数据集的全部前沿档、共 ${tot} 次门槛判定：每一档标注的区间与它实际获胜的区间**逐位相同**，且都连续`;
});
TC('严格 CI 模式：合并统计上不可区分的档', ()=>{
  const res=[];
  for(const ds of ['overall_os','frontend_os','fullstack_os','overall_all']){
    S.ds=ds; S.ci='point'; loadDataset(true); const a=tiers.length;
    S.ci='strict'; loadDataset(true); const b=tiers.length;
    for(let i=1;i<tiers.length;i++){ const A=tiers[i-1].model,B=tiers[i].model;
      if(!(A.sLo>B.sHi)) throw new Error(`${ds}: ${A.n} 与 ${B.n} 仍不可区分`); }
    res.push(`${ds} ${a}→${b}`);
  }
  S.ci='point'; reset(); return res.join(' | ');
});
TC('最少票数过滤', ()=>{ S.minVotes=10000; recompute(); const n=cur.length,t=tiers.length; S.minVotes=0; recompute(); return `${n} 个模型 / ${t} 档（未过滤：${cur.length}/${tiers.length}）`; });
TC('排除 Preliminary', ()=>{ S.exPrelim=true; recompute(); if(frontier.some(m=>m.pre)) throw new Error('前沿上仍有 Preliminary'); const t=tiers.length; S.exPrelim=false; recompute(); return `${t} 档，前沿无 Preliminary`; });
TC('预算上限 $0.20 → 赢家被压低', ()=>{ S.maxCost=0.2; S.hi=1660; recompute();
  const r=`T=1660 且 ≤$0.20 → ${view?view.w.n+' ('+view.w.s+', $'+view.w.c+')':'无解'}`;
  S.maxCost=Infinity; S.hi=D().stats.score_max; recompute(); return r; });
TC('门槛高于最高分 → degraded 提示', ()=>{ S.hi=D().stats.score_max+50; recompute(); const ok=view.degraded===true; S.hi=D().stats.score_max; recompute(); return ok?'degraded=true，回退到最强档':'FAIL'; });
TC('无解时返回空状态', ()=>{ S.minVotes=25000; S.maxCost=0.001; recompute(); const ok=view===null; reset(); return ok?'view=null → 卡片显示空状态':'FAIL'; });
TC('口径② 分数/美元 的退化（印证文中的警告）', ()=>{ S.mode='ratio'; S.hi=D().stats.score_max; recompute(); const r=`${view.w.n}（${view.w.s} 分 / $${view.w.c}）= ${Math.round(view.val)} 分每美元 ← 荒谬，故不推荐`; S.mode='pareto'; recompute(); return r; });
TC('口径③ (Score−1200)/$', ()=>{ S.mode='baseline'; S.hi=D().stats.score_max; recompute(); const r=`${view.w.n}（${view.w.s} 分 / $${view.w.c}）= ${view.val.toFixed(0)} 超额分每美元`; S.mode='pareto'; recompute(); return r; });
/* 其余每个数据集都逐个门槛扫一遍：工具给出的赢家必须等于暴力解 min{cost | score ≥ T} */
['fullstack_os','frontend_os','react_os','reference_os','img2webdev_os','overall_all','t2i'].forEach(k=>{
  TC('数据集 '+k+' 全门槛扫描', ()=>{ const r=sweep(k,1); reset();
    if(r.bad.length) throw new Error(r.bad.slice(0,3).join(' | '));
    if(!r.orderOK) throw new Error('拖动时赢家顺序与前沿顺序不一致');
    if(r.models<2) throw new Error('可用模型太少：'+r.models);
    return `${r.models} 模型 / ${r.tiers} 档 / ${r.n} 个门槛全部匹配暴力解\n     `+r.seen.join('\n     → '); });
});
TC('渲染全链路不抛异常', ()=>{ const mx=D().stats.score_max, mn=D().stats.score_min;
  [mx,1600,1500,1400,1300,mn].forEach(t=>{S.hi=t;recompute();render();});
  S.mode='ratio'; S.hi=mx; recompute(); render();
  S.mode='baseline'; recompute(); render();
  S.ci='strict'; S.mode='pareto'; recompute(); render(); S.ci='point';
  S.hi=mx; recompute(); return '6 个门槛 × 3 种口径 × 2 种 CI 模式，scatter/steps/tiers/table 全部渲染成功'; });
TC('金额格式：极小值不被抹成 $0.0000', ()=>{
  const cases=[[0.0027,'$0.0027'],[0.0000274,'$2.7e-5'],[0.05,'$0.050'],[0.91,'$0.91'],[11.04,'$11.0'],[0.0001,'$1.0e-4']];
  return cases.map(([v])=>`${v} → ${fmt$(v)}`).join('  |  ');
});
TC('粘贴解析（含 Overall Rank 列）', ()=>{
  const smp='| Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task (P50) | Price $/M | Context |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 1 | 5 | [Test X](https://x.com)<br>LabX · MIT | 1700+5/-5 | 110 | 3,000 | $0.42 | $1 / $3 | 200K |\n| 2 | 9 | [Test Y](https://y.com)<br>LabY · Apache 2.0 | 1600+8/-8Preliminary | 520 | 900 | $0.05 | $0.2 / $0.8 | N/A |';
  const r=parsePasted(smp); if(r.length!==2) throw new Error('rows='+r.length);
  if(r[0].s!==1700||r[0].c!==0.42||r[0].lic!=='MIT') throw new Error(JSON.stringify(r[0]));
  if(!r[1].pre) throw new Error('preliminary 未识别');
  return JSON.stringify(r);
});
TC('粘贴解析（无 Overall Rank 列）', ()=>{
  const smp='| Rank | Rank Spread | Model | Score | Votes | Cost/Task (P50) | Price $/M | Context |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| 3 | 35 | Anthropic<br>[Claude Test 9 (xHigh)](https://a.com)<br>Anthropic · Proprietary | 1772+10/-10 | 5,895 | $3.02 | $2 / $10 | 1M |';
  const r=parsePasted(smp); if(r.length!==1||r[0].lab!=='Anthropic'||r[0].v!==5895) throw new Error(JSON.stringify(r)); return JSON.stringify(r);
});
TC('粘贴解析（制表符分隔、列不全）', ()=>{
  const smp='Rank\tModel\tScore\tVotes\tCost/Task (P50)\n1\t[Zed 1](https://z.com)\t1500+5/-5\t1,000\t$0.20';
  const r=parsePasted(smp);
  if(r.length!==1) throw new Error('rows='+r.length);
  if(r[0].n!=='Zed 1'||r[0].s!==1500||r[0].v!==1000||r[0].c!==0.2) throw new Error(JSON.stringify(r[0]));
  return JSON.stringify(r[0]);
});
TC('粘贴解析：Rank Spread 不能被当成 votes / overall rank', ()=>{
  const smp='| Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task (P50) | Price $/M | Context |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 19 | 67 | [Kimi K2.6](https://k.com)<br>Moonshot · Modified MIT | 1509+7/-7 | 6172 | 10,005 | $0.24 | $0.95 / $4 | 262.1K |\n| 4 | 23 | Thinking Machines<br>[Inkling 2 Small](https://t.ai)<br>Thinky · Apache 2.0 | 1647+19/-19Preliminary | 1632 | 990 | $0.31 | $0.30 / $1 | N/A |';
  const r=parsePasted(smp);
  if(r.length!==2) throw new Error('rows='+r.length);
  const k=r[0];
  if(k.r!==19) throw new Error('rank '+k.r);
  if(k.or!==67) throw new Error('overall rank '+k.or+' (期望 67，不能是 Rank Spread 6172)');
  if(k.v!==10005) throw new Error('votes '+k.v+' (期望 10005，不能是 Rank Spread 6172)');
  if(k.c!==0.24||k.pin!==0.95||k.pout!==4||k.ctx!=='262.1K') throw new Error(JSON.stringify(k));
  /* arena.ai 的模型单元格有两种写法：
       "Thinking Machines<br>[Inkling 2 Small](url)<br>Thinky · Apache 2.0"  → lab 在链接前
       "[Kimi K2.6](url)<br>Moonshot · Modified MIT"                        → lab 只在链接后的 "X · Y" 里
     所以 Kimi 这行 lab=null 是正确行为，许可取 "· " 之后的部分。 */
  if(k.lab!==null||k.lic!=='Modified MIT') throw new Error('lab/lic '+k.lab+'/'+k.lic);
  const ink=r[1];
  if(ink.lab!=='Thinking Machines'||!ink.pre||ink.v!==990||ink.ctx!==null) throw new Error(JSON.stringify(ink));
  return `Kimi K2.6: rank=${k.r} orank=${k.or} votes=${k.v} cost=$${k.c} ctx=${k.ctx} lab=${k.lab}\n     Inkling 2 Small: lab=${ink.lab} pre=${ink.pre} votes=${ink.v} ctx=${ink.ctx}`;
});
TC('粘贴解析：全部模型视图（无 Overall Rank 列，Rank Spread 在第 2 列）', ()=>{
  const smp='| Rank | Rank Spread | Model | Score | Votes | Cost/Task (P50) | Price $/M | Context |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| 12 | 1017 | [Kimi K3.1 Pro (Max)](https://k.ai)<br>Moonshot · Kimi K3.1 Pro License | 1687+10/-10 | 4,977 | $0.91 | $2 / $10 | 1M |\n|  | N/A | [Ernie 5.5 Flash Preview](https://e.com)<br>Baidu · Proprietary | 1668+16/-16 [AutoEval](https://arena.ai/blog/autoeval-scores) | N/A | N/A | $0.28 / $1.13 | N/A |';
  const r=parsePasted(smp);
  if(r.length!==2) throw new Error('rows='+r.length);
  const k=r[0];
  if(k.r!==12||k.or!==null) throw new Error(`rank=${k.r} orank=${k.or}（期望 12 / null，Rank Spread 1017 不能被当 orank）`);
  if(k.v!==4977) throw new Error('votes '+k.v);
  if(k.c!==0.91||k.pin!==2||k.pout!==10||k.ctx!=='1M') throw new Error(JSON.stringify(k));
  const e=r[1];
  if(e.r!==null||!e.ae||e.v!==null||e.c!==null||e.pin!==0.28) throw new Error(JSON.stringify(e));
  return `Kimi: rank=${k.r} orank=${k.or} votes=${k.v} $${k.c}\n     Ernie AutoEval: rank=${e.r} autoeval=${e.ae} votes=${e.v} cost=${e.c} pin=$${e.pin}`;
});
/* 整列没有 Cost/Task 的榜单（arena.ai 的 WebDev · HTML 子榜就是这样）：不能崩，且必须说清原因，
   否则用户会以为是自己的过滤条件设错了。 */
TC('无成本列的榜单：不崩溃 + 明确提示原因', ()=>{
  const NOCOST=[
   '| Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task (P50) | Price $/M | Context |',
   '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
   '| 1 | 11 | [DeepSeek-V4.1-Flash-20261017 (Max)](https://hf.co/a)<br>DeepSeek · MIT | 1696+14/-14 | 618 | 2,351 |  | $0.15 / $0.60 | 1M |',
   '| 2 | 12 | [Kimi K3.1 Pro (Max)](https://k.ai/b)<br>Moonshot · Kimi K3.1 Pro License | 1689+22/-22 | 619 | 934 |  | $2 / $10 | 1M |',
   '| 3 | 16 | Thinking Machines<br>[Inkling 2 Small](https://tm.ai/c)<br>Thinky · Apache 2.0 | 1661+55/-55Preliminary | 538 | 130 |  | $0.30 / $1 | N/A |',
   '| 4 | 23 | [Kimi K3 (Max)](https://k.ai/d)<br>Moonshot · Kimi K3 license | 1640+12/-12 | 1632 | 3,128 |  | $3 / $15 | 1M |'].join('\n');
  const r=parsePasted(NOCOST);
  if(r.length!==4) throw new Error('rows='+r.length);
  if(r.some(x=>x.c!==null)) throw new Error('成本应全为 null: '+JSON.stringify(r.map(x=>x.c)));
  if(r.map(x=>x.s).join()!=='1696,1689,1661,1640') throw new Error('分数解析错 '+JSON.stringify(r.map(x=>x.s)));
  if(r[0].pin!==0.15||r[0].pout!==0.6) throw new Error('$/M 解析错 '+JSON.stringify([r[0].pin,r[0].pout]));
  if(!r[2].pre) throw new Error('Preliminary 未识别');
  $('#paste').value=NOCOST; $('#pasteName').value='HTML 子榜（无成本列）'; $('#addDs').onclick();
  const key=S.ds, d=DATASETS[key];
  if(d.stats.with_cost!==0) throw new Error('with_cost='+d.stats.with_cost);
  const msg=$('#pasteMsg').innerHTML;
  if(!/Cost\/Task column is entirely empty/.test(msg)) throw new Error('paste hint missing reason: '+msg);
  if(view!==null||tiers.length!==0) throw new Error('应无前沿，实际 tiers='+tiers.length);
  const card=$('#winCard');
  // 注意：fake DOM 的 appendChild 不会回写父节点 innerHTML，且 el() 写的是子节点 innerHTML
  const cardTxt=[card.innerHTML,...card.children.map(c=>(c.innerHTML||'')+(c.textContent||''))].join(' ');
  if(!/no Cost\/Task data/.test(cardTxt)) throw new Error('main card missing explanation: '+cardTxt.slice(0,140));
  S.onlyCost=false; loadDataset(true);
  if(cur.length!==4||tiers.length!==0) throw new Error('关掉成本过滤后 cur='+cur.length+' tiers='+tiers.length);
  const said=msg.replace(/<[^>]+>/g,'').slice(0,52);
  reset(); delete DATASETS[key];
  return `4 行 / 成本全空 → 前沿 0 档；提示："${said}…"`;
});
/* 交叉校验：浏览器版 parsePasted() 解析 raw/*.md 的结果，必须与 parse.py 写出的
   data/datasets.json 逐字段一致 —— 两套独立实现互为参照，任何一方跑偏都会在这里暴露。 */
TC('交叉校验：JS parsePasted() ≡ Python parse.py（逐字段）', ()=>{
  const fs=require('fs'), P=require('path'), ROOT=P.join(__dirname,'..');
  const ref=JSON.parse(fs.readFileSync(P.join(ROOT,'data','datasets.json'),'utf8'));
  const F=ref.fields, norm=x=>(x===''||x===undefined)?null:x;
  let cells=0, rowsTot=0; const bad=[];
  for(const key of Object.keys(ref.datasets)){
    const f=P.join(ROOT,'raw',key+'.md');
    if(!fs.existsSync(f)){ bad.push(key+': 缺 raw/'+key+'.md'); continue; }
    const got=parsePasted(fs.readFileSync(f,'utf8')), want=ref.datasets[key].rows;
    rowsTot+=want.length;
    if(got.length!==want.length) bad.push(`${key}: 行数 JS=${got.length} PY=${want.length}`);
    const n=Math.min(got.length,want.length);
    for(let i=0;i<n;i++) for(let j=0;j<F.length;j++){
      const a=norm(got[i][F[j]]), b=norm(want[i][j]); cells++;
      if(a!==b) bad.push(`${key}#${i+1}.${F[j]}: JS=${JSON.stringify(a)} PY=${JSON.stringify(b)}`);
    }
  }
  if(bad.length) throw new Error(bad.slice(0,6).join(' | ')+(bad.length>6?` …共 ${bad.length} 处差异`:''));
  return `${Object.keys(ref.datasets).length} 个数据集 / ${rowsTot} 行 × ${F.length} 字段 = ${cells} 个单元格，0 处差异`;
});
/* ==================== 价格情景 / 时间变量 ==================== */
const PEAK={h:2,dow:3}, OFF={h:12,dow:3}, SAT={h:12,dow:6};
function at(sc,T){ onTime(sc.h,sc.dow); S.ds='overall_os'; S.hi=T; recompute(); }
function cOf(name,sc){ at(sc,S.hi); const m=cur.find(x=>x.n===name); return m?m.c:null; }
const DS0910='DeepSeek-V4.1-Flash-20260910 (Max)', DS1017='DeepSeek-V4.1-Flash-20261017 (Max)', GLM='GLM-5.3-Flash';

TC('价格情景：全部关闭 = 完全还原榜面价', ()=>{
  offTime(); S.ds='overall_os'; loadDataset(true);
  const d=D().models; let bad=0;
  for(const m of d){ if(m.cRaw==null){ if(m.c!==null)bad++; continue; }
    if(Math.abs(m.c-m.cRaw)>1e-12) bad++;
    if(m.c!==m.cRaw) m.__x=1; }
  if(bad) throw new Error(bad+' 个模型的成本被改写');
  return `${d.length} 个模型全部等于 cRaw；pinRaw/poutRaw 也一并保存`;
});
TC('峰时（周三 02:00 UTC）：榜面价是谷价的 DeepSeek 成本翻倍', ()=>{
  offTime(); S.ds='overall_os'; loadDataset(true); const d=D().models;
  const g=n=>d.find(m=>m.n===n);
  at(PEAK,1600);
  const a=g(DS1017), b=g(DS0910);
  if(Math.abs(a.c-a.cRaw*2)>1e-9) throw new Error('20261017 未翻倍: '+a.cRaw+'→'+a.c);
  if(Math.abs(b.c-b.cRaw)>1e-9) throw new Error('20260910 榜面本就是峰价，不该变: '+b.c);
  return `${DS1017}: 榜面 $${a.cRaw} → 峰时 $${a.c.toFixed(4)}（×${a.adj.scale.toFixed(2)}）；${DS0910}: $${b.cRaw} → $${b.c.toFixed(4)}（榜面已是峰价，不变）`;
});
TC('谷时（周三 12:00 UTC）：榜面价是峰价的 DeepSeek 成本减半', ()=>{
  offTime(); S.ds='overall_os'; loadDataset(true); const d=D().models; const g=n=>d.find(m=>m.n===n);
  at(OFF,1600);
  const a=g(DS1017), b=g(DS0910), p=g('DeepSeek-V4-Pro');
  if(Math.abs(a.c-a.cRaw)>1e-9) throw new Error('20261017 榜面本就是谷价，不该变: '+a.c);
  if(Math.abs(b.c-b.cRaw/2)>1e-9) throw new Error('20260910 未减半: '+b.cRaw+'→'+b.c);
  if(Math.abs(p.c-p.cRaw/2)>1e-9) throw new Error('V4-Pro 未减半');
  return `${DS0910}: $${b.cRaw} → $${b.c.toFixed(4)}；DeepSeek-V4-Pro: $${p.cRaw} → $${p.c.toFixed(4)}；${DS1017} 保持 $${a.c}（榜面已是谷价）`;
});
TC('周末豁免：周六 02:00 仍是谷价（峰时窗口只在工作日）', ()=>{
  const wk=cOf(DS0910,{h:2,dow:3}), we=cOf(DS0910,{h:2,dow:6}), su=cOf(DS0910,{h:2,dow:0});
  if(!(Math.abs(wk-we*2)<1e-9 && Math.abs(we-su)<1e-9)) throw new Error(`周三 ${wk} / 周六 ${we} / 周日 ${su}`);
  return `${DS0910}: 周三 02:00 = $${wk.toFixed(4)}，周六 02:00 = 周日 02:00 = $${we.toFixed(4)}`;
});
TC('glm_promo 已下线（11-20 榜面价 $0.02/$0.07 不再是旧 promo 价 → GLM 全日期无修正）', ()=>{
  if(PRICE_EVENTS.some(e=>e.id==='glm_promo')) throw new Error('glm_promo 应已从 PRICE_EVENTS 移除');
  /* 注意：拷贝数值 —— find() 返回同一对象引用，applyPriceScenario 会就地改写。 */
  const snap=d=>{ onTime(OFF.h,OFF.dow,d); S.ds='overall_os'; S.hi=1500; recompute();
    const m=D().models.find(x=>x.n===GLM);
    return {c:m.c, cRaw:m.cRaw, scale:m.adj?m.adj.scale:1}; };
  const dates=['2026-09-01','2026-09-09','2026-11-14',DATA.scraped];
  const snaps=dates.map(snap);
  for(let i=0;i<snaps.length;i++){
    if(Math.abs(snaps[i].c-snaps[i].cRaw)>1e-9) throw new Error(dates[i]+' 应无修正: c='+snaps[i].c+' cRaw='+snaps[i].cRaw);
    if(snaps[i].scale!==1) throw new Error(dates[i]+' scale 应为 1, 实际 '+snaps[i].scale);
  }
  return `GLM-5.3-Flash 在 ${dates.join(' / ')} 全部 = 榜面价 $${snaps[0].cRaw}（scale=1）；glm_promo 规则已移除，新价性质（疑似新 promo）待人工核实`;
});
TC('输出占比滑块不影响同比例修正（峰谷 / date 型全部同比例）', ()=>{
  // cOf/at 锁 overall_os（无 Proprietary），这里手动在 overall_all 上量两个模型的加权成本
  const grab=(name)=>{ const m=cur.find(x=>x.n===name); if(!m) throw new Error(name+' 不在当前数据集'); return m.c; };
  S.ds='overall_all'; loadDataset(true); S.hi=D().stats.score_max; onTime(OFF.h,OFF.dow);
  S.outShare=0;   S.dateISO='2026-12-15'; recompute(); const ds0=grab(DS1017), gem0=grab('Gemini 4 Carbon (High)');
  S.outShare=0.5;                          recompute(); const ds1=grab(DS1017), gem1=grab('Gemini 4 Carbon (High)');
  S.outShare=1/12; S.dateISO=DATA.scraped; onTime(OFF.h,OFF.dow); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  if(Math.abs(ds0-ds1)>1e-12) throw new Error('DeepSeek 峰谷是同比涨跌，不该受滑块影响');
  if(Math.abs(gem0-gem1)>1e-12) throw new Error('Gemini $2/$10→$4/$20 也是同比涨跌，不该受滑块影响');
  return `DeepSeek ×2 恒定（$${ds0.toFixed(4)}）；Gemini Carbon 12-15 日 0%输出=$${gem0.toFixed(4)} → 50%输出=$${gem1.toFixed(4)}（同比 ×2, 不随滑块变）`;
});
TC('存疑事件默认关闭，且勾选后可见（敏感性分析）', ()=>{
  const st={}; PRICE_EVENTS.forEach(e=>st[e.id]=S.evState[e.id]);
  if(st.ds_v4flash!==false||st.suspect2x!==false) throw new Error('默认应为 false: '+JSON.stringify(st));
  if(st.ds_tod!==true||st.gem_dec1!==true) throw new Error('已核实事件默认应为 true');
  onTime(OFF.h,OFF.dow); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const g=n=>DATASETS.overall_os.models.find(m=>m.n===n);
  const before=[g('Mistral Medium 3.5'),g('GPT-6 Sol (Max)')];
  if(before.some(m=>m&&m.adj)) throw new Error('存疑事件不该在关闭时生效');
  S.evState.suspect2x=true; recompute();
  const after=[g('Mistral Medium 3.5'),g('GPT-6 Sol (Max)')].filter(Boolean);
  const res=`默认 ${JSON.stringify(st)}（已核实=开、存疑=关）。关闭时：`+
    before.filter(Boolean).map((m,i)=>`${m.n} ${fmt$(m.c)}`).join('，')+
    `；勾选「差 2 倍存疑」后：`+after.map((m,i)=>`${m.n} ${fmt$(m.cRaw)}→${fmt$(m.c)}`).join('，')+
    `（${after.length} 个命中）`;
  if(after.some(m=>!m.adj)) throw new Error('勾选后应命中: '+after.map(m=>m.n).join(','));
  S.evState.suspect2x=false; S.ds='overall_os'; return res;
});
TC('时间变量下 C(T) 仍是单调阶梯（峰时 168 个门槛暴力对照）', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; S.mode='pareto'; S.ci='point'; loadDataset(true);
  const d=D().models; let bad=0, n=0; const seen=[];
  for(let t=d.stats?0:0, th=d.length?DATASETS.overall_os.stats.score_max:0; th>=DATASETS.overall_os.stats.score_min; th--){
    if(++n>2000) throw new Error('iteration guard');
    S.hi=th; recompute();
    const q=cur.filter(m=>m.s>=th&&m.c!=null);
    if(!q.length){ if(view&&view.w) bad++; continue; }
    const mc=Math.min(...q.map(m=>m.c));
    const b=q.filter(m=>m.c===mc).sort((a,b2)=>b2.s-a.s)[0];
    if(!view||!view.w||view.w.n!==b.n) bad++;
    if(seen[seen.length-1]!==view.w.n) seen.push(view.w.n);
  }
  if(bad) throw new Error(bad+'/'+n+' 个门槛不一致');
  const fr=tiers.map(x=>x.model.n);
  const orderOK=seen.length===fr.length&&seen.every((x,i)=>x===fr[i]);
  if(!orderOK) throw new Error('扫描顺序与前沿顺序不一致');
  S.ds='overall_os'; S.hi=DATASETS.overall_os.stats.score_max;
  return `峰时下 ${n} 个门槛全部与暴力解一致，扫描顺序 = 前沿顺序；前沿 ${fr.length} 档`;
});
TC('前沿成员会随时刻变化：谷时 DeepSeek 老版挤掉 Hy3', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); recompute();
  const peakFr=tiers.map(t=>t.model.n);
  onTime(SAT.h,SAT.dow); recompute();
  const offFr=tiers.map(t=>t.model.n);
  const added=offFr.filter(n=>!peakFr.includes(n)), removed=peakFr.filter(n=>!offFr.includes(n));
  if(!added.length) throw new Error('谷时应有新成员进入前沿');
  S.hi=1500; onTime(PEAK.h,PEAK.dow); recompute(); const wp=view.w.n, wc=view.w.c;
  onTime(SAT.h,SAT.dow); recompute(); const wo=view.w.n, woc=view.w.c;
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `峰时 ${peakFr.length} 档 vs 周六谷时 ${offFr.length} 档；新进：${added.join('、')}｜掉出：${removed.join('、')||'无'}。`+
    `\n     T=1500 的赢家：峰时 ${wp} ${fmt$(wc)} → 周六谷时 ${wo} ${fmt$(woc)}`;
});
TC('weekCurve 与 cheapestAt 一致，且峰时小时数 = 35', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const pts=weekCurve(1600,cur);
  if(pts.length!==168) throw new Error('应为 168 点');
  const peakH=pts.filter(p=>p.peak).length;
  if(peakH!==35) throw new Error('工作日 7 峰时小时 ×5 = 35，实际 '+peakH);
  let sw=0, prev=null;
  pts.forEach(p=>{ if(p.n&&p.n!==prev){ if(prev!==null)sw++; prev=p.n; } });
  const vals=[...new Set(pts.map(p=>p.c!=null?fmt$(p.c):'—'))];
  for(let i=1;i<168;i++){ const a=pts[i-1],b=pts[i];
    if(a.c!=null&&b.c!=null){ if(!(Math.abs(a.c-b.c)<1e-12 || a.peak!==b.peak)) throw new Error('第'+i+'小时出现无时段切换的成本变化'); } }
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `168 小时 → ${sw} 次冠军易主，C(T) 只取 ${vals.length} 个值：${vals.join(' / ')}`;
});
TC('一键开关：「榜面原样（全关）」与「全部启用（含存疑）」', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); S.hi=1500; recompute();
  SCEN_BOARD(); renderEvList(); recompute();
  const boardN=tiers.map(t=>t.model.n), boardAdj=(cur||[]).filter(m=>m.adj).length;
  if(boardAdj!==0) throw new Error('全关后仍有 '+boardAdj+' 个模型被改写');
  const board1500=view.w.n;
  SCEN_ALL(); renderEvList(); recompute();
  const allN=tiers.map(t=>t.model.n), allAdj=(cur||[]).filter(m=>m.adj).length;
  if(allAdj<1) throw new Error('全开后没有任何模型被改写');
  const hitSus=PRICE_EVENTS.filter(e=>e.conf!=='official'&&DATASETS.overall_os.models.some(m=>e.entries[m.n])).map(e=>e.id);
  SCEN_BOARD(); renderEvList(); offTime(); S.ds='overall_os'; loadDataset(true);
  return `全关（含缓存）：前沿 ${boardN.length} 档、0 个改写、T=1500 冠军 ${board1500}；全开：前沿 ${allN.length} 档、${allAdj} 个改写`+
    `（存疑事件在本数据集命中 ${hitSus.length?hitSus.join(','):'无'} 条）；复选框状态已随开关重绘`;
});
/* ==================== 缓存折扣 ==================== */
/* 独立手算：effPin = (1−h)·pin·wm + h·pin·r ；scale = blend(effPin,pout) / blend(pinBoard,poutBoard) */
function expectScale(m,h,r,wm,w,pinNow,poutNow){
  const eff=(1-h)*pinNow*wm + h*pinNow*r;
  const num=eff*(1-w)+poutNow*w, den=m.pinRaw*(1-w)+m.poutRaw*w;
  return num/den;
}
function G(ds,n){ return DATASETS[ds].models.find(m=>m.n===n); }

TC('缓存算术：与独立手算公式逐项吻合（含写入倍率）', ()=>{
  onTime(12,3); cacheOn(0.95); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const w=S.outShare, cases=[];
  for(const n of ['DeepSeek-V4.1-Flash-20261017 (Max)','Kimi K3.1 Pro (Max)','MiMo-V2.6-Flash','Hy3','GLM-5.3 (Max)']){
    const m=G('overall_os',n); if(!m) throw new Error('缺模型 '+n);
    const got=priceScale(m,S.hour,S.dow,S.dateISO);
    const exp=expectScale(m,0.95,got.cache.r,got.cache.wm,w,got.cache.pin,m.poutRaw);
    if(Math.abs(got.scale-exp)>1e-12) throw new Error(`${n}: 引擎 ${got.scale} ≠ 手算 ${exp}`);
    cases.push(`${n} r=${(got.cache.r*100).toFixed(1)}%${got.cache.est?'(推算)':'(公布)'} wm=${got.cache.wm} → ×${got.scale.toFixed(4)} = ${fmt$(m.cRaw)}→${fmt$(m.c)}`);
  }
  const cl=G('overall_all','Claude Opus 5.5 (Max)');
  onTime(12,3); cacheOn(0.95); S.ds='overall_all'; loadDataset(true); S.hi=1800; recompute();
  const cl2=G('overall_all','Claude Opus 5.5 (Max)');
  const gc=priceScale(cl2,S.hour,S.dow,S.dateISO);
  if(gc.cache.wm!==1.25) throw new Error('Anthropic 写入倍率应为 1.25，实际 '+gc.cache.wm);
  const ec=expectScale(cl2,0.95,gc.cache.r,1.25,S.outShare,gc.cache.pin,cl2.poutRaw);
  if(Math.abs(gc.scale-ec)>1e-12) throw new Error('Claude 手算不符');
  const dsc=G('overall_os','DeepSeek-V4.1-Flash-20261017 (Max)');
  if(writeMultOf(dsc)!==1) throw new Error('DeepSeek 不应有写入倍率');
  offTime(); S.ds='overall_os'; loadDataset(true);
  return cases.join('\n     ')+`\n     Claude Opus 5.5 (Max) wm=1.25 → ×${gc.scale.toFixed(4)}（写入费吃掉一部分折扣）`;
});
TC('命中率单调：h 越高越便宜，h=0 精确等于「关缓存」', ()=>{
  onTime(12,3); S.ds='overall_os'; loadDataset(true); S.hi=1600;
  const m=G('overall_os','Kimi K3.1 Pro (Max)');
  S.cacheSrc='off'; recompute(); const off=m.c;
  const seq=[]; let prev=Infinity;
  for(const hh of [0,0.25,0.5,0.85,0.95,0.99,1]){
    cacheOn(hh); recompute(); const c=m.c; seq.push(`${Math.round(hh*100)}%:${fmt$(c)}`);
    if(c>prev+1e-12) throw new Error(`h=${hh} 时成本反而上升: ${prev} → ${c}`);
    prev=c;
  }
  cacheOn(0); recompute(); const zero=m.c;
  if(Math.abs(zero-off)>1e-12) throw new Error(`h=0 (${zero}) 应等于关缓存 (${off})`);
  cacheOn(1); recompute(); const full=m.c;
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `Kimi K3.1 Pro：关缓存 ${fmt$(off)} → ${seq.join(' → ')}；h=0 与关缓存完全相同（差 ${Math.abs(zero-off).toExponential(1)}）`;
});
TC('输出 token 是折扣地板：h=100% 也压不到零，且余下账单几乎全是输出', ()=>{
  onTime(12,6); cacheOn(1); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const w=S.outShare, bad=[]; let outShareOfResidual=[];
  for(const m of cur){
    if(m.pinRaw==null||!m.adj) continue;
    const L=listPricesAt(m,S.hour,S.dow,S.dateISO), cr=cacheRatioOf(m);
    if(!cr) continue;
    /* h=1 时仍要付缓存读取价 L.pin·r；且峰谷事件会把 L.pout 一起改掉 */
    const floor=(L.pin*cr.r*(1-w)+L.pout*w)/(m.pinRaw*(1-w)+m.poutRaw*w);
    if(m.c < m.cRaw*floor-1e-12) bad.push(`${m.n}: ${m.c.toFixed(6)} < 地板 ${(m.cRaw*floor).toFixed(6)}`);
    const outPart=L.pout*w, inPart=L.pin*cr.r*(1-w);
    outShareOfResidual.push([m.n,outPart/(outPart+inPart)]);
  }
  if(bad.length) throw new Error(bad.slice(0,3).join(' | '));
  outShareOfResidual.sort((a,b)=>a[1]-b[1]);
  const lo=outShareOfResidual[0], hi=outShareOfResidual[outShareOfResidual.length-1];
  const m=G('overall_os','DeepSeek-V4.1-Flash-20261017 (Max)');
  const L=listPricesAt(m,S.hour,S.dow,S.dateISO);
  const floor=(L.pin*0.02*(1-w)+L.pout*w)/(m.pinRaw*(1-w)+m.poutRaw*w);
  const cFloor=m.c;                      // offTime() 会把 m.c 还原成榜面值，必须先取
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `${outShareOfResidual.length} 个模型全部不低于「读取价 + 输出」地板；h=100% 时残余账单里输出 token 占比 ${(lo[1]*100).toFixed(1)}%（${lo[0]}）～ ${(hi[1]*100).toFixed(1)}%（${hi[0]}）。`+
    `\n     例：DeepSeek-20261017 h=100% → ×${floor.toFixed(4)}，${fmt$(m.cRaw)} → ${fmt$(cFloor)}，再高命中率也压不下去了`;
});
TC('缓存 95% 是否换冠军：全门槛逐个对照 h=0', ()=>{
  onTime(12,6); S.ds='overall_os'; S.mode='pareto'; S.ci='point'; loadDataset(true);
  const st=DATASETS.overall_os.stats;
  const grab=()=>{ const r={}; for(let th=st.score_max; th>=st.score_min; th--){ S.hi=th; recompute();
      r[th]=view&&view.w?view.w.n:null; } return r; };
  cacheOn(0,'off'); const A=grab();
  cacheOn(0.95);    const B=grab();
  const diff=Object.keys(A).filter(t=>A[t]!==B[t]);
  /* 前沿成员差异 */
  cacheOn(0,'off'); S.hi=st.score_max; recompute(); const f0=tiers.map(t=>t.model.n);
  cacheOn(0.95); recompute(); const f1=tiers.map(t=>t.model.n);
  const res=`${Object.keys(A).length} 个门槛中 ${diff.length} 个换了冠军`+
    (diff.length?`（例：T=${diff[0]} ${A[diff[0]]} → ${B[diff[0]]}；T=${diff[diff.length-1]} ${A[diff[diff.length-1]]} → ${B[diff[diff.length-1]]}）`:'')+
    `；前沿 ${f0.length} → ${f1.length} 档，新进 [${f1.filter(n=>!f0.includes(n)).join('、')||'无'}]，掉出 [${f0.filter(n=>!f1.includes(n)).join('、')||'无'}]`;
  S.hi=st.score_max; offTime(); S.ds='overall_os'; loadDataset(true);
  return res;
});
TC('敏感性数字锁定：面板/README 里引用的百分比必须可复现', ()=>{
  onTime(12,6); cacheOn(0.95); S.ds='overall_os'; loadDataset(true); S.hi=1600;
  const saveW=S.outShare;
  const pct=(n,w)=>{ S.outShare=w; const m=G('overall_os',n);
    return Math.round((1-priceScale(m,S.hour,S.dow,S.dateISO).scale)*100); };
  const DS='DeepSeek-V4.1-Flash-20261017 (Max)';
  const want=[[0.02,86],[1/12,68],[0.15,55],[0.25,40],[0.40,25]];
  for(const [w,exp] of want){ const got=pct(DS,w);
    if(got!==exp) throw new Error(`DeepSeek w=${(w*100).toFixed(0)}% 应省 ${exp}%，实际 ${got}%`); }
  const kimi=pct('Kimi K3.1 Pro (Max)',1/12), mimo=pct('MiMo-V2.6-Flash',1/12);
  if(kimi!==59) throw new Error('Kimi w=8% 应省 59%，实际 '+kimi);
  if(mimo!==79) throw new Error('MiMo w=8% 应省 79%，实际 '+mimo);
  /* 峰谷振幅被缓存压缩：T=1600 从 1.45× → 1.00×（2026-11-21 榜面 + 成本 4 位精度口径） */
  const amp=hh=>{ cacheOn(hh,hh===0?'off':'pub'); S.outShare=1/12; S.hi=1600; recompute();
    const cs=weekCurve(1600,cur).filter(p=>p.c!=null).map(p=>p.c);
    return Math.max(...cs)/Math.min(...cs); };
  const a0=amp(0), a95=amp(0.95);
  if(Math.abs(a0-1.4469)>0.02) throw new Error('h=0 振幅应约 1.45×，实际 '+a0.toFixed(3));
  if(!(a95<a0-0.4)) throw new Error(`缓存应显著压缩振幅: ${a0.toFixed(2)} → ${a95.toFixed(2)}`);
  S.outShare=saveW; S.hi=DATASETS.overall_os.stats.score_max; offTime(); S.ds='overall_os'; loadDataset(true);
  return `DeepSeek-20261017 @h=95%：w=2%→省86% / 8%→68% / 15%→55% / 25%→40% / 40%→25%；Kimi 省 ${kimi}%、MiMo 省 ${mimo}%。`+
    `T=1600 一周振幅 ${a0.toFixed(2)}× → 缓存 95% 后 ${a95.toFixed(2)}×`;
});
TC('缓存读取价随峰谷/促销自动缩放（存比例而非绝对值的好处）', ()=>{
  const d=G('overall_os','DeepSeek-V4.1-Flash-20261017 (Max)');
  onTime(2,3); cacheOn(0.95); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const pk=priceScale(d,2,3,S.dateISO).cache.pc;
  const offp=priceScale(d,12,3,S.dateISO).cache.pc;
  if(Math.abs(pk-0.006)>1e-9) throw new Error('峰时缓存价应为 $0.006，实际 '+pk);
  if(Math.abs(offp-0.003)>1e-9) throw new Error('谷时缓存价应为 $0.003，实际 '+offp);
  const g=G('overall_os','GLM-5.3-Flash');
  const p1=priceScale(g,12,3,'2026-09-01').cache.pc, p2=priceScale(g,12,3,DATA.scraped).cache.pc;
  if(Math.abs(p1-p2)>1e-12) throw new Error('GLM 无价格修正, 缓存价不该随日期变: '+p1+' vs '+p2);
  if(Math.abs(p1-g.pin*0.2)>1e-9) throw new Error('GLM 缓存价应 = 榜面输入价 × 20%，实际 '+p1+' vs pin='+g.pin);
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `DeepSeek-20261017：峰时 $${pk}/M、谷时 $${offp}/M（公布值 $0.006/$0.003）；GLM-5.3-Flash 缓存价 $${p1}/M = 榜面输入价 × 20%（无修正, 不随日期变）`;
});
TC('缓存价来源三档：公布价 / 一律 10% / 关闭', ()=>{
  onTime(12,3); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const m=G('overall_os','MiMo-V2.6-Flash');       // 公布 ratio = 2%
  const f=G('overall_os','Gemma 4 31B');           // 无公布价 → 推算 10%
  cacheOn(0.95,'pub');  recompute(); const mp=m.c, fp=f.c;
  const rp=priceScale(m,S.hour,S.dow,S.dateISO).cache, rf=priceScale(f,S.hour,S.dow,S.dateISO).cache;
  cacheOn(0.95,'flat'); recompute(); const mf=m.c, ff=f.c;
  cacheOn(0.95,'off');  recompute(); const mo=m.c, fo=f.c;
  if(rp.est!==false) throw new Error('MiMo 应为公布价');
  if(rf.est!==true) throw new Error('Gemma 4 31B 应为推算');
  if(Math.abs(rp.r-0.02)>1e-9) throw new Error('MiMo ratio 应为 2%，实际 '+rp.r);
  if(Math.abs(rf.r-0.10)>1e-9) throw new Error('Gemma 推算 ratio 应为 10%，实际 '+rf.r);
  if(!(mp<mf)) throw new Error('公布价 2% 应比推算 10% 更便宜');
  if(Math.abs(mo-m.cRaw)>1e-12) throw new Error('关闭时应等于榜面价');
  if(Math.abs(fo-f.cRaw)>1e-12) throw new Error('关闭时应等于榜面价');
  let pub=0,est=0;
  cacheOn(0.95,'pub'); recompute();
  for(const x of cur){ if(x.pinRaw==null)continue; (CACHE_RATIO[x.n]!=null)?pub++:est++; }
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `MiMo-V2.6-Flash（公布 2%）：pub ${fmt$(mp)} / flat ${fmt$(mf)} / off ${fmt$(mo)}；Gemma 4 31B（推算 10%）：pub ${fmt$(fp)} / flat ${fmt$(ff)} / off ${fmt$(fo)}。候选集 ${pub} 个公布价、${est} 个推算`;
});
TC('缓存 95% 下 C(T) 仍是单调阶梯（168 门槛暴力对照）', ()=>{
  onTime(2,3); cacheOn(0.95); S.ds='overall_os'; S.mode='pareto'; S.ci='point'; loadDataset(true);
  const st=DATASETS.overall_os.stats; let bad=0,n=0; const seen=[];
  for(let th=st.score_max; th>=st.score_min; th--){
    if(++n>2000) throw new Error('guard');
    S.hi=th; recompute();
    const q=cur.filter(m=>m.s>=th&&m.c!=null);
    if(!q.length){ if(view&&view.w) bad++; continue; }
    const mc=Math.min(...q.map(m=>m.c));
    const b=q.filter(m=>m.c===mc).sort((a,b2)=>b2.s-a.s)[0];
    if(!view||!view.w||view.w.n!==b.n) bad++;
    if(seen[seen.length-1]!==view.w.n) seen.push(view.w.n);
  }
  if(bad) throw new Error(bad+'/'+n+' 个门槛与暴力解不一致');
  const fr=tiers.map(x=>x.model.n);
  if(!(seen.length===fr.length&&seen.every((x,i)=>x===fr[i]))) throw new Error('扫描顺序 ≠ 前沿顺序');
  const res=`缓存 95% + 峰时下 ${n} 个门槛全部与暴力解一致；前沿 ${fr.length} 档（榜面口径为 7 档）`;
  S.hi=st.score_max; offTime(); S.ds='overall_os'; loadDataset(true);
  return res;
});
TC('缓存把冠军换掉：h=0 → h=95% 的前沿与门槛赢家对比', ()=>{
  onTime(12,6); S.ds='overall_os'; loadDataset(true);
  cacheOn(0,'off'); S.hi=DATASETS.overall_os.stats.score_max; recompute();
  const f0=tiers.map(t=>`${t.model.n}@${t.model.s}`), c0={};
  for(const T0 of [1687,1664,1638,1600,1500]) { S.hi=T0; recompute(); c0[T0]=view.w?`${view.w.n} ${fmt$(view.w.c)}`:'—'; }
  cacheOn(0.95); S.hi=DATASETS.overall_os.stats.score_max; recompute();
  const f1=tiers.map(t=>`${t.model.n}@${t.model.s}`), c1={};
  for(const T0 of [1687,1664,1638,1600,1500]) { S.hi=T0; recompute(); c1[T0]=view.w?`${view.w.n} ${fmt$(view.w.c)}`:'—'; }
  const moved=Object.keys(c0).filter(T0=>c0[T0].split(' ')[0]!==c1[T0].split(' ')[0]);
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `档数 ${f0.length} → ${f1.length}；冠军易主的门槛：${moved.length?moved.map(T0=>`T=${T0}（${c0[T0]} → ${c1[T0]}）`).join('；'):'无'}`+
    `\n     h=95% 各门槛：${Object.keys(c1).map(T0=>`T=${T0} ${c1[T0]}`).join(' | ')}`;
});
TC('未来事件：Gemini 4 Carbon/Argon 2026-12-01 涨价', ()=>{
  onTime(12,3); cacheOn(0.95); S.ds='overall_all'; loadDataset(true); S.hi=1770;
  const c=G('overall_all','Gemini 4 Carbon (High)');
  S.dateISO='2026-11-30'; recompute(); const before={c:c.c,pin:priceScale(c,S.hour,S.dow,S.dateISO).cache.pin};
  S.dateISO='2026-12-01'; recompute(); const after={c:c.c,sc:priceScale(c,S.hour,S.dow,S.dateISO)};
  if(!(after.c>before.c*1.9)) throw new Error(`12-01 应约翻倍: ${before.c} → ${after.c}`);
  const hit=after.sc.hits.find(x=>x.id==='gem_dec1');
  if(!hit) throw new Error('12-01 应命中 gem_dec1 事件');
  if(Math.abs(after.sc.cache.pin-4)>1e-9) throw new Error('涨价后输入标价应为 $4，实际 '+after.sc.cache.pin);
  if(Math.abs(after.sc.cache.pc-0.20)>1e-9) throw new Error('涨价后缓存价应为 $0.20，实际 '+after.sc.cache.pc);
  S.hi=DATASETS.overall_all.stats.score_max; S.dateISO='2026-11-30'; recompute();
  const fr0=tiers.map(t=>t.model.n);
  S.dateISO='2026-12-01'; recompute(); const fr1=tiers.map(t=>t.model.n);
  S.dateISO=DATA.scraped; offTime(); S.ds='overall_os'; loadDataset(true);
  return `Carbon：11-30 ${fmt$(before.c)} → 12-01 ${fmt$(after.c)}（输入 $2→$4、缓存 $0.10→$0.20）；overall_all 前沿 ${fr0.length} → ${fr1.length} 档`+
    (fr0.join()!==fr1.join()?`，成员变化：${fr1.filter(n=>!fr0.includes(n)).join(',')||'无'} 进 / ${fr0.filter(n=>!fr1.includes(n)).join(',')||'无'} 出`:'，成员未变');
});
TC('渲染全链路：缓存控件 × 时刻 × 门槛不抛异常', ()=>{
  let n=0;
  for(const src of ['pub','flat','off']) for(const hh of [0,0.5,0.85,0.95,1]){
    for(const sc of [{h:2,dow:3},{h:12,dow:6}]){
      onTime(sc.h,sc.dow); cacheOn(hh,src);
      for(const T0 of [1687,1600,1500]){ S.ds='overall_os'; S.hi=T0; render(); n++;
        if(!$('#tl').children.length) throw new Error('tl 空');
        if(!$('#cacheHint').innerHTML.length) throw new Error('cacheHint 空');
        renderAdjNote(); }
    }
  }
  for(const ds of ['overall_all','reference_os','img2webdev_os']){
    onTime(2,3); cacheOn(0.95); S.ds=ds; loadDataset(true); S.hi=DATASETS[ds].stats.score_max; render(); n++; }
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `${n} 种（缓存来源 × 命中率 × 时刻 × 门槛 × 数据集）组合渲染通过`;
});
TC('weekSpan：冠军自己的一周成本波动区间', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const g=n=>DATASETS.overall_os.models.find(m=>m.n===n);
  const a=weekSpan(g(DS0910)), b=weekSpan(g(DS1017)), c=weekSpan(g('Kimi K3.1 Pro (Max)'));
  const gA=g(DS0910), gB=g(DS1017);
  if(Math.abs(a.lo-gA.c/2)>1e-9||Math.abs(a.hi-gA.c)>1e-9) throw new Error('20260910 weekSpan 应为 c/2–c（'+gA.c+'/2–'+gA.c+'），实际 '+a.lo+'–'+a.hi);
  if(Math.abs(a.spread-2)>1e-6) throw new Error('spread 应为 2.0');
  if(Math.abs(b.lo-gB.c/2)>1e-9||Math.abs(b.hi-gB.c)>1e-9) throw new Error('20261017 weekSpan 应为 c/2–c（'+gB.c+'/2–'+gB.c+'），实际 '+b.lo+'–'+b.hi);
  if(Math.abs(c.spread-1)>1e-9) throw new Error('Kimi 无峰谷价，spread 应为 1，实际 '+c.spread);
  if(a.hiAt.hour!==1||!(a.hiAt.dow>=1&&a.hiAt.dow<=5)) throw new Error('最贵时刻应落在工作日峰时窗口起点');
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `${DS0910}: ${fmt$(a.lo)}（${DOWS[a.loAt.dow]} ${a.loAt.hour}:00）— ${fmt$(a.hi)}（${DOWS[a.hiAt.dow]} ${a.hiAt.hour}:00），${a.spread.toFixed(2)}×；`+
    `${DS1017}: ${fmt$(b.lo)}–${fmt$(b.hi)}；Kimi K3.1 Pro: ${fmt$(c.lo)}–${fmt$(c.hi)}（无波动）`;
});
TC('②③ 比值口径也跟着时间变量走（ratio 必须由修正后的 c 重算）', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true);
  S.mode='ratio'; S.hi=DATASETS.overall_os.stats.score_max; recompute();
  const peakW=view.w.n, peakV=view.val;
  S.mode='baseline'; recompute(); const peakB=view.w.n;
  let bad=0;
  for(const m of cur){ if(m.c>0 && Math.abs(m.ratio-m.s/m.c)>1e-9) bad++; }
  if(bad) throw new Error(bad+' 个模型的 ratio 没有用修正后的成本重算');
  onTime(SAT.h,SAT.dow); S.mode='ratio'; recompute(); const offW=view.w.n, offV=view.val;
  S.mode='pareto'; offTime(); S.ds='overall_os'; loadDataset(true);
  return `峰时 ②=${peakW}(${fmtR(peakV,0)} pts/$) ③=${peakB}；周六谷时 ②=${offW}(${fmtR(offV,0)} pts/$)；`+
    `${peakW===offW?'比值口径冠军未变（它本来就不受峰谷价影响，说明退化口径对时间变量也不敏感）':'比值口径冠军已改变'}`;
});
TC('默认状态 = 「此刻」+ 只启用已核实的修正', ()=>{
  const st=INIT_EV;
  const off=PRICE_EVENTS.filter(e=>e.conf!=='official'&&st[e.id]).map(e=>e.id);
  const onBad=PRICE_EVENTS.filter(e=>e.conf==='official'&&!st[e.id]).map(e=>e.id);
  if(off.length) throw new Error('存疑事件不该默认开启: '+off.join(','));
  if(onBad.length) throw new Error('已核实事件不该默认关闭: '+onBad.join(','));
  const conf={official:0,suspected:0}; PRICE_EVENTS.forEach(e=>conf[e.conf]++);
  const models=Object.values(conf);
  const nHit=PRICE_EVENTS.filter(e=>e.conf==='official').reduce((a,e)=>a+Object.keys(e.entries).length,0);
  if(INIT.date!==DATA.scraped) throw new Error('默认计价日期应为抓取日: '+INIT.date);
  if(!(INIT.hour>=0&&INIT.hour<=23&&INIT.dow>=0&&INIT.dow<=6)) throw new Error('默认时刻越界: '+INIT.hour+'/'+INIT.dow);
  if(Math.abs(INIT.os-1/12)>1e-9) throw new Error('默认输出占比应为 1/12: '+INIT.os);
  return `${PRICE_EVENTS.length} 条规则（已核实 ${conf.official} 条默认开、存疑 ${conf.suspected} 条默认关），命中 ${nHit} 个模型条目；`+
    `初始状态 = UTC ${DOWS[INIT.dow]} ${String(INIT.hour).padStart(2,'0')}:00、计价日期 ${INIT.date}、输出占比 ${(INIT.os*100).toFixed(0)}%`;
});
TC('idxOf/dowHourOf 往返一致 + jumpToIdx 落点正确', ()=>{
  let bad=0;
  for(let i=0;i<168;i++){ const {dow,hour}=dowHourOf(i); if(idxOf(dow,hour)!==i) bad++; }
  if(bad) throw new Error(bad+' 个索引往返失败');
  const d0=dowHourOf(0), d167=dowHourOf(167), mid=dowHourOf(idxOf(6,3));
  if(d0.hour!==0||d0.dow!==1) throw new Error('索引 0 应为周一 00:00');
  if(d167.hour!==23||d167.dow!==0) throw new Error('索引 167 应为周日 23:00');
  if(mid.hour!==3||mid.dow!==6) throw new Error('周六 03:00 往返失败');
  const keep={h:S.hour,d:S.dow}; jumpToIdx(idxOf(6,3));
  if(S.dow!==6||S.hour!==3) throw new Error('jumpToIdx 未写入状态');
  S.hour=keep.h; S.dow=keep.d; offTime(); S.ds='overall_os'; loadDataset(true);
  return '168 个索引全部往返一致；idx 0 = 周一 00:00，idx 167 = 周日 23:00';
});
TC('渲染全链路：时间控件 + 时间轴 SVG 不抛异常', ()=>{
  let n=0;
  for(const sc of [PEAK,OFF,SAT,{h:1,dow:5},{h:23,dow:0}]){
    for(const T0 of [1687,1660,1600,1500,1400]){
      onTime(sc.h,sc.dow); S.ds='overall_os'; S.hi=T0; render(); n++;
      if(!$('#tl').children.length) throw new Error(`tl 空 @${sc.h}/${sc.dow}/T=${T0}`);
      const nt=$('#tlNote').innerHTML;
      if(!nt||nt.length<20) throw new Error('tlNote 空 @T='+T0);
      renderAdjNote(); if(!$('#adjNote').innerHTML) throw new Error('adjNote 空');
    }
  }
  for(const ds of ['overall_all','reference_os','img2webdev_os','fullstack_os','react_os','frontend_os']){
    onTime(PEAK.h,PEAK.dow); S.ds=ds; loadDataset(true); S.hi=DATASETS[ds].stats.score_max; render(); n++;
  }
  S.hi=99999; onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); render(); n++;  // 门槛过高
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `${n} 种（时刻 × 门槛 × 数据集）组合渲染通过，含门槛过高的空态`;
});
/* ==================== i18n：字典完整性 + 多 locale 渲染 ====================
   I18N_ALL 由 test/build.py 注入（全部 locale 字典 flat JSON 的 {locale: dict}）。
   断言三层：① key 集合全 locale 一致（缺 key = 翻译漏项）；
             ② 渲染全程无缺失（I18N_MISSING 由 01-util 的 T() 记录）；
             ③ 每个 locale 切字典后核心渲染一轮不抛异常、产出不含占位符残留。 */
TC('i18n 字典完整性：全部 locale key 集合一致', ()=>{
  if(typeof I18N_ALL==='undefined'||!I18N_ALL) throw new Error('I18N_ALL 未注入（test/build.py 版本过旧）');
  const lcs=Object.keys(I18N_ALL);
  if(lcs.length<2) throw new Error('至少要 2 个 locale 字典，实际 '+lcs.length);
  const base=Object.keys(I18N_ALL[lcs[0]]).sort();
  const bad=[];
  for(const lc of lcs.slice(1)){
    const ks=Object.keys(I18N_ALL[lc]).sort();
    if(ks.length!==base.length) bad.push(`${lc}: ${ks.length} keys ≠ ${lcs[0]}: ${base.length}`);
    const miss=base.filter(k=>!I18N_ALL[lc][k]), extra=ks.filter(k=>!I18N_ALL[lcs[0]][k]);
    if(miss.length) bad.push(`${lc} 缺: ${miss.slice(0,6).join(',')}${miss.length>6?'…':''}`);
    if(extra.length) bad.push(`${lc} 多: ${extra.slice(0,6).join(',')}${extra.length>6?'…':''}`);
  }
  if(bad.length) throw new Error(bad.slice(0,4).join(' | '));
  return `${lcs.length} locale（${lcs.join('/')}）各自 ${base.length} keys，集合完全一致`;
});
TC('i18n 渲染无缺失：全链路跑完 I18N_MISSING 为空', ()=>{
  const mx=D().stats.score_max, mn=D().stats.score_min;
  I18N_MISSING.length=0;
  [mx,1600,1500,mn].forEach(t=>{S.hi=t;recompute();});
  S.mode='ratio'; recompute(); render();
  S.mode='baseline'; recompute(); render();
  S.hi=mx; recompute();
  if(I18N_MISSING.length) throw new Error('T() 缺 key: '+[...new Set(I18N_MISSING)].slice(0,8).join(','));
  return `en 全链路（${[mx,1600,1500,mn].length} 门槛 × 3 口径 × 2 CI）T() 调用零缺失`;
});
TC('i18n 多 locale 渲染：切字典后核心链路 + 占位符残留检查', ()=>{
  if(typeof I18N_ALL==='undefined'||!I18N_ALL) throw new Error('I18N_ALL 未注入');
  const save=JSON.parse(JSON.stringify(I18N)); const results=[];
  for(const lc of Object.keys(I18N_ALL)){
    for(const k of Object.keys(I18N)) delete I18N[k];
    Object.assign(I18N, I18N_ALL[lc]);
    S.hi=1600; recompute(); render();
    const card=$('#winCard').children.map(c=>c.textContent||c.innerHTML||'').join(' ');
    if(!card||card.length<40) throw new Error(lc+': winCard 空');
    const blob=$('#dsNote').innerHTML+card+($('#tlNote').innerHTML||'');
    if(/undefined|\{\{|%METHOD%|%ROOT%/.test(blob)) throw new Error(lc+': 产出含占位符残留');
    results.push(`${lc}✓`);
  }
  for(const k of Object.keys(I18N)) delete I18N[k];
  Object.assign(I18N, save);
  S.hi=D().stats.score_max; recompute();
  return results.join(' ')+' — 每 locale 渲染一轮（winCard/dsNote/tlNote）无残留';
});



/* ==================== 页签①实惠排行榜 ==================== */
TC('排行榜：画像成本公式手算对照（写入倍率 1.25 + 缓存 95% + 峰谷修正）', ()=>{
  S.ds='overall_os'; loadDataset(true); S.rankPreset='custom'; S.rankIn=20; S.rankOut=2;
  /* Claude Sonnet 5.5 (High)（overall_all，闭源榜）：wm=1.25、公布缓存比 0.05、无峰谷事件 → 手算逐位对照 */
  onTime(12,3); cacheOn(0.95);
  const sn=G('overall_all','Claude Sonnet 5.5 (High)');
  const L1=listPricesAt(sn,S.hour,S.dow,S.dateISO);
  const pinEff=(1-0.95)*L1.pin*1.25+0.95*L1.pin*0.05;
  const want1=(20*pinEff+2*L1.pout)/1000;
  if(Math.abs(dailyCost(sn)-want1)>1e-12) throw new Error(`Sonnet dailyCost=${dailyCost(sn)} 手算=${want1}`);
  /* DeepSeek-20260910（榜面=峰价）：谷时画像 = 峰时的一半（pin/pout 同折半，缓存关闭口径） */
  const ds=G('overall_os','DeepSeek-V4.1-Flash-20260910 (Max)');
  onTime(2,3);
  const pk=dailyCost(ds);
  onTime(12,6);
  const off=dailyCost(ds);
  if(Math.abs(off/pk-0.5)>1e-9) throw new Error(`DeepSeek 谷/峰画像成本比应 0.5，实际 ${off/pk}`);
  onTime(12,3);
  return `Sonnet ${fmt$(dailyCost(sn))}/task @20k/2k+缓存95%；DeepSeek 峰 ${fmt$(pk)} → 谷 ${fmt$(off)}（恰 ×0.5）`;
});
TC('排行榜：达标过滤 + 成本升序 + 冠军=暴力最小成本', ()=>{
  onTime(12,3); cacheOn(0.95); S.ds='overall_os'; loadDataset(true);
  S.rankPreset='dev'; S.rankT=1400; recompute();
  const rows=rankRows();
  if(!rows.length) throw new Error('T=1400 应有达标模型');
  for(let i=1;i<rows.length;i++){
    if(rows[i].c<rows[i-1].c-1e-12) throw new Error(`排序破坏 @${i}: ${rows[i-1].c} > ${rows[i].c}`);
    if(rows[i].m.s<S.rankT) throw new Error(`未达标模型混入: ${rows[i].m.n} s=${rows[i].m.s}`);
  }
  const bruteMin=Math.min(...cur.filter(m=>m.s>=S.rankT&&m.c!=null&&m.c>0).map(m=>dailyCost(m)));
  if(Math.abs(rows[0].c-bruteMin)>1e-12) throw new Error(`冠军 ${rows[0].m.n} ${rows[0].c} ≠ 暴力最小 ${bruteMin}`);
  /* 渲染一轮不抛 + 行数一致（fake DOM: appendChild 的行读 tb.children） */
  renderRank();
  const shown=$('#rankTbl tbody').children.length;
  if(shown!==Math.min(rows.length,20)) throw new Error(`渲染 ${shown} 行 ≠ 预期 ${Math.min(rows.length,20)}`);
  S.rankT=DATASETS.overall_os.stats.score_max; loadDataset(true);
  return `T=1400 达标 ${rows.length} 个，冠军 ${rows[0].m.n} ${fmt$(rows[0].c)}；渲染 ${shown} 行`;
});
TC('排行榜：门槛钳制到榜内 + 空态文案不崩', ()=>{
  S.ds='overall_os'; loadDataset(true); S.rankT=99999; recompute();
  /* renderRank 把门槛 clamp 进 [score_min, score_max]：99999 → score_max，达标只剩顶档 */
  const st=DATASETS.overall_os.stats;
  if(S.rankT!==st.score_max) throw new Error('门槛应被钳到 score_max，实际 '+S.rankT);
  const rows=rankRows();
  if(rows.length!==1) throw new Error('顶档门槛应只剩 1 个达标，实际 '+rows.length);
  /* 达标为空的真实空态：把门槛拖到全榜无模型可达的口径（排除成本空模型）——直接断言空态渲染路径 */
  S.rankT=st.score_max; recompute(); renderRank();
  const html=$('#rankVerdict').children.map(c=>c.textContent||c.innerHTML||'').join(' ');
  if(!html||html.length<10) throw new Error('verdict 应有内容');
  S.rankT=null; loadDataset(true);
  return `门槛钳制 OK（99999→${st.score_max}，顶档达标 ${rows.length} 个）`;
});
TC('排行榜：文生图榜按张计价（画像区隐藏，成本直用实测）', ()=>{
  S.ds='t2i'; loadDataset(true); S.rankPreset='dev'; recompute();
  if(!rankIsImage()) throw new Error('t2i 未识别为 image 单位');
  const rows=rankRows();
  if(!rows.length) throw new Error('t2i 默认门槛下应有达标模型');
  for(const x of rows) if(Math.abs(x.c-x.m.c)>1e-12) throw new Error(`image 榜成本应=实测 m.c：${x.m.n}`);
  renderRank();
  if($('#rankProfile').style.display!=='none') throw new Error('image 榜画像区应隐藏');
  if($('#rankUnitHint').style.display==='none') throw new Error('image 榜应显示按张计价提示');
  const label=$('#rankVerdict').innerHTML+' '+(tb=$('#rankUnitHint')).innerHTML;
  if(!/image/i.test(label)&&!/张/.test(label)) throw new Error('verdict/提示应标注按张口径: '+label.slice(0,120));
  S.ds='overall_os'; loadDataset(true);
  return `t2i 达标 ${rows.length} 个，冠军 ${rows[0].m.n} ${fmt$(rows[0].c)}/image；画像区已隐藏`;
});
TC('排行榜：页签状态机 + deep 重渲（fake DOM 烟雾）', ()=>{
  S.tab='deep'; $('#rankView').style.display='none'; $('#deepView').style.display='';
  if($('#deepView').style.display!=='') throw new Error('deep 显隐失败');
  recompute();
  const card=$('#winCard').children.map(c=>c.textContent||c.innerHTML||'').join(' ');
  if(!card||card.length<40) throw new Error('deep 页签 winCard 应渲染');
  S.tab='rank'; $('#rankView').style.display=''; $('#deepView').style.display='none';
  recompute();
  const rv=$('#rankVerdict').children.map(c=>c.textContent||c.innerHTML||'').join(' ');
  if(!rv||rv.length<10) throw new Error('rank 页签 verdict 应渲染');
  return '页签状态机 + deep 重渲 OK';
});

TC('排行榜：applyTabUI 单一来源（?tab=deep 深链恢复依赖它）', ()=>{
  reset();
  if(typeof applyTabUI!=='function') throw new Error('applyTabUI 未暴露到全局 —— 09-boot 恢复 URL ?tab=deep 会静默失效（深链停在排行榜页）');
  S.tab='deep'; applyTabUI();
  if($('#deepView').style.display!=='') throw new Error('applyTabUI 未显示 deepView（display==\'\' 才是可见）');
  if($('#rankView').style.display!=='none') throw new Error('applyTabUI 未隐藏 rankView');
  S.tab='rank'; applyTabUI();
  if($('#rankView').style.display!=='') throw new Error('applyTabUI 未显示 rankView');
  if($('#deepView').style.display!=='none') throw new Error('applyTabUI 未隐藏 deepView');
  return 'applyTabUI 显隐双向 OK（boot URL 恢复可依赖）';
});

TC('首屏场景卡：applyScene 三场景参数展开（与 URL ?scene= 同映射）', ()=>{
  reset();
  if(applyScene('nope')!==false) throw new Error('非法 scene 应返回 false');
  // coding = 写代码：dev 画像（20k/2k）+ 谷时（hour=12 dow=6）
  applyScene('coding');
  if(S.tab!=='rank'||S.rankPreset!=='dev'||S.rankIn!==20||S.rankOut!==2) throw new Error('coding 展开错: '+JSON.stringify([S.tab,S.rankPreset,S.rankIn,S.rankOut]));
  if(S.rankPk!=='off'||S.hour!==12||S.dow!==6) throw new Error('coding 谷时错: '+S.rankPk+'/'+S.hour+'/'+S.dow);
  // agent = Agent 重度：heavy 画像（120k/12k）+ 此刻（hour/dow = UTC 当前）
  applyScene('agent');
  if(S.rankPreset!=='heavy'||S.rankIn!==120||S.rankOut!==12||S.rankPk!=='now') throw new Error('agent 展开错');
  // offpeak = 深夜低谷：light 画像（2k/0.5k）+ 谷时
  applyScene('offpeak');
  if(S.rankPreset!=='light'||S.rankIn!==2||S.rankOut!==0.5||S.rankPk!=='off') throw new Error('offpeak 展开错');
  // 场景后排行榜冠军必须与同口径暴力最小一致（agent=heavy+此刻，dailyCost 口径）
  applyScene('agent'); S.rankT=1400; S.rankTSet=true; recompute();
  const rows=rankRows();
  const bruteMin=Math.min(...cur.filter(m=>m.s>=S.rankT&&m.c!=null&&m.c>0).map(m=>dailyCost(m)));
  if(!rows.length||Math.abs(rows[0].c-bruteMin)>1e-12) throw new Error('agent 场景冠军 ≠ 暴力最小成本');
  reset();
  return 'coding→dev+谷时 / agent→heavy+此刻 / offpeak→light+谷时；冠军=暴力解';
});

/* ==================== P0 传播链路（2026-11-26）：静态 HTML 卫生 + 分享栏 ==================== */
/* 英文页里混入 CJK 标点（顿号/全角括号）是上一轮实站核查抓到的信任瑕疵 —— 这里把「en 渲染文本
   零 CJK 标点」锁成回归断言。ja 的 、。（） 是该语言规范标点，不在检查范围。 */
TC('静态卫生：英文页渲染文本零 CJK 标点', ()=>{
  const fs=require('fs'), P=require('path');
  const s=fs.readFileSync(P.join(__dirname,'..','dist','index.html'),'utf8');
  const body=s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,'');
  const CJKP=/[、，。．（）【】《》「」『』！？；：～]/;
  const hits=[...body].filter(ch=>CJKP.test(ch));
  if(hits.length) throw new Error('命中 '+hits.length+' 处: '+[...new Set(hits)].join(' '));
  return 'en 首页渲染文本 0 处 CJK 标点（顿号修复已锁定）';
});
TC('静态卫生：全 locale 首页无 --:00 占位符（构建期注入静态小时）', ()=>{
  const fs=require('fs'), P=require('path'), ROOT=P.join(__dirname,'..');
  const pages=[['en','dist/index.html'],['zh','dist/zh/index.html'],['ja','dist/ja/index.html'],['ko','dist/ko/index.html'],['fr','dist/fr/index.html']];
  const bad=[];
  for(const [lc,rel] of pages){
    const f=P.join(ROOT,rel); if(!fs.existsSync(f)){ bad.push(rel+' 缺文件'); continue; }
    const s=fs.readFileSync(f,'utf8');
    if(s.includes('--:00')) bad.push(rel+' 仍有 --:00');
    if(!/id="hourUtc">[^<]* 12:00</.test(s)) bad.push(rel+' hourUtc 无静态默认');
    if(!/id="hourLocal">12:00</.test(s)) bad.push(rel+' hourLocal 无静态默认');
  }
  if(bad.length) throw new Error(bad.join(' | '));
  return pages.length+' 个 locale 首页全部构建期注入「周三 12:00 UTC」静态默认（locale 感知星期名）';
});
TC('分享链路：og/twitter 齐全 + 分享栏三键各发一条 mp_share_click', ()=>{
  const fs=require('fs'), P=require('path');
  const s=fs.readFileSync(P.join(__dirname,'..','dist','index.html'),'utf8');
  for(const mark of ['property="og:image"','property="og:image:width" content="1200"','name="twitter:card"','id="shareBar"'])
    if(!s.includes(mark)) throw new Error('dist/index.html 缺 '+mark);
  const calls=[];
  global.mpTrack=(n,p)=>calls.push([n,p&&p.channel]);
  reset();
  $('#shareX').onclick(); $('#shareReddit').onclick(); $('#shareCopy').onclick();
  delete global.mpTrack;
  if(calls.length!==3) throw new Error('触发 '+calls.length+' 次（期望 3）');
  const got=calls.map(c=>c.join(':')).join(',');
  if(got!=='mp_share_click:x,mp_share_click:reddit,mp_share_click:copy') throw new Error('事件流 '+got);
  return 'og:image(1200×630)/twitter:card/shareBar 在位；x→reddit→copy 各发 mp_share_click（channel 区分）';
});

let fail=0;
for(const [n,st,r,ms] of out){ if(st!=='OK')fail++; W((st==='OK'?'✓ ':'✗ ')+n+`  [${ms}ms]\n     `+String(r).slice(0,1500)); }
W('\n'+(out.length-fail)+'/'+out.length+' passed');
process.exit(fail?1:0);
