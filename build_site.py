#!/usr/bin/env python3
"""Build the deployable site artifacts from data/datasets.json.

Usage: python3 build_site.py [domain]     # e.g. python3 build_site.py https://modelprice.damolabs.dev
Emits:  data/v1/all.json (AI-readable dataset), method.html, llms.txt, robots.txt, sitemap.xml
"""
import json, pathlib, sys, datetime, re

ROOT = pathlib.Path(__file__).parent
DOMAIN = (sys.argv[1] if len(sys.argv) > 1 else "https://modelprice.damolabs.dev").rstrip("/")

RAW = json.loads((ROOT / "data" / "datasets.json").read_text())
FIELDS = RAW["fields"]  # n,u,lab,lic,r,or,s,u95,d95,pre,ae,v,c,pin,pout,ctx

BOARD_META = {
    "overall_os":    ("WebDev · Overall (open-source only)", "open-source"),
    "frontend_os":   ("WebDev · Frontend (open-source only)", "open-source"),
    "fullstack_os":  ("WebDev · Fullstack (open-source only)", "open-source"),
    "react_os":      ("WebDev · React (open-source only)", "open-source"),
    "reference_os":  ("WebDev · Reference-based design (open-source only)", "open-source"),
    "img2webdev_os": ("Image-to-WebDev (open-source only)", "open-source"),
    "overall_all":   ("WebDev · Overall (all licenses)", "all"),
}

CACHE_RATIO = {
    'DeepSeek-V4.1-Flash-20261017 (Max)':0.02, 'DeepSeek-V4.1-Flash-20260910 (Max)':0.02,
    'DeepSeek-V4-Flash (High)':0.02, 'DeepSeek-V4-Flash Preview (High)':0.02,
    'DeepSeek-V4-Pro':0.0333, 'DeepSeek-V4-Pro (High, 20260813)':0.0333, 'DeepSeek-V4-Pro Preview (High)':0.0333,
    'Kimi K3.1 Pro (Max)':0.10, 'Kimi K3 (Max)':0.10, 'Kimi K2.6':0.168, 'Kimi K2.7 Code':0.20,
    'GLM-5.3 (Max)':0.186, 'GLM-5.2 (Max)':0.186, 'GLM-5.1':0.186, 'GLM-5.3-Flash':0.20, 'GLM-4.7':0.183,
    'MiMo-V2.6-Flash':0.02, 'MiMo-V2.6-Pro':0.0083, 'MiMo-V2.5-Pro':0.0083,
    'Hy3':0.25,
    'Claude Opus 5.5 (Max)':0.05, 'Claude Sonnet 5.5 (xHigh)':0.05, 'Claude Sonnet 5.5 (High)':0.05,
    'Claude Haiku 5.5 (High)':0.10, 'Claude Opus 5 (Max)':0.10, 'Claude Opus 5 (High)':0.10,
    'Claude Fable 5.2 (xHigh)':0.025, 'Claude Fable 5.1 (Max)':0.025, 'Claude Fable 5 (High)':0.025,
    'GPT-6.1 Sol (Max)':0.05, 'GPT-6.1 Terra (Max)':0.05, 'GPT-6 Sol (Max)':0.10, 'GPT-6 Astra (Max)':0.10,
    'Gemini 4 Argon (High)':0.05, 'Gemini 4 Carbon (High)':0.05, 'Gemini 4 Hydrogen (High)':0.05,
    'Grok 4.7 (xHigh)':0.25, 'Grok 4.6 (High)':0.25,
    'Mistral Large 4':0.103,
}
CACHE_FALLBACK = 0.10

