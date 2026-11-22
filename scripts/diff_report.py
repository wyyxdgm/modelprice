#!/usr/bin/env python3
"""diff_report.py — 新旧 datasets.json 跳变报告（refresh-data.sh ⑤ 段调用）。

功能: 对照 git HEAD 的 data/datasets.json, 报告榜单日期变化 / 行数变化 / top1 变化 /
      分数跳变(>30 分) / 新进掉出(top40 & OS 榜) / 价格跳变(标 PRICE_CHANGE, 触发人工核对)。
关注点: git 仓库无 HEAD（首次跑）或旧文件缺失时降级为「首次基线」; 输出保持纯文本,
        refresh-data.sh 用 grep 'PRICE_CHANGE' 判定退出码 2。"""
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).parent.parent
NEW = json.loads((ROOT / "data" / "datasets.json").read_text(encoding="utf-8"))

old_raw = None
try:
    old_raw = subprocess.run(
        ["git", "show", "HEAD:data/datasets.json"],
        capture_output=True, text=True, cwd=ROOT, timeout=20,
    ).stdout
except Exception:
    pass
OLD = json.loads(old_raw) if old_raw else None

lines = [f"captured: {OLD['captured'] if OLD else '(首次基线)'} → {NEW['captured']}"]
price_changes = {}

if not OLD:
    print("\n".join(lines))
    sys.exit(0)

F_N, F_S, F_C, F_PIN, F_POUT = 0, 6, 12, 13, 14  # FIELDS 列序: n,s,c,pin,pout

for key, nd in NEW["datasets"].items():
    od = OLD["datasets"].get(key)
    if not od:
        lines.append(f"{key}: 新榜单（旧数据无此板）")
        continue
    o_by, n_by = {r[F_N]: r for r in od["rows"]}, {r[F_N]: r for r in nd["rows"]}
    if len(od["rows"]) != len(nd["rows"]):
        lines.append(f"{key}: 行数 {len(od['rows'])} → {len(nd['rows'])}")
    top_o = od["rows"][0][F_N] if od["rows"] else None
    top_n = nd["rows"][0][F_N] if nd["rows"] else None
    if top_o != top_n:
        lines.append(f"{key}: top1 变化 {top_o} → {top_n}")
    added = set(n_by) - set(o_by)
    removed = set(o_by) - set(n_by)
    if added:
        lines.append(f"{key}: 新进 {len(added)}: {', '.join(sorted(added)[:5])}{'…' if len(added) > 5 else ''}")
    if removed:
        lines.append(f"{key}: 掉出 {len(removed)}: {', '.join(sorted(removed)[:5])}{'…' if len(removed) > 5 else ''}")
    for name in sorted(set(o_by) & set(n_by)):
        o, n = o_by[name], n_by[name]
        if o[F_S] and n[F_S] and abs(n[F_S] - o[F_S]) > 30:
            lines.append(f"{key}: 分数跳变 {name}: {o[F_S]} → {n[F_S]}")
        po, pn = (o[F_PIN], o[F_POUT]), (n[F_PIN], n[F_POUT])
        if None not in po and None not in pn and po != pn:
            price_changes.setdefault(name, {"boards": [], "old": po, "new": pn})
            price_changes[name]["boards"].append(key)

# PRICE_EVENTS 候选提示（价格跳变 = 事件规则需要核对）
if price_changes:
    lines.append("PRICE_CHANGES_BY_MODEL（跨板去重）:")
    for name, c in price_changes.items():
        lines.append(f"  PRICE_CHANGE {name}: ${c['old'][0]}/${c['old'][1]} → ${c['new'][0]}/${c['new'][1]}  [{len(c['boards'])} 板]")
    lines.append(f"→ {len(price_changes)} 个模型价格变化 = PRICE_EVENTS 候选, 派 AI 或人工核对厂商定价页后更新 src/js/03-pricing.js")

print("\n".join(lines))
sys.exit(0)
