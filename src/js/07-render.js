
function render(){
  renderWinner(); renderScatter(); renderSteps(); renderTimeline(); renderTiers(); renderTable(); renderBadges(); syncInputs(); renderAdjNote();
}
function renderBadges(){
  const d=DATASETS[S.ds];
  $('#topBadges').innerHTML='';
  const add=(t,c)=>$('#topBadges').appendChild(el('span','pill '+ (c||''),t));
  add(`${fmtN(d.stats.n)}${T('badges.models')}`); add(`${fmtN(d.stats.with_cost)}${T('badges.withCost')}`,'good');
  add(`${fmtN(cur.filter(inBand).length)}${T('badges.inRange')}`,'gold');
  add(T('badges.frontier')+`${frontier.length}${T('badges.frontierTiers')}`,'good');
  const onEv=PRICE_EVENTS.filter(e=>S.evState[e.id]);
  if(onEv.length){
    const pk=peakAtAny(S.hour,S.dow);
    add(`${pk?T('badges.peak'):T('badges.offpeak')} · ${DOWS[S.dow]} ${String(S.hour).padStart(2,'0')}:00 UTC`, pk?'warn':'');
    const nAdj=(cur||[]).filter(m=>m.adj).length;
    if(nAdj) add(T('badges.timeAdj')+`${nAdj}${T('badges.timeAdjTail')}`,'gold');
  } else add(T('badges.listPrice'));
  add(S.cacheSrc==='off'?T('badges.cacheOff'):T('badges.cacheHit')+Math.round(S.cacheHit*100)+'%', S.cacheSrc==='off'?'':'good');
  if(S.ci==='strict') add(T('badges.strict'),'warn');
}
function renderWinner(){
  const c=$('#winCard'); c.innerHTML='';
  if(!view){
    const d0=DATASETS[S.ds];
    c.appendChild(el('div','empty', d0.stats.with_cost===0
      ? T('data.emptyNoCost')
      : T('data.emptyFiltered')));
    return;
  }
  const m=view.w;
  const modeName=T('winner.modeName.'+view.mode);
  c.appendChild(el('div','k', `${T('winner.currentMode')}${modeName} · ${S.ci==='strict'?T('winner.strictCI'):T('winner.pointEst')}`));
  const nm=el('div','nm');
  nm.innerHTML=`<span class="rank">#${m.r!=null?m.r:'—'}</span>${m.n}`;
  c.appendChild(nm);
  c.appendChild(el('div','by', `${m.lab?m.lab+' · ':''}<span class="mono">${m.lic||T('winner.licUnknown')}</span>${m.pre?' · <span class="pill warn" style="padding:0 5px">'+T('winner.preliminary')+'</span>':''}${m.ae?' · <span class="pill bad" style="padding:0 5px">'+T('winner.autoEval')+'</span>':''}${m.pareto?' · <span class="pill good" style="padding:0 5px">'+T('winner.pareto')+'</span>':' <span class="pill" style="padding:0 5px">'+T('winner.dominated')+'</span>'}`));

  const k=el('div','kpis');
  const kpi=(t,v,cl,s)=>{const d=el('div','kpi '+(cl||''));d.innerHTML=`<div class="t">${t}</div><div class="v">${v}${s?` <small>${s}</small>`:''}</div>`;k.appendChild(d);};
  kpi(T('winner.kpiScore'), m.s, 'gold', `+${m.u95}/−${m.d95}`);
  kpi(T('winner.kpiCost'), m.adj?`${fmt$(m.c)}<small style="color:var(--dim2);text-decoration:line-through">${fmt$(m.cRaw)}</small>`:fmt$(m.c), 'accent',
      m.adj?adjLabel(m):T('winner.listNoAdj'));
  kpi(T('winner.kpiRatio'), fmtR(m.ratio,0), '', T('winner.ptsPerDollar'));
  if(view.mode==='baseline') kpi(T('winner.kpiExcess'), fmtR(m.baseRatio,1),'good', T('winner.kpiBaseline')+view.base);
  kpi(T('winner.kpiVotes'), fmtN(m.v));
  if(m.pin!=null && m.adj && m.adj.cache){
    const cc=m.adj.cache, eff=(1-cc.h)*cc.pin*cc.wm + cc.h*cc.pc;
    kpi(T('winner.kpiApi'), `${fmt$(eff)} / ${fmt$(m.pout)}`, 'good',
        T('winner.kpiEffPin')+Math.round(cc.h*100)+(cc.est?T('winner.kpiEst'):'')+T('winner.kpiList')+fmt$(cc.pin));
  } else kpi(T('winner.kpiApi'), m.pin!=null?`${fmt$(m.pin)} / ${fmt$(m.pout)}`:'N/A','', T('winner.kpiInOut'));
  kpi(T('winner.kpiCtx'), m.ctx||'N/A');
  kpi(T('winner.kpiRank'), m.or!=null?`#${m.or}`:'—');
  c.appendChild(k);

  const v=el('div','verdict');
  let html='';
  if(view.mode==='pareto'){
    const cov=view.covers.map(Math.round);
    html+=TF('winner.verdict',{hi:S.hi,lo:S.lo,name:m.n,cov0:cov[0],cov1:cov[1]});
    if(view.degraded)
      html+=TF('winner.degraded',{hi:S.hi,smax:DATASETS[S.ds].stats.score_max});
    if(!view.bandOk)
      html+=TF('winner.bandNotOk',{s:m.s,lo:S.lo,hi:S.hi});
    const ws=weekSpan(m);
    if(ws && ws.spread>1.0001){
      html+=TF('winner.swing',{lo:fmt$(ws.lo),loDow:DOWS[ws.loAt.dow],loHr:String(ws.loAt.hour).padStart(2,'0'),
        hi:fmt$(ws.hi),hiDow:DOWS[ws.hiAt.dow],hiHr:String(ws.hiAt.hour).padStart(2,'0'),
        spread:ws.spread.toFixed(2),pct:Math.round((1-ws.lo/ws.hi)*100)});
    }
    if(view.marginal){
      const g=view.marginal;
      html+=TF('winner.nextUp',{name:g.model.n,pts:g.model.s,cost:fmt$(g.model.c),dc:fmt$(g.dc),ds:g.ds,per:fmt$(g.per)});
      html+= g.per>2 ? T('winner.nextUpExpensive')
                     : g.per<0.15 ? T('winner.nextUpBargain') : T('winner.nextUpNormal');
      html+=`<br>`;
    } else {
      html+=T('winner.nextUpNone');
    }
    if(view.downStat){
      const g=view.downStat;
      html+=TF('winner.downOne',{name:g.model.n,pts:g.model.s,cost:fmt$(g.model.c),dc:fmt$(g.dc),ds:g.ds,per:fmtR(1/g.per,1)});
      html+= (1/g.per)>15 ? T('winner.downTooMuch') : T('winner.downAcceptable');
    }
  } else {
    html+=TF('winner.verdictRatio',{lo:S.lo,hi:S.hi,n:cur.filter(inBand).length,
      basis:view.mode==='ratio'?T('winner.basisRatio'):TF('winner.basisBaseline',{base:view.base}),
      name:m.n,val:fmtR(view.val,1)});
    if(!view.inBand) html+=T('winner.noInBand');
    html+=`<br>`;
    if(view.marginal){
      const g=view.marginal;
      html+=TF('winner.butNote',{name:g.model.n,s:g.model.s,per:fmt$(g.per)});
    }
    html+=T('winner.biasedWarn');
  }
  // 统计可靠性
  const rel = m.v==null ? null : (m.v<1000?'low':m.v<5000?'mid':'high');
  if(rel){
    const cl = rel==='low'?'warn':rel==='mid'?'':'em';
    html+=TF('winner.reliability',{cl,rel:T('winner.rel_'+rel),votes:fmtN(m.v),ci:Math.max(m.u95,m.d95)});
    if(rel==='low') html+=T('winner.lowSampleWarn');
  }
  if(m.c==null) html+=T('winner.costMissing');
  v.innerHTML=html; c.appendChild(v);
}

