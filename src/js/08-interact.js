
/* ---------- range slider ---------- */
const rng=$('#rng');
function syncInputs(){
  const [mn,mx]=scoreExtent();
  const p=v=>(v-mn)/(mx-mn)*100;
  $('#hLo').style.left=p(S.lo)+'%'; $('#hHi').style.left=p(S.hi)+'%';
  $('#fill').style.left=p(S.lo)+'%'; $('#fill').style.width=(p(S.hi)-p(S.lo))+'%';
  $('#hiFill').style.left=p(S.hi)+'%'; $('#hiFill').style.width=(100-p(S.hi))+'%';
  $('#labLo').style.left=p(S.lo)+'%'; $('#labLo').textContent=S.lo;
  $('#labHi').style.left=p(S.hi)+'%'; $('#labHi').textContent=S.hi;
  $('#inLo').value=S.lo; $('#inHi').value=S.hi;
  $('#vLab').textContent=fmtN(S.minVotes);
}
function dragSetup(handle,get){
  let on=false;
  const move=e=>{ if(!on)return; const r=rng.getBoundingClientRect();
    const f=clamp((e.clientX-r.left)/r.width,0,1); const [mn,mx]=scoreExtent();
    const v=Math.round(mn+f*(mx-mn)); get(v); recompute(); };
  handle.addEventListener('pointerdown',e=>{on=true;stopPlay();handle.setPointerCapture(e.pointerId);move(e);});
  handle.addEventListener('pointermove',move);
  handle.addEventListener('pointerup',()=>on=false);
  handle.addEventListener('pointercancel',()=>on=false);
}
/* 手机友好：点/按轨道空白处 → 把更近的把手跳到该分数（把手自身的拖拽仍走 dragSetup 的
   pointer capture 逻辑；closest('.h') 保证把手按下不会在这里重复触发）。 */
rng.addEventListener('pointerdown',e=>{
  if(e.target&&e.target.closest&&e.target.closest('.h')) return;
  const r=rng.getBoundingClientRect();
  const f=clamp((e.clientX-r.left)/r.width,0,1); const [mn,mx]=scoreExtent();
  const v=Math.round(mn+f*(mx-mn)); stopPlay();
  if(Math.abs(v-S.lo)<=Math.abs(v-S.hi)) S.lo=Math.min(v,S.hi); else S.hi=Math.max(v,S.lo);
  recompute();
});
dragSetup($('#hLo'),v=>{S.lo=Math.min(v,S.hi);});
dragSetup($('#hHi'),v=>{S.hi=Math.max(v,S.lo);});
$('#inLo').onchange=e=>{S.lo=clamp(+e.target.value||0,...scoreExtent());if(S.lo>S.hi)S.hi=S.lo;stopPlay();recompute();};
$('#inHi').onchange=e=>{S.hi=clamp(+e.target.value||0,...scoreExtent());if(S.hi<S.lo)S.lo=S.hi;stopPlay();recompute();};

/* ---------- play ---------- */
let timer=null;
function stopPlay(){ S.playing=false; if(timer){clearInterval(timer);timer=null;} $('#play').textContent=T('interact.play'); $('#playState').textContent=T('interact.stop'); }
$('#play').onclick=()=>{
  if(S.playing){ stopPlay(); return; }
  S.mode='pareto'; syncSeg($('#mode'),S.mode); setModeHint();
  const [mn,mx]=scoreExtent(); S.hi=mx; S.lo=mn; S.playing=true;
  $('#play').textContent=T('interact.pause'); $('#playState').textContent=T('interact.sweeping');
  const spd=+$('#spd').value;
  timer=setInterval(()=>{
    S.hi-=spd;
    if(S.hi<=mn){ S.hi=mn; stopPlay(); }
    recompute();
  }, 90);
};

/* ---------- controls ---------- */
function syncSeg(root,v){ [...root.children].forEach(b=>b.classList.toggle('on',b.dataset.v===v)); }
function setModeHint(){
  $('#modeHint').innerHTML={
    pareto:T('interact.modeHintPareto'),
    ratio:T('interact.modeHintRatio'),
    baseline:T('interact.modeHintBaseline')
  }[S.mode];
}
$('#mode').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.mode=b.dataset.v;syncSeg($('#mode'),S.mode);setModeHint();recompute();};
$('#ci').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.ci=b.dataset.v;syncSeg($('#ci'),S.ci);recompute();};
$('#minVotes').oninput=e=>{S.minVotes=+e.target.value;recompute();};
$('#maxCost').oninput=e=>{const v=+e.target.value;S.maxCost=v>=+e.target.max?Infinity:v;recompute();};
$('#exPrelim').onchange=e=>{S.exPrelim=e.target.checked;recompute();};
$('#exAuto').onchange=e=>{S.exAuto=e.target.checked;recompute();};
$('#onlyCost').onchange=e=>{S.onlyCost=e.target.checked;recompute();};
dsSel.onchange=e=>{S.ds=e.target.value;stopPlay();loadDataset(true);};
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{
  const [mn,mx]=scoreExtent(); stopPlay();
  if(b.dataset.p==='full'){S.lo=mn;S.hi=mx;}
  if(b.dataset.p==='sweep'){S.lo=mn;S.hi=mx;}
  if(b.dataset.p==='top10'){const s=[...cur].map(m=>m.s).sort((a,b)=>b-a);S.hi=s[9]||mx;S.lo=s[9]||mn;}
  if(b.dataset.p==='mid'){S.lo=clamp(1400,mn,mx);S.hi=clamp(1550,mn,mx);}
  recompute();
});

