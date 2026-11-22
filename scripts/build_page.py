#!/usr/bin/env python3
"""Build dist/index.html + dist/assets/ from src/templates/index.html + data/datasets.json.

组装规则：
  · __DATA__ 占位符 ← data/datasets.json（parse.py 的产物；与旧版内嵌 JSON 同一份数据）
  · __DATA__ 注入时把 `</` 转义成 `<\\/`（JSON 语义不变，防止提前闭合 script 标签）
  · CSS / JS 以外链形式引用 /assets/…（CSP 可收紧为 script-src 'self'）
  · src/css + src/js 原样拷贝进 dist/assets（无转换、无压缩 —— 源即产物，浏览器直接执行）

用法： python3 scripts/build_page.py          # 输出 dist/index.html + dist/assets/
"""
import json, pathlib, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TPL = ROOT / "src" / "templates" / "index.html"
DATA = ROOT / "data" / "datasets.json"
OUT = ROOT / "dist" / "index.html"
ASSETS = ROOT / "dist" / "assets"


def main():
    tpl = TPL.read_text(encoding="utf-8")
    raw = json.loads(DATA.read_text(encoding="utf-8"))
    payload = json.dumps(raw, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    if "__DATA__" not in tpl:
        sys.exit("!! 模板里没有 __DATA__ 占位符")
    html = tpl.replace("__DATA__", payload)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    # assets：每次全量重建（shutil.rmtree 保证删掉改名/删除的旧文件）
    # 布局与模板引用一致：/assets/style.css + /assets/js/NN-*.js
    if ASSETS.exists():
        shutil.rmtree(ASSETS)
    ASSETS.mkdir(parents=True)
    for css in (ROOT / "src" / "css").glob("*.css"):
        shutil.copy2(css, ASSETS / css.name)
    shutil.copytree(ROOT / "src" / "js", ASSETS / "js")
    n_css = len(list(ASSETS.glob("*.css")))
    n_js = len(list((ASSETS / "js").glob("*.js")))
    print(f"wrote {OUT.relative_to(ROOT)}  {OUT.stat().st_size:,} bytes  "
          f"(datasets={len(raw['datasets'])}, models={sum(v['stats']['n'] for v in raw['datasets'].values())}; "
          f"assets: css={n_css} js={n_js})")


if __name__ == "__main__":
    main()