/* ---------- render: charts ----------
   三张图都按容器实际宽度渲染：viewBox 宽 = 容器宽（svg.clientWidth，fake DOM 下回退 900），
   文字字号用 SVG attribute 而非 CSS 固定值 —— 手机窄容器同倍缩放后 CSS 字号会变得不可读，
   所以窄容器用更大的基准字号（FS），标签预算/截断长度也随宽度收紧。 */
const LX={w:900,h:430,m:{t:18,r:16,b:38,l:60}};
const NS='http://www.w3.org/2000/svg';
const mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;};
const tx=(x,y,str,cls,anchor,fs)=>{const t=mk('text',{x,y,class:cls||'','text-anchor':anchor||'start'});t.textContent=str;if(fs)t.setAttribute('font-size',fs);return t;};
/* 图表字号三元组：FS 基准 / LFS 标签 / WFS 白色高亮标签 */
function chartFS(w){ const FS=w<620?12.5:9.5; return {FS,LFS:FS+0.5,WFS:FS+1}; }
/* 安全测宽：clientWidth 与父容器 content 宽取小者。首渲发生在布局稳定前时（fresh navigation
   预布局期），clientWidth 可能读到异常大值并经 viewBox 回写形成自锁反馈环 —— 用父容器宽钳住。 */
