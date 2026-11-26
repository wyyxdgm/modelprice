#!/usr/bin/env python3
"""程序化 SEO 子页生成器（构建期纯静态 HTML，零 JS —— 搜索引擎可直接抓全文）。

两类页面：
  1. alternatives/<slug>.html ×frontier 模型 ×5 语言
     「<模型> 的更便宜替代 / 平替」—— 长尾搜索词着陆页。内容全部来自 dist/data/v1/all.json：
     模型速览（分数/成本/统治区间）+ 降一档平替（省多少）+ 升一档（贵多少、每分单价）+ 同段位其它模型表。
  2. best-llm-for-<scene>.html ×3 场景 ×5 语言
     场景着陆页（写代码 / Agent 重度 / 深夜错峰）—— frontier 阶梯表静态版 + 场景说明 + 交互版 CTA。

用法：python3 scripts/build_seo_pages.py [domain]     # 在 build_site.py 之后跑（读 all.json、追加 sitemap.xml）
"""
import datetime
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOMAIN = (sys.argv[1] if len(sys.argv) > 1 else "https://modelprice.damolabs.app").rstrip("/")
ALL = ROOT / "dist" / "data" / "v1" / "all.json"
OUT = ROOT / "dist"
LOCALES = ["en", "zh", "ja", "ko", "fr"]
STYLE = (ROOT / "src" / "css" / "style.css").read_text(encoding="utf-8")

SCENES = ["coding", "agent", "offpeak"]

