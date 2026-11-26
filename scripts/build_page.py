#!/usr/bin/env python3
"""Build dist/index.html (en, root) + dist/<locale>/index.html for every locale, from
src/templates/index.html + data/datasets.json + src/i18n/<locale>.json.

组装规则：
  · __DATA__ 占位符 ← data/datasets.json（parse.py 的产物）
  · __I18N__ 占位符 ← 该 locale 字典（flatten 成点路径 flat JSON，含 boot.methodBody/sourceBody 正文）
  · {{a.b.c}} 占位符 ← 字典值（构建期文本替换，值可含 HTML）
  · %METHOD% / %ROOT% ← 按 locale 的站内路径 token（字典值和模板里都可出现）
  · __LANG__ ← html lang；__HEAD_EXTRA__ ← hreflang 互指 + canonical（绝对 URL，SEO）
  · __LANG_NAV__ ← 可见语言切换器（当前 locale 高亮；链接带 data-locale-path 供 JS 附加 query）
  · __DATA__ 注入时把 `</` 转义成 `<\\/`（JSON 语义不变，防止提前闭合 script 标签）
  · CSS / JS 外链 /assets/…（全语言共享同一份，绝对路径所以 locale 子目录不用改）

用法：
  python3 scripts/build_page.py                        # 渲染全部 locale
  python3 scripts/build_page.py https://modelprice.damolabs.app   # 带域名（hreflang/canonical 用绝对 URL）
"""
import json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TPL = ROOT / "src" / "templates" / "index.html"
DATA = ROOT / "data" / "datasets.json"
OUT = ROOT / "dist"
ASSETS = ROOT / "dist" / "assets"
I18N_DIR = ROOT / "src" / "i18n"

# locale 清单（en = 根路径默认语言）+ 切换器显示名（语言自称，全站一致）
LOCALES = ["en", "zh", "ja", "ko", "fr"]
LANG_NAMES = {"en": "EN", "zh": "中文", "ja": "日本語", "ko": "한국어", "fr": "Français"}


def locale_path(lc, page=""):
    """en → 根路径；其它 → /<lc>/ 前缀。page 形如 method.html。"""
    if lc == "en":
        return "/" + page
    return f"/{lc}/" + page


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out


def load_dict(lc):
    """读 <locale>.json 并把 boot.methodBody / boot.sourceBody 两段大正文从
    src/i18n/boot|source/<locale>.html 填进来（正文单独维护，避免 JSON 里塞 15KB HTML）。
    locale 文件不存在 → 返回 None（调用方跳过该 locale，en 阶段开发不受影响）。"""
    f = I18N_DIR / f"{lc}.json"
    if not f.exists():
        return None
    d = json.loads(f.read_text(encoding="utf-8"))
    boot = (I18N_DIR / "boot" / f"{lc}.html").read_text(encoding="utf-8").strip()
    src = (I18N_DIR / "source" / f"{lc}.html").read_text(encoding="utf-8").strip()
    d.setdefault("boot", {})
    d["boot"]["methodBody"] = boot
    d["boot"]["sourceBody"] = src
    return flatten(d)


def head_extra(lc, domain):
    """hreflang 全语言互指（含 x-default→根英文）+ canonical，绝对 URL。"""
    links = []
    for x in LOCALES:
        links.append(f'<link rel="alternate" hreflang="{x}" href="{domain}{locale_path(x)}">')
    links.append(f'<link rel="alternate" hreflang="x-default" href="{domain}{locale_path("en")}">')
    links.append(f'<link rel="canonical" href="{domain}{locale_path(lc)}">')
    return "".join(links) + "\n"


def lang_nav(lc):
    parts = []
    for x in LOCALES:
        cls = ' class="on"' if x == lc else ""
        parts.append(f'<a data-locale-path="{locale_path(x)}" href="{locale_path(x)}"{cls} hreflang="{x}">{LANG_NAMES[x]}</a>')
    return "".join(parts)


