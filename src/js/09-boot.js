
/* ---------- static text ---------- */
$('#scraped').textContent=DATA.scraped; $('#captured').textContent=DATA.captured;
$('#methodBody').innerHTML=`
<p><b>Bottom line: the approach holds — but your phrasing mixes two different things. With the corrections below it becomes a rigorous, useful tool (this page).</b></p>

<p><b>1. "Sort by cost/task + drag the range's left edge" ≠ the winner by itself.</b>
A sort direction produces no conclusion; the real operation is: fix a threshold <code>T</code> and take the min-<code>cost</code> model among those with <code>score ≥ T</code>.
Sweep <code>T</code> from the highest score down and the winner sequence is the <b>lower envelope (Pareto frontier)</b> of the (score, cost) plane.
It can be proven that the map <code>C(T) = min{cost : score ≥ T}</code> is <b>monotonically non-decreasing</b>, so "every tier has a winner, and winners get pricier as the threshold rises" necessarily follows —
your intuition is right. Arena's official <a href="https://arena.ai/leaderboard/code/webdev/pareto" target="_blank" rel="noopener">/pareto</a> view plots exactly this curve.
The key correction: the winner only switches when a <b>strictly cheaper</b> model appears — not on every drag step — so the frontier is a <b>staircase</b>, and each flat segment is "the score range this model rules".</p>

<p><b>2. "Best value" has at least three definitions, with different answers:</b></p>
<ul>
<li><b>Threshold</b> (= your idea, and the only one correct as constrained optimization): <code>min cost s.t. score ≥ T</code>. Meaning: "cheapest among models that clear the bar".</li>
<li><b>Score per $</b>: <code>max score/cost</code>. Meaning: "cheapest per point" — but Arena scores carry a ~1200 baseline offset that inflates the numerator, so this <b>almost always picks the cheapest small model</b>. Little practical value.</li>
<li><b>Excess score per $</b>: <code>max (score − baseline)/cost</code>. Marginal value after removing the offset; good for comparing "pay more, gain how much" efficiency.</li>
</ul>
<p>Closest to a purchasing decision is the <b>marginal price</b>: moving from the current tier up one, <code>Δcost / Δscore</code> = dollars per extra point. The tier table computes it for you.</p>

<p><b>3. Five pitfalls that flip conclusions (each has a toggle in the tool):</b></p>
<ol>
<li><b>Overlapping confidence intervals.</b> If the score range is narrower than the CI, rankings inside it are noise. Example: on the HTML board, Inkling 2 Small has only 130 votes (CI ±55); Muse Spark Open ±41.
This tool offers a "strict mode": only accepts a gap where A's CI lower bound &gt; B's CI upper bound; statistically indistinguishable adjacent tiers are <b>merged into one</b> (keeping the cheaper model).</li>
<li><b>Preliminary / low votes.</b> Don't crown a "value champion" from a model with &lt;1000 votes.</li>
<li><b>Cost/Task (P50) is a workload-mix artifact.</b> The same model can have different costs on different boards (Overall / Frontend / Fullstack / HTML / React) because task length and tool-call depth differ.
P50 also ignores the tail: when an agent goes off the rails, P95 can be 5–10× P50. And it only covers token spend — not latency, retry rates, or context-window limits.</li>
<li><b>Dataset truncation.</b> In this scrape, <code>frontend_os</code> and <code>overall_all</code> only cover the high-score segment (the low tail wasn't fully scraped).
Good news: <b>the high-score end of the Pareto frontier is unaffected by missing low-scoring models</b> (a lower-scoring, pricier model can never enter the frontier);
bad news: the global cheapest price and the "excess score/$" baseline skew. Use the paste box at the bottom to fill the gap.</li>
<li><b>Point-in-time.</b> The official API returns 403, so only page snapshots are possible; prices and ranks change weekly. CSV exports carry the date in the filename.</li>
</ol>

<p><b>4. The question you actually want, and where it lives in the tool:</b>
"on a given board, within an acceptable score range, which model has the best value" → that's <b>Threshold mode + the score-range slider</b>:
set <code>lo</code> to your minimum acceptable capability and <code>hi</code> to the ceiling you won't pay extra for; the card gives the answer,
and the step chart tells you "how much more the next tier costs" — more decision-useful than a single champion.</p>

<p><b>5. One counter-intuitive but important reminder:</b> models on the Pareto frontier are <b>mutually undominated</b>; there is no "best one on the frontier".
"Best" depends on your utility function — how fast your marginal utility of score decays, and your budget.
So the right question is not "which has the best value" but "<b>above the minimum score I can accept, how many points does each extra dollar buy — and from which tier does that exchange rate stop being worth it</b>".
The "marginal cost $/pt" column in the tier table is exactly that exchange-rate curve; find its knee.</p>

<p><b>6. Price is a function of time — this version makes "the hour" a first-class variable.</b>
The board's <code>Price $/M</code> is a <b>snapshot of list price at scrape time</b>, and list prices change over time. Two time dependencies are verified:</p>
<ul>
<li><b>Intraday rhythm (peak/off-peak).</b> DeepSeek peak = weekdays 01:00–04:00 and 06:00–10:00 UTC; all other hours (including the whole weekend) are half price.
The annoyance: the board <b>mixes both conventions in one table</b> — <code>V4.1-Flash-20261017</code> is listed at off-peak $0.15/$0.60, while <code>V4.1-Flash-20260910</code> and the <code>V4-Pro</code> family are listed at peak $0.30/$1.20 and $1.32/$3.96. Comparing across rows means comparing one model's peak against another's off-peak.</li>
<li><b>Calendar events (promo expiry).</b> <code>GLM-5.3-Flash</code>'s board price $0.05/$0.18 was a launch promo that <b>ended 2026-09-09</b>; the current price is $0.15/$0.50 (~2.9×). The 11-11 snapshot still uses the promo price, so its $0.15 Cost/Task is really ~$0.44.</li>
</ul>
<p><b>Conversion:</b> <code>Cost/Task = token usage × unit price</code>; usage doesn't change with price, so the correction = scale by the <b>weighted unit-price ratio</b>:
<code>scale = [pin'·(1−w) + pout'·w] ÷ [pin·(1−w) + pout·w]</code>, where <code>w</code> = output token share, default <b>8%</b>
(from the Agent board: median inferred input/output ratio ≈ 11:1 across 14 models; range 3.8–17.9×; adjustable via slider).
DeepSeek's peak/off-peak moves input and output <b>proportionally</b>, so it is insensitive to <code>w</code>; <code>w</code> only matters for corrections like GLM's input ×3 / output ×2.8.</p>
<p><b>Losslessly reversible:</b> every model keeps <code>cRaw</code> (the raw board value); all scenarios are derived from it, and switching toggles off restores it exactly — no "edits drifting from truth".</p>
<p><b>Conclusions actually change with the hour — that's the point:</b> off-peak, DeepSeek's older version is half price and <b>kicks <code>Hy3</code> and <code>MiMo-V2.5</code> off the Pareto frontier</b> (fully dominated);
the T=1500 winner changes from Hy3 $0.04 to DeepSeek-V4.1-Flash-20260910 $0.03; conversely at peak, <code>20261017</code> rises from $0.12 to $0.24.
Chart ③ draws this as a 168-hour weekly <code>C(T)</code> curve: gray bands are peak windows; jumps in the line are champion changes.</p>
<p><b>Three limits of this section:</b> ① scores are a 2026-11-11 snapshot and don't change with time, so the time axis reflects the time-dependence of <b>prices</b>, not of <b>capability</b> (capability also drifts as boards update);
② board costs use P50 usage and <b>exclude cache-hit discounts</b> (DeepSeek cache input: peak $0.006 / off-peak $0.003; Anthropic cache input $0.10–$1.00), so real agent bills can be well below "usage × list price";
③ two <b>uncertain</b> rules (whether V4-Flash also splits peak/off-peak; Mistral Medium 3.5 and GPT-6 Sol being 2× off vs a third-party index) are <b>off by default</b> — tick them only for sensitivity analysis.
The rule table <code>PRICE_EVENTS</code> lives in the source, free to edit — it's just "model name → unit price at two hours".
One of them, <code>gem_dec1</code>, is a <b>future event</b>: Gemini 4 Carbon/Argon have announced a hike from $2/$10 to $4/$20 on 2026-12-01 (cache price $0.10→$0.20);
drag the pricing date into December and you'll see it drop off the <code>overall_all</code> frontier that day, replaced by GPT-6.1 Sol.</p>

<p><b>7. Cache hit rate — the single most impactful variable (default 95%).</b>
Arena's <code>Cost/Task</code> is computed at <b>cache-miss prices</b>, so for agent workloads — where prefixes get re-read constantly — it's a <b>systematic overestimate</b>.
Cache discounts only apply to <b>input</b> tokens; output is always full price:
<code>effective input price = (1−h)·input price·write multiplier + h·input price·cache ratio</code>, where <code>h</code> is the hit rate.
Two easily-missed details: ① <b>cache read prices are stored as a ratio of the input price, not absolute values</b>, so peak/off-peak, promo expiry and future hikes move cache prices automatically
(DeepSeek peak $0.006 → off-peak automatically $0.003; GLM promo $0.01 → $0.03 after);
② <b>write multiplier</b>: Anthropic (5-min tier) and OpenAI (30-min tier) bill cache writes separately at 1.25× input price, and the missed share is paid at the write price,
so at the same 95% hit rate Claude's discount is thinner than DeepSeek's; DeepSeek / Z.ai / Xiaomi / Tencent / Google (implicit cache) / xAI don't charge a write fee.
39 models use published ratios (DeepSeek 2%–3.3%, MiMo 0.8%–2%, Kimi 10%–20%, GLM 18.3%–20%, Hy3 25%, Grok 25%,
Anthropic 2.5%–10%, OpenAI 5%–10%, Gemini 5%, Mistral Large 4 10.3%); the other 48 have no published price → estimated at an industry-typical <b>10%</b> and labeled "est." in the UI,
or flatten everything with "Flat 10%" for a conservative comparison.
<span style="color:var(--dim2)">Cache price sources: DeepSeek's official pricing page; Anthropic / OpenAI / Google / xAI / Moonshot / Z.ai pricing pages
(cross-checked via benchlm.ai, morphllm, sentra.app, maximem.ai, tech-insider, felloai, eesel, layer3labs, getnadir, imisofts,
munderdiffl.in, datastudios.org, aipricing.guru, glm-ai.chat, glm5.app, subconscious.dev, mem0.ai, llm-stats, orcarouter,
requesty.ai, codersera, saascity, alphasignal, truescho, flowtivity, deepseekai.guide); the full comparison table is in the README.</span></p>
<p><b>Three conclusion-level changes cache discounts bring:</b> ① <b>levels</b>: top models generally save 59%–79% (Fable 5.2 $11.04→$4.10, Kimi $0.91→$0.375, MiMo-V2.6-Flash $0.05→$0.011);
② <b>frontier structure</b>: <code>overall_os</code> goes from 7 tiers to 8, with three DeepSeek variants squeezing in;
③ <b>scheduling value gets compressed</b>: the weekly cost amplitude at T=1600 shrinks from 1.67× to <b>1.11×</b> — with cache at 95%, dodging peak hours only saves ~10% more,
so the right order is <b>fix prefix caching first, then talk scheduling</b>.
Also, the "output share" slider goes from irrelevant to the <b>second-most sensitive parameter</b> once cache is on: at the same 95% hit rate,
DeepSeek-20261017 saves 86% at w=2%, 68% at w=8% (default), 55% at w=15%, 40% at w=25%, and only 25% at w=40%
— the longer your outputs, the less cache can rescue. Conversely, if a tier champion's input and output prices <b>both</b> double (like DeepSeek-20261017 at T=1664),
cache can't compress the amplitude — still 2.00× — and that tier's lever is scheduling.</p>`;

