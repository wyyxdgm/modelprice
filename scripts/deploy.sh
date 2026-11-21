#!/usr/bin/env bash
# deploy.sh — modelprice.damolabs.app 部署+冒烟（纯静态；照 autorev deploy-games.sh 模式精简）
# 用法：scripts/deploy.sh [--verify-only]
#   默认          rsync 到 wd + 冒烟
#   --verify-only 不部署，只对线上跑冒烟清单
# 环境变量 SMOKE_RESOLVE=<ip>：冒烟 curl 全部加 --resolve（本机 DNS 负缓存时绕过解析）
# 前置（一次性，已随 2026-11-21 首次上线完成）：
#   DNS  NameSilo A modelprice.damolabs.app -> <DEPLOY-SERVER-IP>
#   SSL  ssh wd '~/.acme.sh/acme.sh --issue --dns dns_namesilo -d modelprice.damolabs.app --server letsencrypt'
#        ssh wd '~/.acme.sh/acme.sh --install-cert -d modelprice.damolabs.app --ecc
#                --key-file /var/www/ssl/modelprice.damolabs.app.key
#                --fullchain-file /var/www/ssl/modelprice.damolabs.app.pem
#                --reloadcmd "nginx -s reload"'
#   vhost scp docs/deploy/modelprice.damolabs.app.conf wd:/www/server/nginx/conf/vhost/ && nginx -s reload
# 回滚（各自独立可撤）：
#   ssh wd 'rm /www/server/nginx/conf/vhost/modelprice.damolabs.app.conf && nginx -t && nginx -s reload'
#   ssh wd '~/.acme.sh/acme.sh --uninstall-cert -d modelprice.damolabs.app --ecc && rm -f /var/www/ssl/modelprice.damolabs.app.{pem,key}'
#   NameSilo API dnsDeleteRecord（host=modelprice）
set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="wd:/www/wwwroot/modelprice.damolabs.app/"
mode="${1:-deploy}"

if [[ "$mode" != "--verify-only" ]]; then
  # 部署文件 = 站点产物本体（排除仓内开发件：raw 数据源 / test / build 脚本 / README / docs）
  rsync -az --delete \
    --exclude '.git/' --exclude 'raw/' --exclude 'test/' --exclude 'docs/' \
    --exclude 'scripts/' --exclude 'README.md' --exclude 'README.zh.md' \
    --exclude 'build_site.py' --exclude 'parse.py' --exclude '.DS_Store' \
    ./ "$TARGET" && echo "✅ rsync → $TARGET"
fi

fail=0
smoke_curl() {
  if [[ -n "${SMOKE_RESOLVE:-}" ]]; then
    curl --resolve "modelprice.damolabs.app:443:$SMOKE_RESOLVE" "$@"
  else
    curl "$@"
  fi
}
check() { local code; code=$(smoke_curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$1") || true; [[ "$code" == "$2" ]] || { echo "❌ $3: $code (期望 $2)"; fail=1; } } || true
B=https://modelprice.damolabs.app

# ① 验收清单：首页 / method / all.json / llms.txt / robots.txt / sitemap 全 200
check "$B/" 200 home
check "$B/method.html" 200 method
check "$B/data/v1/all.json" 200 alljson
check "$B/llms.txt" 200 llms
check "$B/robots.txt" 200 robots
check "$B/sitemap.xml" 200 sitemap

# ② 首页 title 含工具名（EN 工具页本体）
title=$(smoke_curl -s --max-time 20 "$B/" | grep -o '<title>[^<]*</title>' | head -1) || true
[[ "$title" == *"Arena Leaderboard Value Analyzer"* ]] || { echo "❌ 首页 title 不含工具名: $title"; fail=1; }

# ③ all.json 可解析且 boards=7、models=338
js=$(smoke_curl -s --max-time 20 "$B/data/v1/all.json")
echo "$js" | python3 -c "
import json,sys
d=json.load(sys.stdin)
bs=d['leaderboards'] if 'leaderboards' in d else d.get('boards',[])
n=len(bs)
m=sum(len(b.get('models',[])) for b in bs)
print(f'  all.json: boards={n} models={m}')
sys.exit(0 if n==7 and m==338 else 1)
" || { echo "❌ all.json 解析/计数不符（期望 boards=7 models=338）"; fail=1; }

# ④ 证书链无告警（curl -v 无 SSL error 即通过，--fail 挂了会非零）
smoke_curl -s --max-time 20 -o /dev/null "$B/" || { echo "❌ TLS/请求失败"; fail=1; }

# ⑤ 产物内绝对 URL 指向最终域名（防 build 带错域名上线）
u=$(smoke_curl -s --max-time 20 "$B/sitemap.xml" | grep -c 'https://modelprice.damolabs.app' || true)
[[ "$u" -ge 3 ]] || { echo "❌ sitemap.xml 绝对 URL 数异常: $u"; fail=1; }

[[ $fail -eq 0 ]] && echo "🎉 冒烟全过" || { echo "💥 冒烟有失败项"; exit 1; }
