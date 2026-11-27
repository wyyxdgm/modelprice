
/* ==================== W2 AI 月度账单体检与混搭配置器 ====================
   一句话：勾选你真实在付的 AI 账单（订阅 + 中转充值）+ 选主力场景，工具按
   「80/20 大小模型混搭」估算官方直连的月成本，和你的账单比出每月省多少。
   · 输入①账单勾选（多选叠加，自动汇总双币）：ChatGPT Plus $20 / Claude Pro $20 /
     Cursor Pro $20 / 国产包月 ¥140 + 第三方中转/API 每月充值 ¥（默认 0，快捷 50/100/200）。
     顶部实时显示「你当前每月 AI 总支出约：¥X（$Y）」。
   · 输入②主力场景（单选）：日常办公问答 / 每天高频写代码 / 重度 Agent 跑任务
     —— 映射 RANK_PRESETS 的 token 画像（light/dev/heavy）并带默认每日次数；
     每日次数 / 能力门槛 / 缓存率收进默认折叠的 ⚙️ 高级参数。
   · 引擎：门槛 T → 达标**且带公布价(pin/pout)**的模型里选出 80% 常规赢家（门槛内
     最便宜，与排行榜同源价格情景：峰谷 priceScale / 缓存 CACHE_RATIO / 写入倍率）；
     20% 攻坚用「分数严格高于赢家的达标模型中最便宜者」（高一档旗舰）；赢家已是榜首
     则退化为单模型并明示。无公布价的模型剔除并明示（红线：算不完整的方案不参与对比）。
   · 输出：账单 vs 直连三方向结论（save 省 / over 多花 / tie 打平 / estimate 未勾账单）
     + 盈亏平衡 tasks/day + 勾了中转充值时追加「缓存盲区」提示 + 复制结论 / 深链 /
     导出「账单体检报告」Canvas 1200×630。
   · 埋点：「算这笔账」提交时 window.mpCalcComplete() 一次（EXP-006 预注册事件，
     W2 起 payload = preset/board/bar/tasks/spend/blend/winner/flagship/dir）。
   · 免责（明示）：订阅额度/限速/降速条款未建模；¥ 按 CALC_USD_CNY 固定折算。 */
S.calc={bills:{gpt:false,claude:false,cursor:false,dom:false}, relay:0,
        tasks:30, profile:'dev', board:'overall_all',
        bar:null, barSet:false, computed:false, noPrice:0, result:null};
const CALC_USD_CNY=7.1;                       // ¥→$ 固定折算（2026-11 口径，写进 cnyNote，不实时抓汇率）
const CALC_BILLS=[{id:'gpt',usd:20},{id:'claude',usd:20},{id:'cursor',usd:20},{id:'dom',cny:140}];
const CALC_RELAY_CHIPS=[50,100,200];
const CALC_TASK_CHIPS=[3,10,30,100];
const CALC_SCEN_TASKS={light:10,dev:30,heavy:100};   // 场景 → 默认每日次数（高级参数可改）
const CALC_PROF_KEY={light:'Light',dev:'Dev',heavy:'Heavy'};   // → rank.presetLight/presetDev/presetHeavy
const CALC_W_REG=0.8, CALC_W_HARD=0.2;               // 80% 常规 / 20% 攻坚

/* ---------- 引擎 ---------- */
function calcBoards(){ return Object.keys(DATASETS).filter(k=>DATASETS[k].unit!=='image'); }
function calcFixBoard(){ const d=DATASETS[S.calc.board];
  if(!d||d.unit==='image') S.calc.board='overall_all'; return DATASETS[S.calc.board]; }
/* 当前勾选账单 + 中转充值 → 每月总支出（USD 口径） */
function calcSpendUSD(){ const c=S.calc; let usd=0;
  CALC_BILLS.forEach(b=>{ if(c.bills[b.id]) usd+=(b.usd!=null?b.usd:b.cny/CALC_USD_CNY); });
  return usd+(c.relay||0)/CALC_USD_CNY; }
