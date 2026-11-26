#!/usr/bin/env python3
"""W1 /price-drops 静态调价页回归测试（构建期 python 逻辑，不依赖 node）。

覆盖验收口径：
  ① JS 提取器：src/js/03-pricing.js PRICE_EVENTS 与 build_site.py all.json 版事件 id 集一致（双源交叉校验）
  ② 结论列算法：frontier_membership / verdict_after_change（与 build_site.frontier_of 同口径）
  ③ 渲染：表格行数 = events 展开行数、每行结论非空、空态文案、verified/unverified 分节、页头传播句
  ④ 与主站排行榜一致性：after 价 = 榜面价的行，verdict 必须与 all.json frontier 成员一致
     （条件测试：dist/data/v1/all.json 存在才跑；全量验证在部署前跑一次构建链）

用法： python3 test/test_price_drops.py -v
"""
import json
import pathlib
import re
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import build_seo_pages as bsp  # noqa: E402


class TestExtractor(unittest.TestCase):
    """① 从 03-pricing.js 提取 PRICE_EVENTS。"""

    def test_extracts_events_with_required_fields(self):
        events = bsp.js_price_events()
        self.assertGreaterEqual(len(events), 5)
        for ev in events:
            self.assertIn(ev.get("conf"), ("official", "suspected"), ev.get("id"))
            self.assertTrue(ev.get("entries"), ev.get("id"))
            for nm, e in ev["entries"].items():
                if ev["kind"] == "tod":
                    self.assertIn("peak", e); self.assertIn("off", e)
                else:
                    self.assertIn("before", e); self.assertIn("after", e)
                self.assertTrue(nm, "entry key must be a model name")

    def test_ids_match_alljson_source_of_truth(self):
        """JS 侧与 build_site.py（all.json price_events）双源 id 集必须一致——
        交互器和静态页各读一份，id 漂移 = 数据腐烂。"""
        js_ids = {e["id"] for e in bsp.js_price_events()}
        py_src = (ROOT / "build_site.py").read_text(encoding="utf-8")
        py_ids = set(re.findall(r'\{"id":"(\w+)"', py_src))
        self.assertEqual(js_ids, py_ids)


class TestVerdict(unittest.TestCase):
    """② 前沿判定算法（与 build_site.frontier_of 同口径：严格更便宜才进档）。"""

    def setUp(self):
        self.boards = [{
            "id": "b1", "unit": "task",
            "models": [
                {"model": "Top", "score": 1400, "cost_per_task_p50_usd": 1.0,
                 "price_in_per_m_usd": 2.0, "price_out_per_m_usd": 10.0},
                {"model": "Mid", "score": 1300, "cost_per_task_p50_usd": 0.5,
                 "price_in_per_m_usd": 1.0, "price_out_per_m_usd": 5.0},
                {"model": "Cheap", "score": 1200, "cost_per_task_p50_usd": 0.2,
                 "price_in_per_m_usd": 0.4, "price_out_per_m_usd": 2.0},
                {"model": "Waste", "score": 1250, "cost_per_task_p50_usd": 0.9,
                 "price_in_per_m_usd": 1.8, "price_out_per_m_usd": 9.0},
            ]}]

    def test_frontier_membership_pareto_chain(self):
        rows = [("Top", 1400, 1.0), ("Mid", 1300, 0.5), ("Cheap", 1200, 0.2)]
        self.assertTrue(bsp.frontier_membership(rows, "Top"))
        self.assertTrue(bsp.frontier_membership(rows, "Mid"))
        self.assertTrue(bsp.frontier_membership(rows, "Cheap"))
        # Waste 比 Mid 更贵且分数更低 → 被支配
        rows2 = rows + [("Waste", 1250, 0.9)]
        self.assertFalse(bsp.frontier_membership(rows2, "Waste"))

    def test_price_cut_joins_frontier(self):
        """降价：Waste 从 0.9 降到 0.4（低于同段所有更强者）→ 进前沿。"""
        v = bsp.verdict_after_change("Waste", 0.9, 4.5, [])  # boards 空 → None
        self.assertIsNone(v)
        # 用低价直算：构造「调价后」= Waste 成本 0.4（blend 同比降 55%）
        # Waste 榜面 blend = 0.9；after blend 0.4 → ratio 4/9；输入价 1.8→0.8 输出 9→4
        v = bsp.verdict_after_change("Waste", 0.8, 4.0, self.boards)
        self.assertEqual(v, (1, 1))

    def test_price_hike_leaves_frontier(self):
        """涨价：Cheap 0.2 → 0.95（仍比 Mid 贵不了多少但比 Top 贵？）验证退出判定：
        Cheap blend×4.75 ≈ 0.95 → 分数段内被 Mid(0.5) 支配 → 出前沿。"""
        v = bsp.verdict_after_change("Cheap", 1.9, 9.5, self.boards)
        self.assertEqual(v, (0, 1))

    def test_image_boards_skipped_and_missing_model_none(self):
        img = [{"id": "t2i", "unit": "image", "models": [{"model": "Waste", "score": 900,
                "cost_per_task_p50_usd": 0.05, "price_in_per_m_usd": 0.01, "price_out_per_m_usd": 0.01}]}]
        self.assertIsNone(bsp.verdict_after_change("Waste", 1, 1, img))
        self.assertIsNone(bsp.verdict_after_change("Nobody", 1, 1, self.boards))


