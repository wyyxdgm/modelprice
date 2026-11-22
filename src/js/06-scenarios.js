
/* ---------- 价格情景控件 ---------- */
function EV_OFF_ALL(){ PRICE_EVENTS.forEach(e=>S.evState[e.id]=false); }
/* 两个一键情景（按钮与测试共用同一份定义，避免两边漂移） */
function SCEN_BOARD(){ EV_OFF_ALL(); S.cacheSrc='off'; }                       // 榜面原样
function SCEN_ALL(){ PRICE_EVENTS.forEach(e=>S.evState[e.id]=true); S.cacheSrc='pub'; }  // 全部启用
/* 缓存口径Notes：实时统计有多少Model用的是公布价、多少是推算 */
function cacheHintHTML(){
  if(S.cacheSrc==='off')
    return T('cache.off');
  const ms=(cur&&cur.length)?cur:[];
  let pub=0,est=0,na=0;
  for(const m of ms){
    if(m.pinRaw==null){ na++; continue; }
    if(S.cacheSrc==='flat') est++;
    else if(CACHE_RATIO[m.n]!=null) pub++;
    else est++;
  }
  const h=Math.round(S.cacheHit*100);
  return TF('cache.hitHead',{h,m:Math.round((1-S.cacheHit)*100)})+
    TF('cache.srcCounts',{pub,est,na:na?TF('cache.srcNa',{na}):''})+T('cache.wmNote')+
    T('cache.missBasis');
}
$('#cacheHit').oninput=e=>{ S.cacheHit=clamp((+e.target.value||0)/100,0,1); syncPriceUI(); recompute(); };
$('#cacheHitN').onchange=e=>{ S.cacheHit=clamp((+e.target.value||0)/100,0,1); syncPriceUI(); recompute(); };
$('#cacheSrc').onchange=e=>{ S.cacheSrc=e.target.value; syncPriceUI(); recompute(); };
document.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{
  S.cacheHit=(+b.dataset.ch)/100; if(S.cacheSrc==='off') S.cacheSrc='pub';
  stopPlay(); syncPriceUI(); recompute();
});
function renderEvList(){
  const c=$('#evList'); c.innerHTML='';
  PRICE_EVENTS.forEach(ev=>{
    const n=Object.keys(ev.entries).length;
    const wrap=el('div',null,'');
    wrap.setAttribute('style','margin-bottom:7px;padding:7px 8px;border:1px solid rgba(255,255,255,.09);border-radius:7px');
    const lab=el('label',null,'');
    lab.setAttribute('style','display:flex;gap:7px;align-items:flex-start;font-size:12.5px;cursor:pointer');
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!S.evState[ev.id];
    cb.setAttribute('style','width:auto;margin-top:2px');
    cb.onchange=()=>{ S.evState[ev.id]=cb.checked; recompute(); };
    const conf=ev.conf==='official'
      ? `<span class="pill" style="padding:0 5px;background:rgba(80,200,120,.16);color:var(--good)">${T('cache.verified')}</span>`
      : `<span class="pill warn" style="padding:0 5px">${T('cache.uncertain')}</span>`;
    const sp=el('span',null,'');
    sp.innerHTML=`${conf} <b>${T('ev.'+ev.id+'.name')}</b> <span style="color:var(--dim2)">· ${n}${T('cache.evModels')}</span><br>`+
      `<span style="color:var(--dim);font-size:11.5px">${T('ev.'+ev.id+'.desc')}<br>${T('cache.evSource')}${T('ev.'+ev.id+'.src')}</span>`;
    lab.appendChild(cb); lab.appendChild(sp); wrap.appendChild(lab); c.appendChild(wrap);
  });
}
function syncPriceUI(){
  $('#hour').value=String(S.hour); $('#dow').value=String(S.dow);
  $('#dateIso').value=S.dateISO; $('#tz').value=String(S.tz);
  $('#outShare').value=String(Math.round(S.outShare*100));
  $('#hourUtc').textContent=`${DOWS[S.dow]} ${String(S.hour).padStart(2,'0')}:00`;
  const lh=(S.hour+S.tz+48)%24;
  $('#hourLocal').textContent=`${String(Math.floor(lh)).padStart(2,'0')}:00`;
  const pk=peakAtAny(S.hour,S.dow), pill=$('#peakPill');
  pill.textContent=pk?T('cache.pillPeak'):T('cache.pillOff');
  pill.setAttribute('class','pill '+(pk?'warn':''));
  pill.setAttribute('style','padding:0 6px');
  $('#osLab').textContent=Math.round(S.outShare*100)+'%';
  const chP=Math.round(S.cacheHit*100);
  $('#cacheHit').value=String(chP); $('#cacheHitN').value=String(chP);
  $('#cachePill').textContent = S.cacheSrc==='off'?T('cache.pillOff2'):chP+'%';
  $('#cacheSrc').value=S.cacheSrc;
  $('#cacheHint').innerHTML=cacheHintHTML();
  $('#osHint').innerHTML=T('cache.osHintHead')+
    (S.cacheSrc==='off' ? T('cache.osHintOff') : T('cache.osHintOn'));
}
$('#hour').oninput=e=>{ S.hour=+e.target.value; syncPriceUI(); recompute(); };
$('#dow').onchange=e=>{ S.dow=+e.target.value; syncPriceUI(); recompute(); };
$('#tz').onchange=e=>{ S.tz=+e.target.value; syncPriceUI(); };
$('#dateIso').onchange=e=>{ if(e.target.value){ S.dateISO=e.target.value; syncPriceUI(); recompute(); } };
$('#outShare').oninput=e=>{ S.outShare=(+e.target.value)/100; syncPriceUI(); recompute(); };
document.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{
  const k=b.dataset.pk;
  if(k==='now'){ const d=new Date(); S.hour=d.getUTCHours(); S.dow=d.getUTCDay(); }
  else if(k==='sat'){ S.dow=6; S.hour=12; }
  else if(k==='board'){ SCEN_BOARD(); S.dow=3; S.hour=12; S.cacheHit=0.95; }
  else if(k==='all'){ SCEN_ALL(); S.dow=3; S.hour=2; }
  else { S.dow=3; S.hour=(k==='peak')?2:12; }
  renderEvList(); stopPlay(); syncPriceUI(); recompute();
});
/* 被时间情景修正的Model清单（提示区） */
function renderAdjNote(){
  const n=$('#adjNote'); if(!n) return;
  const on=PRICE_EVENTS.filter(e=>S.evState[e.id]);
  if(!on.length){ n.innerHTML=T('cache.adjAllOff'); return; }
  const adj=(cur||[]).filter(m=>m.adj);
  if(!adj.length){ n.innerHTML=TF('cache.adjNone',{rules:on.map(e=>T('ev.'+e.id+'.name')).join('、')}); return; }
  const peak=peakAtAny(S.hour,S.dow);
  n.innerHTML=TF('cache.adjHead',{peak:peak?T('badges.peak'):T('badges.offpeak'),dow:DOWS[S.dow],hr:String(S.hour).padStart(2,'0'),n:adj.length})+
    adj.map(m=>`${m.n} <span class="mono" style="text-decoration:line-through;color:var(--dim2)">${fmt$(m.cRaw)}</span> → <b class="mono" style="color:var(--accent)">${fmt$(m.c)}</b>`).join('；');
}
/* 修正原因的简短标签（徽标 / KPI 副标题用） */
function adjLabel(m){
  if(!m.adj) return T('cache.listPrice');
  const p=[];
  for(const x of m.adj.hits)
    p.push(`${x.tag} ×${(Math.abs(x.kIn-x.kOut)<1e-9?x.kIn.toFixed(2):x.kIn.toFixed(2)+'/'+x.kOut.toFixed(2))}`);
  if(m.adj.cache) p.push(`cache ${Math.round(m.adj.cache.h*100)}%${m.adj.cache.est?' (est.)':''}`);
  return p.length?p.join(' · '):T('cache.listPrice');
}
/* 成本单元格：被时间情景修正过的，同时显示榜面原值 */
function costCell(m){
  if(m.c==null) return '<span style="color:var(--dim2)">—</span>';
  if(!m.adj) return fmt$(m.c);
  const why=m.adj.hits.map(x=>`${T('ev.'+x.id+'.name')}·${x.tag} input ×${x.kIn.toFixed(2)} output ×${x.kOut.toFixed(2)}`).join('；')+
    (m.adj.cache?`&#10;`+TF('cache.costCellWhy',{h:Math.round(m.adj.cache.h*100),pc:fmt$(m.adj.cache.pc),
        src:m.adj.cache.est?T('cache.costCellSrcEst'):T('cache.costCellSrcPub'),wm:m.adj.cache.wm}):'')+
    `&#10;`+TF('cache.costCellTotal',{scale:m.adj.scale.toFixed(3)});
  return `<span title="${TF('cache.costCellTitle',{raw:fmt$(m.cRaw),cur:fmt$(m.c)})}&#10;${why}" style="cursor:help">${fmt$(m.c)}<sup style="color:var(--gold)">◷</sup></span>`+
         ` <span style="color:var(--dim2);font-size:10.5px;text-decoration:line-through">${fmt$(m.cRaw)}</span>`;
}
renderEvList(); syncPriceUI();