PRICE_EVENTS = [
    {"id":"ds_tod","name":"DeepSeek peak/off-peak pricing","confidence":"verified","default":True,
     "rule":"Peak = weekdays 01:00-04:00 and 06:00-10:00 UTC (2x); all other hours incl. weekends 0.5x",
     "models_affected":["DeepSeek-V4.1-Flash-20261017","DeepSeek-V4.1-Flash-20260910","DeepSeek-V4-Flash family","DeepSeek-V4-Pro family"],
     "source":"DeepSeek official pricing page + 4 independent sources"},
    {"id":"glm_promo","name":"GLM-5.3-Flash launch promo expired","confidence":"verified","default":True,
     "rule":"Before 2026-09-09: $0.05/$0.18; on/after: $0.15/$0.50 (~2.95x). The 2026-11-11 board still lists the promo price.",
     "models_affected":["GLM-5.3-Flash"],
     "source":"benchr.org/pricing (2026-09-11 snapshot, states promo end date)"},
    {"id":"gem_dec1","name":"Gemini 4 Carbon/Argon price hike on 2026-12-01 (announced)","confidence":"verified","default":True,
     "rule":"Before 2026-12-01: $2/$10; on/after: $4/$20; cache read price $0.10 -> $0.20",
     "models_affected":["Gemini 4 Carbon (High)","Gemini 4 Argon (High)"],
     "source":"Google Gemini API pricing page (3 independent indexes agree)"},
    {"id":"ds_v4flash","name":"Whether DeepSeek V4-Flash also splits peak/off-peak","confidence":"uncertain","default":False,
     "rule":"Unverified; V4-Flash is retired. Off by default (sensitivity analysis only).",
     "models_affected":["DeepSeek-V4-Flash (High)","DeepSeek-V4-Flash Preview (High)"],
     "source":"insufficient evidence"},
    {"id":"suspect2x","name":"Two models 2x off vs a third-party index, no promo explanation","confidence":"uncertain","default":False,
     "rule":"Mistral Medium 3.5 ($0.75/$3.75 vs index $1.50/$7.50) and GPT-6 Sol ($1/$5 vs $2/$10). Off by default.",
     "models_affected":["Mistral Medium 3.5","GPT-6 Sol"],
     "source":"benchr.org/pricing comparison"},
]

def row_to_model(r):
    (n,u,lab,lic,rk,ork,s,u95,d95,pre,ae,v,c,pin,pout,ctx) = [r[i] for i in range(16)]
    return {
        "model": n, "lab": lab, "license": lic, "url": u,
        "board_rank": rk, "overall_rank": ork,
        "score": s, "ci95": {"up": u95, "down": d95},
        "preliminary": pre, "auto_eval": ae,
        "votes": v,
        "cost_per_task_p50_usd": c,
        "price_in_per_m_usd": pin, "price_out_per_m_usd": pout,
        "context_window": ctx,
        "cache_read_ratio_of_input": CACHE_RATIO.get(n),
        "cache_write_multiplier": 1.25 if (n.startswith("Claude") or n.startswith("GPT-")) else 1.0,
    }

def frontier_of(models, score_min, score_max):
    """C(T) = min{cost : score >= T}. Tier i reigns [next_tier_score+1 (or score_min), own_score]; top tier upper = score_max."""
    costed = [m for m in models if m["score"] is not None and m["cost_per_task_p50_usd"] is not None]
    costed.sort(key=lambda m: (-m["score"], m["cost_per_task_p50_usd"]))
    tiers, best = [], None
    for m in costed:
        if best is None or m["cost_per_task_p50_usd"] < best:
            tiers.append(m); best = m["cost_per_task_p50_usd"]
    out = []
    for i, m in enumerate(tiers):
        lower = tiers[i+1]["score"] + 1 if i + 1 < len(tiers) else score_min
        upper = score_max if i == 0 else m["score"]
        out.append({
            "tier": i + 1, "model": m["model"], "score": m["score"],
            "ci95": m["ci95"], "cost_per_task_p50_usd": m["cost_per_task_p50_usd"],
            "votes": m["votes"], "preliminary": m["preliminary"], "auto_eval": m["auto_eval"],
            "reigns_score_range": [lower, upper],
            "url": m["url"],
        })
    # marginal price between tiers
    for i in range(len(out) - 1):
        a, b = out[i], out[i + 1]
        b["marginal_to_prev_tier"] = {
            "usd_per_point": round((a["cost_per_task_p50_usd"] - b["cost_per_task_p50_usd"]) / (a["score"] - b["score"]), 5),
            "extra_usd": round(a["cost_per_task_p50_usd"] - b["cost_per_task_p50_usd"], 4),
            "extra_points": a["score"] - b["score"],
        }
    return out

