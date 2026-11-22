
/* ---------- render: winner card ---------- */
/* ==================== ③ 一周 168 小时价格时间轴 ====================
   横轴 = Mon 00:00 → Sun 23:00（UTC），纵轴 = 该时刻满足门槛 T 的最低成本 C(T)。
   因为 DeepSeek 的峰谷价按「工作日 + 小时」循环，一周正好能画出完整的节律。 */
const DOWS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function peakAtAny(hour,dow){
  return PRICE_EVENTS.some(ev=> ev.kind==='tod' && S.evState[ev.id] && isPeakAt(ev,hour,dow));
}
function idxOf(dow,hour){ return (((dow+6)%7)*24)+hour; }          // 0=Mon00:00 … 167=Sun23:00
function dowHourOf(i){ const d=Math.floor(i/24); return {dow:(d+1)%7, hour:i%24}; }
function jumpToIdx(i){ const {dow,hour}=dowHourOf(i); S.dow=dow; S.hour=hour; syncPriceUI(); recompute(); }

/* 一周内每个时刻的 C(T) 与冠军。纯计算，图与摘要共用。 */
function weekCurve(T,models){
  const out=[];
  for(let i=0;i<168;i++){
    const {dow,hour}=dowHourOf(i);
    const r=cheapestAt(T,models,hour,dow,S.dateISO);
    out.push({i,hour,dow,c:r?r.c:null,n:r?r.m.n:null,peak:peakAtAny(hour,dow)});
  }
  return out;
}
/* 关掉全部价格事件时的 C(T) = 「List price」基准，用来量化修正带来的差别 */
function baselineCostAt(T,models,hour,dow,dateISO){
  const saved={}; PRICE_EVENTS.forEach(e=>saved[e.id]=S.evState[e.id]);
  PRICE_EVENTS.forEach(e=>S.evState[e.id]=false);
  const r=cheapestAt(T,models,hour,dow,dateISO);
  PRICE_EVENTS.forEach(e=>S.evState[e.id]=saved[e.id]);
  return r?r.c:null;
}
function renderTimeline(){
  const svg=$('#tl'), note=$('#tlNote'); svg.innerHTML='';
  const models=cur||[], T=S.hi;
  const pts=weekCurve(T,models);
  const cs=pts.filter(p=>p.c!=null).map(p=>p.c);
  if(!cs.length){
    note.textContent=`No model qualifies at threshold T=${T} (filtered out, or no cost data above this score). Lower the threshold or relax the filters.`;
    svg.appendChild(tx(20,40,'No model qualifies at the current threshold','lbl','start',12)); return;
  }
  const baseC=baselineCostAt(T,models,S.hour,S.dow,S.dateISO);
  const W=Math.max(340,Math.round(svg.clientWidth||900)),H=300,g={t:18,r:20,b:48,l:66};
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);   // viewBox 跟随容器宽，否则画布坐标与视口错位
  const {FS,LFS,WFS}=chartFS(W); const narrow=W<620;
  const x0=g.l,x1=W-g.r,y0=H-g.b,y1=g.t;
  const sx=i=>x0+(i/167)*(x1-x0);
  let lo=Math.min(...cs), hi=Math.max(...cs);
  if(baseC!=null){ lo=Math.min(lo,baseC); hi=Math.max(hi,baseC); }
  if(hi-lo<1e-9){ lo*=0.96; hi*=1.04; }
  const pad=(hi-lo)*0.14; lo=Math.max(0,lo-pad); hi+=pad;
  const sy=v=>y0-((v-lo)/(hi-lo))*(y0-y1);

  let run=null;
  const flush=()=>{ if(run){ svg.appendChild(mk('rect',{x:sx(run.a),y:y1,width:Math.max(1,sx(run.b)-sx(run.a)),height:y0-y1,fill:'rgba(255,255,255,0.06)'})); run=null; } };
  pts.forEach(p=>{ if(p.peak){ if(!run)run={a:p.i}; run.b=p.i+1; } else flush(); }); flush();

  for(let d=0;d<7;d++){
    const i=d*24;
    svg.appendChild(mk('line',{x1:sx(i),y1:y1,x2:sx(i),y2:y0,stroke:'rgba(255,255,255,0.14)','stroke-width':1}));
    svg.appendChild(tx(sx(i+12),y0+17,DOWS[dowHourOf(i).dow],'lbl','middle',LFS));
  }
  const ticks=niceTicks(Math.max(lo,1e-4),hi).filter(v=>v>=lo&&v<=hi);
  (ticks.length?ticks:[lo,hi]).forEach(v=>{
    svg.appendChild(mk('line',{x1:x0,y1:sy(v),x2:x1,y2:sy(v),stroke:'rgba(255,255,255,0.07)','stroke-width':1}));
    svg.appendChild(tx(x0-8,sy(v)+4,fmt$(v),'lbl','end',FS));
  });
  svg.appendChild(tx(x0-8,y1-8,'/task','lbl','end',FS));
  if(!narrow) svg.appendChild(tx(x0,y0+36,'Peak windows = weekdays 01:00–04:00 & 06:00–10:00 UTC (gray); weekends are all off-peak','lbl','start',FS));

  if(baseC!=null){
    svg.appendChild(mk('line',{x1:x0,y1:sy(baseC),x2:x1,y2:sy(baseC),stroke:'rgba(255,255,255,0.38)','stroke-width':1.2,'stroke-dasharray':'5 4'}));
    svg.appendChild(tx(x1-2,sy(baseC)-6,'List price '+fmt$(baseC),'lbl','end',LFS));
  }
  let dstr='';
  pts.forEach(p=>{ if(p.c==null)return; const Y=sy(p.c);
    dstr+=(dstr?' L':'M')+sx(p.i).toFixed(1)+' '+Y.toFixed(1)+' L'+sx(p.i+1).toFixed(1)+' '+Y.toFixed(1); });
  svg.appendChild(mk('path',{d:dstr,fill:'none',stroke:'var(--accent)','stroke-width':2.2,'stroke-linejoin':'round'}));

  let prev=null; const sw=[];
  pts.forEach(p=>{ if(p.n&&p.n!==prev){ if(prev!==null)sw.push(p); prev=p.n; } });
  sw.slice(0,narrow?4:8).forEach((p,k)=>{
    svg.appendChild(mk('line',{x1:sx(p.i),y1:y1,x2:sx(p.i),y2:y0,stroke:'var(--gold)','stroke-width':1,'stroke-dasharray':'3 3',opacity:0.6}));
    const nm=p.n.length>(narrow?10:16)?p.n.slice(0,(narrow?9:15))+'…':p.n;
    svg.appendChild(tx(sx(p.i)+3,y1+30+(k%2)*0,nm,'lbl','start',LFS));
  });

  const nowI=idxOf(S.dow,S.hour), nowP=pts[nowI];
  svg.appendChild(mk('line',{x1:sx(nowI),y1:y1,x2:sx(nowI),y2:y0,stroke:'var(--gold)','stroke-width':1.6}));
  if(nowP&&nowP.c!=null) svg.appendChild(mk('circle',{cx:sx(nowI),cy:sy(nowP.c),r:4.2,fill:'var(--gold)'}));
  svg.appendChild(narrow ? tx(Math.min(sx(nowI),W-30),y1-8,'now','lbl','end',LFS) : tx(sx(nowI),y1-8,'now','lbl','middle',LFS));

  const hit=mk('rect',{x:x0,y:y1,width:x1-x0,height:y0-y1,fill:'transparent',style:'cursor:crosshair'});
  hit.addEventListener('pointerdown',e=>{
    const r=svg.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width*W;
    jumpToIdx(Math.round(clamp((px-x0)/(x1-x0),0,1)*167));
  });
  svg.appendChild(hit);

  const uniq={}; pts.forEach(p=>{ if(p.c==null)return; if(!uniq[p.n])uniq[p.n]={h:0,c:p.c}; uniq[p.n].h++; });
  const peakH=pts.filter(p=>p.peak).length;
  const parts=Object.entries(uniq).sort((a,b)=>a[1].c-b[1].c).map(([n,v])=>`${n} <b class="mono">${fmt$(v.c)}</b>（${v.h} h）`).join(' · ');
  const diff=(baseC!=null&&nowP&&nowP.c!=null)?`(list price ${fmt$(baseC)}, ${nowP.c>baseC?'pricier':'cheaper'} by ${Math.round(Math.abs(nowP.c/baseC-1)*100)}%)`:'(same as list price)';
  note.innerHTML=`Threshold <b class="mono">T=${T}</b> · <b>${peakH}</b> peak hours per 168-hour week · `+
    `Now ${DOWS[S.dow]} ${String(S.hour).padStart(2,'0')}:00 UTC → <b style="color:var(--accent)">${nowP&&nowP.c!=null?fmt$(nowP.c):'—'}</b>, champion <b>${nowP&&nowP.n?nowP.n:'—'}</b>${diff}<br>`+
    `C(T) over the week: ${parts}`+
    (S.cacheSrc!=='off'?`<br><span style="color:var(--dim2)">Cache discount on (hit ${Math.round(S.cacheHit*100)}%): cache applies to input tokens only, compressing both absolute levels and peak/off-peak amplitude.</span>`:'');
}
