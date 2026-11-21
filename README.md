# ModelPrice — Arena Leaderboard Value Analyzer

Public, static, single-page tool answering one question with arena.ai (LMArena) WebDev leaderboard data:

> **Given the minimum Arena Score I can accept, which model is the cheapest that clears it — and how much does the next tier cost per point?**

Interactive: https://modelprice.damolabs.app · Method: `/method.html` · Machine-readable export for AI agents: `/data/v1/all.json` + `/llms.txt`

## What it computes

`C(T) = min{cost : score ≥ T}` — the cost-quality Pareto frontier as a tier ladder, with marginal $/point between tiers. On top of raw board data it corrects three systematic biases:

1. **Time-dependent prices** — DeepSeek peak/off-peak (the board mixes both conventions in one table), expired promos (GLM-5.3-Flash), announced hikes (Gemini 2026-12-01), rendered as a 168-hour weekly cost curve.
2. **Cache-miss bias** — board costs assume 0% cache hits; a cache model (published read-ratios, 1.25× write multiplier for Claude/GPT-) lets you see effective cost at any hit rate (95% default).
3. **Statistical noise** — strict mode merges tiers whose 95% CIs overlap so you don't pay for noise.

## Files

| File | What |
|---|---|
| `index.html` | The whole tool: single file, data embedded, zero dependencies, works offline |
| `raw/*.md` | Scrape provenance — arena.ai leaderboard tables as captured (source of truth) |
| `parse.py` | `raw/*.md` → `data/datasets.json` → auto-reinjects into `index.html` |
| `build_site.py [domain]` | Builds deployable artifacts: `data/v1/all.json` (AI-readable frontier export), `method.html`, `llms.txt`, `robots.txt`, `sitemap.xml`. Re-run with the final domain before deploy. |
| `test/` | 61 regression cases: brute-force tier verification over all integer thresholds (20282 judgments), JS/Python parser cross-check (5408 cells), price/cache engines, render smoke tests |
| `README.zh.md` | Original Chinese deep-dive (methodology, evidence, known gaps) — still accurate |

## Update the data

```bash
# 1. Save a fresh arena.ai leaderboard table into raw/<board>.md (same column layout)
# 2. Re-parse + reinject into index.html:
python3 parse.py
# 3. Rebuild site artifacts (pass the live domain so llms.txt/sitemap get absolute URLs):
python3 build_site.py https://modelprice.damolabs.app
# 4. Regression suite (builds test/run.js from the served HTML first):
python3 test/build.py && node --max-old-space-size=4096 test/run.js
```

For automated refresh, the official machine-readable leaderboard mirror is
[lmarena-ai/leaderboard-dataset on Hugging Face](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) — prefer it over scraping (arena.ai has no public JSON API; `/api/*` returns 403).

## Deploy

Static hosting — any of: nginx on an existing box, Cloudflare Pages, Netlify. Serve the repo root; no build step, no server code. Price events / cache ratios live in `index.html` (`PRICE_EVENTS`, `CACHE_RATIO`) and are mirrored in `build_site.py` — keep both in sync when editing.

## Attribution

Leaderboard data © LMArena (arena.ai). Prices from vendor pricing pages, verified against benchr.org/pricing. Independent analysis, no affiliation.