function chartW(svg,fallback){
  const p=svg.parentElement, cw=svg.clientWidth||0;
  let pc=0;
  if(p&&p.clientWidth&&typeof getComputedStyle==='function'){
    const cs=getComputedStyle(p);
    pc=p.clientWidth-parseFloat(cs.paddingLeft||'0')-parseFloat(cs.paddingRight||'0');
  }
  return Math.max(340,Math.round(Math.min(cw||fallback, pc||cw||fallback)));
}
function logScale(v,lo,hi){ const a=Math.log10(lo),b=Math.log10(hi); return (Math.log10(v)-a)/(b-a); }
function niceTicks(lo,hi){
  const out=[]; const e0=Math.floor(Math.log10(lo)), e1=Math.ceil(Math.log10(hi));
  for(let e=e0;e<=e1;e++) for(const m of [1,2,5]){ const v=m*Math.pow(10,e); if(v>=lo*0.999&&v<=hi*1.001) out.push(v); }
  return out.length?out:[lo,hi];
}
let scatGeo=null;
function renderScatter(){
  const svg=$('#scat'); svg.innerHTML='';
  const pts=cur.filter(m=>m.c!=null&&m.c>0);
  if(pts.length<2){ svg.appendChild(tx(20,40,T('scatter.needTwo'),'lbl','start',12)); return; }
  const w=chartW(svg,LX.w), h=LX.h, m=LX.m, {FS,LFS,WFS}=chartFS(w);
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);   // viewBox 跟随容器宽，否则画布坐标与视口错位
  const narrow=w<620;
  const x0=m.l, x1=w-m.r, y0=h-m.b, y1=m.t;
  const sLo=Math.min(...cur.map(v=>v.sLo)), sHi=Math.max(...cur.map(v=>v.sHi));
  const pad=(sHi-sLo)*0.05||10, dMin=sLo-pad, dMax=sHi+pad;
  const sx=v=>x0+(v-dMin)/(dMax-dMin)*(x1-x0);
  const cMin=Math.min(...pts.map(v=>v.c))*0.78, cMax=Math.max(...pts.map(v=>v.c))*1.3;
  const sy=v=>y0-logScale(clamp(v,cMin,cMax),cMin,cMax)*(y0-y1);
  scatGeo={sx,x0,x1,dMin,dMax,w};

  // 当前分数区间
  const bx0=sx(S.lo), bx1=sx(S.hi);
  svg.appendChild(mk('rect',{x:Math.min(bx0,bx1),y:y1,width:Math.max(1,Math.abs(bx1-bx0)),height:y0-y1,class:'band'}));
  // 网格 + 轴
  niceTicks(cMin,cMax).forEach(t=>{
    const y=sy(t);
    svg.appendChild(mk('line',{x1:x0,x2:x1,y1:y,y2:y,class:'grid-l'}));
    svg.appendChild(tx(x0-8,y+3,fmt$(t),'','end',FS));
  });
  const step=Math.max(10,Math.round((dMax-dMin)/9/10)*10);
  for(let t=Math.ceil(dMin/step)*step;t<=dMax;t+=step){
    const x=sx(t);
    svg.appendChild(mk('line',{x1:x,x2:x,y1:y0,y2:y0+5,class:'ax'}));
    svg.appendChild(tx(x,y0+17,String(t),'','middle',FS));
  }
  svg.appendChild(mk('line',{x1:x0,x2:x1,y1:y0,y2:y0,class:'ax'}));
  const yl=tx(16,(y0+y1)/2,T('scatter.yAxis'),'','middle',LFS);
  yl.setAttribute('transform',`rotate(-90 16 ${(y0+y1)/2})`); svg.appendChild(yl);
  svg.appendChild(tx((x0+x1)/2,h-3,T('scatter.xAxis'),'','middle',FS));

  // Pareto 前沿（阶梯折线）
  if(frontier.length>1){
    const fr=[...frontier].sort((a,b)=>a.s-b.s);
    let d=`M${sx(fr[0].s)},${sy(fr[0].c)}`;
    for(let i=0;i<fr.length;i++){
      const y=sy(fr[i].c), nx=i<fr.length-1?sx(fr[i+1].s):x1;
      d+=`L${nx},${y}`;
      if(i<fr.length-1) d+=`L${nx},${sy(fr[i+1].c)}`;
    }
    svg.appendChild(mk('path',{d,class:'frontier'}));
  }
  // 拖动分数线（放在点下面，点仍可点击）
  const hit=mk('rect',{x:x0,y:y1,width:x1-x0,height:y0-y1,fill:'transparent',style:'cursor:ew-resize'});
  let drag=false;
  const toScore=e=>{
    const r=svg.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width*w;
    return Math.round(clamp(dMin+(px-x0)/(x1-x0)*(dMax-dMin), scoreExtent()[0], scoreExtent()[1]));
  };
  hit.addEventListener('pointerdown',e=>{drag=true;hit.setPointerCapture(e.pointerId);const v=toScore(e);S.hi=v;if(S.lo>v)S.lo=v;stopPlay();recompute();});
  hit.addEventListener('pointermove',e=>{if(!drag)return;const v=toScore(e);S.hi=v;if(S.lo>v)S.lo=v;recompute();});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>hit.addEventListener(ev,()=>drag=false));
  svg.appendChild(hit);

  // 数据点
  const wn = view&&view.w?view.w.n:null;
  const labelBudget = frontier.length<=(narrow?5:16);
  pts.forEach(mm=>{
    const g=mk('g',{class:'dot'});
    const isW = mm.n===wn;
    if(mm.u95||mm.d95)
      g.appendChild(mk('line',{x1:sx(mm.s-mm.d95),x2:sx(mm.s+mm.u95),y1:sy(mm.c),y2:sy(mm.c),class:'ci',
        stroke:isW?'#f5c542':(mm.pareto?'#3ddc97':'#5b6a82')}));
    g.appendChild(mk('circle',{cx:sx(mm.s),cy:sy(mm.c),r:isW?7.5:(mm.pareto?4.8:3),
      fill:isW?'#f5c542':(mm.pareto?'#3ddc97':'#39445a'),
      stroke:isW?'#fff':'none','stroke-width':isW?2:0,opacity:isW||mm.pareto?1:.8}));
    if(mm.adj) g.appendChild(mk('circle',{cx:sx(mm.s),cy:sy(mm.c),r:(isW?7.5:(mm.pareto?4.8:3))+4,
      fill:'none',stroke:'var(--gold)','stroke-width':1.2,'stroke-dasharray':'3 3',opacity:.85}));
    if(isW||(mm.pareto&&labelBudget)){
      const anchor = sx(mm.s) > x1-(narrow?110:190) ? 'end' : 'start';
      const dx = anchor==='end'? -10 : 9;
      g.appendChild(tx(sx(mm.s)+dx, sy(mm.c)+3.5, mm.n.length>(narrow?18:28)?mm.n.slice(0,(narrow?17:27))+'…':mm.n, isW?'lblw':'lbl', anchor, isW?WFS:LFS));
    }
    const t=mk('title'); t.textContent=TF('scatter.dotTitle',{name:mm.n,s:mm.s,u:mm.u95,d:mm.d95,
      c:fmt$(mm.c),v:fmtN(mm.v),
      api:mm.pin!=null?fmt$(mm.pin)+' / '+fmt$(mm.pout)+' $/M':T('scatter.dotApiNA'),
      pareto:mm.pareto?T('scatter.dotPareto'):T('scatter.dotDominated')}); g.appendChild(t);
    g.addEventListener('click',()=>{ S.hi=mm.s; if(S.lo>mm.s)S.lo=mm.s; stopPlay(); recompute(); });
    svg.appendChild(g);
  });
  // 分数线 T
  svg.appendChild(mk('line',{x1:sx(S.hi),x2:sx(S.hi),y1:y1-8,y2:y0,class:'tline'}));
  svg.appendChild(narrow
      ? tx(sx(S.hi)-5,y1-1,`T = ${S.hi}`,'lblw','end',WFS)
      : tx(sx(S.hi)+5,y1-1,`T = ${S.hi}`,'lblw','start',WFS)).setAttribute('fill','#f5c542');
  if(S.lo<S.hi) svg.appendChild(tx(sx(S.lo)-5,y1-1,`lo = ${S.lo}`,'lbl','end',LFS));
}

