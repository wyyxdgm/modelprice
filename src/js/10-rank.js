
/* ==================== 页签①实惠排行榜 ====================
   直接回答：「在质量标准 T 下，做一次日常任务谁最实惠、差多少分、用多少 $」。
   · 标准 = 质量门槛 S.rankT（达标 = score ≥ T）+ 能力榜（S.ds）+ 价格时段（峰/谷/此刻）
   · 日常标准 = 任务画像：输入 inK / 输出 outK（千 token）× 当前情景修正后的标价，
     公式与 priceScale 同口径（缓存折扣、峰谷、促销、写入倍率全部继承左栏控制）。
   · unit==='image' 的榜（文生图）按张计价：一律用实测 Cost/Task（每张图），画像控件禁用。
   · m.cRaw 永不改动 —— 排行榜成本是纯推导，与阶梯/散点共享同一份情景状态。 */
S.tab='rank';
S.rankT=null; S.rankTSet=false;
S.rankPreset='dev'; S.rankIn=20; S.rankOut=2; S.rankPerDay=30; S.rankPk='now';
S.rankShowAll=false;
const RANK_PRESETS={light:[2,0.5], dev:[20,2], heavy:[120,12]};
const RANK_TOP_N=20;
/* 首屏一键场景卡 → 等价 rank 参数（卡片点击与 URL ?scene= 共用同一映射，09-boot 调 applyScene） */
const SCENARIOS={coding:{rk:'dev',rp:'off'}, agent:{rk:'heavy',rp:'now'}, offpeak:{rk:'light',rp:'off'}};
function applyScene(k){
  const sc=SCENARIOS[k]; if(!sc) return false;
  S.tab='rank'; S.rankPreset=sc.rk; S.rankPk=sc.rp;
  if(RANK_PRESETS[sc.rk]){ const [i,o]=RANK_PRESETS[sc.rk]; S.rankIn=i; S.rankOut=o; }
  if(sc.rp==='now'){ S.hour=new Date().getUTCHours(); S.dow=new Date().getUTCDay(); }
  else if(sc.rp==='peak'){ S.hour=2; S.dow=3; }
  else { S.hour=12; S.dow=6; }
  [...$('#tabs').children].forEach(x=>x.classList.toggle('on',x.dataset.tab==='rank'));
  $('#rankView').style.display=''; $('#deepView').style.display='none';
  [...$('#rankPk').children].forEach(x=>x.classList.toggle('on',x.dataset.v===S.rankPk));
  [...$('#rankPreset').children].forEach(x=>x.classList.toggle('on',x.dataset.v===S.rankPreset));
  $('#rankIn').value=String(S.rankIn); $('#rankOut').value=String(S.rankOut);
  syncPriceUI(); recompute();
  return true;
}

function rankIsImage(){ return DATASETS[S.ds] && DATASETS[S.ds].unit==='image'; }
/* 一次「日常标准任务」的成本。榜单实测口径 / 文生图（按张）/ 无标价 → 直接用情景修正后的 m.c。 */
function dailyCost(m){
  if(S.rankPreset==='board'||rankIsImage()||m.pin==null||m.pout==null) return m.c;
  const L=listPricesAt(m,S.hour,S.dow,S.dateISO);
  const cr=cacheRatioOf(m);
  let pin=L.pin;
  if(cr){ const h=S.cacheHit; pin=(1-h)*L.pin*writeMultOf(m)+h*L.pin*cr.r; }
  return (S.rankIn*pin+S.rankOut*L.pout)/1000;
}
/* 达标集合按单次成本升序；同成本时更强的排前。 */
function rankRows(){
  return cur.filter(m=>m.s>=S.rankT&&m.c!=null&&m.c>0)
    .map(m=>({m, c:dailyCost(m)}))
    .sort((a,b)=> a.c-b.c || b.m.s-a.m.s);
}
function rankPeriodLabel(){
  if(S.rankPk==='peak') return T('rank.pkPeak');
  if(S.rankPk==='off')  return T('rank.pkOff');
  const pk=peakAtAny(S.hour,S.dow);
  return T('rank.pkNow')+' · '+(pk?T('cache.pillPeak'):T('cache.pillOff'));
}
function rankDefaultT(){
  const st=DATASETS[S.ds].stats;
  return Math.round(st.score_max-(st.score_max-st.score_min)*0.3);
}

