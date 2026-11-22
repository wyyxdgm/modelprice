#!/usr/bin/env python3
"""gen_raw_md.py — 抓取产物 JSON → raw/*.md（保持 parse.py 期望的 markdown 表格格式）。

用法: python3 scripts/gen_raw_md.py [--scrape-dir scripts/.scrape]
输入: <scrape-dir>/<board>.json（refresh-data.sh 用 browse eval + arena_extract.js 抓的 RSC payload）
输出: raw/{overall_os,overall_all,frontend_os,fullstack_os,react_os,reference_os,img2webdev_os}.md
      + <scrape-dir>/meta.json（captured/scraped 日期 + 每榜 meta/note 覆盖, parse.py --meta 消费）

格式契约（与 2026-11-14 人工抓取的 raw/*.md 逐列对齐, parse.py 已有测试背书, 勿改）:
  overall_os  9 列: Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task (P50) | Price $/M | Context
  其余        8 列: Rank | Rank Spread | Model | Score | Votes | Cost/Task (P50) | Price $/M | Context
  model cell: all 榜 = Org<br>[Name](url)<br>Org · License；OS 榜 = [Name](url)<br>Org · License
  score cell: round(rating)+up/-dn（Preliminary 后缀直接拼接）
  价格: 整数无小数 / 非整数两位小数；cost 两位小数；votes 千分位；ctx K/M 一位小数去尾零
"""
import argparse
import datetime
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent.parent

BOARDS = [
    # scrape 名, DATASETS key, 路径说明（仅日志用）
    ("overall", ["overall_os", "overall_all"]),
    ("frontend", ["frontend_os"]),
    ("fullstack", ["fullstack_os"]),
    ("react", ["react_os"]),
    ("reference", ["reference_os"]),
    ("img2webdev", ["img2webdev_os"]),
]
TOP_ALL = 40  # overall_all 只取前 40（与旧 raw 口径一致: ranks 41+ not scraped）


def fmt_price(v):
    if v is None:
        return "N/A"
    return f"${int(v)}" if v == int(v) else f"${v:.2f}"


def fmt_cost(v):
    return "N/A" if v is None else f"${v:.2f}"


def fmt_ctx(v):
    if v is None:
        return "N/A"
    x = v / 1_000_000
    unit, div = ("M", 1_000_000) if v >= 1_000_000 else ("K", 1_000)
    s = f"{v / div:.1f}".rstrip("0").rstrip(".")
    return s + unit


def fmt_votes(v):
    return "N/A" if v is None else f"{v:,}"


def fmt_score(r):
    s = round(r["rating"])
    up = max(1, round(r["ratingUpper"] - r["rating"]))
    dn = max(1, round(r["rating"] - r["ratingLower"]))
    cell = f"{s}+{up}/-{dn}"
    if r.get("releaseType") == "preliminary":
        cell += "Preliminary"  # 与旧 raw 一致: 直接拼在 score 后, parse_score 靠子串识别
    return cell


def model_cell(r, leading_lab):
    name_url = f"[{r['modelDisplayName']}]({r['modelUrl']})"
    org = (r.get("modelOrganization") or "").strip()
    lic = (r.get("license") or "").strip()
    tail = f"{org} · {lic}" if org and lic else (org or lic)
    if leading_lab:
        return f"{org}<br>{name_url}<br>{tail}" if tail else f"{org}<br>{name_url}"
    return f"{name_url}<br>{tail}" if tail else name_url


