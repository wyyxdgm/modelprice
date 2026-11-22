#!/usr/bin/env python3
"""把构建产物 dist/index.html 里的 <script id="DATA"> 与外链应用脚本抽出来，
拼上 fake DOM 和测试用例，生成 test/run.js。

默认读取「服务器实际返回的那一份」（http://127.0.0.1:8080/），拿不到就退回本地
dist/index.html —— 这样测的永远是用户真正会看到的内容。应用脚本是外链
/assets/js/*.js，按 index.html 里引用顺序从 dist/（或同一 server）逐个读取拼接。

用法： python3 test/build.py && node --max-old-space-size=4096 test/run.js
"""
import json, pathlib, re, sys, urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "scripts"))
from build_page import flatten  # 与构建同源的 flatten（字典结构单一事实）

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = HERE / "run.js"
BASE = "http://127.0.0.1:8080"
DATA_RE = re.compile(r'<script id="DATA" type="application/json">(.*?)</script>', re.S)
I18N_RE = re.compile(r'<script id="I18N" type="application/json">(.*?)</script>', re.S)
SRC_RE = re.compile(r'<script src="(/assets/js/[^"]+)"></script>')


def fetch(path, local):
    """优先从本地服务器拿（与用户看到的完全一致），拿不到回退 dist/ 文件。"""
    try:
        with urllib.request.urlopen(BASE + path, timeout=3) as r:
            return r.read().decode("utf-8"), f"HTTP {BASE}{path}"
    except Exception:
        return local.read_text(encoding="utf-8"), f"file {local}"


def main():
    idx_local = ROOT / "dist" / "index.html"
    if not idx_local.exists():
        sys.exit("!! dist/index.html 不存在 —— 先跑 python3 scripts/build_page.py")
    src, origin = fetch("/", idx_local)
    m = DATA_RE.search(src)
    if not m:
        sys.exit("!! 没找到 <script id=\"DATA\"> 块 —— 模板/构建可能被破坏了")
    data_raw = m.group(1)
    json.loads(data_raw)  # 校验数据块本身是合法 JSON
    if "__DATA__" in src:
        sys.exit("!! 产物里还有未注入的 __DATA__ 占位符")
    mi = I18N_RE.search(src)
    if not mi:
        sys.exit("!! 没找到 <script id=\"I18N\"> 块 —— build_page.py 版本过旧或模板被破坏")
    i18n_raw = mi.group(1)
    json.loads(i18n_raw)  # 校验字典是合法 JSON（构建产物自检）

    app_js = ""
    refs = SRC_RE.findall(src)
    if not refs:
        sys.exit("!! 产物里没有 /assets/js/*.js 外链引用")
    for ref in refs:
        js, js_origin = fetch(ref, ROOT / "dist" / ref.lstrip("/"))
        app_js += js
        if not app_js.endswith("\n"):
            app_js += "\n"
    origin += f" + {len(refs)} js files"

    # 全 locale 字典 → I18N_ALL（多 locale 渲染测试用；en 之外的 locale 直接读 src/i18n/）
    i18n_all = {}
    for f in sorted((ROOT / "src" / "i18n").glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        bootf = ROOT / "src" / "i18n" / "boot" / f"{f.stem}.html"
        srcf = ROOT / "src" / "i18n" / "source" / f"{f.stem}.html"
        if bootf.exists() and srcf.exists():
            d.setdefault("boot", {})
            d["boot"]["methodBody"] = bootf.read_text(encoding="utf-8").strip()
            d["boot"]["sourceBody"] = srcf.read_text(encoding="utf-8").strip()
        i18n_all[f.stem] = flatten(d)

    harness = (HERE / "harness.js").read_text(encoding="utf-8")
    cases = (HERE / "cases.js").read_text(encoding="utf-8")
    inject = ("store['DATA']=CE('script'); store['DATA'].textContent=" + json.dumps(data_raw) + ";\n"
              "store['I18N']=CE('script'); store['I18N'].textContent=" + json.dumps(i18n_raw) + ";\n"
              "const I18N_ALL=" + json.dumps(i18n_all, ensure_ascii=False) + ";\n")
    OUT.write_text(harness + inject + app_js + cases, encoding="utf-8")

    d = json.loads(data_raw)
    i18nd = json.loads(i18n_raw)
    print(f"来源      : {origin}")
    print(f"HTML      : {len(src):,} bytes   应用脚本 {len(app_js):,} chars（{len(refs)} 个文件）   i18n {len(i18nd)} keys")
    print(f"数据集    : " + ", ".join(f"{k}={v['stats']['n']}" for k, v in d["datasets"].items()))
    print(f"榜单日期  : {d['captured']}   抓取日期: {d['scraped']}")
    print(f"生成      : {OUT}")


if __name__ == "__main__":
    main()
