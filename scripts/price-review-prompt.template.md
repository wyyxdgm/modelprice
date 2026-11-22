## 任务：核对本周榜面价格变化，登记/下线 PRICE_EVENTS（能定性的登记，不能定性的标 suspected）

**第一句回复必须是**：`我是 modelprice (id=cd9d6211-c14f-46ae-b6c1-afc428b29580)。`

### 背景
modelprice.damolabs.app 数据已由 launchd 定时任务自动刷新（每周一 09:17，scripts/refresh-data.sh），diff 检出以下模型榜面价（Price $/M，输入/输出每百万 tokens）相对上次 commit 变化。本 task 由刷新钩子自动派发：

{{DIFF_TABLE}}

### 你要做什么
对每个模型：**核对厂商官方定价页现价**，判断榜面新价的性质，按判定处理：

1. **榜面价 = 厂商现价（常规价或进行中促销，无已知到期日）** → 不登记事件，数据已正确。报告里记一行结论 + 来源 URL
2. **榜面价是「已知起止日期的促销价」** → `src/js/03-pricing.js` PRICE_EVENTS 加 date 型事件（结构照抄历史 glm_promo 形态），conf:'official'
3. **拿不准 / 单方信源** → 登记但 conf:'suspected'（默认关，敏感性分析用）
4. **旧事件失配检查**：PRICE_EVENTS 里「榜面价=before」前提不成立的规则必须下线（参考 2026-11-22 glm_promo 下线注释）——修正前提失效还继续修正 = 输出假价格

### 核对信源（按优先级）
1. 厂商官方定价页（模型 modelUrl 在 raw/overall_os.md 里；z.ai / platform.kimi.ai / mimo.xiaomi.com / qwenlm.github.io 等）
2. benchr.org/pricing 第三方索引交叉验证
3. curl 不通用本机代理 `curl -x http://127.0.0.1:1087`；JS 渲染页用 browse CLI（复用现有浏览器窗口，禁止新开 profile）

### 登记时的同步面（三处缺一测试红）
- `src/js/03-pricing.js` PRICE_EVENTS 本体
- `build_site.py` PRICE_EVENTS 镜像
- `src/i18n/{en,zh,ja,ko,fr}.json` 各加 `ev.<id>.{name,desc,src}`（5 locale key 集合必须一致，测试强制）

### 验收标准（硬性，逐条给证据）
1. 每个变化模型都有核对结论（性质 + 信源 URL）写进收尾报告
2. 若有登记/下线：`python3 scripts/build_page.py && python3 build_site.py https://modelprice.damolabs.app && python3 test/build.py && node --max-old-space-size=4096 test/run.js` 全绿（64/64）
3. `bash scripts/deploy.sh` 上线 + 冒烟全过
4. commit 进仓（message 带撤销命令），不 push（本仓无 remote）

### 如何回复自己
完成后第一句自报家门：`我是 modelprice (id=cd9d6211-c14f-46ae-b6c1-afc428b29580)。回复本任务 task_id=<你的task_id> -- ao-dev 就可以继续处理了`，然后给核对结论表 + 事件登记明细 + 测试/部署证据。