/* ---------- render: step chart ---------- */
function renderSteps(){
  const svg=$('#steps'); svg.innerHTML='';
  if(!tiers.length){
    svg.appendChild(tx(20,40,T('steps.modeOnly'),'lbl','start',12));
    return;
  }
  const w=chartW(svg,900),h=250,m={t:20,r:16,b:42,l:60};
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);   // viewBox 跟随容器宽，否则画布坐标与视口错位
  const {FS,LFS,WFS}=chartFS(w); const narrow=w<620;
  const x0=m.l,x1=w-m.r,y0=h-m.b,y1=m.t;
  const sTop = DATASETS[S.ds].stats.score_max;
  const fr=[...tiers].sort((a,b)=>a.model.s-b.model.s);
  const sLo=Math.min(...fr.map(t=>t.model.s))-10, sHi=Math.max(sTop, Math.max(...fr.map(t=>t.upper||t.model.s)))+10;
  const cs=fr.map(t=>t.model.c).filter(c=>c>0);
  if(!cs.length){ svg.appendChild(tx(20,40,T('steps.noCost'),'lbl','start',12)); return; }
  const cMin=Math.min(...cs)*0.72, cMax=Math.max(...cs)*1.45;
  const sx=v=>x0+(v-sLo)/(sHi-sLo)*(x1-x0);
  const sy=v=>y0-logScale(clamp(v,cMin,cMax),cMin,cMax)*(y0-y1);
  niceTicks(cMin,cMax).forEach(t=>{
    const y=sy(t);
    svg.appendChild(mk('line',{x1:x0,x2:x1,y1:y,y2:y,class:'grid-l'}));
    svg.appendChild(tx(x0-8,y+3,fmt$(t),'','end',FS));
  });
  const step=Math.max(10,Math.round((sHi-sLo)/9/10)*10);
  for(let t=Math.ceil(sLo/step)*step;t<=sHi;t+=step){
    const x=sx(t);
    svg.appendChild(mk('line',{x1:x,x2:x,y1:y0,y2:y0+5,class:'ax'}));
    svg.appendChild(tx(x,y0+17,String(t),'','middle',FS));
  }
  svg.appendChild(mk('line',{x1:x0,x2:x1,y1:y0,y2:y0,class:'ax'}));
  svg.appendChild(tx((x0+x1)/2,h-4,narrow?T('steps.xAxisNarrow'):T('steps.xAxis'),'','middle',FS));
  const yl=tx(16,(y0+y1)/2,T('steps.yAxis'),'','middle',LFS);
  yl.setAttribute('transform',`rotate(-90 16 ${(y0+y1)/2})`); svg.appendChild(yl);
  svg.appendChild(mk('rect',{x:sx(S.lo),y:y1,width:Math.max(1,sx(S.hi)-sx(S.lo)),height:y0-y1,class:'band'}));

  // 阶梯路径
  let d='', df='';
  fr.forEach((t,i)=>{
    const xa=sx(t.lower), xb=sx(i<fr.length-1?fr[i+1].lower:sHi), y=sy(t.model.c);
    d += (i===0?`M${xa},${y}`:`L${xa},${y}`) + `L${xb},${y}`;
    df += (i===0?`M${xa},${y0} L${xa},${y}`:`L${xa},${y}`) + `L${xb},${y}`;
  });
  df += `L${sx(sHi)},${y0} Z`;
  svg.appendChild(mk('path',{d:df,class:'stepfill'}));
  svg.appendChild(mk('path',{d,class:'stepline'}));

  const wn = view&&view.w?view.w.n:null;
  const cheapIdx = cs.indexOf(Math.min(...cs));
  fr.forEach((t,i)=>{
    const xa=sx(t.lower), xb=sx(i<fr.length-1?fr[i+1].lower:sHi), y=sy(t.model.c);
    const isW=t.model.n===wn;
    const up = t.upper==null? sHi : t.upper;
    const seg=mk('line',{x1:xa,x2:Math.max(xa+2,xb),y1:y,y2:y,class:'seg-hit'});
    const tt=mk('title');
    tt.textContent=TF('steps.segTitle',{lo:Math.round(t.lower),up:Math.round(up),name:t.model.n,
      s:t.model.s,u:t.model.u95,d:t.model.d95,c:fmt$(t.model.c),v:fmtN(t.model.v)});
    seg.appendChild(tt);
    seg.addEventListener('click',()=>{ S.lo=Math.round(t.lower); S.hi=Math.round(up); stopPlay(); recompute(); });
    svg.appendChild(seg);
    svg.appendChild(mk('circle',{cx:xa,cy:y,r:isW?6.5:4,fill:isW?'#f5c542':'#4cc9f0',stroke:isW?'#fff':'none','stroke-width':isW?2:0}));
    if(narrow? (isW||i===cheapIdx||i===fr.length-1) : (fr.length<=16||isW||i===cheapIdx)){
      const anchor = xa > x1-(narrow?120:210) ? 'end':'start';
      const dx = anchor==='end'?-8:8;
      const nm=t.model.n.length>(narrow?14:24)?t.model.n.slice(0,(narrow?13:23))+'…':t.model.n;
      /* 宽轴下右侧高分档密集，标签全部画在点上方会互叠 → 奇偶交错（上方/下方） */
      const ty = (isW||i%2===0) ? y-8 : y+15;
      svg.appendChild(tx(xa+dx, ty, `${nm}  ${fmt$(t.model.c)}`, isW?'lblw':'lbl', anchor, isW?WFS:LFS));
    }
  });
  svg.appendChild(mk('line',{x1:sx(S.hi),x2:sx(S.hi),y1:y1-6,y2:y0,class:'tline'}));
  svg.appendChild(narrow
      ? tx(sx(S.hi)-5,y1+16,`T = ${S.hi}`,'lblw','end',WFS)   // 窄屏下移一行，避开顶档标签
      : tx(sx(S.hi)+5,y1+2,`T = ${S.hi}`,'lblw','start',WFS)).setAttribute('fill','#f5c542');
}

