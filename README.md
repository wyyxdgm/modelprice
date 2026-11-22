# ModelPrice — Arena Leaderboard Value Analyzer

Public, static, single-page tool answering one question with arena.ai (LMArena) leaderboard data (WebDev code boards + Text-to-Image):

> **Given the minimum Arena Score I can accept, which model is the cheapest that clears it — and how much does the next tier cost per point?**

Two tabs: **① Best value ranking** (default — direct ranking + verdict card under your quality bar & daily-task profile: who is cheapest per task, by how many points, for how many $; switch peak/off-peak and capability boards incl. per-image Text-to-Image) and **② Tiers & charts** (winner card, step chart, scatter, weekly curve, tier & model tables).

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
  i18n/<locale>.json      per-locale dictionaries (nested, flattened to dot paths at build time; 350 keys ×5, key sets must stay identical — test enforces)
  i18n/boot|source|method/<locale>.html   long-form bodies (in-page methodology / sources / method page), filled into the dict at build time
  js/0N-*.js              app modules in load order (all locales share one copy; user-visible strings go through T()/TF() against the inline I18N dict):
    01-util.js    02-data.js    03-pricing.js    04-core.js    05-timeline.js
    06-scenarios.js    07-render.js    08-interact.js    10-rank.js    09-boot.js
data/datasets.json      parse.py output (the numbers)
raw/*.md                scrape provenance — arena.ai tables as captured (source of truth)
scripts/build_page.py   src/ + data → dist/index.html (en) + dist/<locale>/index.html ×5 + dist/assets/
build_site.py [domain]  dist/data/v1/all.json + method.html ×5 + llms.txt + robots.txt + sitemap.xml (全语言互指)
parse.py                raw/*.md → data/datasets.json
scripts/deploy.sh       build → rsync dist/ → wd → smoke checks
test/                   64 regression cases (see below)
dist/                   build output (gitignored — rebuild with scripts/build_page.py)
docs/deploy/            nginx vhost (CSP: script-src 'self', JS/CSS are external files)
```

## Update the data

```bash
# One-shot (2026-11-22): scrape arena.ai via the real browser (Cloudflare-safe) → raw/*.md →
# parse → diff report → build → 64-case regression → auto-commit → deploy → smoke.
# Exit 0 = clean, 2 = green but price changes detected (PRICE_EVENTS need review), 1 = failed.
scripts/refresh-data.sh            # add --no-deploy / --no-commit to skip stages
```

Requirements: Mac host with the gstack browse daemon Chrome running (headless/other hosts can't pass Cloudflare; arena rate-limits rapid fetches — the script spaces requests 10 s apart). Manual fallback:

```bash
# 1. Scrape one board into scripts/.scrape/<name>.json (browser session must be past the challenge):
browse eval "$(sed 's|__BOARD_URL__|/leaderboard/code/webdev|' scripts/arena_extract.js)"
# 2. Regenerate raw/*.md from scrape JSON, then parse → datasets.json:
python3 scripts/gen_raw_md.py && python3 parse.py
# 3. Rebuild everything into dist/ (pass the live domain so llms.txt/sitemap get absolute URLs):
python3 scripts/build_page.py
python3 build_site.py https://modelprice.damolabs.app
# 4. Regression suite (builds test/run.js from the served HTML first, falls back to dist/):
python3 test/build.py && node --max-old-space-size=4096 test/run.js
# 5. Local preview (one-off server; render probe with a real browser):
python3 -m http.server 8080 -d dist    # Ctrl-C when done
```

**Price-event review** (the only non-programmatic step): `scripts/diff_report.py` lists models whose board price changed since the last commit — those are PRICE_EVENTS candidates. Verify against the vendor pricing page, then update `PRICE_EVENTS` in `src/js/03-pricing.js` + its mirror in `build_site.py` + the `ev.*` strings in all five `src/i18n/<locale>.json` dicts. Rules are matched against the exact listed price, so a rule whose "board price" no longer matches must be retired (see the glm_promo retirement note, 2026-11-22).

## Test suite

`python3 test/build.py` assembles `test/run.js` by taking the served page (HTTP `127.0.0.1:8080` first, `dist/index.html` fallback), extracting the `<script id="DATA">` block and the `/assets/js/*.js` files in reference order, then concatenating fake-DOM harness + app + cases. The 64 cases assert: brute-force winner verification over every integer threshold on all 8 boards (3347 thresholds, t2i included), tier-boundary continuity (25971 per-threshold judgments), strict-CI merging, peak/off-peak + promo + future-hike price engine, cache arithmetic vs. hand-computed formula, the best-value ranking profile formula (write-multiplier 1.25×, cache 95%, DeepSeek off-peak exactly ×0.5), JS `parsePasted()` ≡ Python `parse.py` cross-check (6832 cells over 427 rows), and full render-chain smoke tests. **Any UI/render change must keep all 64 green.**

## Deploy

`scripts/deploy.sh` builds `dist/`, `rsync --delete` it to `wd:/www/wwwroot/modelprice.damolabs.app/`, then runs smoke checks (root + 4 locale homes + 5 method pages all 200, page structure incl. rankView tab, CSP header, all.json boards=8 models=427 with the t2i board, zh title/hreflang/lang-nav spot checks). `--verify-only` skips the deploy. Price events / cache ratios live in `src/js/03-pricing.js` (`PRICE_EVENTS`, `CACHE_RATIO`) and are mirrored in `build_site.py` — keep both in sync when editing.

## Attribution

Leaderboard data © LMArena (arena.ai). Prices from vendor pricing pages, verified against benchr.org/pricing. Independent analysis, no affiliation.

**11-20 board caveat** (checked 2026-11-22): of the 8 models whose board price changed on 11-20, 6 now match the OpenRouter aggregator rate instead of the vendor's official price (Qwen3.5-397B-A17B, Kimi K2.7 Code, MiMo-V2.5-Pro, Hy3 preview, GLM-4.7, GLM-5.3-Flash) with no vendor price-change announcement. Registered as 6 `conf:'suspected'` events (off by default); Hy3 GA (= Tencent official ¥1/¥4 converted) and Beam 1.0 (no published vendor rate card) were verified and intentionally not registered. Per-model evidence lives in the `PRICE_EVENTS` block of `src/js/03-pricing.js`.