class TestRender(unittest.TestCase):
    """③ 渲染：行数/结论非空/空态/分节/headline。"""

    def setUp(self):
        # DOMAIN 来自 sys.argv（构建脚本习惯），unittest 的 argv 会污染 → 固定为线上域名
        bsp.DOMAIN = "https://modelprice.damolabs.app"
        self.events = [
            {"id": "ev_a", "kind": "date", "conf": "official", "date": "2026-12-01", "future": True,
             "name": "TestA hike", "src": "example.com/pricing (checked 2026-01-01)",
             "entries": {"M-One": {"listed": "before", "before": [2.0, 10.0], "after": [4.0, 20.0]}}},
            {"id": "ev_b", "kind": "date", "conf": "suspected", "date": "2026-11-20",
             "name": "TestB flag", "src": "no url here",
             "entries": {"M-One": {"listed": "before", "before": [0.45, 3.0], "after": [0.6, 3.6]}}},
        ]
        self.leaderboards = [{
            "id": "overall_all", "unit": "task",
            "models": [
                {"model": "M-One", "score": 1300, "cost_per_task_p50_usd": 0.5,
                 "price_in_per_m_usd": 2.0, "price_out_per_m_usd": 10.0},
                {"model": "Rival", "score": 1250, "cost_per_task_p50_usd": 0.3,
                 "price_in_per_m_usd": 1.0, "price_out_per_m_usd": 5.0},
            ]}]

    def _render(self, events, leaderboards):
        return bsp.build_price_drops("en", bsp.L10N["en"], events, leaderboards,
                                     "2026-11-22", "2026-11-26 12:00")

    def test_row_count_equals_entries(self):
        html, _ = self._render(self.events, self.leaderboards)
        n = len(re.findall(r'data-pd-row', html))
        expected = sum(len(e["entries"]) for e in self.events)
        self.assertEqual(n, expected)

    def test_every_row_has_nonempty_verdict(self):
        html, _ = self._render(self.events, self.leaderboards)
        rows = re.findall(r'<tr class="pd-row"[^>]*>(.*?)</tr>', html, re.S)
        self.assertTrue(rows)
        for r in rows:
            self.assertTrue(("pd-on" in r) or ("pd-off" in r) or (">—<" in r),
                            f"verdict cell empty in row: {r[:120]}")

    def test_empty_group_renders_empty_state(self):
        # 只喂 official 事件 → unverified 节应出空态文案（且仅出现 1 次）
        html, _ = self._render([e for e in self.events if e["conf"] == "official"], self.leaderboards)
        self.assertIn(bsp.L10N["en"]["pd_empty"], html)
        self.assertEqual(html.count(bsp.L10N["en"]["pd_empty"]), 1)
        # 两组都非空 → 不出空态
        html2, _ = self._render(self.events, self.leaderboards)
        self.assertNotIn(bsp.L10N["en"]["pd_empty"], html2)
        # 全空 → 两节各一个空态
        html3, _ = self._render([], self.leaderboards)
        self.assertEqual(html3.count(bsp.L10N["en"]["pd_empty"]), 2)

    def test_sections_and_headline_and_seo_bits(self):
        html, canon = self._render(self.events, self.leaderboards)
        self.assertEqual(canon, "price-drops.html")
        self.assertIn("Verified price changes", html)
        self.assertIn("Unverified flags", html)
        # headline: ev_a input 2→4 = +100%（|pct| 最大）
        self.assertIn("M-One input $2.00 → $4.00 (+100%)", html)
        self.assertIn('rel="canonical" href="https://modelprice.damolabs.app/price-drops.html"', html)
        self.assertIn('property="og:image"', html)
        self.assertIn('name="twitter:card"', html)
        self.assertIn("Data as of 2026-11-22 · generated 2026-11-26 12:00 (UTC)", html)
        self.assertIn('hreflang="ja" href="https://modelprice.damolabs.app/ja/price-drops.html"', html)
        # 事件来源链接：文本里已有的 URL 才转链接；无 URL 的回退纯文本
        self.assertIn('href="https://example.com/pricing"', html)
        self.assertIn("no url here", html)
        # 不允许客户端 JS fetch 承载内容：只允许共用 analytics.js
        self.assertNotIn("fetch(", html)
        self.assertIn('src="/analytics.js"', html)