/* ---------- render: tier table ---------- */
function renderTiers(){
  const tb=$('#tiersT tbody'); tb.innerHTML='';
  $('#tierCount').textContent = tiers.length? TF('tiers.count',{n:tiers.length,strict:S.ci==='strict'?T('tiers.countStrict'):''}) : T('tiers.modeOnly');
  if(!tiers.length){ tb.appendChild(el('tr',null,'<td colspan="8" class="empty">'+T('tiers.modeOnlyCell')+'</td>')); return; }
  const fr=[...tiers]; // tiers[0] = 最强
  const sMax=DATASETS[S.ds].stats.score_max;
  const wn = view&&view.w?view.w.n:null;
  fr.forEach((t,i)=>{
    const m=t.model;
    const lo=Math.round(t.lower), up=Math.round(i===0?sMax:t.upper);
    const stronger = i>0?fr[i-1].model:null;
    let marg='—', style='';
    if(stronger && stronger.s>m.s && stronger.c>m.c){
      const per=(stronger.c-m.c)/(stronger.s-m.s);
      marg=`${fmt$(per)}`;
      style = per>2?'style="color:var(--bad)"':per<0.15?'style="color:var(--good)"':'';
    }
    const isW=m.n===wn;
    const tr=el('tr', isW?'winner':'');
    tr.innerHTML=`<td class="mono">${i+1}</td>
      <td class="mono">[${lo}, ${up}]</td>
      <td class="nm">${isW?'<b style="color:var(--gold)">★ ':''}<a href="${m.u}" target="_blank" rel="noopener">${m.n}</a>${isW?'</b>':''} <span class="lab">${m.lab||''}</span></td>
      <td class="num">${m.s}<span style="color:var(--dim2);font-size:11px"> +${m.u95}/−${m.d95}</span></td>
      <td class="num" style="color:var(--accent)">${costCell(m)}</td>
      <td class="num" ${style}>${marg}</td>
      <td class="num">${fmtN(m.v)}</td>
      <td style="color:var(--dim2);font-size:11.5px">${m.pre?T('tiers.notesPre'):''}${m.v!=null&&m.v<1000?T('tiers.notesLow'):''}${T('tiers.notesFrontier')}</td>`;
    tr.style.cursor='pointer';
    tr.title=T('tiers.rowTitle');
    tr.addEventListener('click',()=>{ S.lo=lo; S.hi=up; stopPlay(); recompute(); });
    tb.appendChild(tr);
  });
}

