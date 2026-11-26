
/* ==================== W1 包月 vs API 回本计算器 ====================
   一句话：把「会员月费 + 我的用量」和「能力门槛内最便宜的 API」算成同一张月账单。
   · 输入：月费（USD/¥ 快捷钮）· 每日任务数 · 任务类型（复用 10-rank 的 RANK_PRESETS
     token 画像：Light Q&A / Daily Dev / Heavy Agent）· 能力基准门槛 T
     （默认 = 旗舰切点：所选板块第 10 名分数，从榜单数据实算；可调低看平替收益）
   · 引擎：门槛 T → 达标**且带公布价(pin/pout)**的模型里，用与排行榜完全同源的价格
     情景（峰谷 priceScale / 缓存 CACHE_RATIO / 写入倍率）算单任务成本 → 最便宜者。
     无公布价的模型**剔除并明示**（红线：算不完整的方案不参与对比，不编数）。
   · 输出：一句可传播结论（concApi/concSub/concTie 三方向）+ 盈亏平衡 tasks/day
     +「复制结论文本」「Copy state link（stateUrl 深链可复算）」「导出结果图」
     （原生 Canvas 1200×630，风格对齐 assets/og.png，零依赖）。
   · 埋点：「算这笔账」提交时 window.mpCalcComplete() 一次（EXP-006 预注册事件，
     src/analytics.js 桩）；导出/复制结论另发 mp_share_click（channel 扩展）。
   · 免责（明示）：包月额度/限速/降速条款未建模；¥ 按 CALC_USD_CNY 固定折算。 */
S.calc={cur:'usd', fee:20, tasks:30, profile:'dev', board:'overall_all',
        bar:null, barSet:false, computed:false, noPrice:0, result:null};
const CALC_USD_CNY=7.1;                       // ¥→$ 固定折算（2026-11 口径，写进 cnyNote，不实时抓汇率）
const CALC_FEE_CHIPS={usd:[10,20,30,200], cny:[100,140,200,300]};
const CALC_TASK_CHIPS=[3,10,30,100];
const CALC_PROF_KEY={light:'Light',dev:'Dev',heavy:'Heavy'};   // → rank.presetLight/presetDev/presetHeavy

/* ---------- 引擎 ---------- */
function calcBoards(){ return Object.keys(DATASETS).filter(k=>DATASETS[k].unit!=='image'); }
function calcFixBoard(){ const d=DATASETS[S.calc.board];
  if(!d||d.unit==='image') S.calc.board='overall_all'; return DATASETS[S.calc.board]; }
function calcFeeUSD(){ return S.calc.cur==='cny' ? S.calc.fee/CALC_USD_CNY : S.calc.fee; }
function calcFeeDisp(){ return S.calc.cur==='cny'
  ? `¥${fmtN(S.calc.fee)} (≈ ${fmt$(S.calc.fee/CALC_USD_CNY)})` : fmt$(S.calc.fee); }
/* 旗舰切点 = 板块第 10 名分数（不足 10 个模型取最低）；与首屏 top10 快捷钮同口径 */
function calcFlagshipCut(d){
  const s=d.models.map(m=>m.s).filter(x=>x!=null).sort((a,b)=>b-a);
  return s.length ? s[Math.min(9,s.length-1)] : Math.round((d.stats.score_min+d.stats.score_max)/2);
}
/* 均衡切点 = 与排行榜默认门槛 rankDefaultT 同式（score_max − 30% 量程） */
function calcMidCut(d){ const st=d.stats; return Math.round(st.score_max-(st.score_max-st.score_min)*0.3); }
/* 一次「画像任务」的成本：与 10-rank dailyCost 同公式，但 inK/outK 参数化（不读 S.rankIn）。
   无公布价 → null（调用方剔除）。 */
