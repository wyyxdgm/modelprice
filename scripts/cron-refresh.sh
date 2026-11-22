#!/usr/bin/env bash
# cron-refresh.sh — launchd 定时入口（refresh-data.sh 的定时 wrapper）。
# 功能: 补全 PATH（launchd 环境无 nvm bin）→ 跑 refresh-data.sh → 日志落
#       ~/Library/Logs/modelprice-refresh.log → Mac 通知中心弹结果。
# 关注点: 退出码透传（0=干净 2=有价格跳变需核对 PRICE_EVENTS 1=失败）;
#         browse 依赖 gstack Chrome daemon 在跑 —— Mac 重启后 Chrome 没自动开则本轮失败,
#         日志里会有 browse 不可达 字样。卸载: launchctl bootout gui/$(id -u)
#         ~/Library/LaunchAgents/app.damolabs.modelprice-refresh.plist
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$HOME/Library/Logs/modelprice-refresh.log"

{
  echo "=== $(date '+%F %T') refresh start"
  bash "$DIR/refresh-data.sh"
  code=$?
  echo "=== $(date '+%F %T') exit=$code"
  echo
} >> "$LOG" 2>&1

case $code in
  0) MSG="完成, 无价格变化";;
  2) MSG="完成, 有价格跳变 — PRICE_EVENTS 需核对";;
  *) MSG="失败, 看 $LOG";;
esac
osascript -e "display notification \"$MSG\" with title \"ModelPrice 数据刷新\" sound name \"Glass\"" 2>/dev/null || true
exit $code
