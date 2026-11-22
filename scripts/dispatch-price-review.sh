#!/usr/bin/env bash
# dispatch-price-review.sh — refresh-data.sh 检出价格跳变（exit 2）时, 自动派「价格核对」task 给 modelprice 项目。
# 功能: diff_report.py 生成价格变化表 → 填 price-review-prompt.template.md → ao dispatch 派发。
# 用法: scripts/dispatch-price-review.sh [--dry]   （--dry 只打印 prompt 不真派）
# 关注点: 依赖 ao CLI（AO_BASE_URL 默认打 Mac 本机 13000 实例, modelprice 项目户口所在实例）;
#         平台不可达/token 失效时 exit 1 —— cron-refresh.sh 调它失败只留日志不阻塞主流程。
set -euo pipefail
cd "$(dirname "$0")/.."

DRY=0; ARGS=(); for a in "$@"; do [[ "$a" == "--dry" ]] && DRY=1 || ARGS+=("$a"); done
AO_BASE_URL="${AO_BASE_URL:-http://127.0.0.1:13000}"
AO=/Users/damo/workspace/agent-orchestrator/scripts/ao

# 模型名含空格（Beam 1.0 501B A23B）, awk 切列必错 — python regex 解析
TABLE=$(python3 scripts/diff_report.py "${ARGS[@]}" 2>/dev/null | python3 -c "
import re, sys
for line in sys.stdin:
    m = re.match(r'^  PRICE_CHANGE (.+?): (\\$\S+ → \\$\S+)', line)
    if m: print(f'| {m.group(1)} | {m.group(2)} |')
")
[[ -n "$TABLE" ]] || { echo "❌ diff 无价格变化, 无需派发"; exit 1; }
DIFF_TABLE="| 模型 | 旧价 | 新价 |
|---|---|---|
$TABLE"

# 多行表含 | 和 / — sed 必炸分隔符, 用 python 做占位符替换
PROMPT=$(python3 -c "
import sys
tpl = open('scripts/price-review-prompt.template.md', encoding='utf-8').read()
table = sys.argv[1]
sys.stdout.write(tpl.replace('{{DIFF_TABLE}}', table))
" "$DIFF_TABLE")
TS=$(date '+%F')

if [[ $DRY -eq 1 ]]; then
  echo "[dry] 将派发如下 prompt（标题: 核对 $TS 榜价格变化）："; echo "$PROMPT" | head -20
  exit 0
fi

OUT=$("$AO" dispatch -p modelprice -t "价格核对 $TS（自动派发）" -m "$PROMPT" --max-turns 500 --effort high 2>&1)
echo "$OUT" | tail -3
echo "$OUT" | grep -q '任务已创建' || { echo "❌ ao dispatch 失败"; exit 1; }
echo "✅ 价格核对 task 已自动派发"