function calcTaskCost(m,inK,outK){
  if(m.pin==null||m.pout==null) return null;
  const L=listPricesAt(m,S.hour,S.dow,S.dateISO);
  const cr=cacheRatioOf(m);
  let pin=L.pin;
  if(cr){ const h=S.cacheHit; pin=(1-h)*L.pin*writeMultOf(m)+h*L.pin*cr.r; }
  const per=(inK*pin+outK*L.pout)/1000;
  return per>0 ? per : null;
}
function calcCompute(fire){
  const c=S.calc, d=calcFixBoard();
  const [inK,outK]=RANK_PRESETS[c.profile]||RANK_PRESETS.dev;
  if(!c.barSet||c.bar==null) c.bar=calcFlagshipCut(d);
  c.bar=clamp(Math.round(c.bar),d.stats.score_min,d.stats.score_max);
  const fee=calcFeeUSD();
  const pool=d.models.filter(m=>m.s!=null&&m.s>=c.bar);
  c.noPrice=pool.filter(m=>m.pin==null||m.pout==null).length;
  let best=null;
  for(const m of pool){
    const per=calcTaskCost(m,inK,outK);
    if(per==null) continue;
    if(!best||per<best.per-1e-12||(Math.abs(per-best.per)<=1e-12&&m.s>best.m.s)) best={m,per};
  }
  if(!best){ c.result=null; c.computed=true; calcRender(); return; }   // 空达标/全无价 → 明示空态，不发事件
  const apiMonth=best.per*c.tasks*30;
  const diff=fee-apiMonth;                        // >0：包月更贵 → API 省；<0：包月划算
  const tie=Math.abs(diff)<Math.max(1,fee*0.02);  // 差额 < $1 且 < 2% 月费 → 视为打平
  const be=best.per*30>0 ? fee/(best.per*30) : Infinity;   // 盈亏平衡：API 月成本恰好 = 月费的任务频次
  c.result={model:best.m,perTask:best.per,apiMonth,fee,diff,tie,be,inK,outK,
            board:c.board,bar:c.bar,tasks:c.tasks};
  c.computed=true;
  if(fire) calcTrack();
  calcRender();
}
/* EXP-006 判读事件：只有用户点「算这笔账」（fire=true）才上报一次 */
function calcTrack(){
  const r=S.calc.result; if(!r) return;
  if(typeof window==='undefined'||!window.mpCalcComplete) return;   // fake DOM / 桩缺失 → 静默
  window.mpCalcComplete({preset:S.calc.profile, board:r.board, bar:r.bar,
    fee:Math.round(r.fee*100)/100, tasks_per_day:S.calc.tasks,
    api_month:Math.round(r.apiMonth*100)/100, winner:r.model.n,
    dir:r.tie?'tie':(r.diff>0?'api':'plan')});
}

/* ---------- 结论文案（DOM 与复制文本共用一源，plain 控制是否加 <b>） ---------- */
function calcHeadline(plain){
  const r=S.calc.result; if(!r) return '';
  const nm=plain?r.model.n:'<b>'+r.model.n+'</b>';
  if(r.tie) return TF('calc.concTie',{n:fmtN(S.calc.tasks),fee:calcFeeDisp(),api:fmt$(r.apiMonth),model:nm});
  if(r.diff>0) return TF('calc.concApi',{n:fmtN(S.calc.tasks),fee:calcFeeDisp(),diff:fmt$(r.diff),
    model:nm,api:fmt$(r.apiMonth),perDay:fmt$(r.diff/30)});
  return TF('calc.concSub',{n:fmtN(S.calc.tasks),fee:calcFeeDisp(),api:fmt$(r.apiMonth),
    diff:fmt$(-r.diff),model:nm,score:r.model.s,perTask:fmt$(r.perTask),bar:fmtN(r.bar)});
}
function calcBeLine(plain){
  const r=S.calc.result; if(!r||r.tie) return '';
  const be=fmtR(r.be,1), n=fmtN(S.calc.tasks);
  return r.diff>0 ? TF('calc.beLow',{be,n}) : TF('calc.beHigh',{be,n});
}
function calcBasisText(){
  const r=S.calc.result; if(!r) return '';
  const prof=TF('rank.profileTag',{in:r.inK,out:r.outK})+' · '+T('rank.preset'+CALC_PROF_KEY[S.calc.profile]);
  return TF('calc.basis',{profile:prof,bar:fmtN(r.bar),board:DATASETS[r.board].label,date:DATA.scraped});
}
/* 复制结论文本：结论 + 平衡点 + 口径 +（¥ 折算）+ 免责 + 深链 */
function calcText(){
  const r=S.calc.result; if(!r) return '';
  const parts=[calcHeadline(true)];
  const be=calcBeLine(true); if(be) parts.push(be);
  parts.push(calcBasisText());
  if(S.calc.cur==='cny') parts.push(TF('calc.cnyNote',{rate:CALC_USD_CNY}));
  parts.push(T('calc.disclaimer'));
  parts.push(stateUrl());
  return parts.join('\n');
}

