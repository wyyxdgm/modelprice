#!/usr/bin/env python3
"""Parse Arena.ai leaderboard markdown tables (as returned by the public page) into compact JSON."""
import json, re, sys, pathlib

RAW = pathlib.Path(__file__).parent / "raw"
OUT = pathlib.Path(__file__).parent / "data" / "datasets.json"

LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
SCORE = re.compile(r"(\d{3,4})\s*\+(\d+)\s*/\s*-(\d+)")   # 不锚定：AutoEval 行尾部还挂着 [AutoEval](...) 链接


def money(s):
    s = s.strip()
    if s in ("", "N/A", "-", "—"):
        return None
    s = s.replace("$", "").replace(",", "").strip()
    try:
        return float(s)
    except ValueError:
        return None


def ints(s):
    s = s.strip().replace(",", "")
    if s in ("", "N/A", "-"):
        return None
    try:
        return int(s)
    except ValueError:
        return None


def parse_model_cell(cell):
    """cell -> (name, url, lab, license)"""
    links = list(LINK.finditer(cell))
    if not links:
        return None
    name, url = links[-1].group(1), links[-1].group(2)
    head = LINK.split(cell)[0].replace("<br>", " ").strip()
    lab = head if head else None
    # 不能用 split(")")[-1]：模型页 URL 里本身可能有 ')'。取最后一个链接之后的文本。
    last = links[-1]
    end = last.end()
    tail = cell[end:].replace("<br>", " ").strip()
    lic = None
    if "·" in tail:
        lic = tail.split("·", 1)[1].strip()
    elif tail and not lab:
        lic = tail
    if lab is None and lic is None and "·" in tail:
        lab = tail.split("·")[0].strip()
    return name.strip(), url.strip(), lab, lic


def parse_score(cell):
    cell = cell.replace("<br>", " ").strip()
    prelim = "Preliminary" in cell
    autoeval = "AutoEval" in cell
    cell = re.sub(r"\[AutoEval\]\([^)]*\)", "", cell)
    cell = cell.replace("Preliminary", " ").strip()
    m = SCORE.search(cell)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2)), int(m.group(3)), prelim, autoeval


def parse_table(text, has_overall_rank):
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 8:
            continue
        # 注意：set("") <= {...} 在 Python 里是 True（空集是任何集合的子集），
        # 所以必须先判空 —— 否则 rank 为空的 AutoEval 行会被当成分隔行丢掉。
        if not cells[0] or cells[0].lower() == "rank" or set(cells[0]) <= {"-", " ", ":"}:
            if not cells[0] and len(cells) >= 8 and "[" in cells[2]:
                pass  # rank 空但有模型链接 → 是 AutoEval 之类的合法行，继续解析
            else:
                continue
        try:
            if has_overall_rank:
                rank, orank, model, score, spread, votes, cost, price, ctx = cells[:9]
            else:
                rank, spread, model, score, votes, cost, price, ctx = cells[:8]
                orank = None
            parsed_model = parse_model_cell(model)
            parsed_score = parse_score(score)
            if not parsed_model or not parsed_score:
                print("  !! skipped unparsable row:", cells[:4], file=sys.stderr)
                continue
            name, url, lab, lic = parsed_model
            s, up, dn, prelim, autoeval = parsed_score
            pin, pout = (price.split("/") + [None, None])[:2]
            rows.append({
                "n": name, "u": url, "lab": lab, "lic": lic,
                "r": ints(rank), "or": ints(orank) if orank is not None else None,
                "s": s, "u95": up, "d95": dn, "pre": prelim, "ae": autoeval,
                "v": ints(votes), "c": money(cost),
                "pin": money(pin), "pout": money(pout),
                "ctx": None if ctx.strip() in ("", "N/A") else ctx.strip(),
            })
        except ValueError as e:
            print("  !! row error:", e, cells[:3], file=sys.stderr)
    return rows


DATASETS = [
    ("overall_os", "WebDev · Overall", "code/webdev", "open-source", True,
     "997,838 votes · 63 open source models", "All 63 open-source models"),
    ("frontend_os", "WebDev · Frontend", "code/webdev/frontend", "open-source", True,
     "865,237 votes · 63 open source models", "All 63 open-source models"),
    ("fullstack_os", "WebDev · Fullstack", "code/webdev/fullstack", "open-source", True,
     "124,674 votes · 34 open source models", "All 34 open-source models"),
    ("react_os", "WebDev · React", "code/webdev/react", "open-source", True,
     "656,360 votes · 59 open source models",
     "All 59 open-source models (row 44 Hy3 preview stitched from two scrape chunks; Overall Rank inferred)"),
    ("reference_os", "WebDev · Reference-based design", "code/webdev/reference-based-design", "open-source", True,
     "227,361 votes · 63 open source models", "All 63 open-source models"),
    ("img2webdev_os", "Image-to-WebDev (screenshot to code)", "code/image-to-webdev", "open-source", True,
     "210,832 votes · 15 open source models", "All 15 open-source models; this board is dated 2026-11-10"),
    ("overall_all", "WebDev · Overall (all models)", "code/webdev", "all", False,
     "997,838 votes · 158 models", "Top 40 all-license models (incl. closed); ranks 41+ not scraped"),
]

FIELDS = ["n", "u", "lab", "lic", "r", "or", "s", "u95", "d95", "pre", "ae", "v", "c", "pin", "pout", "ctx"]

out = {"captured": "2026-11-11", "scraped": "2026-11-14", "source": "arena.ai/leaderboard", "fields": FIELDS, "datasets": {}}

for key, label, path, license_, hor, meta, note in DATASETS:
    f = RAW / f"{key}.md"
    rows = parse_table(f.read_text(encoding="utf-8"), hor)
    scored = [r for r in rows if r["s"]]
    withcost = [r for r in scored if r["c"] is not None]
    out["datasets"][key] = {
        "label": label, "path": path, "license": license_, "meta": meta, "note": note,
        "total_claimed": len(rows), "rows": [[r[k] for k in FIELDS] for r in rows],
        "stats": {"n": len(rows), "with_cost": len(withcost),
                  "score_min": min(r["s"] for r in scored), "score_max": max(r["s"] for r in scored),
                  "cost_min": min(r["c"] for r in withcost), "cost_max": max(r["c"] for r in withcost)},
    }
    print(f"{key:14s} rows={len(rows):3d} with_cost={len(withcost):3d} "
          f"score {out['datasets'][key]['stats']['score_min']}-{out['datasets'][key]['stats']['score_max']} "
          f"cost ${out['datasets'][key]['stats']['cost_min']}-${out['datasets'][key]['stats']['cost_max']}")

payload = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
assert "</" not in payload, "JSON 里出现 </ 会提前闭合 <script>，需要转义"
OUT.write_text(payload, encoding="utf-8")
print("\nwrote", OUT, f"{OUT.stat().st_size:,} bytes")

# --- 注入 index.html（保持单文件、离线可用） ---
HTML = OUT.parent.parent / "index.html"
BLOCK = re.compile(r'(<script id="DATA" type="application/json">)(.*?)(</script>)', re.S)
html = HTML.read_text(encoding="utf-8")
m = BLOCK.search(html)
if not m:
    raise SystemExit(f"!! {HTML} 里找不到 <script id=\"DATA\"> 块")
HTML.write_text(html[:m.start(2)] + payload + html[m.end(2):], encoding="utf-8")
print(f"injected into {HTML}  ({HTML.stat().st_size:,} bytes)")
print("下一步： python3 test/build.py && node --max-old-space-size=4096 test/run.js")