def render(rows, overall_rank_of, has_overall_rank, leading_lab):
    header = (
        "| Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task (P50) | Price $/M | Context |"
        if has_overall_rank
        else "| Rank | Rank Spread | Model | Score | Votes | Cost/Task (P50) | Price $/M | Context |"
    )
    sep = "| " + " | ".join(["---"] * (9 if has_overall_rank else 8)) + " |"
    lines = [header, sep]
    for r in rows:
        rank = "" if r["rank"] is None else r["rank"]
        spread = max(0, (r.get("rankLower") or r["rank"] or 0) - (r["rank"] or 0))  # rankLower=最差可达名次 → 可能下滑名次数
        if has_overall_rank:
            # 9 列: Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost | Price | Context
            ork = overall_rank_of.get(r["modelKey"])
            cells = [str(rank), "" if ork is None else str(ork), model_cell(r, leading_lab), fmt_score(r), str(spread)]
        else:
            # 8 列: Rank | Rank Spread | Model | Score | Votes | Cost | Price | Context（spread 在 model 前）
            cells = [str(rank), str(spread), model_cell(r, leading_lab), fmt_score(r)]
        cells += [
            fmt_votes(r.get("votes")),
            fmt_cost(r.get("costUsd")),
            f"{fmt_price(r.get('inputPricePerMillion'))} / {fmt_price(r.get('outputPricePerMillion'))}",
            fmt_ctx(r.get("contextLength")),
        ]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines) + "\n"


def board_meta(inner, key):
    n = inner["rowCount"]
    votes = inner.get("totalVotes") or "N/A"
    if key == "overall_all":
        return {
            "meta": f"{votes} votes · {n} models",
            "note": f"Top {TOP_ALL} all-license models (incl. closed); ranks 41+ not scraped",
        }
    os_n = sum(1 for r in inner["rows"] if (r.get("license") or "") != "Proprietary")
    return {
        "meta": f"{votes} votes · {os_n} open source models",
        "note": f"All {os_n} open-source models",
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scrape-dir", default="scripts/.scrape")
    args = ap.parse_args()
    sdir = (ROOT / args.scrape_dir).resolve()
    raw_dir = ROOT / "raw"

    data = {}
    for name, _ in BOARDS:
        f = sdir / f"{name}.json"
        if not f.exists():
            sys.exit(f"!! 缺抓取产物 {f} — 先跑 refresh-data.sh 的抓取段")
        d = json.load(open(f))
        inner = json.loads(d["result"]) if isinstance(d, dict) and "result" in d else d
        if "error" in inner or not inner.get("rows"):
            sys.exit(f"!! {name} 抓取无效: {inner.get('error', 'no rows')}")
        data[name] = inner

    # Overall Rank 映射: overall 榜 modelKey → rank
    overall_rank_of = {r["modelKey"]: r["rank"] for r in data["overall"]["rows"] if r["rank"] is not None}

    captured = None
    for inner in data.values():
        for cand in inner.get("dateCandidates") or []:
            # 榜单日期 = 候选里最晚的合法日期（payload 里会混历史版本日期）
            if captured is None or cand > captured:
                captured = cand
    scraped = datetime.date.today().isoformat()
    if not captured:
        sys.exit("!! 抓取产物里找不到榜单日期")

    for name, keys in BOARDS:
        inner = data[name]
        rows = inner["rows"]
        for key in keys:
            if key == "overall_all":
                body = render([r for r in rows if (r["rank"] or 999) <= TOP_ALL], overall_rank_of, False, True)
            else:
                # 所有 *_os 榜: license 过滤 + 9 列带 Overall Rank（与旧 raw 一致, DATASETS 全部 hor=True）
                os_rows = [r for r in rows if (r.get("license") or "") != "Proprietary"]
                body = render(os_rows, overall_rank_of, True, False)
            out = raw_dir / f"{key}.md"
            old = out.read_text(encoding="utf-8") if out.exists() else ""
            out.write_text(body, encoding="utf-8")
            same = " (unchanged)" if old == body else ""
            print(f"{key:14s} rows={body.count(chr(10)) - 2:3d} -> {out}{same}")

    meta = {
        "captured": captured,
        "scraped": scraped,
        "boards": {k: board_meta(data[name], k) for name, keys in BOARDS for k in keys},
    }
    (sdir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"captured={captured} scraped={scraped} -> {sdir}/meta.json")


if __name__ == "__main__":
    main()