$('#sourceBody').innerHTML=`
<p><b>Source:</b> <a href="https://arena.ai/leaderboard/code/webdev" target="_blank" rel="noopener">arena.ai/leaderboard/code/webdev</a> and its sub-boards (frontend / fullstack), scraped <span class="mono">${DATA.scraped}</span>; leaderboard data dated <span class="mono">${DATA.captured}</span>.</p>
<p><b>Availability:</b> pages are publicly readable and scrapeable; but <span class="mono">arena.ai/api/*</span> and <span class="mono">api.arena.ai/*</span> return 403 (Cloudflare + route allowlist) — <b>no public JSON API</b>. So this tool uses an "embedded snapshot + paste-to-extend" design instead of live requests.</p>
<p><b>Field semantics:</b></p>
<ul>
<li><b>Score</b>: Arena's Bradley-Terry-style rating; <span class="mono">+u/−d</span> is the bootstrap 95% confidence interval.</li>
<li><b>Cost/Task (P50)</b>: the <b>median</b> dollar cost of completing one Arena task = measured token usage × the API prices below. <span class="mono">N/A</span> = not published — such models are excluded by default (toggleable).</li>
<li><b>Price $/M</b>: the <b>vendor's first-party API list price</b> (input / output per million tokens) — not a unified Arena-set price, and not the amortized cost of self-hosting. Note: a low Cost/Task doesn't mean a low unit price (it also depends on how many tokens the model emitted).</li>
</ul>
<p><b>Whose prices are these, exactly? (checked item by item)</b></p>
<p>Compared one-by-one against the independent pricing index <a href="https://benchr.org/pricing" target="_blank" rel="noopener">benchr.org/pricing</a> (2026-09-11 snapshot), Arena's <span class="mono">Price $/M</span> equals each vendor's <b>official API list price</b>:
Kimi K3.1 Pro <span class="mono">$2/$10</span>, Kimi K3 <span class="mono">$3/$15</span> (Moonshot); GLM-5.2 / 5.3 <span class="mono">$1.40/$4.40</span> (Z.ai); Claude Opus 5.5 <span class="mono">$4/$20</span>, Sonnet 5.5 <span class="mono">$2/$10</span>, Haiku 5.5 <span class="mono">$0.10/$0.50</span> (Anthropic); GPT-6.1 Sol <span class="mono">$2/$10</span>, Terra <span class="mono">$1/$5</span>, GPT-6 Astra <span class="mono">$10/$50</span> (OpenAI); Grok 4.7 <span class="mono">$2/$6</span>, Gemini 4 Argon <span class="mono">$2/$10</span>; Mistral Large 4 <span class="mono">$0.70/$2.10</span>; MiniMax M3 <span class="mono">$0.30/$1.20</span>; DeepSeek V4-Pro <span class="mono">$1.32/$3.96</span>.</p>
<p><b>Open-source models are also listed at API prices — not what you'd pay self-hosting.</b> Gemma 4 31B <span class="mono">$0.16/$0.47</span>, Granite 4.1 8B <span class="mono">$0.05/$0.10</span>, Hy3 <span class="mono">$0.13/$0.53</span>, Qwen3.8-27B <span class="mono">$0.40/$3</span>, MiMo-V2.6-Flash <span class="mono">$0.14/$0.28</span> — these are the quotes of Google / IBM / Tencent / Alibaba / Xiaomi's <b>own hosted endpoints</b> (each model's link on the board points to those API docs). Open weights ≠ free inference: self-hosting costs are GPU amortization + power + ops, with no mapping to per-token list prices.</p>
<p><b>Cost/Task is computed from measured usage — three internal proofs:</b></p>
<ul>
<li>A model's <span class="mono">Price $/M</span> is <b>identical across all 7 boards</b> in this tool → unit price is a model-level constant;</li>
<li>A model's <span class="mono">Cost/Task</span> is <b>identical across the five WebDev sub-boards</b> (Overall / Frontend / React / Reference-based / Fullstack) but differs on Image-to-WebDev (e.g. DeepSeek-V4.1-Flash-20261017: $0.12 vs $0.10) → usage is aggregated per <b>task category</b>, not per sub-board;</li>
<li>The Agent board also publishes <span class="mono">Output Tokens/Task</span>, from which input volume can be inferred: 14 models infer to 125K–1.27M input tokens, input/output ratios 3.8–17.9× — exactly a multi-turn tool-calling load signature. And <span class="mono">(Max)/(High)/(xHigh)</span> tiers share the <b>same unit price</b> while Cost differs 2–4× (Claude Opus 5.5: $5.66 vs $2.13) — entirely a token-usage difference.</li>
</ul>
<p><b>Three price traps that make conclusions optimistic:</b></p>
<ul>
<li><b>DeepSeek peak/off-peak.</b> The board lists the 20261017 version at <b>off-peak</b> <span class="mono">$0.15/$0.60</span> and the 20260910 version at <b>peak</b> <span class="mono">$0.30/$1.20</span>. Peak = weekdays 01:00–04:00 and 06:00–10:00 UTC; other hours are half price. If your workload can't be scheduled into off-peak, 20261017's $0.12/task doubles to ~$0.24: it still holds the 1664 tier (structure unchanged), but the "1638→1664" marginal price rises from $0.0027/pt to $0.0073/pt while "1664→1687" falls from $0.0343 to $0.0291 — the knee jump shrinks from 12.8× to 4.0×, weakening the urgency to stop there.</li>
<li><b>GLM-5.3-Flash uses an expired launch-promo price</b> <span class="mono">$0.05/$0.18</span>; the promo ended 2026-09-09, current price <span class="mono">$0.15/$0.50</span> (3×), so its $0.15/task is really ~$0.45. It wasn't on the frontier anyway, but similar stale promo prices may inflate other models.</li>
<li><b>No cache discount.</b> DeepSeek cache-hit input <span class="mono">$0.006</span> (peak) / <span class="mono">$0.003</span> (off-peak); Anthropic cache input <span class="mono">$0.10–$1.00</span>. Multi-turn agent workloads hit cache often; real bills can be well below "list × tokens".</li>
</ul>
<p><b>Want your own cost basis?</b> Use the paste box below and replace the <span class="mono">Cost/Task</span> column with your measured bills or self-hosted amortized costs — the parser reads <b>column names</b> and doesn't care where the numbers come from. The frontier you get is <b>yours</b>.</p>
<ul>
<li><b>Rank vs Overall Rank</b>: the former is the rank within this sub-board/license filter; the latter is the all-models overall rank.</li>
<li><b>Preliminary</b>: votes haven't reached the stability threshold; CIs are usually wide.</li>
<li><b>AutoEval</b>: score from automated evaluation rather than human battles — not directly comparable with human-vote scores → excluded by default.</li>
</ul>
<p><b>Limitations of this tool:</b> data is a snapshot, not live; cost covers token spend only; the definition of "value" is yours to choose and different definitions crown different champions; statistical significance is only enforced in strict mode.</p>
<p><b>Compliance:</b> data comes from public pages and is used for personal analysis. Don't scrape at high frequency. If you publish derived conclusions, attribute the data source and scrape date.</p>`;