/* ---------- exports ---------- */
function dl(name,text,type){
  const b=new Blob(['\ufeff'+text],{type:type||'text/csv;charset=utf-8'});
  const a=el('a'); a.href=URL.createObjectURL(b); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
$('#expCsv').onclick=()=>{
  const head=['rank','overall_rank','model','lab','license','score','ci_up','ci_down','preliminary','autoeval','votes','cost_per_task_p50','score_per_dollar','excess_score_per_dollar','price_in_per_M','price_out_per_M','context','in_band','pareto','url'];
  const rows=[...cur].sort((a,b)=>b.s-a.s).map(m=>[m.r,m.or,`"${m.n}"`,`"${m.lab||''}"`,`"${m.lic||''}"`,m.s,m.u95,m.d95,m.pre,m.ae,m.v,m.c,
    m.ratio!=null?m.ratio.toFixed(2):'', m.baseRatio!=null?m.baseRatio.toFixed(3):'', m.pin,m.pout,`"${m.ctx||''}"`,inBand(m),m.pareto,`"${m.u}"`]);
  dl(`arena_${S.ds}_${S.lo}-${S.hi}.csv`,[head.join(','),...rows.map(r=>r.join(','))].join('\n'));
};
$('#expTiers').onclick=()=>{
  if(!tiers.length){alert(T('interact.alertTiers'));return;}
  const fr=[...tiers].sort((a,b)=>b.model.s-a.model.s);
  const head=['tier','score_band_lo','score_band_hi','model','score','cost_per_task','marginal_$per_point_to_next_tier','votes','license'];
  let pc=null,ps=null; const rows=fr.map((t,i)=>{
    const m=t.model; let marg='';
    if(pc!=null&&m.s<ps){const dc=pc-m.c,ds=ps-m.s; if(ds>0&&dc>0)marg=(dc/ds).toFixed(3);}
    pc=m.c;ps=m.s;
    return [i+1,Math.round(t.lower),Math.round(t.upper==null?t.model.s:t.upper),`"${m.n}"`,m.s,m.c,marg,m.v,`"${m.lic||''}"`];
  });
  dl(`arena_${S.ds}_tiers.csv`,[head.join(','),...rows.map(r=>r.join(','))].join('\n'));
};
/* ---------- state link / share ----------
   state link（含全部分析状态）由 stateUrl() 单一来源产出：export 区的 Copy state link
   与页头分享栏（X / Reddit / Copy）共用同一链接，不漂移。 */
function stateUrl(){
  const onIds=PRICE_EVENTS.filter(e=>S.evState[e.id]).map(e=>e.id);
  const p=new URLSearchParams({ds:S.ds,mode:S.mode,ci:S.ci,lo:S.lo,hi:S.hi,mv:S.minVotes,pre:S.exPrelim?1:0,
    hr:S.hour,dow:S.dow,date:S.dateISO,os:Math.round(S.outShare*100),tz:S.tz,ev:onIds.join(','),
    ch:Math.round(S.cacheHit*100),cs:S.cacheSrc,
    tab:S.tab,rk:S.rankPreset,ri:S.rankIn,ro:S.rankOut,rd:S.rankPerDay,rt:S.rankT,rp:S.rankPk});
  return location.origin+location.pathname+'?'+p;
}
function copyStateLink(btn,restoreKey){
  const u=stateUrl();
  (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>{btn.textContent=T('interact.copied');setTimeout(()=>btn.textContent=T(restoreKey),1500);})
   .catch(()=>prompt(T('interact.promptCopy'),u));
}
$('#copyLink').onclick=()=>copyStateLink($('#copyLink'),'interact.copyLink');
/* 分享栏（EXP-006 判读指标 mp_share_click 的触发面）：X / Reddit 一键 + Copy。
   mpTrack 由 /analytics.js（umami）定义；未加载时静默跳过，分享功能不受影响。 */
function shareClick(net){
  if(typeof mpTrack==='function') mpTrack('mp_share_click',{channel:net});
}
function shareOpen(url){
  const a=el('a'); a.href=url; a.target='_blank'; a.rel='noopener'; a.click();
}
$('#shareX').onclick=()=>{ shareClick('x');
  shareOpen('https://x.com/intent/post?text='+encodeURIComponent(T('meta.ogTitle'))+'&url='+encodeURIComponent(stateUrl())); };
$('#shareReddit').onclick=()=>{ shareClick('reddit');
  shareOpen('https://www.reddit.com/submit?url='+encodeURIComponent(stateUrl())+'&title='+encodeURIComponent(T('meta.ogTitle'))); };
$('#shareCopy').onclick=()=>{ shareClick('copy'); copyStateLink($('#shareCopy'),'share.copy'); };

/* ---------- paste new dataset ---------- */
function parsePasted(text){
  /* 与 parse.py 的 LINK 同口径：lazy + http 锚定 —— 模型名可含内嵌 [..]（如 FLUX.2 [max]）不被切断 */
  const LINK=/\[(.*?)\]\((https?[^)\s]+)\)/g;
  const SCORE_RE=/(\d{3,4})\s*\+(\d+)\s*\/\s*-(\d+)/;
  const money=x=>{x=(x==null?'':String(x)).replace(/[$,\s]/g,'');return (x&&x!=='N/A'&&x!=='-'&&!isNaN(+x))?+x:null;};
  const isInt=x=>/^[\d,]+$/.test(String(x).trim());
  const isMoney=x=>/^\$[\d.,]+$/.test(String(x).trim());
  const isPrice=x=>/^\$?[\d.]+\s*\/\s*\$?[\d.]+$/.test(String(x).replace(/,/g,'').trim());
  const isCtx=x=>/^[\d.]+\s*[KM]$/i.test(String(x).trim());

  // 表格文本 → 单元格数组（markdown 管道 / 制表符）
  const grid=text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length).map(l=>{
    if(l.startsWith('|')) return l.replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
    if(l.includes('\t'))  return l.split('\t').map(c=>c.trim());
    return null;
  }).filter(Boolean);
  if(!grid.length) return [];

  /* 有表头就按表头名定位列 —— 不要硬编码列号，arena.ai 不同视图列数/列序都不一样：
       开源视图 = Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task | Price | Context
       全部Model = Rank | Rank Spread  | Model | Score | Votes | Cost/Task | Price | Context
       用户自己粘的表可能只有 5 列。
     认不出表头才退化为「按内容猜列」。 */
  const hi=grid.findIndex(r=>/^(Rank|#|排名)$/i.test((r[0]||'').trim()));
  let col=null;
  if(hi>=0){
    const h=grid[hi].map(c=>c.toLowerCase().trim());
    const ex=n=>h.findIndex(x=>x===n);
    const st=n=>h.findIndex(x=>x.startsWith(n));
    const c={rank:ex('rank')>=0?ex('rank'):st('rank'), orank:ex('overall rank'),
             model:ex('model')>=0?ex('model'):st('model'), score:ex('score')>=0?ex('score'):st('score'),
             votes:st('votes'), cost:st('cost'), price:st('price'), ctx:st('context')};
    if(c.model>=0&&c.score>=0) col=c;
  }
  const positional=!!col;
  const body=grid.filter((r,i)=> i!==hi && !r.every(c=>/^[-:\s]*$/.test(c)) && !/^(Rank|#|排名)$/i.test((r[0]||'').trim()));

  const rows=[];
  for(const cells of body){
    if(cells.length<4) continue;
    const linkIdx=cells.findIndex(c=>c.includes('[')&&c.includes(']('));
    if(linkIdx<0) continue;
    const sIdx=cells.findIndex(c=>SCORE_RE.test(c));
    if(sIdx<0) continue;

    const modelCell=cells[linkIdx];
    const links=[...modelCell.matchAll(LINK)];
    const last=links[links.length-1];
    const name=last[1], url=last[2];
    /* lab = 第一个链接之前的前缀（可能带 <br>，如 "Thinking Machines<br>"）
       lic = 最后一个链接之后的那段，形如 "Moonshot · Modified MIT"
       注意不能用 split(')')：Model页 URL 里本身就可能有 ')'。 */
    const lab=modelCell.slice(0,last.index).replace(/<br>/g,' ').trim()||null;
    const after=modelCell.slice(last.index+last[0].length).replace(/<br>/g,' ').trim();
    let lic=null;
    if(after.includes('·')) lic=after.split('·').slice(1).join('·').trim()||null;
    else if(after && !lab) lic=after;
    const scoreCell=cells[sIdx];
    const prelim=/Preliminary/i.test(scoreCell), auto=/AutoEval/i.test(scoreCell);
    const mm=scoreCell.match(SCORE_RE);

    let rank=null, orank=null, votes=null, cost=null, pin=null, pout=null, ctx=null;
    if(positional){
      const at=key=>{ const i=col[key]; return (i!=null&&i>=0&&i<cells.length)?cells[i]:null; };
      rank=money(at('rank')); orank=money(at('orank'));
      votes=money(at('votes')); cost=money(at('cost'));
      const pr=(at('price')||'').split('/'); pin=money(pr[0]); pout=money(pr[1]);
      ctx=at('ctx');
      if(!ctx||/^(N\/A|-|)$/i.test(String(ctx).trim())) ctx=null; else ctx=String(ctx).trim();
    } else {
      /* 猜列。关键陷阱：Rank Spread 也是纯整数列，绝不能当成 votes。
         votes 几乎总是带千分位逗号 → 用「有没有逗号」来区分；没有逗号列时取最大的那个。 */
      const before=[]; for(let i=0;i<linkIdx;i++) if(/^\d+$/.test(cells[i].replace(/,/g,''))) before.push(+cells[i].replace(/,/g,''));
      rank=before.length?before[0]:null;
      orank=before.length>1?before[1]:null;
      const afterIdx=[]; for(let i=sIdx+1;i<cells.length;i++) afterIdx.push(i);
      const pIdx=afterIdx.find(i=>isPrice(cells[i]));
      const cIdx=afterIdx.find(i=>i!==pIdx&&isCtx(cells[i]));
      ctx=cIdx!=null?cells[cIdx].trim():null;
      if(pIdx!=null){ const q=cells[pIdx].split('/'); pin=money(q[0]); pout=money(q[1]); }
      /* cost 一定带 $；votes 是纯整数。两者都先排除 price / context 列再判。 */
            /* 注意：pIdx / cIdx 可能是 undefined，不能用 indexOf(...)<0 之类的写法排除 */
      const notPC=i=>(pIdx===undefined||i!==pIdx)&&(cIdx===undefined||i!==cIdx);
      const mIdx=afterIdx.filter(i=>notPC(i)&&isMoney(cells[i]));
      const iIdx=afterIdx.filter(i=>notPC(i)&&!mIdx.includes(i)&&isInt(cells[i]));
      cost=mIdx.length?money(cells[mIdx[0]]):null;
      const comma=iIdx.filter(i=>cells[i].includes(','));
      let vIdx;
      if(comma.length) vIdx=comma[0];                       // 带千分位的几乎必是 votes
      else if(iIdx.length) vIdx=iIdx[iIdx.length-1];        // 否则取最靠右的（cost 已被 $ 规则拿走）
      votes=vIdx!=null?money(cells[vIdx]):null;
    }
    rows.push({n:name,u:url,lab,lic,r:rank,or:orank,s:+mm[1],u95:+mm[2],d95:+mm[3],
      pre:prelim,ae:auto,v:votes,c:cost,pin,pout,ctx});
  }
  return rows;
}
$('#addDs').onclick=()=>{
  const txt=$('#paste').value.trim();
  if(!txt){$('#pasteMsg').innerHTML=T('interact.pasteFirst');return;}
  const rows=parsePasted(txt);
  if(rows.length<2){$('#pasteMsg').innerHTML=TF('interact.tooFewRows',{n:rows.length});return;}
  const name=($('#pasteName').value.trim()||T('interact.customBoard'))+' ('+rows.length+')';
  const key='custom_'+Date.now().toString(36);
  const scored=rows.filter(r=>r.s), wc=rows.filter(r=>r.c!=null);
  DATASETS[key]={label:name,path:'custom',license:'custom',meta:`${rows.length}${T('interact.userPaste')}`,
    note:T('interact.customNote'),total_claimed:rows.length,
    stats:{n:rows.length,with_cost:wc.length,score_min:Math.min(...scored.map(r=>r.s)),score_max:Math.max(...scored.map(r=>r.s)),
           cost_min:wc.length?Math.min(...wc.map(r=>r.c)):null,cost_max:wc.length?Math.max(...wc.map(r=>r.c)):null},
    models:hydrate(rows.map(r=>F.map(k=>r[k])))};
  const o=el('option'); o.value=key; o.textContent=name; dsSel.appendChild(o);
  S.ds=key; dsSel.value=key; stopPlay(); loadDataset(true);
  $('#pasteMsg').innerHTML = wc.length===0
    ? TF('interact.noCostParsed',{n:rows.length})
    : TF('interact.addedOk',{n:rows.length,wc:wc.length});
  $('#paste').value='';
};
