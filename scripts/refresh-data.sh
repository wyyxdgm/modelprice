#!/usr/bin/env bash
# refresh-data.sh — modelprice 数据一键刷新（纯程序, 无 AI 参与）
# 链路: browse(真浏览器过 CF) 抓 arena.ai RSC payload → gen_raw_md → parse → diff 报告
#       → build → 64 条回归 → 自动 commit → deploy → 线上冒烟
# 用法: scripts/refresh-data.sh [--no-deploy] [--no-commit]
# 前置（全部已验证 2026-11-22）:
#   · Mac 本机 + gstack browse daemon 的 Chrome 在跑（headless/其它机器过不了 Cloudflare）
#   · arena.ai 首次访问若弹 CF 挑战, 脚本会等待自动通过; 长时间不过 = 需人工开一次页面
# 退出码: 0=全绿无价格跳变  2=全绿但有价格/榜单跳变（需人工核对 PRICE_EVENTS）  1=失败
# 单板手工重抓: browse eval "$(sed s|__BOARD_URL__|/leaderboard/code/webdev| scripts/arena_extract.js)"
set -euo pipefail
cd "$(dirname "$0")/.."

DEPLOY=1; COMMIT=1
for a in "$@"; do case "$a" in --no-deploy) DEPLOY=0;; --no-commit) COMMIT=0;; esac; done

BOARDS=(  # SSR 路由:抓取名（gen_raw_md.py 按 DATASETS 生成 8 个 md; overall 拆 overall_os/overall_all）
  "/leaderboard/code/webdev:overall"
  "/leaderboard/code/webdev/frontend:frontend"
  "/leaderboard/code/webdev/fullstack:fullstack"
  "/leaderboard/code/webdev/react:react"
  "/leaderboard/code/webdev/reference-based-design:reference"
  "/leaderboard/code/image-to-webdev:img2webdev"
  "/leaderboard/image/text-to-image:t2i"
)
SCRATCH=scripts/.scrape
DOMAIN=https://modelprice.damolabs.app
step(){ echo "── $*"; }

step "① browse 检活（Mac Chrome daemon）"
if ! browse eval '1+1' >/dev/null 2>&1; then
  echo "❌ browse 不可达 — 需要 Mac 本机 + gstack Chrome 在跑"; exit 1
fi

step "② 打开 arena.ai 榜单页（过 Cloudflare）+ 抓首板"
browse newpage 'https://arena.ai/leaderboard/code/webdev' >/dev/null 2>&1 || true
mkdir -p "$SCRATCH"
ok=0
for i in $(seq 1 8); do
  JS=$(sed 's|__BOARD_URL__|/leaderboard/code/webdev|' scripts/arena_extract.js)
  if browse eval "$JS" > "$SCRATCH/overall.json" 2>/dev/null \
     && python3 -c "
import json,sys
d=json.load(open('$SCRATCH/overall.json')); inner=json.loads(d['result'])
sys.exit(0 if inner.get('rows') else 1)" 2>/dev/null; then ok=1; break; fi
  echo "   CF 挑战未过 / 限流, 等待 30s（$i/8）…"; sleep 30
done
[[ $ok -eq 1 ]] || { echo "❌ arena.ai 数据 240s 内不可得（CF 挑战需人工过一次）"; exit 1; }
echo "   ✓ 会话有效（overall 已抓）"; sleep 10   # 连续 fetch 会触发 arena 限流, 板间必须间隔

step "③ 抓取其余 5 个 SSR 路由 → $SCRATCH/"
for B in "${BOARDS[@]:1}"; do
  url="${B%%:*}"; name="${B##*:}"
  JS=$(sed "s|__BOARD_URL__|$url|" scripts/arena_extract.js)
  if ! browse eval "$JS" > "$SCRATCH/$name.json" 2>/dev/null; then echo "❌ $name eval 失败"; exit 1; fi
  python3 -c "
import json,sys
d=json.load(open('$SCRATCH/$name.json')); inner=json.loads(d['result'])
if 'error' in inner or not inner.get('rows'): sys.exit('❌ $name 抓取无效: '+str(inner.get('error','no rows')))
print(f\"   ✓ $name rows={inner['rowCount']} cost={inner['costEntryCount']}\")" || exit 1
  sleep 10
done

step "④ 生成 raw/*.md + parse → datasets.json"
python3 scripts/gen_raw_md.py --scrape-dir "$SCRATCH"
python3 parse.py 2>&1 | tail -8

step "⑤ 数据跳变 diff（对照 git HEAD）"
PRICE_CHANGES=$(python3 scripts/diff_report.py || true)
echo "$PRICE_CHANGES"
EXIT_CODE=0
echo "$PRICE_CHANGES" | grep -q 'PRICE_CHANGE' && { echo "⚠️  检测到价格跳变 — PRICE_EVENTS 需人工/AI 核对（src/js/03-pricing.js）"; EXIT_CODE=2; }

step "⑥ 构建 + 64 条回归"
python3 scripts/build_page.py >/dev/null
python3 build_site.py "$DOMAIN" >/dev/null
python3 test/build.py >/dev/null 2>&1
node --max-old-space-size=4096 test/run.js 2>&1 | tail -1

step "⑦ commit 数据更新"
if [[ $COMMIT -eq 1 ]]; then
  git add raw/ data/datasets.json
  if ! git diff --cached --quiet; then
    SUMMARY=$(echo "$PRICE_CHANGES" | head -1)
    git commit -m "data: 榜单刷新（captured=$(python3 -c "import json;print(json.load(open('data/datasets.json'))['captured'])")）

$SUMMARY
撤销: git reset HEAD~1 -- raw/ data/" --quiet
    echo "   ✓ $(git log -1 --format='%h %s' | head -1)"
  else
    echo "   - 数据无变化, 跳过 commit"
  fi
fi

step "⑧ 部署 + 线上冒烟"
if [[ $DEPLOY -eq 1 ]]; then
  bash scripts/deploy.sh 2>&1 | tail -2
else
  echo "   - 跳过（--no-deploy）"
fi

echo "🎉 刷新完成（captured=$(python3 -c "import json;print(json.load(open('data/datasets.json'))['captured'])")）"
exit $EXIT_CODE