/* ---------- UI 同步 ---------- */
function calcSegSync(id,v){ [...$(id).children].forEach(b=>b.classList.toggle('on',b.dataset.v===v)); }
function calcChips(wrap,vals,label){
  wrap.innerHTML='';
  vals.forEach(v=>{ const b=el('button','btn'); b.dataset.cv=String(v); b.textContent=label(v); wrap.appendChild(b); });
}
function calcApplyUI(){
  const c=S.calc, d=calcFixBoard();
  const sel=$('#calcBoard');
  if(!sel.children.length){
    calcBoards().forEach(k=>{
      const b=DATASETS[k], o=el('option'); o.value=k;
      const lic=b.license==='all'?T('data.licAll'):T('data.licOS');
      o.textContent=`${lic}${b.label} · ${b.stats.n}`;
      sel.appendChild(o);
    });
  }
  sel.value=c.board;
  calcSegSync('#calcCur',c.cur);
  calcSegSync('#calcProf',c.profile);
  calcChips($('#calcFeeChips'),CALC_FEE_CHIPS[c.cur],
    v=>(c.cur==='usd'?'$':'¥')+fmtN(v));
  calcChips($('#calcTaskChips'),CALC_TASK_CHIPS,v=>fmtN(v)+T('calc.perDay'));
  const bar=$('#calcBar'), st=d.stats;
  bar.min=st.score_min; bar.max=st.score_max;
  bar.value=String(c.bar==null?calcFlagshipCut(d):Math.round(c.bar));
  $('#calcFee').value=String(c.fee); $('#calcTasks').value=String(c.tasks);
  $('#calcBarLab').textContent=(c.bar==null?'—':T('rank.ge')+fmtN(Math.round(c.bar)))
    +(c.barSet?'':' · '+T('calc.barDefaultTag'));
}

/* ---------- 渲染结论卡 ---------- */
function calcRender(){
  calcApplyUI();
  const c=S.calc, card=$('#calcCard'), note=$('#calcNote');
  const acts=[$('#calcCopyText'),$('#calcCopyLink'),$('#calcExport')];
  card.innerHTML=''; note.innerHTML='';
  const disable=on=>acts.forEach(b=>{ b.disabled=on; });
  if(!c.computed||!c.result){
    card.appendChild(el('div','k',T('tabs.calc')));
    card.appendChild(el('div','empty',c.computed?TF('calc.none',{bar:fmtN(c.bar)}):T('calc.placeholder')));
    if(c.computed&&c.noPrice) note.innerHTML=TF('calc.excluded',{n:fmtN(c.noPrice)});
    disable(true); return;
  }
  disable(false);
  const r=c.result, dd=DATASETS[r.board], m=r.model;
  card.appendChild(el('div','k', `${T('tabs.calc')} · ${dd.label} · ${T('rank.ge')}${Math.round(r.bar)} · ${T('rank.preset'+CALC_PROF_KEY[c.profile])}`));
  card.appendChild(el('div','cl',calcHeadline(false)));
  const nm=el('div','nm');
  nm.innerHTML=`<span class="rank">API</span>${m.n}`;
  card.appendChild(nm);
  card.appendChild(el('div','by', `${m.lab?m.lab+' · ':''}<span class="mono">${m.lic||''}</span> · ${m.s} pts <span class="mono">(+${m.u95}/−${m.d95})</span>`));
  const k=el('div','kpis');
  const kpi=(t,v,cl,s)=>{const d2=el('div','kpi '+(cl||''));d2.innerHTML=`<div class="t">${t}</div><div class="v">${v}${s?` <small>${s}</small>`:''}</div>`;k.appendChild(d2);};
  kpi(T('calc.kpiPlan'), calcFeeDisp()+'/mo');
  kpi(T('calc.kpiApi'), fmt$(r.apiMonth)+'/mo', 'accent', fmt$(r.perTask)+T('rank.perTask'));
  kpi(T('calc.kpiDiff'), (r.diff>0?'+':r.diff<0?'−':'±')+fmt$(Math.abs(r.diff))+'/mo', r.tie?'':'gold');
  kpi(T('calc.kpiBe'), fmtR(r.be,1)+T('calc.perDay'), 'good');
  kpi(T('winner.kpiScore'), m.s, 'gold', `+${m.u95}/−${m.d95}`);
  card.appendChild(k);
  const v=el('div','verdict');
  let html='';
  const be=calcBeLine(false); if(be) html+=be+'<br>';
  html+=calcBasisText();
  if(c.cur==='cny') html+='<br>'+TF('calc.cnyNote',{rate:CALC_USD_CNY});
  html+='<br><span class="warn">'+T('calc.disclaimer')+'</span>';
  if(c.noPrice) html+='<br>'+TF('calc.excluded',{n:fmtN(c.noPrice)});
  v.innerHTML=html; card.appendChild(v);
}

