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


def head(lc, title, desc, canonical_path):
    links = "".join(f'<link rel="alternate" hreflang="{x}" href="{locale_url(x, "index.html" if x!="en" else "")}">' for x in LOCALES)
    links += f'<link rel="alternate" hreflang="x-default" href="{DOMAIN}/">'
    links += f'<link rel="canonical" href="{locale_url(lc, canonical_path)}">'
    return f"""<!DOCTYPE html>
<html lang="{lc}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
{links}
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
    entry = next(b for b in data["leaderboards"] if b["id"] == "overall_os")
    tiers = entry["frontier"]
    n_pages, n_urls = 0, 0
    entries = []
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
    n_canon, n_urls = append_sitemap(entries)
    print(f"seo pages: wrote {n_pages} files ({n_canon} canonical paths, sitemap +{n_urls} urls, frontier={len(tiers)}, locales={len(LOCALES)})")


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT / "scripts"))
    main()