/* 双币展示：中文页 ¥ 在前（账单输入以 ¥ 为主），其余 $ 在前 */
function calcSpendDisp(usd){
  const cny=fmtN(Math.round(usd*CALC_USD_CNY));
  return /^zh/.test(LOCALE_TAG) ? `¥${cny}（${fmt$(usd)}）` : `${fmt$(usd)} (≈ ¥${cny})`;
}
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
/* 攻坚旗舰 = 达标带价模型里「分数严格高于赢家」的最便宜者；没有（赢家即榜首）→ null */
function calcFlagship(pool,winner,inK,outK){
  let best=null;
  for(const m of pool){
    if(m.s==null||m.s<=winner.s) continue;
    const per=calcTaskCost(m,inK,outK); if(per==null) continue;
    if(!best||per<best.per-1e-12) best={m,per};
  }
  return best;
}
function calcCompute(fire){
  const c=S.calc, d=calcFixBoard();
  const [inK,outK]=RANK_PRESETS[c.profile]||RANK_PRESETS.dev;
  if(!c.barSet||c.bar==null) c.bar=calcFlagshipCut(d);
  c.bar=clamp(Math.round(c.bar),d.stats.score_min,d.stats.score_max);
  const spend=calcSpendUSD();
  const pool=d.models.filter(m=>m.s!=null&&m.s>=c.bar);
  c.noPrice=pool.filter(m=>m.pin==null||m.pout==null).length;
  let best=null;
  for(const m of pool){
    const per=calcTaskCost(m,inK,outK);
    if(per==null) continue;
    if(!best||per<best.per-1e-12||(Math.abs(per-best.per)<=1e-12&&m.s>best.m.s)) best={m,per};
  }
  if(!best){ c.result=null; c.computed=true; calcRender(); return; }   // 空达标/全无价 → 明示空态，不发事件
  const flag=calcFlagship(pool,best.m,inK,outK);
  const blendPer=CALC_W_REG*best.per+(flag?CALC_W_HARD*flag.per:best.per);
  const blendMonth=blendPer*c.tasks*30;
  const noBill=spend<=0;
  const diff=spend-blendMonth;                    // >0：直连比你省 → save；<0：你已更省 → over
  const tie=!noBill&&Math.abs(diff)<Math.max(1,spend*0.02);   // 差额 < $1 且 < 2% 月支出 → 打平
  const be=(blendPer*30>0&&!noBill) ? spend/(blendPer*30) : null;   // 平衡点：混搭月成本恰好=账单的频次
  c.result={model:best.m,flag:flag?flag.m:null,perTask:best.per,flagPer:flag?flag.per:null,
            blendPer,blendMonth,spend,diff,tie,noBill,be,inK,outK,
            board:c.board,bar:c.bar,tasks:c.tasks};
  c.computed=true;
  if(fire) calcTrack();
  calcRender();
}
/* EXP-006 判读事件：只有用户点「算这笔账」（fire=true）才上报一次（W2 起带 spend/blend/flagship） */
function calcTrack(){
  const r=S.calc.result; if(!r) return;
  if(typeof window==='undefined'||!window.mpCalcComplete) return;   // fake DOM / 桩缺失 → 静默
  const dir=r.noBill?'estimate':(r.tie?'tie':(r.diff>0?'save':'over'));
  window.mpCalcComplete({preset:S.calc.profile, board:r.board, bar:r.bar,
    tasks_per_day:S.calc.tasks, spend:Math.round(r.spend*100)/100,
    blend_month:Math.round(r.blendMonth*100)/100,
    winner:r.model.n, flagship:r.flag?r.flag.n:null, dir});
}

/* ---------- 结论文案（DOM 与复制文本共用一源，plain 控制是否加 <b>） ---------- */
function calcHeadline(plain){
  const r=S.calc.result; if(!r) return '';
  const spend=calcSpendDisp(r.spend), api=fmt$(r.blendMonth);
  const w=plain?r.model.n:'<b>'+r.model.n+'</b>';
  const f=plain?(r.flag?r.flag.n:r.model.n):'<b>'+(r.flag?r.flag.n:r.model.n)+'</b>';
  if(r.noBill) return TF('calc.noBill',{n:fmtN(S.calc.tasks),api,winner:w,flag:f});
  if(r.tie) return TF('calc.concTie',{n:fmtN(S.calc.tasks),spend,api,winner:w,flag:f});
  if(r.diff>0) return TF('calc.concSave',{n:fmtN(S.calc.tasks),spend,api,diff:fmt$(r.diff),
    perDay:fmt$(r.diff/30),winner:w,flag:f});
  return TF('calc.concOver',{n:fmtN(S.calc.tasks),spend,api,diff:fmt$(-r.diff),winner:w,flag:f});
}
function calcBeLine(plain){
  const r=S.calc.result; if(!r||r.tie||r.noBill||r.be==null) return '';
  const be=fmtR(r.be,1), n=fmtN(S.calc.tasks);
  return r.diff>0 ? TF('calc.beLow',{be,n}) : TF('calc.beHigh',{be,n});
}
function calcBasisText(){
  const r=S.calc.result; if(!r) return '';
  const prof=T('calc.sc'+CALC_PROF_KEY[S.calc.profile])+' · '+TF('rank.profileTag',{in:r.inK,out:r.outK});
  return TF('calc.basis',{profile:prof,n:fmtN(S.calc.tasks),
    bar:fmtN(r.bar),winner:r.model.n,flag:r.flag?r.flag.n:r.model.n,
    board:DATASETS[r.board].label,date:DATA.scraped});
}
/* 复制结论文本：结论 + 平衡点 +（中转提示）+ 口径 +（¥ 折算）+ 免责 + 深链 */
function calcText(){
  const r=S.calc.result; if(!r) return '';
  const parts=[calcHeadline(true)];
  const be=calcBeLine(true); if(be) parts.push(be);
  if(S.calc.relay>0) parts.push(T('calc.relayHint'));
  parts.push(calcBasisText());
  parts.push(TF('calc.cnyNote',{rate:CALC_USD_CNY}));
  parts.push(T('calc.disclaimer'));
  parts.push(stateUrl());
  return parts.join('\n');
}

