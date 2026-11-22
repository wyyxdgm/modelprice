# ModelPrice — Arena Leaderboard Value Analyzer

Public, static, single-page tool answering one question with arena.ai (LMArena) WebDev leaderboard data:

> **Given the minimum Arena Score I can accept, which model is the cheapest that clears it — and how much does the next tier cost per point?**

Interactive: https://modelprice.damolabs.app · Method: `/method.html` · Machine-readable export for AI agents: `/data/v1/all.json` + `/llms.txt`

## What it computes

`C(T) = min{cost : score ≥ T}` — the cost-quality Pareto frontier as a tier ladder, with marginal $/point between tiers. On top of raw board data it corrects three systematic biases:

1. **Time-dependent prices** — DeepSeek peak/off-peak (the board mixes both conventions in one table), expired promos (GLM-5.3-Flash), announced hikes (Gemini 2026-12-01), rendered as a 168-hour weekly cost curve.
2. **Cache-miss bias** — board costs assume 0% cache hits; a cache model (published read-ratios, 1.25× write multiplier for Claude/GPT-) lets you see effective cost at any hit rate (95% default).
3. **Statistical noise** — strict mode merges tiers whose 95% CIs overlap so you don't pay for noise.

## Repo layout (2026-11-22 restructure)

```
src/                    ← editable sources (git-tracked)
  templates/index.html    page skeleton; __DATA__ placeholder filled at build time
  css/style.css           all styles (desktop ≥1240 two-col · tablet · ≤720 mobile)
  js/0N-*.js              app modules in load order:
    01-util.js    02-data.js    03-pricing.js    04-core.js    05-timeline.js
    06-scenarios.js    07-render.js    08-interact.js    09-boot.js
data/datasets.json      parse.py output (the numbers)
raw/*.md                scrape provenance — arena.ai tables as captured (source of truth)
scripts/build_page.py   src/ + data → dist/index.html + dist/assets/
build_site.py [domain]  dist/data/v1/all.json + method.html + llms.txt + robots.txt + sitemap.xml
parse.py                raw/*.md → data/datasets.json
scripts/deploy.sh       build → rsync dist/ → wd → smoke checks
test/                   61 regression cases (see below)
dist/                   build output (gitignored — rebuild with scripts/build_page.py)
docs/deploy/            nginx vhost (CSP: script-src 'self', JS/CSS are external files)
```

## Update the data

```bash
# 1. Save a fresh arena.ai leaderboard table into raw/<board>.md (same column layout)
# 2. Re-parse:
python3 parse.py
# 3. Rebuild everything into dist/ (pass the live domain so llms.txt/sitemap get absolute URLs):
python3 scripts/build_page.py
python3 build_site.py https://modelprice.damolabs.app
# 4. Regression suite (builds test/run.js from the served HTML first, falls back to dist/):
python3 test/build.py && node --max-old-space-size=4096 test/run.js
# 5. Local preview (one-off server; render probe with a real browser):
python3 -m http.server 8080 -d dist    # Ctrl-C when done
```

## Test suite

`python3 test/build.py` assembles `test/run.js` by taking the served page (HTTP `127.0.0.1:8080` first, `dist/index.html` fallback), extracting the `<script id="DATA">` block and the `/assets/js/*.js` files in reference order, then concatenating fake-DOM harness + app + cases. The 61 cases assert: brute-force winner verification over every integer threshold on all 7 boards (20282 judgments), tier-boundary continuity, strict-CI merging, peak/off-peak + promo + future-hike price engine, cache arithmetic vs. hand-computed formula, JS `parsePasted()` ≡ Python `parse.py` cross-check (5408 cells), and full render-chain smoke tests. **Any UI/render change must keep all 61 green.**

## Deploy

`scripts/deploy.sh` builds `dist/`, `rsync --delete` it to `wd:/www/wwwroot/modelprice.damolabs.app/`, then runs smoke checks (9 URLs 200, page structure, CSP header, all.json boards=7 models=338). `--verify-only` skips the deploy. Price events / cache ratios live in `src/js/03-pricing.js` (`PRICE_EVENTS`, `CACHE_RATIO`) and are mirrored in `build_site.py` — keep both in sync when editing.

## Attribution

Leaderboard data © LMArena (arena.ai). Prices from vendor pricing pages, verified against benchr.org/pricing. Independent analysis, no affiliation.
