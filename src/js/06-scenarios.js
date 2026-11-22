
/* ---------- 价格情景控件 ---------- */
function EV_OFF_ALL(){ PRICE_EVENTS.forEach(e=>S.evState[e.id]=false); }
/* 两个一键情景（按钮与测试共用同一份定义，避免两边漂移） */
function SCEN_BOARD(){ EV_OFF_ALL(); S.cacheSrc='off'; }                       // 榜面原样
function SCEN_ALL(){ PRICE_EVENTS.forEach(e=>S.evState[e.id]=true); S.cacheSrc='pub'; }  // 全部启用
/* 缓存口径Notes：实时统计有多少Model用的是公布价、多少是推算 */
function cacheHintHTML(){
  if(S.cacheSrc==='off')
    return `Off → all input tokens bill at <b>cache-miss prices</b> — exactly <b>Arena's leaderboard Cost/Task basis</b>.`;
  const ms=(cur&&cur.length)?cur:[];
  let pub=0,est=0,na=0;
  for(const m of ms){
    if(m.pinRaw==null){ na++; continue; }
    if(S.cacheSrc==='flat') est++;
    else if(CACHE_RATIO[m.n]!=null) pub++;
    else est++;
  }
  const h=S.cacheHit, wmNote='Anthropic / OpenAI bill cache writes separately (= 1.25× input price) and the missed share is paid at the write price; other providers charge no write fee.';
  return `Hit rate <b class="mono">${Math.round(h*100)}%</b>: ${Math.round(h*100)}% of input tokens bill at cache-read prices, ${Math.round((1-h)*100)}% at (write-multiplier-inclusive) miss prices; <b>output tokens are never discounted</b>, so even a 100% hit rate can't reach zero.`+
    `${pub} models in the candidate set use published cache prices, ${est} estimated at 10%${na?`, ${na} without published prices (N/A)`:''}。${wmNote}`+
    `<br><b>Note</b>: Arena's Cost/Task is computed at <b>cache-miss prices</b> (the Agent board's inferred $4/$20 list prices are the proof), so enabling the cache discount is a hypothetical — "if your workload really hits this often" — not the board's own meaning.`;
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
      ? '<span class="pill" style="padding:0 5px;background:rgba(80,200,120,.16);color:var(--good)">verified</span>'
      : '<span class="pill warn" style="padding:0 5px">uncertain</span>';
    const sp=el('span',null,'');
    sp.innerHTML=`${conf} <b>${ev.name}</b> <span style="color:var(--dim2)">· ${n} models</span><br>`+
      `<span style="color:var(--dim);font-size:11.5px">${ev.desc}<br>Source: ${ev.src}</span>`;
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
  pill.textContent=pk?'peak (2×)':'off-peak (½ price)';
  pill.setAttribute('class','pill '+(pk?'warn':''));
  pill.setAttribute('style','padding:0 6px');
  $('#osLab').textContent=Math.round(S.outShare*100)+'%';
  const chP=Math.round(S.cacheHit*100);
  $('#cacheHit').value=String(chP); $('#cacheHitN').value=String(chP);
  $('#cachePill').textContent = S.cacheSrc==='off'?'off':chP+'%';
  $('#cacheSrc').value=S.cacheSrc;
  $('#cacheHint').innerHTML=cacheHintHTML();
  $('#osHint').innerHTML=`Output share decides how a "unit-price change" converts into a "Cost/Task change". Default <b class="mono">8%</b> = input:output 11:1, from measured inference on 14 Agent-board models (ratios 3.8–17.9×).`+
    (S.cacheSrc==='off'
      ? `With cache discount off, DeepSeek's peak/off-peak moves input and output <b>proportionally</b> and this slider has <b>no effect</b> on it; it only matters for corrections like GLM's input ×3 / output ×2.8.`
      : `<b>With cache discount on, this slider becomes critical</b>: cache discounts input only, so the higher the output share, the thinner the discount. At the same 95% hit rate, DeepSeek-20261017 saves 86% at w=2%, 68% at w=8% (default), 55% at w=15%, 40% at w=25%, and only 25% at w=40%.`);
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
  if(!on.length){ n.innerHTML='<span style="color:var(--dim2)">All corrections off → the board as listed. Tick any rule above to see time effects.</span>'; return; }
  const adj=(cur||[]).filter(m=>m.adj);
  if(!adj.length){ n.innerHTML='No model in the current candidate set is affected by the enabled corrections ('+on.map(e=>e.name).join('、')+'）。'; return; }
  const peak=peakAtAny(S.hour,S.dow);
  n.innerHTML=`<b>${peak?'Peak':'Off-peak'} · ${DOWS[S.dow]} ${String(S.hour).padStart(2,'0')}:00 UTC</b>: <b>${adj.length}</b> models in the candidate set get rewritten → `+
    adj.map(m=>`${m.n} <span class="mono" style="text-decoration:line-through;color:var(--dim2)">${fmt$(m.cRaw)}</span> → <b class="mono" style="color:var(--accent)">${fmt$(m.c)}</b>`).join('；');
}
/* 修正原因的简短标签（徽标 / KPI 副标题用） */
function adjLabel(m){
  if(!m.adj) return 'List price';
  const p=[];
  for(const x of m.adj.hits)
    p.push(`${x.tag} ×${(Math.abs(x.kIn-x.kOut)<1e-9?x.kIn.toFixed(2):x.kIn.toFixed(2)+'/'+x.kOut.toFixed(2))}`);
  if(m.adj.cache) p.push(`cache ${Math.round(m.adj.cache.h*100)}%${m.adj.cache.est?' (est.)':''}`);
  return p.length?p.join(' · '):'List price';
}
/* 成本单元格：被时间情景修正过的，同时显示榜面原值 */
function costCell(m){
  if(m.c==null) return '<span style="color:var(--dim2)">—</span>';
  if(!m.adj) return fmt$(m.c);
  const why=m.adj.hits.map(x=>`${x.name}·${x.tag} input ×${x.kIn.toFixed(2)} output ×${x.kOut.toFixed(2)}`).join('；')+
    (m.adj.cache?`&#10;Cache hit ${Math.round(m.adj.cache.h*100)}%: read price ${fmt$(m.adj.cache.pc)}/M (${m.adj.cache.est?'10%-of-input estimate':'published'}), write multiplier ${m.adj.cache.wm}×`:'')+
    `&#10;Total ×${m.adj.scale.toFixed(3)}`;
  return `<span title="List ${fmt$(m.cRaw)} → current scenario ${fmt$(m.c)}&#10;${why}" style="cursor:help">${fmt$(m.c)}<sup style="color:var(--gold)">◷</sup></span>`+
         ` <span style="color:var(--dim2);font-size:10.5px;text-decoration:line-through">${fmt$(m.cRaw)}</span>`;
}
renderEvList(); syncPriceUI();