/* ---------- UI 同步 ---------- */
function calcSegSync(id,v){ [...$(id).children].forEach(b=>b.classList.toggle('on',b.dataset.v===v)); }
function calcChips(wrap,vals,cls,label){
  wrap.innerHTML='';
  vals.forEach(v=>{ const b=el('button','btn'+(cls?' '+cls:'')); b.dataset.cv=String(v);
    b.textContent=label(v); wrap.appendChild(b); });
}
function calcBillsRender(){
  const wrap=$('#calcBills'); wrap.innerHTML='';
  CALC_BILLS.forEach(b=>{ const btn=el('button','btn'+(S.calc.bills[b.id]?' on':''));
    btn.dataset.bill=b.id; btn.textContent=T('calc.bill'+b.id.charAt(0).toUpperCase()+b.id.slice(1));
    wrap.appendChild(btn); });
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
  calcSegSync('#calcProf',c.profile);
  calcBillsRender();
  calcChips($('#calcRelayChips'),CALC_RELAY_CHIPS,null,v=>'¥'+fmtN(v));
  calcChips($('#calcTaskChips'),CALC_TASK_CHIPS,null,v=>fmtN(v)+T('calc.perDay'));
  const bar=$('#calcBar'), st=d.stats;
  bar.min=st.score_min; bar.max=st.score_max;
  bar.value=String(c.bar==null?calcFlagshipCut(d):Math.round(c.bar));
  $('#calcRelay').value=String(c.relay||0);
  $('#calcTasks').value=String(c.tasks);
  $('#calcCache').value=String(Math.round(S.cacheHit*100));
  $('#calcSpend').innerHTML=T('calc.spendTotal')+'<b>'+calcSpendDisp(calcSpendUSD())+'</b>';
  $('#calcBarLab').textContent=(c.bar==null?'—':T('rank.ge')+fmtN(Math.round(c.bar)))
    +(c.barSet?'':' · '+T('calc.barDefaultTag'));
}

/* ---------- 渲染体检卡 ---------- */
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
  card.appendChild(el('div','k', `${T('tabs.calc')} · ${dd.label} · ${T('rank.ge')}${Math.round(r.bar)} · ${T('calc.sc'+CALC_PROF_KEY[c.profile])}`));
  card.appendChild(el('div','cl',calcHeadline(false)));
  const nm=el('div','nm');
  nm.innerHTML=`<span class="rank">${T('calc.tagWinner')}</span>${m.n}`;
  card.appendChild(nm);
  card.appendChild(el('div','by', `${m.lab?m.lab+' · ':''}<span class="mono">${m.lic||''}</span> · ${m.s} pts <span class="mono">(+${m.u95}/−${m.d95})</span>`));
  if(r.flag){ const f2=el('div','nm');
    f2.innerHTML=`<span class="rank">${T('calc.tagFlag')}</span>${r.flag.n}`;
    card.appendChild(f2);
    card.appendChild(el('div','by', `${r.flag.lab?r.flag.lab+' · ':''}${r.flag.s} pts <span class="mono">(+${r.flag.u95}/−${r.flag.d95})</span>`)); }
  const k=el('div','kpis');
  const kpi=(t,v,cl,s)=>{const d2=el('div','kpi '+(cl||''));d2.innerHTML=`<div class="t">${t}</div><div class="v">${v}${s?` <small>${s}</small>`:''}</div>`;k.appendChild(d2);};
  kpi(T('calc.kpiSpend'), calcSpendDisp(r.spend)+'/mo');
  kpi(T('calc.kpiBlend'), fmt$(r.blendMonth)+'/mo', 'accent', fmt$(r.blendPer)+T('rank.perTask'));
  kpi(T('calc.kpiDiff'), r.noBill?'—':((r.diff>0?'+':r.diff<0?'−':'±')+fmt$(Math.abs(r.diff))+'/mo'), (r.tie||r.noBill)?'':'gold');
  kpi(T('calc.kpiBe'), r.be==null?'—':fmtR(r.be,1)+T('calc.perDay'), 'good');
  kpi(T('winner.kpiScore'), m.s, 'gold', `+${m.u95}/−${m.d95}`);
  card.appendChild(k);
  const v=el('div','verdict');
  let html='';
  const be=calcBeLine(false); if(be) html+=be+'<br>';
  html+=calcBasisText();
  if(r.flag==null) html+='<br><span class="warn">'+TF('calc.noFlagNote',{winner:m.n})+'</span>';
  if(c.relay>0) html+='<br><span class="warn">'+T('calc.relayHint')+'</span>';
  html+='<br><span class="warn">'+T('calc.disclaimer')+'</span>';
  if(c.noPrice) html+='<br>'+TF('calc.excluded',{n:fmtN(c.noPrice)});
  v.innerHTML=html; card.appendChild(v);
}

