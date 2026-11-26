#!/usr/bin/env python3
"""生成 og 分享图 dist/assets/og.png（1200×630，构建期从 data/datasets.json 出数字）。

设计：站内 favicon 同族视觉（深底 + 绿色折线 + 金点），标题 = en og title 前半句，
副题 = "Arena Score × real cost"，底部 chips = 数据集统计（榜单数/模型数，构建期实算，
不手写死数字）。文案固定英文 —— og:image 全语言共用一张（社交平台惯例）。

被 scripts/build_page.py 在 assets 重建阶段调用（dist/assets 每次全量重建，og.png 随之再生）。
依赖 PIL + DejaVuSans 字体；缺失 → 抛错（构建显式失败，不静默出无图产物）。

单独调试：python3 scripts/gen_og_image.py   # 写到 dist/assets/og.png
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 1200, 630
BG = (11, 14, 20)        # #0b0e14 与 favicon/站内背景一致
GREEN = (61, 220, 151)   # #3ddc97 accent
GOLD = (245, 197, 66)    # #f5c542
WHITE = (238, 242, 247)
DIM = (122, 133, 148)
TITLE = "Cheapest LLM at every quality level"
SUBTITLE = "Arena Score × real cost"
DOMAIN = "modelprice.damolabs.app"


def _font(size, bold=True):
    from PIL import ImageFont
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/{name}", size)


def _fit(draw, text, max_w, start, bold=True):
    """字号从 start 往下试，直到 text 宽度 ≤ max_w（标题自适应防溢出）。"""
    size = start
    while size > 20:
        f = _font(size, bold)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return _font(20, bold)


def gen_og(data, out_path):
    from PIL import Image, ImageDraw

    boards = len(data.get("datasets", {}))
    models = sum(v.get("stats", {}).get("n", 0) for v in data.get("datasets", {}).values())

    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # 背景装饰：右上到左下的折线 motif（favicon 的放大版，低调）
    pts = [(880, 190), (960, 130), (1020, 168), (1105, 84)]
    d.line(pts, fill=GREEN, width=7, joint="curve")
    ex, ey, r = pts[-1][0], pts[-1][1], 13
    d.ellipse((ex - r, ey - r, ex + r, ey + r), fill=GOLD)

    # 域名（顶部小字，字距拉开）
    f_dom = _font(30)
    d.text(((W - d.textlength(DOMAIN.upper(), font=f_dom) * 1.0) / 2, 92), DOMAIN.upper(), font=f_dom, fill=DIM)

    # 主标题 + 副题（居中，自适应宽度）
    f_title = _fit(d, TITLE, 1040, 76)
    f_sub = _font(44)
    y = 210
    d.text(((W - d.textlength(TITLE, font=f_title)) / 2, y), TITLE, font=f_title, fill=WHITE)
    d.text(((W - d.textlength(SUBTITLE, font=f_sub)) / 2, y + f_title.size + 34), SUBTITLE, font=f_sub, fill=GREEN)

    # 底部 chips：数据实算（榜单数 / 模型数 / 峰谷+缓存口径）；整体宽 ≤ 1080 防顶边
    chips = [f"{boards} leaderboards", f"{models} models", "peak/off-peak & cache"]
    f_chip = _font(30)
    gap, pad_x, pad_y = 22, 26, 16
    widths = [d.textlength(c, font=f_chip) for c in chips]
    total = sum(w + pad_x * 2 for w in widths) + gap * (len(chips) - 1)
    x = (W - total) / 2
    y0 = 470
    for c, w in zip(chips, widths):
        d.rounded_rectangle((x, y0, x + w + pad_x * 2, y0 + f_chip.size + pad_y * 2),
                            radius=12, outline=(52, 62, 76), width=2)
        d.text((x + pad_x, y0 + pad_y - 2), c, font=f_chip, fill=WHITE)
        x += w + pad_x * 2 + gap

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG", optimize=True)
    print(f"og image: {out_path} {out_path.stat().st_size:,} bytes  ({boards} boards / {models} models)")
    return out_path


if __name__ == "__main__":
    import json
    data = json.loads((ROOT / "data" / "datasets.json").read_text(encoding="utf-8"))
    gen_og(data, ROOT / "dist" / "assets" / "og.png")