function renderRank(){
  const st=DATASETS[S.ds].stats, isImg=rankIsImage();
  /* ---- 控制区同步 ---- */
  $('#rankDs').value=S.ds;
  const rt=$('#rankT'); rt.min=st.score_min; rt.max=st.score_max;
  if(S.rankT==null) S.rankT=rankDefaultT();
  S.rankT=clamp(S.rankT,st.score_min,st.score_max);
  rt.value=String(S.rankT);
  $('#rankTLab').textContent=T('rank.ge')+S.rankT;
  [...$('#rankPk').children].forEach(b=>b.classList.toggle('on',b.dataset.v===S.rankPk));
  [...$('#rankPreset').children].forEach(b=>b.classList.toggle('on',b.dataset.v===S.rankPreset));
  $('#rankIn').value=String(S.rankIn); $('#rankOut').value=String(S.rankOut); $('#rankDay').value=String(S.rankPerDay);
  $('#rankProfile').style.display=isImg?'none':'';
  const uh=$('#rankUnitHint'); uh.style.display=isImg?'':'none';
  if(isImg) uh.innerHTML=T('rank.unitHint');
  if(!isImg) $('#rankHint').innerHTML=TF('rank.hint',{ch:Math.round(S.cacheHit*100)});

  /* ---- 排行 ---- */
  const rows=rankRows(), tb=$('#rankTbl tbody'); tb.innerHTML='';
  const champ=rows[0]||null;
  const shown=S.rankShowAll?rows:rows.slice(0,RANK_TOP_N);
  shown.forEach((x,i)=>{
    const m=x.m, c1=champ?champ.c:x.c;
    const ratio=c1>0?x.c/c1:1;
    const tr=el('tr', i===0?'winner':'in');
    tr.innerHTML=`<td class="mono">${i+1}</td>
      <td class="nm"><a href="${m.u}" target="_blank" rel="noopener">${m.n}</a> <span class="lab">${m.lab||''}</span>
        ${m.pre?'<span class="pill warn" style="padding:0 4px;font-size:9.5px">PRE</span>':''}</td>
      <td class="num">${m.s}<span style="color:var(--dim2);font-size:11px"> +${m.u95}/−${m.d95}</span></td>
      <td class="num">${i===0?'<span style="color:var(--gold)">★</span>':'+'+(m.s-champ.m.s)}</td>
      <td class="num" style="color:var(--accent)">${fmt$(x.c)}${(m.adj&&Math.abs(x.c/m.c-1)>1e-9)?'<small style="color:var(--dim2)">*</small>':''}</td>
      <td class="num hidemid">${i===0?'—':(ratio>=1.005?'×'+fmtR(ratio,2):'≈')}</td>
      <td class="num hidemid">${fmt$(x.c*S.rankPerDay*30)}</td>`;
    tr.title=TF('rank.rowTitle',{name:m.n,s:m.s,c:fmt$(x.c),
      api:m.pin!=null?fmt$(m.pin)+' / '+fmt$(m.pout)+' $/M':'—',v:fmtN(m.v)});
    tr.addEventListener('click',e=>{ if(e.target.tagName==='A')return;
      S.lo=Math.min(m.s,S.rankT); S.hi=m.s; stopPlay(); recompute(); });
    tb.appendChild(tr);
  });
  $('#rankCount').textContent=TF('rank.count',{n:rows.length,all:cur.filter(m=>m.c!=null).length});
  const more=$('#rankMore');
  more.style.display=rows.length>RANK_TOP_N?'':'none';
  more.textContent=S.rankShowAll?T('rank.fewer'):TF('rank.more',{n:rows.length-RANK_TOP_N});

  /* ---- 答案卡 ---- */
  const c=$('#rankVerdict'); c.innerHTML='';
  if(!champ){
    c.appendChild(el('div','k',T('rank.still')+`${S.rankT}`));
    c.appendChild(el('div','empty',TF('rank.empty',{t:S.rankT,smax:st.score_max})));
    return;
  }
  const m=champ.m;
  const profTxt = isImg ? T('rank.perImage')
    : (S.rankPreset==='board' ? T('rank.measured')
       : TF('rank.profileTag',{in:S.rankIn,out:S.rankOut}));
  c.appendChild(el('div','k', TF('rank.standards',{t:S.rankT,cap:DATASETS[S.ds].label,prof:profTxt,period:rankPeriodLabel()})));
  const nm=el('div','nm');
  nm.innerHTML=`<span class="rank">#1</span>${m.n}`;
  c.appendChild(nm);
  c.appendChild(el('div','by', `${m.lab?m.lab+' · ':''}<span class="mono">${m.lic||T('winner.licUnknown')}</span>`));
  const k=el('div','kpis');
  const kpi=(t,v,cl,s)=>{const d=el('div','kpi '+(cl||''));d.innerHTML=`<div class="t">${t}</div><div class="v">${v}${s?` <small>${s}</small>`:''}</div>`;k.appendChild(d);};
  kpi(T('winner.kpiScore'), m.s, 'gold', `+${m.u95}/−${m.d95}`);
  kpi(T('rank.kpiPer'), fmt$(champ.c), 'accent', isImg?T('rank.perImage'):T('rank.perTask'));
  kpi(T('rank.kpiMonth'), fmt$(champ.c*S.rankPerDay*30), 'good', TF('rank.kpiMonthTail',{n:S.rankPerDay}));
  kpi(T('winner.kpiVotes'), fmtN(m.v));
  c.appendChild(k);
  const v=el('div','verdict');
  let html='';
  const top=rows.reduce((a,b)=> b.m.s>a.m.s?b:a, rows[0]);   // 达标集里分数最高者
  if(top && top.m.n!==m.n && top.m.c>champ.c){
    const dc=top.c-champ.c, ds=top.m.s-m.s, mult=champ.c>0?top.c/champ.c:0;
    html+=TF('rank.upSell',{name:top.m.n,s:top.m.s,dc:fmt$(dc),mult:fmtR(mult,2),ds});
    html+= dc/S.rankPerDay>0.5 ? T('rank.upExpensive') : T('rank.upOk');
  } else html+=T('rank.topIsChamp');
  html+='<br>';
  if(m.adj) html+=TF('rank.adjNote',{board:fmt$(m.cRaw)});
  const ws=weekSpan(m);
  if(ws && ws.spread>1.0001)
    html+=TF('rank.swing',{lo:fmt$(ws.lo),hi:fmt$(ws.hi),pct:Math.round((1-ws.lo/ws.hi)*100)});
  v.innerHTML=html; c.appendChild(v);
}