/* ---------- url state ---------- */
(function(){
  const p=new URLSearchParams(location.search);
  if(p.get('ds')&&DATASETS[p.get('ds')])S.ds=p.get('ds');
  if(p.get('mode'))S.mode=p.get('mode');
  if(p.get('ci'))S.ci=p.get('ci');
  dsSel.value=S.ds; syncSeg($('#mode'),S.mode); syncSeg($('#ci'),S.ci); setModeHint();
  $('#exPrelim').checked=S.exPrelim=p.get('pre')==='1';
  loadDataset(true);
  if(p.get('hr')!=null) S.hour=clamp(+p.get('hr')||0,0,23);
  if(p.get('dow')!=null) S.dow=clamp(+p.get('dow')||0,0,6);
  if(p.get('date')&&/^\d{4}-\d{2}-\d{2}$/.test(p.get('date'))) S.dateISO=p.get('date');
  if(p.get('os')!=null) S.outShare=clamp((+p.get('os')||0)/100,0,1);
  if(p.get('tz')!=null) S.tz=+p.get('tz')||0;
  if(p.get('ch')!=null) S.cacheHit=clamp((+p.get('ch')||0)/100,0,1);
  if(p.get('cs')&&CACHE_SRC[p.get('cs')]) S.cacheSrc=p.get('cs');
  if(p.get('ev')!=null){ const on=new Set(p.get('ev').split(',').filter(Boolean));
    PRICE_EVENTS.forEach(e=>{ S.evState[e.id]=on.has(e.id); }); }
  syncPriceUI();
  if(p.get('lo')&&p.get('hi')){ S.lo=+p.get('lo'); S.hi=+p.get('hi'); }
  /* 首渲延到首帧（布局稳定后再量容器宽）：fresh navigation 下同步首渲会在预布局期量错宽度。
     图表宽渲染在 render 内部，recompute 的数据计算不依赖布局，rAF 只挪渲染时机。 */
  const onResize=()=>{
    if(typeof window==='undefined'||!window.addEventListener) return;
    let t=null;
    window.addEventListener('resize',()=>{ clearTimeout(t); t=setTimeout(()=>{ if(cur)render(); },180); });
  };
  if(typeof requestAnimationFrame==='function')
    requestAnimationFrame(()=>{ recompute(); onResize(); });   // 首帧后再渲：布局稳定，量宽不再错
  else{
    recompute(); onResize();
  }
})();

/* ---------- responsive boot ----------
   手机（≤720px）：答案区已用 CSS order 沉到控制台之前，这里再把控制台分组全部收起，
   需要时展开 —— 首屏只看到 header + 赢家卡 + 图表。宽屏恢复 HTML 里的默认开合状态。
   window/matchMedia 都做了存在性守卫，fake DOM 测试环境直接跳过。 */
(function(){
  const grps=document.querySelectorAll('.panel details.grp');
  grps.forEach(d=>{ d.dataset.dopen=d.hasAttribute('open')?'1':'0'; });
  const method=document.getElementById('method');
  if(typeof matchMedia==='undefined') return;
  const mq=matchMedia('(max-width:720px)');
  const apply=()=>{
    grps.forEach(d=>{ d.open = !mq.matches && d.dataset.dopen==='1'; });
    /* 页面级「Methodology」大折叠：手机同样默认收起，宽屏保持 HTML 的 open */
    if(method) method.open = !mq.matches;
  };
  apply();
  if(mq.addEventListener) mq.addEventListener('change',apply);
  else if(mq.addListener) mq.addListener(apply);
})();