/* ---------- 导出结果图：原生 Canvas 1200×630（风格对齐 assets/og.png） ---------- */
function calcWrap(ctx,text,maxW){
  const out=[];
  for(const para of String(text).split('\n')){
    const words=para.split(/\s+/).filter(Boolean);
    if(words.length<=1){                       // CJK 连续文本 → 按字贪心
      let l='';
      for(const ch of para){ if(ctx.measureText(l+ch).width>maxW&&l){out.push(l);l='';} l+=ch; }
      if(l) out.push(l);
      continue;
    }
    let l='';
    for(const w of words){ const t=l?l+' '+w:w;
      if(ctx.measureText(t).width>maxW&&l){out.push(l);l=w;} else l=t; }
    if(l) out.push(l);
  }
  return out;
}
function calcExport(){
  const r=S.calc.result; if(!r) return false;
  const m=r.model;
  if(typeof mpTrack==='function') mpTrack('mp_share_click',{channel:'export-image'});
  const cv=document.createElement('canvas');
  if(!cv||typeof cv.getContext!=='function') return false;   // fake DOM / 无 canvas → 跳过像素路径
  const ctx=cv.getContext('2d'); if(!ctx) return false;
  const W=1200,H=630, C={bg:'#0b0e14',panel:'#131b28',green:'#3ddc97',gold:'#f5c542',white:'#eef2f7',dim:'#7a8594',line:'#343e4c'};
  cv.width=W; cv.height=H;
  const g=ctx.createLinearGradient?ctx.createLinearGradient(0,0,0,H):null;
  if(g){ g.addColorStop(0,C.panel); g.addColorStop(1,C.bg); ctx.fillStyle=g; } else ctx.fillStyle=C.bg;
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle=C.gold; ctx.fillRect(0,0,8,H);                       // .win:before 同款左金条
  ctx.strokeStyle=C.green; ctx.lineWidth=6; ctx.lineJoin='round';    // favicon 折线 motif
  ctx.beginPath(); ctx.moveTo(960,150); ctx.lineTo(1030,100); ctx.lineTo(1085,135); ctx.lineTo(1155,58); ctx.stroke();
  ctx.fillStyle=C.gold; ctx.beginPath(); ctx.arc(1155,58,11,0,Math.PI*2); ctx.fill();
  const fam='"Segoe UI","PingFang SC","Hiragino Sans","Microsoft YaHei",Roboto,sans-serif';
  const font=(sz,w)=>(w||400)+' '+sz+'px '+fam;
  const center=(txt,y,f,fill)=>{ ctx.font=f; ctx.fillStyle=fill; ctx.fillText(txt,(W-ctx.measureText(txt).width)/2,y); };
  center('MODELPRICE.DAMOLABS.APP',58,font(23),C.dim);
  /* 标题自适应宽度（og _fit 同策略） */
  let tsz=46; ctx.font=font(tsz,700);
  const title=T('calc.imgTitle');
  while(tsz>26&&ctx.measureText(title).width>1040){ tsz-=2; ctx.font=font(tsz,700); }
  center(title,132,font(tsz,700),C.white);
  /* 结论句：字号从 32 往下试，整段 ≤5 行 */
  let hsz=32, lh=Math.round(hsz*1.42);
  ctx.font=font(hsz,600);
  let lines=calcWrap(ctx,calcHeadline(true),1040);
  while(hsz>22&&lines.length>5){ hsz-=2; lh=Math.round(hsz*1.42); ctx.font=font(hsz,600); lines=calcWrap(ctx,calcHeadline(true),1040); }
  ctx.font=font(hsz,600); ctx.fillStyle=C.white;
  let y=196;
  for(const l of lines){ ctx.fillText(l,80,y); y+=lh; }
  const model=`${m.lab?m.lab+' · ':''}${m.n} · ${m.s} pts (+${m.u95}/−${m.d95})`;
  center(model,y+26,font(28,600),C.green);
  /* 底部 chips（og chips 同款描边，锚在 og 同款节奏位 y≈478）：包月 / API / 盈亏平衡 */
  const chips=[T('calc.kpiPlan')+' '+calcFeeDisp(),
               T('calc.kpiApi')+' '+fmt$(r.apiMonth),
               T('calc.kpiBe')+' '+fmtR(r.be,1)+T('calc.perDay')];
  const fch=font(24), gap=20, px=24, py=14; let cw=chips.map(t=>{ctx.font=fch;return ctx.measureText(t).width;});
  let total=cw.reduce((a,b)=>a+b,0)+px*2*chips.length+gap*(chips.length-1);
  let x=(W-total)/2, y0=Math.max(478,y+44), ch=24+py*2;
  chips.forEach((t,i)=>{ ctx.strokeStyle=C.line; ctx.lineWidth=2;
    ctx.strokeRect(x,y0,cw[i]+px*2,ch);
    ctx.font=fch; ctx.fillStyle=C.white; ctx.fillText(t,x+px,y0+py+18); x+=cw[i]+px*2+gap; });
  center(TF('calc.imgFooter',{date:DATA.scraped}),H-38,font(20),C.dim);
  /* 下载 PNG */
  const done=b=>{ if(!b) return; const a=el('a'); a.href=URL.createObjectURL(b);
    a.download='modelprice-plan-vs-api.png'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000); };
  if(cv.toBlob) cv.toBlob(done,'image/png');
  else if(cv.toDataURL){ const a=el('a'); a.href=cv.toDataURL('image/png');
    a.download='modelprice-plan-vs-api.png'; a.click(); }
  return true;
}