# ---------- 文案模板（5 语言；模型名/数字构建期填充） ----------
L10N = {
 "en": {
  "alt_title": "{model} cheaper alternatives (2026) — Arena score vs. real cost",
  "alt_desc": "Cheaper alternatives to {model} on the Arena (LMArena) WebDev leaderboard: score {score}, ${cost} per task. See the next tier down (how much you save, how many points you give up), the tier above, and other models in the same score band.",
  "alt_h1": "{model}: cheaper alternatives & same-tier picks",
  "alt_intro": "{model} sits on the price-performance Pareto frontier of the Arena WebDev leaderboard at score {score} — the cheapest model that clears {score}. Below: what you save by stepping down one tier, what the tier above costs per extra point, and every other model in its score band.",
  "spec_h2": "At a glance",
  "spec_lab": ["Arena score", "$ / task", "Reigns", "Votes"],
  "down_h2": "Step down one tier (cheaper)",
  "down_line": "<a href=\"{href}\">{model}</a> costs ${cost} per task (save {pct}%), at {delta} fewer Arena points (score {score}).",
  "none_down": "{model} is already the cheapest model clearing score {score} — nothing below it passes that bar.",
  "up_h2": "Step up one tier (stronger)",
  "up_line": "<a href=\"{href}\">{model}</a> costs ${cost} per task (+{pct}% / +${marg}/pt), at {delta} more Arena points (score {score}).",
  "none_up": "{model} is the top tier of this leaderboard — nothing above it.",
  "peers_h2": "Other models in the same score band ({lo}–{hi})",
  "peers_note": "All of these cost more per task than {model} at equal-or-lower score — that is exactly what the Pareto frontier means.",
  "cta_h2": "Check it with cache & off-peak pricing",
  "cta_line": "Board prices assume 0% cache hits and mixed peak/off-peak conventions. The interactive calculator reprices every model at your cache-hit rate (default 95%) and hour of day.",
  "cta_btn": "Open the interactive calculator",
  "back": "← Back to the analyzer",
  "method": "Method & data sources",
  "tbl": ["Model", "Arena score", "$ / task", "vs. {model}", "Votes"],
  "updated": "Leaderboard captured {captured}. Prices verified against vendor pages — see the method page for the full price-event log.",
  "sc_title": {"coding": "Cheapest LLMs for coding (2026) — Arena-score value ranking",
               "agent": "Cheapest LLMs for heavy agent workloads (2026)",
               "offpeak": "LLM off-peak half-price guide (2026) — who gets cheap at night"},
  "sc_desc": {"coding": "Ranking of Arena WebDev frontier tiers by real cost per task: the cheapest model at every quality bar for coding workloads.",
              "agent": "Long-context agent workloads are billed on tokens — here is the cheapest model at every Arena score bar, ranked by real per-task cost.",
              "offpeak": "DeepSeek-style peak/off-peak pricing can halve your bill at night. See which frontier models get cheap off-peak and when."},
  "sc_h1": {"coding": "Cheapest LLMs for coding — every quality tier, ranked by real cost",
            "agent": "Cheapest LLMs for heavy agent workloads",
            "offpeak": "Off-peak half-price guide: who gets cheap at night"},
  "sc_intro": {"coding": "Set a quality bar (Arena score) and the frontier below gives the cheapest model that clears it, plus what the next tier up costs per extra point. Board prices are shown; the interactive version reprices at your cache-hit rate and hour.",
               "agent": "Agent runs are token-hungry: large contexts in, long outputs out. The tiers below are ranked by board price per task — the interactive calculator adds cache-hit and time-of-day corrections.",
               "offpeak": "Several vendors price off-peak hours at a steep discount (DeepSeek: exactly ×0.5). The tiers below are the board-price baseline; open the calculator's weekly 168-hour curve to see the nightly drops."},
  "sc_cta": "Open the {scene} scenario in the calculator",
  # —— /price-drops 静态调价页（构建期从 src/js/03-pricing.js 提取事件 + all.json 前沿算法自动判结论）——
  "pd_title": "LLM price drops & changes (2026) — tracked moves with value verdicts",
  "pd_desc": "Every tracked LLM API price change behind the Arena WebDev board: old → new $/M token prices, effective dates, vendor sources, and an auto-computed verdict — does the model stay on the price-performance Pareto frontier after the change?",
  "pd_h1": "LLM price drops & changes — tracked, sourced, priced",
  "pd_intro": "Vendors reprice constantly; the Arena board snapshots prices periodically and can lag or mix channel tiers. Below is every price move we track: verified vendor announcements, plus flags where the board price and the official price disagree. Each row is re-scored at build time — we recompute every board's cost-quality Pareto frontier with the post-change price and report whether the model stays on it.",
  "pd_headline": "Largest tracked change: {model} input ${bin} → ${ain} ({pct}%), {eff}",
  "pd_verified_h2": "Verified price changes (vendor-announced)",
  "pd_unverified_h2": "Unverified flags — board price vs. official price",
  "pd_badge_v": "verified",
  "pd_badge_u": "unverified",
  "pd_col_model": "Model",
  "pd_col_change": "Price change ($/M in/out)",
  "pd_col_eff": "Effective",
  "pd_col_verdict": "Value verdict (after change)",
  "pd_verdict_on": "On frontier",
  "pd_verdict_off": "Off frontier",
  "pd_boards": "{on}/{total} boards",
  "pd_empty": "No tracked price changes in this section for the current snapshot.",
  "pd_eff_date": "from {date}",
  "pd_eff_future": "announced — from {date}",
  "pd_eff_tod": "off-peak: weekdays {w} UTC (+weekends)",
  "pd_change_tod": "peak ${pki}/${pko} · off-peak ${ofi}/${ofo}",
  "pd_change_duo": "board ${bi}/${bo} vs official ${ai}/${ao}",
  "pd_change_mv": "${bi}/${bo} → ${ai}/${ao}",
  "pd_note": "Prices are USD per 1M tokens (input/output). “After change” = the price this event moves the model to: the announced new price for verified events, the vendor-verified price for flags. The verdict recomputes each board's threshold Pareto frontier (cheapest model at every quality bar) with the post-change price — the same algorithm that powers the leaderboard.",
  "pd_source": "Source",
  "pd_cta_btn": "Open the interactive calculator",
  "pd_cta_line": "All numbers here are static board-price baselines. The interactive calculator reprices every model at your cache-hit rate and hour of day.",
  "pd_dataasof": "Data as of {captured} · generated {gen} (UTC)",
 },
 "zh": {
  "alt_title": "{model} 平替（2026）— 更便宜的替代品与同分数段对比",
  "alt_desc": "{model} 在 Arena（LMArena）WebDev 榜的分数为 {score}、单任务 ${cost}。降一档平替能省多少、升一档每分单价多少、同分数段还有哪些模型——数据全部来自榜单实测。",
  "alt_h1": "{model} 的更便宜替代（平替）与同段位选择",
  "alt_intro": "{model} 位于 Arena WebDev 榜单性价比帕累托前沿的分数 {score} 档——即「能跨过 {score} 分门槛的最便宜模型」。下文给出：降一档能省多少钱、升一档每多一分要花多少、以及同分数段内的全部其它模型。",
  "spec_h2": "模型速览",
  "spec_lab": ["Arena 分数", "$ / 任务", "统治区间", "票数"],
  "down_h2": "降一档平替（更便宜）",
  "down_line": "<a href=\"{href}\">{model}</a> 单任务 ${cost}（省 {pct}%），低 {delta} 个 Arena 分（{score} 分）。",
  "none_down": "{model} 已经是能跨过 {score} 分门槛的最便宜模型——再往下没有模型达标。",
  "up_h2": "升一档（更强）",
  "up_line": "<a href=\"{href}\">{model}</a> 单任务 ${cost}（+{pct}% / 每分 +${marg}），高 {delta} 个 Arena 分（{score} 分）。",
  "none_up": "{model} 已是本榜最高档——上面没有了。",
  "peers_h2": "同分数段其它模型（{lo}–{hi} 分）",
  "peers_note": "这些模型在相同或更低分数下单任务成本都比 {model} 高——这正是「帕累托前沿」的含义。",
  "cta_h2": "用缓存与错峰价核一遍",
  "cta_line": "榜面价假设 0% 缓存命中且峰谷口径混计。交互计算器可按你设置的缓存命中率（默认 95%）与时段对每个模型重算单任务成本。",
  "cta_btn": "打开交互计算器验证",
  "back": "← 返回分析器",
  "method": "方法与数据来源",
  "tbl": ["模型", "Arena 分数", "$ / 任务", "对比 {model}", "票数"],
  "updated": "榜单数据抓取于 {captured}。价格已对照厂商页面核验——完整价格事件日志见方法页。",
  "sc_title": {"coding": "写代码最便宜的大模型（2026）— Arena 分数性价比排行",
               "agent": "Agent 重度调用最省钱的大模型（2026）— 达标排行",
               "offpeak": "大模型深夜错峰半价指南（2026）— 谁在夜里变便宜"},
  "sc_desc": {"coding": "按真实单任务成本排列的 Arena WebDev 前沿档位：每个质量门槛下最便宜的模型一览。",
              "agent": "Agent 长上下文重调用按 token 计费——每个 Arena 分数门槛下最便宜的模型，按真实单任务成本排列。",
              "offpeak": "DeepSeek 式峰谷定价让夜间账单减半。看看哪些前沿模型在错峰时段变便宜、便宜多少。"},
  "sc_h1": {"coding": "写代码最便宜的大模型 — 每个质量档位按真实成本排列",
            "agent": "Agent 重度调用最省钱的大模型 — 按真实单任务成本排列",
            "offpeak": "深夜错峰半价指南 — 哪些模型在夜里变便宜"},
  "sc_intro": {"coding": "设定质量门槛（Arena 分数），下表给出每个档位跨过门槛的最便宜模型，以及升一档的每分边际成本。表内为榜面价；交互版可按缓存命中率与时段重算。",
               "agent": "Agent 运行吃 token：长上下文进、长输出出。下表按榜面单任务成本排列——交互计算器可叠加缓存命中与时段修正。",
               "offpeak": "多家厂商在错峰时段大幅降价（DeepSeek：恰好半价）。下表是榜面价基线；打开交互计算器的 168 小时周成本曲线可看夜间降价窗口。"},
  "sc_cta": "在计算器中打开「{scene}」场景",
  "pd_title": "大模型降价与调价事件（2026）— 每次调价自动判性价比",
  "pd_desc": "Arena WebDev 榜背后的每一次大模型 API 调价：旧价 → 新价（$/M token）、生效日期、厂商来源，以及自动计算的性价比结论——调价后该模型还在不在「分数段最优价」帕累托前沿上。",
  "pd_h1": "大模型降价与调价 — 有追踪、有出处、有结论",
  "pd_intro": "厂商频繁调价，Arena 榜面价是周期性快照，可能滞后或混入渠道价。下面是我们追踪的全部调价：已核实的厂商官宣，以及「榜面价与官方价不符」的待核实标记。每行结论在构建期自动重算——用调价后价格重算各榜单的成本-质量帕累托前沿，报告该模型是否仍在前沿。",
  "pd_headline": "最大已追踪调价：{model} 输入 ${bin} → ${ain}（{pct}%），{eff}",
  "pd_verified_h2": "已核实的调价（厂商官宣）",
  "pd_unverified_h2": "待核实标记 — 榜面价 vs 官方价",
  "pd_badge_v": "已核实",
  "pd_badge_u": "待核实",
  "pd_col_model": "模型",
  "pd_col_change": "价格变化（$/M 输入/输出）",
  "pd_col_eff": "生效",
  "pd_col_verdict": "性价比结论（调价后）",
  "pd_verdict_on": "仍在前沿",
  "pd_verdict_off": "跌出前沿",
  "pd_boards": "{on}/{total} 个榜单",
  "pd_empty": "当前快照中该节没有追踪到的调价事件。",
  "pd_eff_date": "{date} 起",
  "pd_eff_future": "已官宣 — {date} 起",
  "pd_eff_tod": "错峰时段：工作日 {w} UTC（周末全天适用）",
  "pd_change_tod": "峰 ${pki}/${pko} · 谷 ${ofi}/${ofo}",
  "pd_change_duo": "榜面 ${bi}/${bo} vs 官方 ${ai}/${ao}",
  "pd_change_mv": "${bi}/${bo} → ${ai}/${ao}",
  "pd_note": "价格单位：美元 / 百万 token（输入/输出）。「调价后」= 该事件把模型调向的价格：已核实事件用官宣新价，待核实标记用厂商核验价。结论列用调价后价格重算每个榜单的门槛制帕累托前沿（每个质量档位的最便宜模型）——与排行榜同一算法。",
  "pd_source": "来源",
  "pd_cta_btn": "打开交互计算器",
  "pd_cta_line": "本页全部数字是静态榜面价基线。交互计算器可按你设置的缓存命中率与时段对每个模型重算成本。",
  "pd_dataasof": "数据截至 {captured} · 生成于 {gen}（UTC）",
 },
 "ja": {
  "alt_title": "{model} の安い代替（2026）— Arenaスコア × 実コスト比較",
  "alt_desc": "{model}（Arena WebDevスコア {score}、タスクあたり ${cost}）より安い代替モデル：1ティア下でいくら節約できるか、1ティア上の1ポイント単価、同スコア帯の他モデルを一覧。",
  "alt_h1": "{model} のより安い代替と同ティアの選択肢",
  "alt_intro": "{model} は Arena WebDev リーダーボードの価格性能パレート最前線、スコア {score} のティアに位置します（{score} 以上で最安）。以下に：1ティア下の節約額、1ティア上のポイント単価、同スコア帯の全モデルを示します。",
  "spec_h2": "モデル概要",
  "spec_lab": ["Arenaスコア", "$ / タスク", "支配区間", "票数"],
  "down_h2": "1ティア下（より安い）",
  "down_line": "<a href=\"{href}\">{model}</a> はタスクあたり ${cost}（{pct}% 節約）、Arenaスコア {delta} 点低い（{score}）。",
  "none_down": "{model} はスコア {score} を超える最安モデルです——それ以下で合格線を満たすモデルはありません。",
  "up_h2": "1ティア上（より高性能）",
  "up_line": "<a href=\"{href}\">{model}</a> はタスクあたり ${cost}（+{pct}% / +${marg}/pt）、スコア {delta} 点高い（{score}）。",
  "none_up": "{model} はこのリーダーボードの最高ティアです。",
  "peers_h2": "同スコア帯の他モデル（{lo}–{hi}）",
  "peers_note": "同等以下のスコアでタスクあたりコストが {model} より高い——これがパレート最前線の意味です。",
  "cta_h2": "キャッシュとオフピーク料金で再確認",
  "cta_line": "掲載料金はキャッシュヒット0%を仮定し、ピーク/オフピークも混在しています。インタラクティブ計算機は設定したヒット率（既定95%）と時間帯で各モデルを再計算します。",
  "cta_btn": "インタラクティブ計算機を開く",
  "back": "← アナライザーに戻る",
  "method": "方法とデータソース",
  "tbl": ["モデル", "Arenaスコア", "$ / タスク", "{model} 比", "票数"],
  "updated": "リーダーボード取得日 {captured}。料金はベンダーページと照合済み——詳細は方法ページへ。",
  "sc_title": {"coding": "コーディングに最安のLLM（2026）— Arenaスコア別コスパ順位",
               "agent": "Agent大量処理に最安のLLM（2026）— 达标ランキング",
               "offpeak": "LLM 深夜オフピーク半額ガイド（2026）— 夜に安くなるモデル"},
  "sc_desc": {"coding": "Arena WebDev フロンティアティアを実タスクコスト順に：各品質ハードルで最安のモデル一覧。",
              "agent": "長文コンテキストのAgent処理はトークン課金——各Arenaスコアハードルの最安モデルを実コスト順に。",
              "offpeak": "DeepSeek式のピーク/オフピーク料金で夜間は半額。どのフロンティアモデルが夜安くなるか。"},
  "sc_h1": {"coding": "コーディング最安のLLM — 各品質ティアを実コスト順に",
            "agent": "Agent大量処理に最安のLLM — 実タスクコスト順",
            "offpeak": "深夜オフピーク半額ガイド — 夜に安くなるモデル"},
  "sc_intro": {"coding": "品質ハードル（Arenaスコア）を決めると、各ティアでハードルを超える最安モデルと、1ティア上のポイント単価がわかります。掲載はボード価格；対話版はヒット率と時間帯で再計算。",
               "agent": "Agentは長文入力・長文出力でトークンを消費します。以下はボード価格順——計算機でキャッシュ・時間帯補正を追加できます。",
               "offpeak": "複数ベンダーはオフピークに大幅割引（DeepSeek：ちょうど半額）。以下はボード価格の基準；計算機の168時間週次曲線で夜間の下がり幅を確認できます。"},
  "sc_cta": "計算機で「{scene}」シナリオを開く",
  "pd_title": "LLM 価格改定・値下げトラッカー（2026）— 各改定のコスパ判定つき",
  "pd_desc": "Arena WebDev ボードの背後にある LLM API の価格改定をすべて掲載：旧→新の $/M トークン価格、発効日、ベンダー出典、そして自動判定 — 改定後もそのモデルは価格性能パレート最前線に残るか。",
  "pd_h1": "LLM の値下げ・価格改定 — 追跡し、出典を示し、判定する",
  "pd_intro": "ベンダーは頻繁に価格を変え、Arena ボードは定期的なスナップショットのため遅れたりチャネル価格を混ぜることがあります。以下は追跡中のすべての価格変動：確認済みのベンダー公式発表と、ボード価格と公式価格が食い違っている未確認フラグ。各行の判定はビルド時に自動再計算 — 改定後の価格で各ボードのコスト品質パレート最前線を再計算し、モデルが最前線に残るかを報告します。",
  "pd_headline": "最大の追跡変更：{model} 入力 ${bin} → ${ain}（{pct}%）、{eff}",
  "pd_verified_h2": "確認済みの価格改定（ベンダー公式発表）",
  "pd_unverified_h2": "未確認フラグ — ボード価格 vs 公式価格",
  "pd_badge_v": "確認済み",
  "pd_badge_u": "未確認",
  "pd_col_model": "モデル",
  "pd_col_change": "価格変化（$/M 入力/出力）",
  "pd_col_eff": "発効",
  "pd_col_verdict": "コスパ判定（改定後）",
  "pd_verdict_on": "最前線に残留",
  "pd_verdict_off": "最前線から脱落",
  "pd_boards": "{on}/{total} ボード",
  "pd_empty": "現在のスナップショットではこのセクションに追跡中の価格変更はありません。",
  "pd_eff_date": "{date} から",
  "pd_eff_future": "発表済み — {date} から",
  "pd_eff_tod": "オフピーク：平日 {w} UTC（週末は終日）",
  "pd_change_tod": "ピーク ${pki}/${pko} · オフピーク ${ofi}/${ofo}",
  "pd_change_duo": "ボード ${bi}/${bo} vs 公式 ${ai}/${ao}",
  "pd_change_mv": "${bi}/${bo} → ${ai}/${ao}",
  "pd_note": "価格は 100 万トークンあたりの USD（入力/出力）。「改定後」= このイベントがモデルを向かわせる価格：確認済みは発表された新価格、フラグはベンダー照合済みの価格。判定は改定後の価格で各ボードのしきい値パレート最前線（各品質ハードルの最安モデル）を再計算 — リーダーボードと同じアルゴリズムです。",
  "pd_source": "出典",
  "pd_cta_btn": "インタラクティブ計算機を開く",
  "pd_cta_line": "本ページの数値はすべて静的なボード価格の基準値です。インタラクティブ計算機はヒット率と時間帯で各モデルを再計算します。",
  "pd_dataasof": "データ基準日 {captured} · 生成 {gen}（UTC）",
 },
 "ko": {
  "alt_title": "{model} 저렴한 대안 (2026) — Arena 점수 × 실비용 비교",
  "alt_desc": "{model}(Arena WebDev {score}점, 작업당 ${cost})의 더 저렴한 대안: 한 등급 아래로 얼마 아끼는지, 한 등급 위의 점수당 단가, 같은 점수대의 다른 모델까지 한눈에.",
  "alt_h1": "{model}의 더 저렴한 대안과 같은 등급 선택지",
  "alt_intro": "{model}은 Arena WebDev 리더보드 가격성능 파레토 경계의 {score}점 등급입니다({score} 이상에서 최저가). 아래에서 한 등급 아래의 절감액, 한 등급 위의 점수당 비용, 같은 점수대의 모든 모델을 확인하세요.",
  "spec_h2": "모델 요약",
  "spec_lab": ["Arena 점수", "$ / 작업", "지배 구간", "표 수"],
  "down_h2": "한 등급 아래 (더 저렴)",
  "down_line": "<a href=\"{href}\">{model}</a> 작업당 ${cost}({pct}% 절감), Arena {delta}점 낮음({score}점).",
  "none_down": "{model}은 {score}점 이상에서 최저가 모델입니다 — 그 아래로 기준을 넘는 모델이 없습니다.",
  "up_h2": "한 등급 위 (더 강함)",
  "up_line": "<a href=\"{href}\">{model}</a> 작업당 ${cost}(+{pct}% / +${marg}/pt), Arena {delta}점 높음({score}점).",
  "none_up": "{model}은 이 리더보드의 최상위 등급입니다.",
  "peers_h2": "같은 점수대의 다른 모델 ({lo}–{hi}점)",
  "peers_note": "이 모델들은 같거나 낮은 점수에서 작업당 비용이 {model}보다 높습니다 — 그것이 바로 파레토 경계의 의미입니다.",
  "cta_h2": "캐시·심야 할인 요금으로 재확인",
  "cta_line": "게시 가격은 캐시 히트 0%를 가정하고 시간대 표기도 섞여 있습니다. 대화형 계산기는 설정한 히트율(기본 95%)과 시간대로 각 모델을 다시 계산합니다.",
  "cta_btn": "대화형 계산기 열기",
  "back": "← 분석기로 돌아가기",
  "method": "방법 및 데이터 출처",
  "tbl": ["모델", "Arena 점수", "$ / 작업", "{model} 대비", "표 수"],
  "updated": "리더보드 수집일 {captured}. 가격은 벤더 페이지와 대조 검증 — 자세한 내용은 방법 페이지에서.",
  "sc_title": {"coding": "코딩용 최저가 LLM (2026) — Arena 점수별 가성비 순위",
               "agent": "Agent 대량 호출용 최저가 LLM (2026) — 기준 충족 순위",
               "offpeak": "LLM 심야 할인 가이드 (2026) — 밤에 저렴해지는 모델"},
  "sc_desc": {"coding": "Arena WebDev 경계 등급을 실제 작업당 비용순으로: 모든 품질 기준에서 최저가 모델 목록.",
              "agent": "긴 컨텍스트 Agent 처리는 토큰 과금 — 각 Arena 점수 기준의 최저가 모델을 실비용순으로.",
              "offpeak": "DeepSeek식 시간대 요금으로 야간 요금이 절반. 어떤 경계 모델이 밤에 저렴해지는지."},
  "sc_h1": {"coding": "코딩 최저가 LLM — 모든 품질 등급을 실비용순으로",
            "agent": "Agent 대량 호출 최저가 LLM — 실제 작업당 비용순",
            "offpeak": "심야 할인 가이드 — 밤에 저렴해지는 모델"},
  "sc_intro": {"coding": "품질 기준(Arena 점수)을 정하면 각 등급에서 기준을 넘는 최저가 모델과 한 등급 위의 점수당 비용을 볼 수 있습니다. 표는 게시 가격 기준; 대화형 버전은 히트율·시간대로 재계산합니다.",
               "agent": "Agent는 긴 입력·긴 출력으로 토큰을 많이 씁니다. 아래는 게시 가격순 — 계산기에서 캐시·시간대 보정을 추가할 수 있습니다.",
               "offpeak": "여러 벤더가 심야 시간대에 큰 폭으로 할인합니다(DeepSeek: 정확히 반값). 아래는 게시 가격 기준; 계산기의 168시간 주간 곡선에서 야간 하락 폭을 확인하세요."},
  "sc_cta": "계산기에서 '{scene}' 시나리오 열기",
  "pd_title": "LLM 가격 인하·인상 트래커 (2026) — 변경별 가성비 판정 포함",
  "pd_desc": "Arena WebDev 보드 뒤의 모든 LLM API 가격 변경: 기존 → 신규 $/M 토큰 가격, 발효일, 벤더 출처, 그리고 자동 판정 — 변경 후에도 그 모델이 가격성능 파레토 경계에 남는지.",
  "pd_h1": "LLM 가격 인하·인상 — 추적, 출처, 판정",
  "pd_intro": "벤더는 가격을 자주 바꾸고 Arena 보드는 주기적 스냅샷이라 뒤처지거나 채널 가격이 섞일 수 있습니다. 아래는 추적 중인 모든 가격 변동: 확인된 벤더 공식 발표와, 보드 가격과 공식 가격이 어긋난 미확인 플래그. 각 행의 판정은 빌드 시점에 자동 재계산 — 변경 후 가격으로 각 보드의 비용-품질 파레토 경계를 다시 계산해 모델이 경계에 남는지 보고합니다.",
  "pd_headline": "최대 추적 변경: {model} 입력 ${bin} → ${ain}({pct}%), {eff}",
  "pd_verified_h2": "확인된 가격 변경(벤더 공식 발표)",
  "pd_unverified_h2": "미확인 플래그 — 보드 가격 vs 공식 가격",
  "pd_badge_v": "확인됨",
  "pd_badge_u": "미확인",
  "pd_col_model": "모델",
  "pd_col_change": "가격 변화($/M 입력/출력)",
  "pd_col_eff": "발효",
  "pd_col_verdict": "가성비 판정(변경 후)",
  "pd_verdict_on": "경계 유지",
  "pd_verdict_off": "경계 이탈",
  "pd_boards": "{on}/{total} 보드",
  "pd_empty": "현재 스냅샷의 이 섹션에는 추적된 가격 변경이 없습니다.",
  "pd_eff_date": "{date}부터",
  "pd_eff_future": "발표됨 — {date}부터",
  "pd_eff_tod": "오프피크: 평일 {w} UTC(주말 종일)",
  "pd_change_tod": "피크 ${pki}/${pko} · 오프피크 ${ofi}/${ofo}",
  "pd_change_duo": "보드 ${bi}/${bo} vs 공식 ${ai}/${ao}",
  "pd_change_mv": "${bi}/${bo} → ${ai}/${ao}",
  "pd_note": "가격 단위: 토큰 100만 개당 USD(입력/출력). 「변경 후」= 이 이벤트가 모델을 향하게 하는 가격: 확인된 이벤트는 발표된 신규 가격, 플래그는 벤더 대조 검증 가격. 판정은 변경 후 가격으로 각 보드의 임계값 파레토 경계(각 품질 기준의 최저가 모델)를 재계산 — 리더보드와 같은 알고리즘입니다.",
  "pd_source": "출처",
  "pd_cta_btn": "대화형 계산기 열기",
  "pd_cta_line": "이 페이지의 모든 수치는 정적 보드 가격 기준입니다. 대화형 계산기는 히트율과 시간대로 각 모델을 다시 계산합니다.",
  "pd_dataasof": "데이터 기준 {captured} · 생성 {gen}(UTC)",
 },
 "fr": {
  "alt_title": "Alternatives moins chères à {model} (2026) — score Arena × coût réel",
  "alt_desc": "{model} : score Arena WebDev {score}, ${cost} par tâche. Alternatives moins chères : combien vous économisez un palier en dessous, le prix par point du palier au-dessus, et tous les modèles de la même plage de score.",
  "alt_h1": "Alternatives moins chères à {model} et choix du même palier",
  "alt_intro": "{model} occupe la frontière de Pareto prix-performance du classement Arena WebDev au palier {score} — le modèle le moins cher qui franchit {score}. Ci-dessous : l'économie d'un palier en dessous, le coût par point du palier au-dessus, et tous les autres modèles de sa plage de score.",
  "spec_h2": "En bref",
  "spec_lab": ["Score Arena", "$ / tâche", "Règne", "Votes"],
  "down_h2": "Un palier en dessous (moins cher)",
  "down_line": "<a href=\"{href}\">{model}</a> coûte ${cost} par tâche (−{pct} %), avec {delta} points Arena de moins (score {score}).",
  "none_down": "{model} est déjà le modèle le moins cher franchissant {score} — rien en dessous ne passe ce seuil.",
  "up_h2": "Un palier au-dessus (plus fort)",
  "up_line": "<a href=\"{href}\">{model}</a> coûte ${cost} par tâche (+{pct} % / +${marg}/pt), avec {delta} points de plus (score {score}).",
  "none_up": "{model} est le palier supérieur de ce classement — rien au-dessus.",
  "peers_h2": "Autres modèles de la même plage ({lo}–{hi})",
  "peers_note": "Tous coûtent plus cher par tâche que {model} à score égal ou inférieur — c'est exactement ce que signifie la frontière de Pareto.",
  "cta_h2": "Vérifiez avec cache et tarifs heures creuses",
  "cta_line": "Les prix affichés supposent 0 % de hits de cache et mélangent pointe/creux. Le calculateur interactif reprécise chaque modèle à votre taux de cache (95 % par défaut) et à l'heure choisie.",
  "cta_btn": "Ouvrir le calculateur interactif",
  "back": "← Retour à l'analyseur",
  "method": "Méthode et sources",
  "tbl": ["Modèle", "Score Arena", "$ / tâche", "vs {model}", "Votes"],
  "updated": "Classement capturé le {captured}. Prix vérifiés sur les pages vendeurs — voir la page méthode.",
  "sc_title": {"coding": "Les LLM les moins chers pour coder (2026) — classement par score Arena",
               "agent": "Les LLM les moins chers pour agents intensifs (2026)",
               "offpeak": "Guide des demi-tarifs nocturnes LLM (2026) — qui devient bon marché la nuit"},
  "sc_desc": {"coding": "Paliers de la frontière Arena WebDev classés par coût réel par tâche : le modèle le moins cher à chaque barreau de qualité.",
              "agent": "Les agents gourmands en contexte sont facturés au token — le modèle le moins cher à chaque barreau Arena, classé par coût réel.",
              "offpeak": "La tarification pointe/creux à la DeepSeek peut diviser la facture par deux la nuit. Quels modèles de la frontière deviennent bon marché en heures creuses."},
  "sc_h1": {"coding": "LLM les moins chers pour coder — chaque palier classé par coût réel",
            "agent": "LLM les moins chers pour agents intensifs — par coût réel par tâche",
            "offpeak": "Guide des demi-tarifs nocturnes — qui devient bon marché la nuit"},
  "sc_intro": {"coding": "Fixez un barreau de qualité (score Arena) : le tableau donne le modèle le moins cher qui le franchit à chaque palier, plus le coût par point du palier suivant. Prix affichés ; la version interactive reprécise au taux de cache et à l'heure.",
               "agent": "Les agents consomment beaucoup de tokens : longs contextes en entrée, longues sorties. Les paliers ci-dessous sont classés au prix affiché — le calculateur ajoute cache et heure.",
               "offpeak": "Plusieurs vendeurs appliquent de forts rabais en heures creuses (DeepSeek : exactement ×0,5). Le tableau est la base prix affiché ; la courbe hebdomadaire 168 h du calculateur montre les chutes nocturnes."},
  "sc_cta": "Ouvrir le scénario « {scene} » dans le calculateur",
  "pd_title": "Baisses et changements de prix LLM (2026) — verdicts de valeur par changement",
  "pd_desc": "Chaque changement de prix LLM API suivi derrière le classement Arena WebDev : anciens → nouveaux prix $/M tokens, dates d'entrée en vigueur, sources vendeurs, et un verdict calculé automatiquement — le modèle reste-t-il sur la frontière de Pareto prix-performance après le changement ?",
  "pd_h1": "Baisses et changements de prix LLM — suivis, sourcés, évalués",
  "pd_intro": "Les vendeurs revisent leurs prix en permanence ; le classement Arena est un instantané périodique qui peut être en retard ou mélanger des prix de canal. Voici chaque mouvement de prix que nous suivons : annonces officielles vérifiées, plus les signaux où le prix du classement et le prix officiel divergent. Chaque ligne est réévaluée à la construction — nous recalculons la frontière de Pareto coût-qualité de chaque classement avec le prix post-changement et indiquons si le modèle s'y maintient.",
  "pd_headline": "Plus grand changement suivi : {model} entrée ${bin} → ${ain} ({pct} %), {eff}",
  "pd_verified_h2": "Changements de prix vérifiés (annoncés par le vendeur)",
  "pd_unverified_h2": "Signaux non vérifiés — prix du classement vs prix officiel",
  "pd_badge_v": "vérifié",
  "pd_badge_u": "non vérifié",
  "pd_col_model": "Modèle",
  "pd_col_change": "Changement de prix ($/M entrée/sortie)",
  "pd_col_eff": "Effet",
  "pd_col_verdict": "Verdict de valeur (après changement)",
  "pd_verdict_on": "Sur la frontière",
  "pd_verdict_off": "Hors frontière",
  "pd_boards": "{on}/{total} classements",
  "pd_empty": "Aucun changement de prix suivi dans cette section pour l'instantané actuel.",
  "pd_eff_date": "à partir du {date}",
  "pd_eff_future": "annoncé — à partir du {date}",
  "pd_eff_tod": "heures creuses : jours ouvrés {w} UTC (+ week-ends)",
  "pd_change_tod": "pointe ${pki}/${pko} · creux ${ofi}/${ofo}",
  "pd_change_duo": "classement ${bi}/${bo} vs officiel ${ai}/${ao}",
  "pd_change_mv": "${bi}/${bo} → ${ai}/${ao}",
  "pd_note": "Prix en USD par million de tokens (entrée/sortie). « Après changement » = le prix vers lequel cet événement déplace le modèle : le nouveau prix annoncé pour les événements vérifiés, le prix vérifié chez le vendeur pour les signaux. Le verdict recalcule la frontière de Pareto à seuil de chaque classement (modèle le moins cher à chaque barreau de qualité) avec le prix post-changement — le même algorithme que le classement.",
  "pd_source": "Source",
  "pd_cta_btn": "Ouvrir le calculateur interactif",
  "pd_cta_line": "Tous les chiffres ici sont des bases statiques au prix du classement. Le calculateur interactif reprécise chaque modèle à votre taux de cache et à l'heure choisie.",
  "pd_dataasof": "Données au {captured} · généré le {gen} (UTC)",
 },
}