boards = []
for key, d in RAW["datasets"].items():
    models = [row_to_model(r) for r in d["rows"]]
    scored = [m for m in models if m["score"] is not None]
    s_min, s_max = min(m["score"] for m in scored), max(m["score"] for m in scored)
    title, scope = BOARD_META[key]
    boards.append({
        "id": key, "title": title, "license_scope": scope,
        "arena_path": d["path"], "url": f"https://arena.ai/leaderboard/code/{d['path']}",
        "votes_note": d["meta"], "coverage_note": d["note"],
        "score_domain": {"min": s_min, "max": s_max},
        "stats": {"models": d["stats"]["n"], "with_cost": d["stats"]["with_cost"]},
        "frontier": frontier_of(models, s_min, s_max),
        "frontier_method": "C(T) = min{cost : score >= T}; a model joins the frontier only if strictly cheaper than every higher-scoring model. Computed over ALL models with published Cost/Task (no vote/preliminary/AutoEval filters applied). reigns_score_range = the T interval this model wins; floor of the cheapest tier = dataset min score.",
        "models": models,
    })

generated = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
payload = {
    "$schema_note": "Machine-readable export of the cost-quality Pareto frontier computed from arena.ai (LMArena) WebDev leaderboards. Question it answers: for a minimum acceptable Arena Score T, which model has the lowest measured cost per task? Humans: see " + DOMAIN + "/ ; interactive tool: " + DOMAIN + "/",
    "meta": {
        "name": "Arena WebDev Cost-Quality Frontier",
        "version": 1,
        "generated": generated,
        "leaderboard_snapshot": RAW["captured"],
        "scraped": RAW["scraped"],
        "sources": {
            "leaderboards": "arena.ai/leaderboard/code/webdev (+ sub-boards) public pages",
            "machine_readable_leaderboard_data": "https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset (official; use for automated refresh)",
            "prices": "each vendor's first-party API list price (verified vs benchr.org/pricing 2026-09-11 snapshot)",
        },
        "attribution": "Leaderboard data © LMArena (arena.ai). This export reproduces publicly listed scores and costs with added analysis.",
        "cost_basis": "Cost/Task (P50) = median measured token usage of an Arena task x the vendor's list price (cache-miss basis; no cache discount applied).",
        "methodology_url": DOMAIN + "/method.html",
        "interactive_tool_url": DOMAIN + "/",
        "disclaimers": [
            "Scores are a 2026-11-11 snapshot; prices are checked as of 2026-11-14 and change over time.",
            "P50 task cost excludes long-tail (P95 can be 5-10x), latency, retries and non-token fees.",
            "Price events below adjust list prices for verified time dependencies; uncertain rules are listed but flagged.",
            "Cache model: cache read price stored as a ratio of input price; write multiplier 1.25x for Anthropic/OpenAI (Claude*/GPT-*) models, 1.0x otherwise.",
        ],
    },
    "price_events": PRICE_EVENTS,
    "cache_model": {
        "cache_read_ratio_of_input_price": CACHE_RATIO,
        "fallback_ratio_when_unpublished": CACHE_FALLBACK,
        "write_multiplier_rule": "1.25 if model name starts with 'Claude' or 'GPT-', else 1.0",
        "effective_input_price_formula": "(1-h)*pin*wm + h*pin*ratio   # h = hit rate",
    },
    "leaderboards": boards,
}