/* ---------- 导出「账单体检报告」：原生 Canvas 1200×630（风格对齐 assets/og.png） ---------- */
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
  const mixline=`${T('calc.tagWinner')} ${m.n} · ${T('calc.tagFlag')} ${r.flag?r.flag.n:m.n}`;
  center(mixline,y+26,font(28,600),C.green);
  /* 底部 chips（og chips 同款描边，锚在 og 同款节奏位 y≈478）：当前账单 / 直连混搭 / 盈亏平衡 */
  const chips=[T('calc.kpiSpend')+' '+calcSpendDisp(r.spend),
               T('calc.kpiBlend')+' '+fmt$(r.blendMonth),
               T('calc.kpiBe')+' '+(r.be==null?'—':fmtR(r.be,1)+T('calc.perDay'))];
  const fch=font(24), gap=20, px=24, py=14; let cw=chips.map(t=>{ctx.font=fch;return ctx.measureText(t).width;});
  let total=cw.reduce((a,b)=>a+b,0)+px*2*chips.length+gap*(chips.length-1);
  let x=(W-total)/2, y0=Math.max(478,y+44), ch=24+py*2;
  chips.forEach((t,i)=>{ ctx.strokeStyle=C.line; ctx.lineWidth=2;
    ctx.strokeRect(x,y0,cw[i]+px*2,ch);
    ctx.font=fch; ctx.fillStyle=C.white; ctx.fillText(t,x+px,y0+py+18); x+=cw[i]+px*2+gap; });
  center(TF('calc.imgFooter',{date:DATA.scraped}),H-38,font(20),C.dim);
  /* 下载 PNG */
  const done=b=>{ if(!b) return; const a=el('a'); a.href=URL.createObjectURL(b);
    a.download='modelprice-bill-check.png'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000); };
  if(cv.toBlob) cv.toBlob(done,'image/png');
  else if(cv.toDataURL){ const a=el('a'); a.href=cv.toDataURL('image/png');
    a.download='modelprice-bill-check.png'; a.click(); }
  return true;
}

/* ---------- 控件事件 ---------- */
(function(){
  const live=()=>{ if(S.calc.computed) calcCompute(false); else calcApplyUI(); };
  $('#calcBills').onclick=e=>{ const b=e.target.closest('button');
    if(!b||!b.dataset.bill) return;
    S.calc.bills[b.dataset.bill]=!S.calc.bills[b.dataset.bill]; live(); };
  $('#calcRelay').onchange=e=>{ S.calc.relay=Math.max(0,+e.target.value||0); live(); };
  $('#calcTasks').onchange=e=>{ S.calc.tasks=Math.max(1,Math.round(+e.target.value||1)); live(); };
  $('#calcCache').oninput=e=>{ S.cacheHit=clamp((+e.target.value||0)/100,0,1);
    if(typeof syncPriceUI==='function') syncPriceUI();
    if(typeof recompute==='function') recompute();
    live(); };
  $('#calcProf').onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
    if(!RANK_PRESETS[b.dataset.v]) return;
    S.calc.profile=b.dataset.v;
    S.calc.tasks=CALC_SCEN_TASKS[b.dataset.v]||S.calc.tasks;   // 场景带默认频次，高级参数可再改
    live(); };
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
  chipDelegate('#calcRelayChips',v=>{ S.calc.relay=v; live(); });
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
