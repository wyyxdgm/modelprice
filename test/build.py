#!/usr/bin/env python3
"""把 index.html 里的 <script id="DATA"> 与应用脚本抽出来，拼上 fake DOM 和测试用例，生成 test/run.js。

默认读取「服务器实际返回的那一份」（http://127.0.0.1:8080/），拿不到就退回本地文件 ——
这样测的永远是用户真正会看到的内容。

用法： python3 test/build.py && node --max-old-space-size=4096 test/run.js
"""
import json, pathlib, re, sys, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = HERE / "run.js"
PATTERN = re.compile(
    r'<script id="DATA" type="application/json">(.*?)</script>\s*<script>(.*?)</script>', re.S)


def load_source():
    url = "http://127.0.0.1:8080/"
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            body = r.read().decode("utf-8")
        if "<script id=\"DATA\"" in body:
            return body, f"HTTP {url}"
    except Exception as e:
        print(f"  (无法从 {url} 取，改用本地文件：{e})", file=sys.stderr)
    p = ROOT / "index.html"
    return p.read_text(encoding="utf-8"), f"file {p}"


def main():
    src, origin = load_source()
    m = PATTERN.search(src)
    if not m:
        sys.exit("!! 没找到 <script id=\"DATA\"> 块 —— index.html 可能被破坏了")
    data_raw, app_js = m.group(1), m.group(2)
    json.loads(data_raw)  # 校验数据块本身是合法 JSON
    if "__DATA__" in src:
        sys.exit("!! index.html 里还有未注入的 __DATA__ 占位符")

    harness = (HERE / "harness.js").read_text(encoding="utf-8")
    cases = (HERE / "cases.js").read_text(encoding="utf-8")
    inject = "store['DATA']=CE('script'); store['DATA'].textContent=" + json.dumps(data_raw) + ";\n"
    OUT.write_text(harness + inject + app_js + "\n" + cases, encoding="utf-8")

    d = json.loads(data_raw)
    print(f"来源      : {origin}")
    print(f"HTML      : {len(src):,} bytes   应用脚本 {len(app_js):,} chars")
    print(f"数据集    : " + ", ".join(f"{k}={v['stats']['n']}" for k, v in d["datasets"].items()))
    print(f"榜单日期  : {d['captured']}   抓取日期: {d['scraped']}")
    print(f"生成      : {OUT}")


if __name__ == "__main__":
    main()