SCENE_L10N_KEY = {"coding": "coding", "agent": "agent", "offpeak": "offpeak"}


def slugify(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return re.sub(r"-+", "-", s)


def fmt_cost(c):
    return f"{c:.4f}".rstrip("0").rstrip(".") if c < 1 else f"{c:.2f}"


def fmt_pct(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


def locale_url(lc, path):
    return f"{DOMAIN}/{path}" if lc == "en" else f"{DOMAIN}/{lc}/{path}"


def locale_prefix(lc):
    return "/" if lc == "en" else f"/{lc}/"


def head(lc, title, desc, canonical_path, alt_path=None, og=False):
    # hreflang 互指：alt_path=None 时保持旧行为（互指各语言首页），传子页路径时互指该页各语言版
    if alt_path:
        links = "".join(f'<link rel="alternate" hreflang="{x}" href="{locale_url(x, alt_path)}">' for x in LOCALES)
        links += f'<link rel="alternate" hreflang="x-default" href="{locale_url("en", alt_path)}">'
    else:
        links = "".join(f'<link rel="alternate" hreflang="{x}" href="{locale_url(x, "index.html" if x!="en" else "")}">' for x in LOCALES)
        links += f'<link rel="alternate" hreflang="x-default" href="{DOMAIN}/">'
    canonical = locale_url(lc, canonical_path)
    links += f'<link rel="canonical" href="{canonical}">'
    ogmeta = ""
    if og:
        ogmeta = (f'<meta property="og:title" content="{title}">\n'
                  f'<meta property="og:description" content="{desc}">\n'
                  f'<meta property="og:type" content="article">\n'
                  f'<meta property="og:url" content="{canonical}">\n'
                  f'<meta property="og:image" content="{DOMAIN}/assets/og.png">\n'
                  f'<meta property="og:image:width" content="1200">\n'
                  f'<meta property="og:image:height" content="630">\n'
                  f'<meta name="twitter:card" content="summary_large_image">')
    return f"""<!DOCTYPE html>
<html lang="{lc}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
{links}
{ogmeta}
<style>{STYLE}</style>
</head>
<body><div class="wrap" style="max-width:860px">"""


def lang_nav(lc):
    from build_page import LOCALES as PAGE_LOCALES, LANG_NAMES
    nav = "".join(
        f'<a data-locale-path="{locale_prefix(x)}" href="{locale_prefix(x)}"'
        + (' class="on"' if x == lc else "") + f' hreflang="{x}">{LANG_NAMES[x]}</a>'
        for x in PAGE_LOCALES)
    return f'<nav class="lang" aria-label="Language">{nav}</nav>'


def footer(lc, t, captured, home_href):
    return (f'<p class="hint" style="margin-top:18px">{t["updated"].format(captured=captured)} '
            f'<a href="{locale_prefix(lc)}method.html">{t["method"]}</a> · '
            f'<a href="{home_href}">{t["back"]}</a></p></div></body></html>')


def cost_table(lc, t, rows, winner_name):
    cols = [c.format(model=winner_name) for c in t["tbl"]]
    th = "".join(f"<th>{c}</th>" for c in cols[:3]) + f'<th class="num">{cols[3]}</th><th class="num">{cols[4]}</th>'
    tr = []
    for m, vs in rows:
        tr.append(f"<tr><td><b>{m['model']}</b></td><td>{m['score']}</td>"
                  f'<td>${fmt_cost(m["cost_per_task_p50_usd"])}</td>'
                  f'<td class="num">{vs}</td><td class="num">{m["votes"]:,}</td></tr>')
    return f'<table class="ranktbl"><thead><tr>{th}</tr></thead><tbody>{"".join(tr)}</tbody></table>'


def build_alt(lc, t, entry, tier, prev_tier, next_tier, captured):
    """alternatives 页：tier = 当前档 winner，prev/next = 上一档/下一档（frontier 相邻项）。"""
    name = tier["model"]
    slug = slugify(name)
    canon = f"alternatives/{slug}.html" if lc == "en" else f"alternatives/{slug}.html"
    lo, hi = tier["reigns_score_range"]
    cost = fmt_cost(tier["cost_per_task_p50_usd"])
    href_self = locale_prefix(lc) + f"alternatives/{slug}.html"

    # 降一档 = frontier 中下一档（tier+1，分数更低更便宜）
    if next_tier:
        pct = fmt_pct((1 - next_tier["cost_per_task_p50_usd"] / tier["cost_per_task_p50_usd"]) * 100)
        down = t["down_line"].format(model=next_tier["model"], cost=fmt_cost(next_tier["cost_per_task_p50_usd"]),
                                     pct=pct, delta=tier["score"] - next_tier["score"], score=next_tier["score"],
                                     href=locale_prefix(lc) + f"alternatives/{slugify(next_tier['model'])}.html")
    else:
        down = t["none_down"].format(model=name, score=tier["score"])
    # 升一档 = 上一档
    if prev_tier:
        pct = fmt_pct((prev_tier["cost_per_task_p50_usd"] / tier["cost_per_task_p50_usd"] - 1) * 100)
        # marginal_to_prev_tier 挂在当前档上（all.json 生成方向：下一档持有「升到上一档」的边际）
        marg = fmt_cost(tier["marginal_to_prev_tier"]["usd_per_point"])
        up = t["up_line"].format(model=prev_tier["model"], cost=fmt_cost(prev_tier["cost_per_task_p50_usd"]),
                                 pct=pct, marg=marg, delta=prev_tier["score"] - tier["score"], score=prev_tier["score"],
                                 href=locale_prefix(lc) + f"alternatives/{slugify(prev_tier['model'])}.html")
    else:
        up = t["none_up"].format(model=name)

    # 同段位其它模型（分数在统治区间内、非本模型，按票数降序 top 6）
    peers = [m for m in entry["models"]
             if m["model"] != name and m["score"] is not None
             and lo <= m["score"] <= hi and m["cost_per_task_p50_usd"] is not None]
    peers.sort(key=lambda m: -(m["votes"] or 0))
    peers = peers[:6]
    peer_rows = [(m, "+" + fmt_pct((m["cost_per_task_p50_usd"] / tier["cost_per_task_p50_usd"] - 1) * 100) + "%")
                 for m in peers]

    models = entry["models"]
    winner_score = tier["score"]
    calc_href = locale_prefix(lc) + f'?ds={entry["id"]}&rt={winner_score}'

    html = head(lc, t["alt_title"].format(model=name, score=winner_score, cost=cost),
                t["alt_desc"].format(model=name, score=winner_score, cost=cost), canon)
    html += lang_nav(lc)
    lab = t['spec_lab']
    html += f"""<h1 style="margin-top:10px">{t['alt_h1'].format(model=name)}</h1>
<p class="hint">{t['alt_intro'].format(model=name, score=winner_score)}</p>
<div class="panel" style="margin-top:12px"><h2>{t['spec_h2']}</h2>
<table class="ranktbl"><tbody>
<tr><td>{lab[0]}</td><td><b>{winner_score}</b></td><td>{lab[1]}</td><td><b>${cost}</b></td></tr>
<tr><td>{lab[2]}</td><td>{lo}–{hi}</td><td>{lab[3]}</td><td>{tier['votes']:,}</td></tr>
</tbody></table></div>
<div class="panel" style="margin-top:12px"><h2>{t['down_h2']}</h2><p>{down}</p>
<h2 style="margin-top:10px">{t['up_h2']}</h2><p>{up}</p></div>"""
    if peer_rows:
        html += f"""<div class="panel" style="margin-top:12px"><h2>{t['peers_h2'].format(lo=lo, hi=hi)}</h2>
<p class="hint">{t['peers_note'].format(model=name)}</p>
{cost_table(lc, t, peer_rows, name)}</div>"""
    html += f"""<div class="panel" style="margin-top:12px"><h2>{t['cta_h2']}</h2>
<p class="hint">{t['cta_line']}</p>
<p style="margin-top:8px"><a class="btn primary" href="{calc_href}">{t['cta_btn']}</a></p></div>
"""
    html += footer(lc, t, captured, locale_prefix(lc))
    return html, canon


def build_scene(lc, t, scene, entry, captured):
    name_map = {"coding": "coding", "agent": "agent", "offpeak": "offpeak"}
    key = SCENE_L10N_KEY[scene]
    canon = f"best-llm-for-{scene}.html"
    calc_href = locale_prefix(lc) + f"?scene={scene}"
    rows = [(m, "—") for m in entry["frontier"]]
    html = head(lc, t["sc_title"][key], t["sc_desc"][key], canon)
    html += lang_nav(lc)
    html += f"""<h1 style="margin-top:10px">{t['sc_h1'][key]}</h1>
<p class="hint">{t['sc_intro'][key]}</p>
<div class="panel" style="margin-top:12px">{cost_table(lc, t, rows, t['tbl'][0])}</div>
<div class="panel" style="margin-top:12px"><p class="hint">{t['cta_line']}</p>
<p style="margin-top:8px"><a class="btn primary" href="{calc_href}">{t['sc_cta'].format(scene=t['sc_h1'][key].split('—')[0].strip() if scene!='offpeak' else t['sc_h1'][key])}</a></p></div>
"""
    html += footer(lc, t, captured, locale_prefix(lc))
    return html, canon


# ==================== /price-drops 静态调价页 ====================
# 数据源：src/js/03-pricing.js 的 PRICE_EVENTS（JS 单一事实源，交互器与静态页读同一份，
# 不建第三份拷贝）。构建期提取 → 展开成行 → 用 dist/data/v1/all.json 的榜单数据 +
# 与 build_site.frontier_of / 主站 04-core.js buildTiers 同口径的门槛制前沿算法，
# 对「调价后」价格自动判该模型是否仍在前沿。严禁客户端 JS 拉数据。

OUT_SHARE = 1 / 12   # 输出 token 占比（与主站 03-pricing.js S.outShare 同值，agent 榜实测 in/out ≈ 11×）
PRICE_TOD_WINDOWS_LABEL = "{w}"


def blend(pin, pout):
    """加权单价（与主站 03-pricing.js blend 同式）：Cost/Task 换算按单价比例缩放。"""
    return pin * (1 - OUT_SHARE) + pout * OUT_SHARE


def _split_js_literal(lit):
    """字符串感知切段：返回 [(is_string, text)]。
    str 段已做 JS 单引号 → JSON 双引号（保留 \\n 等转义；\\' → '；\\" → \\"）；
    code 段已剥掉 /* */ 与 // 注释。"""
    parts, code_buf, i, n = [], [], 0, len(lit)
    while i < n:
        c = lit[i]
        if c in "\"'":
            q = c
            j = i + 1
            s = ['"']
            while j < n:
                if lit[j] == "\\" and j + 1 < n:
                    nxt = lit[j + 1]
                    s.append("'" if nxt == "'" else ('\\"' if nxt == '"' else lit[j:j + 2]))
                    j += 2
                    continue
                if lit[j] == q:
                    break
                s.append(lit[j])
                j += 1
            s.append('"')
            if code_buf:
                parts.append((False, "".join(code_buf)))
                code_buf = []
            parts.append((True, "".join(s)))
            i = j + 1
            continue
        if lit[i:i + 2] == "/*":
            e = lit.find("*/", i + 2)
            i = (e + 2) if e >= 0 else n
            continue
        if lit[i:i + 2] == "//":
            e = lit.find("\n", i)
            i = e if e >= 0 else n
            continue
        code_buf.append(c)
        i += 1
    if code_buf:
        parts.append((False, "".join(code_buf)))
    return parts


def js_price_events():
    """从 src/js/03-pricing.js 提取 PRICE_EVENTS 数组字面量 → python list。
    解析 = 字符串感知的去注释 + 单引号转双引号 + 裸键加引号（只对字符串外的 code 段）；
    json.loads 校验，失败直接 raise（构建挂掉好过静默错数）。"""
    src = (ROOT / "src" / "js" / "03-pricing.js").read_text(encoding="utf-8")
    i = src.index("const PRICE_EVENTS=")
    j = src.index("[", i)
    # 字符串感知的方括号配对扫描（字符串里的 // /* 不算注释，] 不算闭合）
    depth, k, in_str, q = 0, j, False, ""
    while k < len(src):
        c = src[k]
        if in_str:
            if c == "\\":
                k += 2
                continue
            if c == q:
                in_str = False
        elif c in "\"'":
            in_str, q = True, c
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                break
        k += 1
    lit = src[j:k + 1]
    out = []
    for is_str, seg in _split_js_literal(lit):
        if is_str:
            out.append(seg)
        else:
            seg = re.sub(r"([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)", r'\1"\2"\3', seg)
            seg = re.sub(r",\s*([}\]])", r"\1", seg)
            out.append(seg)
    events = json.loads("".join(out))
    if not isinstance(events, list) or not events:
        raise ValueError("PRICE_EVENTS extraction produced no events")
    for ev in events:
        for f in ("id", "conf", "entries"):
            if f not in ev:
                raise ValueError(f"event missing field {f}: {ev.get('id')}")
    return events


def frontier_membership(rows, target):
    """门槛制前沿判定（与 build_site.frontier_of / 04-core.js buildTiers 同口径）：
    分数降序扫，只有严格比「已见的所有更强模型」都便宜时才成为一档。
    rows = [(name, score, cost)]；返回 target 是否在前沿。"""
    costed = [(s, c, n) for (n, s, c) in rows if s is not None and c is not None]
    costed.sort(key=lambda x: (-x[0], x[1]))
    best = None
    for s, c, n in costed:
        if best is None or c < best - 1e-12:
            best = c
            if n == target:
                return True
    return False


def verdict_after_change(name, after_pin, after_pout, boards):
    """结论列：用调价后价格重算该模型出现的每个文本榜（unit=task）的前沿。
    调价后成本 = 榜面实测 cost × blend(after价)/blend(榜面价)（用量不随价变，按单价比例缩放）。
    返回 (on, total)；模型不在任何可判定榜 → None。"""
    on = total = 0
    for b in boards:
        if b.get("unit") == "image":
            continue
        tgt = None
        for m in b["models"]:
            if (m["model"] == name and m["score"] is not None
                    and m["cost_per_task_p50_usd"] is not None
                    and m["price_in_per_m_usd"] and m["price_out_per_m_usd"]):
                tgt = m
                break
        if tgt is None:
            continue
        base = blend(tgt["price_in_per_m_usd"], tgt["price_out_per_m_usd"])
        if base <= 0:
            continue
        cost_after = tgt["cost_per_task_p50_usd"] * blend(after_pin, after_pout) / base
        rows = [(m["model"], m["score"],
                 cost_after if m["model"] == name else m["cost_per_task_p50_usd"])
                for m in b["models"]]
        total += 1
        if frontier_membership(rows, name):
            on += 1
    return (on, total) if total else None


URL_RE = re.compile(r"\b((?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s;,)\]]*)?)", re.I)


def source_links(src_text):
    """事件 src 文本 → 可点来源链接（只转文本里已出现的 URL 形态 token，不新增不猜测）。
    无 URL token → 返回 []（调用方回退为纯文本展示）。"""
    links, seen = [], set()
    for m in URL_RE.finditer(src_text):
        u = m.group(1).rstrip(".")
        host = u.split("/")[0].lower()
        if host in seen:
            continue
        seen.add(host)
        links.append(f'<a href="https://{u}" rel="nofollow noopener" target="_blank">{host}</a>')
    return links


def fmt_price(p):
    return f"{p:.4f}".rstrip("0").rstrip(".") if p < 1 else f"{p:.2f}"


def family_of(names):
    """entries 多个模型名 → 最长公共前缀（截到最后完整 token）作事件主体名。"""
    if len(names) == 1:
        return names[0]
    pre = names[0]
    for x in names[1:]:
        while not x.startswith(pre):
            pre = pre[:-1]
    pre = pre.rstrip(" -(（")
    return pre or names[0]


def pd_after_price(ev, e):
    """「调价后」价格：date 事件 = after（官宣新价/核验价）；
    tod 事件 = off（错峰可达最低价，peak/off 两档并存）。"""
    if ev["kind"] == "tod":
        return e["off"]
    return e["after"]


def pd_moves(events):
    """页头传播句候选：每个 official 事件的 |输入价变化幅度|（date=before→after，tod=off vs peak）。"""
    moves = []
    for ev in events:
        if ev.get("conf") != "official":
            continue
        names = list(ev["entries"].keys())
        for nm, e in ev["entries"].items():
            if ev["kind"] == "tod":
                pct = (e["off"][0] / e["peak"][0] - 1) * 100
                eff = "tod"
            else:
                pct = (e["after"][0] / e["before"][0] - 1) * 100
                eff = ev.get("date", "")
            moves.append({"model": family_of(names), "pct": pct,
                          "bin": e["before" if ev["kind"] != "tod" else "peak"][0],
                          "ain": e["off" if ev["kind"] == "tod" else "after"][0],
                          "eff": eff, "ev": ev})
    return moves


def build_price_drops(lc, t, events, leaderboards, captured, gen_now):
    canon = "price-drops.html"
    # 页头传播句：|pct| 最大的 official 事件（数据实算，不手写）
    moves = pd_moves(events)
    head_line = ""
    if moves:
        mv = max(moves, key=lambda x: abs(x["pct"]))
        eff_lbl = (t["pd_eff_tod"].format(w="01:00–04:00 & 06:00–10:00") if mv["eff"] == "tod"
                   else t["pd_eff_future"].format(date=mv["eff"]))
        head_line = t["pd_headline"].format(
            model=mv["model"], bin=fmt_price(mv["bin"]), ain=fmt_price(mv["ain"]),
            pct=f"{mv['pct']:+.0f}", eff=eff_lbl)

    def verdict_cell(name, e, ev):
        after = pd_after_price(ev, e)
        v = verdict_after_change(name, after[0], after[1], leaderboards)
        if v is None:
            return "—", after
        on, total = v
        word = t["pd_verdict_on"] if on else t["pd_verdict_off"]
        detail = t["pd_boards"].format(on=on, total=total)
        tip = (f"after ${fmt_price(after[0])}/${fmt_price(after[1])} per M "
               f"(in/out) — {on} of {total} task boards still frontier")
        cls = "pd-on" if on else "pd-off"
        return (f'<span class="{cls}" title="{tip}"><b>{word}</b> · {detail}</span>', after)

    def eff_cell(ev):
        if ev["kind"] == "tod":
            ws = " & ".join(f"{w[0]:02d}:00–{w[1]:02d}:00" for w in ev["windows"])
            return t["pd_eff_tod"].format(w=ws)
        d = ev.get("date", "")
        return (t["pd_eff_future"] if ev.get("future") else t["pd_eff_date"]).format(date=d)

    def change_cell(ev, e):
        if ev["kind"] == "tod":
            return t["pd_change_tod"].format(pki=fmt_price(e["peak"][0]), pko=fmt_price(e["peak"][1]),
                                             ofi=fmt_price(e["off"][0]), ofo=fmt_price(e["off"][1]))
        if ev.get("conf") != "official":
            return t["pd_change_duo"].format(bi=fmt_price(e["before"][0]), bo=fmt_price(e["before"][1]),
                                             ai=fmt_price(e["after"][0]), ao=fmt_price(e["after"][1]))
        return t["pd_change_mv"].format(bi=fmt_price(e["before"][0]), bo=fmt_price(e["before"][1]),
                                        ai=fmt_price(e["after"][0]), ao=fmt_price(e["after"][1]))

    def event_table(group_events):
        if not group_events:
            return f'<p class="hint pd-empty">{t["pd_empty"]}</p>'
        bodies = []
        n_rows = 0
        for ev in group_events:
            badge = t["pd_badge_v"] if ev.get("conf") == "official" else t["pd_badge_u"]
            links = source_links(ev.get("src", ""))
            src_html = (" ".join(links) if links
                        else (ev.get("src", "") or "").split(";")[0].strip())
            head_row = (f'<tr class="pd-ev"><td colspan="4"><b>{ev["name"]}</b> '
                        f'<span class="pd-badge">{badge}</span><br>'
                        f'<span class="pd-src">{t["pd_source"]}: {src_html}</span></td></tr>')
            rows = []
            for nm, e in ev["entries"].items():
                vtxt, _ = verdict_cell(nm, e, ev)
                rows.append(f'<tr class="pd-row" data-pd-row><td class="nm"><b>{nm}</b></td>'
                            f'<td>{change_cell(ev, e)}</td>'
                            f'<td>{eff_cell(ev)}</td>'
                            f'<td>{vtxt}</td></tr>')
                n_rows += 1
            bodies.append(f"<tbody>{head_row}{''.join(rows)}</tbody>")
        return (f'<table class="ranktbl pd" data-pd-count="{n_rows}">'
                f'<thead><tr><th>{t["pd_col_model"]}</th><th>{t["pd_col_change"]}</th>'
                f'<th>{t["pd_col_eff"]}</th><th>{t["pd_col_verdict"]}</th></tr></thead>'
                f'{"".join(bodies)}</table>')

    official = [e for e in events if e.get("conf") == "official"]
    uncertain = [e for e in events if e.get("conf") != "official"]

    html = head(lc, t["pd_title"], t["pd_desc"], canon,
                alt_path=canon, og=True)
    html += lang_nav(lc)
    html += f'<h1 style="margin-top:10px">{t["pd_h1"]}</h1>'
    if head_line:
        html += f'<p class="pd-headline">{head_line}</p>'
    html += f'<p class="hint">{t["pd_intro"]}</p>'
    html += f'<p class="hint pd-note">{t["pd_note"]}</p>'
    html += f'<div class="panel" style="margin-top:12px"><h2>{t["pd_verified_h2"]}</h2>{event_table(official)}</div>'
    html += (f'<div class="panel" style="margin-top:12px"><h2>{t["pd_unverified_h2"]}</h2>'
             f'{event_table(uncertain)}</div>')
    calc_href = locale_prefix(lc)
    html += (f'<div class="panel" style="margin-top:12px"><p class="hint">{t["pd_cta_line"]}</p>'
             f'<p style="margin-top:8px"><a class="btn primary" href="{calc_href}">{t["pd_cta_btn"]}</a></p></div>')
    html += (f'<p class="hint" style="margin-top:18px">{t["pd_dataasof"].format(captured=captured, gen=gen_now)} '
             f'<a href="{locale_prefix(lc)}method.html">{t["method"]}</a> · '
             f'<a href="{locale_prefix(lc)}">{t["back"]}</a></p></div>\n'
             f'<script src="/analytics.js" defer></script>\n</body>\n</html>')
    return html, canon


def append_llms(line):
    """往 dist/llms.txt 的 Pages 段追加一行（build_seo_pages 在 build_site 之后跑）。"""
    f = OUT / "llms.txt"
    s = f.read_text(encoding="utf-8")
    f.write_text(s.rstrip("\n") + "\n" + line + "\n", encoding="utf-8")


def append_sitemap(entries):
    """往 dist/sitemap.xml 追加 SEO 页条目（build_seo_pages 在 build_site 之后跑）。"""
    smf = OUT / "sitemap.xml"
    sm = smf.read_text(encoding="utf-8")
    today = json.loads(ALL.read_text(encoding="utf-8"))["meta"]["generated"]
    add = []
    by_lc = {}
    for lc, canon in entries:
        by_lc.setdefault(canon, []).append(lc)
    for canon, lcs in sorted(by_lc.items()):
        hrefs = "".join(f'\n  <xhtml:link rel="alternate" hreflang="{x}" href="{locale_url(x, canon)}"/>'
                        for x in LOCALES if x in lcs)
        hrefs += f'\n  <xhtml:link rel="alternate" hreflang="x-default" href="{locale_url("en", canon)}"/>'
        for lc in lcs:
            add.append(f'  <url><loc>{locale_url(lc, canon)}</loc><lastmod>{today}</lastmod>'
                       f'<changefreq>weekly</changefreq><priority>{"0.7" if lc=="en" else "0.6"}</priority>{hrefs}\n  </url>')
    sm = sm.replace("</urlset>", "\n".join(add) + "\n</urlset>")
    smf.write_text(sm, encoding="utf-8")
    return len(by_lc), sum(len(v) for v in by_lc.values())


def main():
    data = json.loads(ALL.read_text(encoding="utf-8"))
    captured = data["meta"].get("captured") or data["meta"].get("scraped", "")
    captured_scraped = data["meta"].get("scraped") or captured
    entry = next(b for b in data["leaderboards"] if b["id"] == "overall_os")
    tiers = entry["frontier"]
    n_pages, n_urls = 0, 0
    entries = []
    gen_now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M")
    events = js_price_events()
    for lc in LOCALES:
        t = L10N[lc]
        od = (OUT / lc / "alternatives") if lc != "en" else (OUT / "alternatives")
        od.mkdir(parents=True, exist_ok=True)
        for i, tier in enumerate(tiers):
            prev_t = tiers[i - 1] if i > 0 else None
            next_t = tiers[i + 1] if i + 1 < len(tiers) else None
            html, canon = build_alt(lc, t, entry, tier, prev_t, next_t, captured)
            f = od / f"{slugify(tier['model'])}.html"
            f.write_text(html, encoding="utf-8")
            entries.append((lc, canon))
            n_pages += 1
        for scene in SCENES:
            html, canon = build_scene(lc, t, scene, entry, captured)
            f = (OUT / lc / f"best-llm-for-{scene}.html") if lc != "en" else (OUT / f"best-llm-for-{scene}.html")
            f.write_text(html, encoding="utf-8")
            entries.append((lc, canon))
            n_pages += 1
        # /price-drops 静态调价页（数据 = 03-pricing.js PRICE_EVENTS + all.json 前沿）
        html, canon = build_price_drops(lc, t, events, data["leaderboards"], captured_scraped, gen_now)
        f = (OUT / lc / canon) if lc != "en" else (OUT / canon)
        f.write_text(html, encoding="utf-8")
        entries.append((lc, canon))
        n_pages += 1
    n_canon, n_urls = append_sitemap(entries)
    append_llms(f"- [Price drops & changes]({DOMAIN}/price-drops.html): every tracked LLM price move — old → new $/M prices, effective dates, sources, and an auto-computed verdict of whether each model stays on its board's Pareto frontier after the change.")
    print(f"seo pages: wrote {n_pages} files ({n_canon} canonical paths, sitemap +{n_urls} urls, frontier={len(tiers)}, locales={len(LOCALES)}, price_events={len(events)})")


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT / "scripts"))
    main()