/* ---------- 控件事件 ---------- */
(function(){
  const live=()=>{ if(S.calc.computed) calcCompute(false); else calcApplyUI(); };
  $('#calcCur').onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
    const v=b.dataset.v; if(v===S.calc.cur||!['usd','cny'].includes(v)) return;
    S.calc.cur=v;
    /* 换币种 = 同一数值换算过去（不静默取整到整数档，快捷钮负责取整档） */
    S.calc.fee = v==='cny' ? Math.round(S.calc.fee*CALC_USD_CNY)
                           : Math.round(S.calc.fee/CALC_USD_CNY*10)/10;
    live(); };
  $('#calcFee').onchange=e=>{ S.calc.fee=Math.max(0,+e.target.value||0); live(); };
  $('#calcTasks').onchange=e=>{ S.calc.tasks=Math.max(1,Math.round(+e.target.value||1)); live(); };
  $('#calcProf').onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
    if(!RANK_PRESETS[b.dataset.v]) return;
    S.calc.profile=b.dataset.v; live(); };
  $('#calcBoard').onchange=e=>{ S.calc.board=e.target.value; S.calc.barSet=false; live(); };
  $('#calcBar').oninput=e=>{ S.calc.bar=+e.target.value||0; S.calc.barSet=true; live(); };
  $('#calcBar').onchange=e=>{ S.calc.bar=+e.target.value||0; S.calc.barSet=true; live(); };
  document.querySelectorAll('[data-cb]').forEach(b=>b.onclick=()=>{
    const d=calcFixBoard();
    if(b.dataset.cb==='flag'){ S.calc.bar=calcFlagshipCut(d); S.calc.barSet=false; }
    else if(b.dataset.cb==='mid'){ S.calc.bar=calcMidCut(d); S.calc.barSet=true; }
    else { S.calc.bar=d.stats.score_min; S.calc.barSet=true; }
    live(); });
  const chipDelegate=(wrapId,fn)=>{ $(wrapId).onclick=e=>{ const b=e.target.closest('button');
    if(!b||b.dataset.cv==null) return; fn(+b.dataset.cv); }; };
  chipDelegate('#calcFeeChips',v=>{ S.calc.fee=v; live(); });
  chipDelegate('#calcTaskChips',v=>{ S.calc.tasks=Math.max(1,v); live(); });
  /* 提交测算（EXP-006 mp_calc_complete 的唯一触发点） */
  $('#calcGo').onclick=()=>{ calcCompute(true);
    if(S.calc.result&&typeof document.querySelector==='function')
      $('#calcCard').scrollIntoView&&$('#calcCard').scrollIntoView({behavior:'smooth',block:'start'}); };
  $('#calcCopyText').onclick=()=>{
    const t=calcText(); if(!t) return;
    if(typeof mpTrack==='function') mpTrack('mp_share_click',{channel:'copy-verdict'});
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject())
      .then(()=>{ $('#calcCopyText').textContent=T('interact.copied');
        setTimeout(()=>{$('#calcCopyText').textContent=T('calc.copyText');},1500); })
      .catch(()=>prompt(T('interact.promptCopy'),t)); };
  $('#calcCopyLink').onclick=()=>copyStateLink($('#calcCopyLink'),'grp.export.copyLink');
  $('#calcExport').onclick=()=>calcExport();
})();

/* boot（09-boot）恢复 ?tab=calc 深链时调用：同步 UI + 静默首算（不发事件） */
function calcBoot(){ calcApplyUI(); if(!S.calc.computed||!S.calc.result) calcCompute(false); }
