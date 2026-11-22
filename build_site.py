#!/usr/bin/env python3
"""Build the deployable site artifacts from data/datasets.json.

Usage: python3 build_site.py [domain]     # e.g. python3 build_site.py https://modelprice.damolabs.app
Emits into dist/:  data/v1/all.json (AI-readable dataset), method.html, llms.txt, robots.txt, sitemap.xml
页面本身（dist/index.html + assets/）由 scripts/build_page.py 负责。
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

out_dir = ROOT / "dist" / "data" / "v1"; out_dir.mkdir(parents=True, exist_ok=True)
(out_dir / "all.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
print("wrote dist/data/v1/all.json", (out_dir / "all.json").stat().st_size, "bytes")
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
(ROOT / "dist" / "llms.txt").write_text(llms)

# ---------- robots.txt / sitemap.xml（全语言 URL + xhtml:link alternate 互指） ----------
(ROOT / "dist" / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n")
today = payload["meta"]["generated"]
XHTML_NS = 'xmlns:xhtml="http://www.w3.org/1999/xhtml"'
LOCALES = ["en", "zh", "ja", "ko", "fr"]

def locale_root(lc):
    return f"{DOMAIN}/" if lc == "en" else f"{DOMAIN}/{lc}/"

def locale_method(lc):
    return f"{DOMAIN}/method.html" if lc == "en" else f"{DOMAIN}/{lc}/method.html"

def alternates(loc):
    """一个 <url> 里的全语言互指（含 x-default→根英文）。loc = 本条 URL。"""
    out = []
    for x in LOCALES:
        out.append(f'  <xhtml:link rel="alternate" hreflang="{x}" href="{locale_root(x)}"/>')
    out.append(f'  <xhtml:link rel="alternate" hreflang="x-default" href="{locale_root("en")}"/>')
    return "\n".join(out)

sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" {XHTML_NS}>']
# 每个语言目录一条（首页）
for lc in LOCALES:
    u = locale_root(lc)
    sm.append(f'  <url><loc>{u}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>{"1.0" if lc=="en" else "0.9"}</priority>\n{alternates(u)}\n  </url>')
# 每个语言的 method 页一条（互指同一组语言首页——Google 接受同页互指，这里互指首页组）
for lc in LOCALES:
    u = locale_method(lc)
    sm.append(f'  <url><loc>{u}</loc><lastmod>{today}</lastmod><changefreq>monthly</changefreq><priority>{"0.8" if lc=="en" else "0.7"}</priority>\n{alternates(locale_root(lc))}\n  </url>')
# 数据导出一条（语言无关）
sm.append(f'  <url><loc>{DOMAIN}/data/v1/all.json</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>')
sm.append("</urlset>")
(ROOT / "dist" / "sitemap.xml").write_text("\n".join(sm))

# ---------- method.html（每 locale 一份；正文 = src/i18n/method/<locale>.html） ----------
style = (ROOT / "src" / "css" / "style.css").read_text(encoding="utf-8")
sys.path.insert(0, str(ROOT / "scripts"))
from build_page import flatten, LOCALES as PAGE_LOCALES, LANG_NAMES

LOCALES = PAGE_LOCALES  # 单一事实：locale 清单来自 build_page.py

def build_method(lc, flat):
    body = (ROOT / "src" / "i18n" / "method" / f"{lc}.html").read_text(encoding="utf-8")
    root_rel = locale_root(lc).removeprefix(DOMAIN)
    body = body.replace("%ROOT%", root_rel)
    links = "".join(
        f'<link rel="alternate" hreflang="{x}" href="{locale_root(x)}">' for x in LOCALES
    ) + f'<link rel="alternate" hreflang="x-default" href="{locale_root("en")}">' + \
        f'<link rel="canonical" href="{locale_method(lc)}">'
    nav = "".join(
        f'<a data-locale-path="{locale_root(x).removeprefix(DOMAIN)}" href="{locale_root(x).removeprefix(DOMAIN)}"'
        + (' class="on"' if x == lc else "") + f' hreflang="{x}">{LANG_NAMES[x]}</a>'
        for x in LOCALES
    )
    nav = f'<nav class="lang" aria-label="Language">{nav}</nav>'
    return f"""<!DOCTYPE html>
<html lang="{lc}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{flat['method.title']}</title>
<meta name="description" content="{flat['method.desc']}">
{links}
<style>{style}</style>
</head>
<body><div class="wrap" style="max-width:860px">
{nav}
{body}
</div></body></html>"""

for lc in LOCALES:
    mf = ROOT / "src" / "i18n" / "method" / f"{lc}.html"
    if not mf.exists():
        print(f"skip method locale={lc} (src/i18n/method/{lc}.html 不存在)")
        continue
    flat = flatten(json.loads((ROOT / "src" / "i18n" / f"{lc}.json").read_text(encoding="utf-8")))
    html = build_method(lc, flat)
    out = (ROOT / "dist" / "method.html") if lc == "en" else (ROOT / "dist" / lc / "method.html")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}  {out.stat().st_size:,} bytes (locale={lc})")
print("wrote llms.txt, robots.txt, sitemap.xml  (domain:", DOMAIN + ")")