out_dir = ROOT / "data" / "v1"; out_dir.mkdir(parents=True, exist_ok=True)
(out_dir / "all.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
print("wrote data/v1/all.json", (out_dir / "all.json").stat().st_size, "bytes")
for b in payload["leaderboards"]:
    print(f"  {b['id']:15s} tiers={len(b['frontier'])}  top={b['frontier'][0]['model']}")

# ---------- llms.txt ----------
llms = f"""# {payload['meta']['name']}
> Answers one question with arena.ai (LMArena) WebDev leaderboard data: given a minimum acceptable Arena Score T, which model has the lowest real cost per task? Includes a threshold-based Pareto frontier ("tier ladder"), marginal $/point between tiers, peak/off-peak and promo price corrections, and a cache-hit cost model.

## Data (machine-readable)
- [All data, JSON v1]({DOMAIN}/data/v1/all.json): 7 leaderboards, {sum(b['stats']['models'] for b in payload['leaderboards'])} model rows, computed Pareto frontiers with score ranges and marginal prices, price-event rules, cache ratios. `leaderboards[].frontier` = the tier ladder; `leaderboards[].models` = raw rows.

## Pages
- [Interactive tool]({DOMAIN}/): drag the score threshold, toggle price scenarios and cache hit rate, strict CI mode.
- [Method & data sources]({DOMAIN}/method.html): definitions, formulas, price verification, limitations.
"""
(ROOT / "llms.txt").write_text(llms)

# ---------- robots.txt / sitemap.xml ----------
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n")
today = payload["meta"]["generated"]
urls = [("/", "1.0", "weekly"), ("/method.html", "0.8", "monthly"), ("/data/v1/all.json", "0.5", "weekly")]
sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u, pr, freq in urls:
    sm.append(f"  <url><loc>{DOMAIN}{u}</loc><lastmod>{today}</lastmod><changefreq>{freq}</changefreq><priority>{pr}</priority></url>")
sm.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(sm))

