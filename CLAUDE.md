# modelprice — LLM Price-Performance Calculator（模型比价站）

> 线上: https://modelprice.damolabs.app ｜ 治理归属: autorev 纲领仓 **EXP-006**（预算 / 红线 / 判读都在那边）
> 冷启动顺序: 读本文件 → 读 `/home/damo/workspace/autorev/docs/modelprice-plan.md`（当前方案与执行顺序）→ `autorev/EXPERIMENTS.md` §EXP-006

## 一句话

用 WebDev Arena（code 榜 + Text-to-Image 榜）分数做「能力门槛」→ 门槛内找最便宜（Pareto 前沿 + per-task 成本），在裸榜数据上修正三类系统性偏差：峰谷时变价（168h 曲线）、缓存命中偏差（0%→95% 可调）、统计噪声（95% CI 重叠档位合并）。

## 仓结构（src/ 进 git，dist/ 不进）

- `src/templates/index.html` 页面骨架（`__DATA__` 构建时填充）
- `src/js/01~11-*.js` 模块按文件名序加载（11=计算器，10=排行榜页签）；`src/css/` 桌面/平板/手机三档响应式
- `src/i18n/` 5 语言字典（350 keys ×5，**key 集必须一致——test 强制**；改 en.json 必须同步其余 4 语言）+ boot/source/method 长文
- `data/datasets.json` 数字本体；`scripts/` 抓取/构建/部署管线；`test/`（build.py + cases.js 主站 83 条 + test_price_drops.py 调价页 12 条）
- 全部构建命令经 `scripts/deploy.sh`，不要单独手跑构建段

## 构建 + 部署（一条命令）

- `bash scripts/deploy.sh` = 三段构建（build_page → build_site → build_seo_pages）→ rsync dist/ → `wd:/www/wwwroot/modelprice.damolabs.app/` → 冒烟（首页 / 5 语言 / method / all.json / llms / robots / sitemap 全 200 断言 + 排行榜页签 + t2i 榜在线）
- `--verify-only` 只冒烟不部署；回滚命令（vhost / 证书 / DNS 三层独立可撤）见 deploy.sh 头注释
- 部署前 `git pull --rebase`；直接 master 提交，message 附 revert 命令
- WSL 已配 `ssh wd`（root@193.180.211.32）；本机部署机配置不进仓库（`.env.example` 只含 DEPLOY_TARGET / SMOKE_RESOLVE，无密钥）

## 数据管线（Mac 侧自动跑，WSL 别抢）

- Mac launchd `app.damolabs.modelprice-refresh.plist` 每日跑 `scripts/refresh-data.sh`：OpenRouter 价格日快照（自动 git commit「data: OpenRouter 价格日快照 <日期>」）+ arena 抓取 + tokencanopy 85 平台历史回填
- 检出价格跳变（exit 2）→ 自动派「价格核对」task 到 **Mac 本机 13000 实例**的 modelprice 项目（不走 WSL 户口）
- WSL 侧一般不改数据管线；需手动刷新 → `ssh damo@192.168.3.243 'bash /Users/damo/workspace/modelprice/scripts/refresh-data.sh'`

## 测量

- **umami 已接入**（2026-11-26 P0，autorev `umami-onboard` playbook 适配本仓）：`src/analytics.js`（构建期拷到 `dist/analytics.js`，模板尾注入 `/analytics.js`）+ wd vhost 双精确反代（`/js/script.js` 200、`/api/send` GET 405，见 `docs/deploy/modelprice.damolabs.app.conf`）；与 cozy/games/tools 共用同一 Umami Cloud websiteId（hostname 区分），事件带 `mp_` 前缀
- 事件（EXP-006 判读指标）：`mp_share_click`（分享栏 X/Reddit/Copy + 计算器复制结论/导出图，`props.channel` = x|reddit|copy|copy-verdict|export-image）；`mp_calc_complete` **已接入**（W1，2026-11-26）——唯一触发面 = 计算器「算这笔账」按钮（`11-calculator.js` calcTrack，payload 带 preset/board/bar/fee/tasks/winner/dir）；深链/切页签不触发
- 冒烟已锁：deploy.sh 检查 og.png 200 / analytics.js 200 / umami 双端点 / og:image+twitter:card+shareBar+无 `--:00`
- 流量口径: wd nginx vhost 日志（autorev `traffic-baseline.sh` 同族，豁免 IP + bot 过滤）

## 红线（继承 autorev 纲领 AUTONOMOUS_REVENUE_CHARTER.md）

- 预算 $0 新增；不编造数据——价格声明必须带来源链接 + 生效日期；不刷量不自购
- 不把「Arena 分数 ÷ 价格」做成连续排名（分数无真实零点，会被技术社区挑战）；峰谷建议只基于 verified 规则
- 生成素材商用授权未确认前不发布（autorev WAITING_FOR_HUMAN 管）
- i18n key 集不一致会被 test 拦——改 en.json 当轮同步 5 语言

## 平台户口（两实例并存，别混）

- **WSL localhost:13000** = 本仓派发户口（project `e217652d-edfc-40df-bb38-14027edc4795`，version `67ecfa6b`，飞书 sheet=modelprice `xQObT6`）——本仓开发任务派在这里
- **Mac 127.0.0.1:13000** = 价格核对 cron 的派发目标（同名项目）——Mac cron 自动派的核对 task 在那边，别来 WSL 找