class TestLiveConsistency(unittest.TestCase):
    """④ 真实数据一致性（需先跑构建链；无 dist 时跳过——CI/部署前全量跑）。"""

    ALL = ROOT / "dist" / "data" / "v1" / "all.json"

    def setUp(self):
        if not self.ALL.exists():
            self.skipTest("dist/data/v1/all.json 不存在 —— 先跑 python3 build_site.py")

    def test_row_count_and_verdicts_on_real_data(self):
        data = json.loads(self.ALL.read_text(encoding="utf-8"))
        events = bsp.js_price_events()
        html, _ = bsp.build_price_drops("en", bsp.L10N["en"], events,
                                        data["leaderboards"], "2026-11-22", "2026-11-26 12:00")
        n_rows = len(re.findall(r"data-pd-row", html))
        n_entries = sum(len(e["entries"]) for e in events)
        self.assertEqual(n_rows, n_entries)
        # 「—」行 = 该模型所有文本榜都缺实测 Cost/Task（如 GLM-4.7），不能瞎判 →
        # 断言这些模型确实全榜无 cost（缺数据的行才允许 —）
        dashes = set(re.findall(r'data-pd-row><td class="nm"><b>([^<]+)</b></td><td>[^<]*</td>'
                                r'<td>[^<]*</td><td>—</td>', html))
        self.assertLessEqual(len(dashes), n_entries)
        for nm in dashes:
            for bd in data["leaderboards"]:
                if bd.get("unit") == "image":
                    continue
                m = next((x for x in bd["models"] if x["model"] == nm), None)
                if m is not None and m["score"] is not None:
                    self.assertIsNone(m["cost_per_task_p50_usd"],
                                      f"{nm} 有实测 cost 却判 — : board={bd['id']}")

    def test_boardprice_rows_match_alljson_frontier(self):
        """after 价 = 榜面价的行：verdict 聚合 (on, total) 必须等于「逐榜 all.json frontier 成员计数」。
        （单榜判定与 all.json frontier 同口径；verdict 是跨榜聚合，两者在计数层面必须一致。）"""
        data = json.loads(self.ALL.read_text(encoding="utf-8"))
        events = bsp.js_price_events()
        agg_checked = solo_checked = 0
        for ev in events:
            for nm, e in ev["entries"].items():
                after = bsp.pd_after_price(ev, e)
                on_count = total = 0
                matched_any = False
                for bd in data["leaderboards"]:
                    if bd.get("unit") == "image":
                        continue
                    tgt = next((m for m in bd["models"] if m["model"] == nm), None)
                    if not tgt or tgt["price_in_per_m_usd"] is None or tgt["cost_per_task_p50_usd"] is None:
                        continue
                    if (abs(after[0] - tgt["price_in_per_m_usd"]) < 1e-9
                            and abs(after[1] - tgt["price_out_per_m_usd"]) < 1e-9):
                        total += 1
                        in_f = any(t["model"] == nm for t in bd["frontier"])
                        if in_f:
                            on_count += 1
                        # 单榜同构性：ratio=1 的 frontier_membership 必须与 all.json frontier 一致
                        rows = [(m["model"], m["score"], m["cost_per_task_p50_usd"]) for m in bd["models"]]
                        self.assertEqual(bsp.frontier_membership(rows, nm), in_f,
                                         f"{nm} @ {bd['id']}: solo judge != all.json frontier")
                        solo_checked += 1
                        matched_any = True
                if matched_any:
                    v = bsp.verdict_after_change(nm, after[0], after[1], data["leaderboards"])
                    self.assertEqual(v, (on_count, total), nm)
                    agg_checked += 1
        self.assertGreaterEqual(solo_checked, 1, "至少应有一个 after==榜面价的 (模型,榜) 对可对照")
        self.assertGreaterEqual(agg_checked, 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