# ---------- method.html ----------
CSS = open(ROOT / "index.html").read()
m = re.search(r"<style>(.*?)</style>", CSS, re.S)
style = m.group(1) if m else ""
method_body = """
<h1>Method &amp; data sources</h1>
<p class="tagline">How the frontier is computed, where every number comes from, and what this tool deliberately does <i>not</i> claim.</p>

<h2>The question</h2>
<p>Comparison sites show prices; leaderboards show scores. This tool joins them and answers a decision-grade question: <b>given the minimum Arena Score you can accept (threshold T), which model has the lowest measured cost per task?</b> Formally <code>C(T) = min{cost : score &ge; T}</code>. Sweeping T downward yields the cost-quality Pareto frontier &mdash; a staircase where each flat segment is the score range one model rules. The table also reports the <b>marginal price</b> of moving up one tier (&Delta;cost/&Delta;score in $/point), which is the number purchasing decisions actually turn on.</p>

<h2>Three definitions of &ldquo;best value&rdquo;</h2>
<ul>
<li><b>Threshold</b> (default): cheapest model with score &ge; T. The only definition that is correct constrained optimization.</li>
<li><b>Score per $</b>: strongly biased toward cheap models because Arena&rsquo;s Bradley-Terry scores carry a ~1200 baseline offset.</li>
<li><b>Excess score per $</b>: subtracts the 1200 floor first; closer to marginal value, still biased.</li>
</ul>

<h2>Data sources &amp; snapshot dates</h2>
<ul>
<li>Scores and Cost/Task: the public <a href="https://arena.ai/leaderboard/code/webdev">arena.ai WebDev leaderboards</a> and sub-boards, snapshot <b>2026-11-11</b> (scraped 2026-11-14). For automated refresh prefer the official machine-readable mirror: <a href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset">lmarena-ai/leaderboard-dataset on Hugging Face</a>.</li>
<li>Prices: each vendor&rsquo;s first-party API list price (input/output per $1M tokens), verified item-by-item against <a href="https://benchr.org/pricing">benchr.org/pricing</a> (2026-09-11 snapshot). Open models are listed at their vendor-hosted API price, not self-hosting cost.</li>
<li>Cost/Task (P50) = median measured token usage of an Arena task &times; list price &mdash; a cache-miss basis. P50 hides the tail (P95 can be 5&ndash;10&times;) and covers token spend only.</li>
</ul>

<h2>Price as a function of time</h2>
<p>List prices change by hour and by calendar. Verified rules applied by default: <b>DeepSeek peak/off-peak</b> (peak = weekdays 01:00&ndash;04:00 &amp; 06:00&ndash;10:00 UTC, 2&times;; otherwise &frac12;&times;) &mdash; the board itself mixes peak-priced and off-peak-priced rows of the same family; <b>GLM-5.3-Flash promo expiry</b> (2026-09-09: $0.05/$0.18 &rarr; $0.15/$0.50); <b>Gemini 4 Carbon/Argon hike on 2026-12-01</b> ($2/$10 &rarr; $4/$20). Uncertain rules (DeepSeek V4-Flash peak split; two models 2&times; off vs a third-party index) are included but off by default.</p>

<h2>Cache model</h2>
<p>Leaderboard costs assume 0% cache hits, which systematically overestimates agent workloads. Effective input price = <code>(1&minus;h)&middot;pin&middot;wm + h&middot;pin&middot;ratio</code>; output is never discounted. Cache read prices are stored as a ratio of list input price (DeepSeek 2&ndash;3.3%, MiMo 0.8&ndash;2%, Kimi 10&ndash;20%, GLM 18&ndash;20%, Hy3/Grok 25%, Anthropic 2.5&ndash;10%, OpenAI 5&ndash;10%, Gemini 5%, Mistral 10.3%; unknown &rarr; 10% estimate, labeled). Write multiplier <code>wm</code> = 1.25&times; for Anthropic/OpenAI (model names starting Claude/GPT-), else 1.0&times;. At h=95% top models drop 59&ndash;79% in effective cost and the frontier itself re-orders.</p>

<h2>Strict CI mode</h2>
<p>Adjacent tiers whose 95% CIs overlap are merged (cheaper model kept) so you don&rsquo;t pay for statistical noise. Note this is a conservative <i>overlap screen</i>, not a formal test of score differences.</p>

<h2>Limitations</h2>
<ul>
<li>Scores are a snapshot; capability drifts as boards update. Prices drift weekly.</li>
<li>P50 task cost is a workload mix; your workload differs. Use the paste-to-extend feature with your own bills.</li>
<li>The all-license board covers only its top 41 rows; the open-source boards are complete.</li>
<li>Confidence: every number here traces to a public page; corrections carry per-rule sources in the tool.</li>
</ul>

<h2>Attribution &amp; compliance</h2>
<p>Leaderboard data &copy; LMArena (arena.ai). This is an independent analysis of publicly listed numbers; no affiliation with arena.ai. Don&rsquo;t scrape arena.ai at high frequency &mdash; use the Hugging Face dataset for automation. If you publish derived conclusions, attribute the source and snapshot dates.</p>
<p><a href="/">← Back to the tool</a> · <a href="/data/v1/all.json">JSON export</a> · <a href="/llms.txt">llms.txt</a></p>
"""
canonical = f'<link rel="canonical" href="{DOMAIN}/method.html">'
method_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Method &amp; Data Sources — Arena Leaderboard Value Analyzer</title>
<meta name="description" content="How the cost-quality Pareto frontier is computed from arena.ai WebDev leaderboards: data sources, price verification, peak/off-peak rules, cache model, and limitations.">
{canonical}
<style>{style}</style>
</head>
<body><div class="wrap" style="max-width:860px">
{method_body}
</div></body></html>"""
(ROOT / "method.html").write_text(method_html)
print("wrote method.html, llms.txt, robots.txt, sitemap.xml  (domain:", DOMAIN + ")")