/* ---------- 排行榜控制事件 ---------- */
(function(){
  const rd=$('#rankDs');
  Object.keys(DATASETS).forEach(k=>{
    const d=DATASETS[k], o=document.createElement('option');
    o.value=k;
    const lic = d.license==='all' ? T('data.licAll') : T('data.licOS');
    o.textContent=`${lic} ${d.label}`;
    rd.appendChild(o);
  });
  rd.value=S.ds;
  rd.onchange=e=>{ S.ds=e.target.value; dsSel.value=S.ds; S.rankTSet=false; stopPlay(); loadDataset(true); };
  $('#rankT').oninput=e=>{ S.rankT=+e.target.value||0; S.rankTSet=true; recompute(); };
  $('#rankPk').onclick=e=>{ const b=e.target.closest('button'); if(!b)return;
    S.rankPk=b.dataset.v;
    if(S.rankPk==='now'){ S.hour=new Date().getUTCHours(); S.dow=new Date().getUTCDay(); }
    else if(S.rankPk==='peak'){ S.hour=2; S.dow=3; }
    else { S.hour=12; S.dow=6; }
    syncPriceUI(); recompute(); };
  $('#rankPreset').onclick=e=>{ const b=e.target.closest('button'); if(!b)return;
    S.rankPreset=b.dataset.v;
    if(RANK_PRESETS[S.rankPreset]){ const [i,o]=RANK_PRESETS[S.rankPreset]; S.rankIn=i; S.rankOut=o; }
    recompute(); };
  const syncPreset=()=>{ const hit=Object.entries(RANK_PRESETS).find(([k,[i,o]])=> S.rankIn===i&&S.rankOut===o);
    S.rankPreset=hit?hit[0]:'custom'; };
  $('#rankIn').onchange=e=>{ S.rankIn=Math.max(0,+e.target.value||0); syncPreset(); recompute(); };
  $('#rankOut').onchange=e=>{ S.rankOut=Math.max(0,+e.target.value||0); syncPreset(); recompute(); };
  $('#rankDay').onchange=e=>{ S.rankPerDay=Math.max(1,+e.target.value||1); recompute(); };
  $('#rankMore').onclick=()=>{ S.rankShowAll=!S.rankShowAll; renderRank(); };
  /* 页签显隐 + 高亮，一处定义三处用（点击 / 初始 / boot 恢复 URL ?tab= 后重调） */
  function applyTabUI(){
    [...$('#tabs').children].forEach(x=>x.classList.toggle('on',x.dataset.tab===S.tab));
    $('#rankView').style.display=S.tab==='rank'?'':'none';
    $('#deepView').style.display=S.tab==='deep'?'':'none';
  }
  $('#tabs').onclick=e=>{ const b=e.target.closest('button'); if(!b)return;
    S.tab=b.dataset.tab;
    applyTabUI();
    if(S.tab==='deep') recompute();     // 隐藏容器里量不到宽度，切回来重渲图表
  };
  /* 初始按 S.tab 显隐。⚠️ 本文件先于 09-boot 加载：此时 URL 还没恢复，
     tab=deep 的显隐由 boot 恢复后回调 applyTabUI 补上（不补 = 深链停在排行榜页）。 */
  applyTabUI();
  globalThis.applyTabUI=applyTabUI;   // 09-boot（后加载）恢复 URL ?tab= 时回调；fake DOM 测试环境同样可达
  /* 首屏场景卡：一键设参 → 滚到答案区（?scene= 的 boot 解析走 applyScene，不滚动） */
  const scWrap=$('#sceneCards');
  if(scWrap) scWrap.onclick=e=>{
    const b=e.target.closest('[data-scene]'); if(!b) return;
    if(applyScene(b.dataset.scene))
      document.querySelector('.res').scrollIntoView({behavior:'smooth',block:'start'});
  };
})();
/* 左栏能力下拉 → 排行榜下拉同步 */
(function(){ const old=dsSel.onchange;
  dsSel.onchange=e=>{ if(old)old(e); $('#rankDs').value=S.ds; };
})();