/* ---------- render: main table ---------- */
const COLS={r:m=>m.r??1e9, or:m=>m.or??1e9, n:m=>m.n, s:m=>m.s, ci:m=>Math.max(m.u95,m.d95),
  c:m=>m.c==null?1e9:m.c, ratio:m=>m.ratio==null?-1:m.ratio, base:m=>m.baseRatio==null?-1:m.baseRatio,
  v:m=>m.v==null?-1:m.v, pin:m=>m.pin==null?1e9:m.pin, pout:m=>m.pout==null?1e9:m.pout,
  ctx:m=>m.ctx||'', lic:m=>m.lic||''};
function renderTable(){
  const tb=$('#tbl tbody'); tb.innerHTML='';
  const rows=[...cur].sort((a,b)=>{
    const A=COLS[S.sortKey](a),B=COLS[S.sortKey](b);
    return (typeof A==='string'? A.localeCompare(B) : A-B)*S.sortDir;
  });
  $('#tblCount').textContent=TF('table.count',{n:cur.length,total:DATASETS[S.ds].stats.n});
  const wn = view&&view.w?view.w.n:null;
  rows.forEach(m=>{
    const tr=el('tr',(inBand(m)?'in':'out')+(m.n===wn?' winner':'')+(m.pareto?' pareto':''));
    tr.innerHTML=`<td class="num">${m.r!=null?m.r:'—'}</td><td class="num">${m.or!=null?m.or:'—'}</td>
      <td class="nm"><a href="${m.u}" target="_blank" rel="noopener">${m.n}</a> <span class="lab">${m.lab||''}</span>
        ${m.pre?'<span class="pill warn" style="padding:0 4px;font-size:9.5px">PRE</span>':''}${m.ae?'<span class="pill bad" style="padding:0 4px;font-size:9.5px">AE</span>':''}</td>
      <td class="num">${m.s}</td><td class="num" style="color:var(--dim2)">+${m.u95}/−${m.d95}</td>
      <td class="num" style="color:var(--accent)">${costCell(m)}</td>
      <td class="num">${fmtR(m.ratio,0)}</td><td class="num">${fmtR(m.baseRatio,1)}</td>
      <td class="num">${fmtN(m.v)}</td><td class="num">${m.pin!=null?fmt$(m.pin):'—'}</td><td class="num">${m.pout!=null?fmt$(m.pout):'—'}</td>
      <td>${m.ctx||'—'}</td><td style="color:var(--dim2);font-size:11px">${m.lic||'—'}</td>`;
    tr.addEventListener('click',e=>{ if(e.target.tagName==='A')return; S.lo=Math.min(m.s,S.hi); S.hi=m.s; stopPlay(); recompute(); });
    tr.style.cursor='pointer';
    tb.appendChild(tr);
  });
  document.querySelectorAll('#tbl th').forEach(th=>{
    const k=th.dataset.k; if(!k)return;
    if(!th.dataset.lbl) th.dataset.lbl=th.textContent.trim();
    const on=S.sortKey===k;
    th.innerHTML=th.dataset.lbl+` <span class="ar">${on?(S.sortDir<0?'▼':'▲'):'⇅'}</span>`;
    th.onclick=()=>{ if(S.sortKey===k)S.sortDir*=-1; else {S.sortKey=k;S.sortDir=(k==='n'||k==='lic'||k==='ctx')?1:-1;} renderTable(); };
  });
}