def jsonld_str(lc, domain, i18n, raw_captured):
    """结构化数据：SoftwareApplication + FAQPage（FAQ 文案来自 i18n faq 段，构建期注入）。"""
    app = {
        "@type": "SoftwareApplication",
        "name": i18n.get("meta.title", ""),
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Web",
        "url": domain + locale_path(lc),
        "description": i18n.get("meta.desc", ""),
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "dateModified": raw_captured,
    }
    main_entity = [
        {"@type": "Question", "name": x["q"], "acceptedAnswer": {"@type": "Answer", "text": x["a"]}}
        for x in i18n.get("faq", [])
    ]
    graph = [app] + ([{"@type": "FAQPage", "mainEntity": main_entity}] if main_entity else [])
    payload = json.dumps({"@context": "https://schema.org", "@graph": graph},
                         ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return '<script type="application/ld+json">' + payload + "</script>"


def render(lc, domain, i18n):
    tpl = TPL.read_text(encoding="utf-8")
    raw = json.loads(DATA.read_text(encoding="utf-8"))
    raw_captured, raw_scraped = raw.get("captured", ""), raw.get("scraped", "")
    payload = json.dumps(raw, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    i18n_payload = json.dumps(i18n, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

    missing = []

    def sub(m):
        k = m.group(1)
        if k not in i18n:
            missing.append(k)
            return m.group(0)
        return str(i18n[k])

    html = tpl.replace("__LANG__", lc)
    html = html.replace("__HEAD_EXTRA__", head_extra(lc, domain))
    html = html.replace("__LANG_NAV__", lang_nav(lc))
    # og/twitter 绝对 URL token（og:url 按 locale；og:image 全语言共用一张英文 og.png）
    html = html.replace("__DOMAIN__", domain).replace("__OG_URL__", domain + locale_path(lc))
    # 时区/小时的静态默认（周三 12:00 UTC = 谷时代表值，locale 感知星期名）：爬虫/无 JS 首屏
    # 不再出现 --:00 占位符；JS 加载后 06-scenarios.syncPriceUI() 立刻用真实「now」覆盖，
    # 静态值只服务首帧前与 no-JS 场景。本地时默认 tz=0 → 与 UTC 同值。
    dows = str(i18n.get("dows", "Sun,Mon,Tue,Wed,Thu,Fri,Sat")).split(",")
    html = html.replace("__HOUR_UTC__", f"{dows[3] if len(dows) > 3 else 'Wed'} 12:00")
    html = html.replace("__HOUR_LOCAL__", "12:00")
    html = re.sub(r"\{\{([\w.]+)\}\}", sub, html)
    # 路径 token：在字典值替换后再做一轮（字典值里可以引用站内路径）
    html = html.replace("%METHOD%", locale_path(lc, "method.html"))
    html = html.replace("%ROOT%", locale_path(lc))
    # 日期 token：footer 等构建期注入的串里快照/抓取日期跟数据走（不再硬编码）
    html = html.replace("%CAPTURED%", raw_captured).replace("%SCRAPED%", raw_scraped)
    # 结构化数据（SoftwareApplication + FAQPage），FAQ 文案取自该 locale 字典 faq 段
    html = html.replace("__JSONLD__", jsonld_str(lc, domain, i18n, raw_captured))
    html = html.replace("__DATA__", payload)
    # I18N JSON 里的字典值同样做路径 token 替换（字典值可能被 JS 引用）；
    # 日期 token 一并构建期替换（tagline 的抓取/榜单日期 + methodBody/sourceBody 正文）——
    # 静态 HTML 直接带日期（SEO freshness 信号），运行时 bootSub 再替换一遍幂等无害。
    html = html.replace("__I18N__", i18n_payload
                       .replace("%METHOD%", locale_path(lc, "method.html"))
                       .replace("%ROOT%", locale_path(lc))
                       .replace("%CAPTURED%", raw_captured)
                       .replace("%SCRAPED%", raw_scraped))
    return html, missing


def main():
    domain = (sys.argv[1] if len(sys.argv) > 1 else "https://modelprice.damolabs.app").rstrip("/")
    tpl = TPL.read_text(encoding="utf-8")
    raw = json.loads(DATA.read_text(encoding="utf-8"))
    all_missing = []
    n_models = sum(v["stats"]["n"] for v in raw["datasets"].values())

    # assets：每次全量重建（shutil.rmtree 保证删掉改名/删除的旧文件）
    # 布局与模板引用一致：/assets/style.css + /assets/js/NN-*.js（全语言共享一份）
    OUT.mkdir(parents=True, exist_ok=True)
    if ASSETS.exists():
        shutil.rmtree(ASSETS)
    ASSETS.mkdir(parents=True)
    for css in (ROOT / "src" / "css").glob("*.css"):
        shutil.copy2(css, ASSETS / css.name)
    shutil.copytree(ROOT / "src" / "js", ASSETS / "js")
    # analytics.js（umami 第一方埋点）放站点根：绝对路径 /analytics.js，locale 子目录同样命中
    aj = ROOT / "src" / "analytics.js"
    if aj.exists():
        shutil.copy2(aj, OUT / "analytics.js")
    # og 分享图（1200×630，构建期从数据集生成）；依赖 PIL+DejaVu，缺失则显式报错不静默
    sys.path.insert(0, str(ROOT / "scripts"))
    from gen_og_image import gen_og
    gen_og(raw, ASSETS / "og.png")

    for lc in LOCALES:
        flat = load_dict(lc)
        if flat is None:
            print(f"skip locale={lc}  (src/i18n/{lc}.json 不存在)")
            continue
        html, missing = render(lc, domain, flat)
        all_missing += [f"{lc}:{k}" for k in missing]
        if lc == "en":
            out = OUT / "index.html"
        else:
            out = OUT / lc / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")
        print(f"wrote {out.relative_to(ROOT)}  {out.stat().st_size:,} bytes  "
              f"(locale={lc}, i18n keys={len(flat)})")

    n_css = len(list(ASSETS.glob("*.css")))
    n_js = len(list((ASSETS / "js").glob("*.js")))
    print(f"assets: css={n_css} js={n_js}  (datasets={len(raw['datasets'])}, models={n_models})")
    if all_missing:
        sys.exit("!! 字典缺 key：" + ", ".join(all_missing[:20]))


if __name__ == "__main__":
    main()
