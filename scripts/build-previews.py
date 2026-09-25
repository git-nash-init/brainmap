"""Renders every PDF in templates-out/ to a styled preview tile in public/templates-preview/<slug>.jpg.
Run after build-templates.mjs:   python scripts/build-previews.py
Needs: pip install pymupdf pillow
"""
import json, os
import fitz
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC, OUT = "templates-out", "public/templates-preview"
os.makedirs(OUT, exist_ok=True)

# soft, category-matched backdrops (top colour, bottom colour)
BG = {
    "Habit Tracker": ((226, 240, 216), (201, 226, 190)),
    "Planner": ((246, 240, 228), (236, 226, 208)),
    "Finance": ((224, 234, 244), (200, 216, 234)),
    "Goals": ((250, 232, 220), (244, 212, 194)),
    "Health": ((219, 241, 235), (192, 228, 218)),
    "Productivity": ((236, 232, 246), (216, 208, 236)),
    "Home": ((244, 238, 224), (232, 222, 198)),
    "Study": ((228, 238, 248), (208, 224, 242)),
    "Business": ((240, 232, 240), (226, 210, 228)),
    "Everyday": ((246, 244, 226), (236, 232, 200)),
}
W, H = 960, 720


def gradient(top, bottom):
    img = Image.new("RGB", (W, H), top)
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = c
    return img


def page_with_shadow(pil, angle):
    page = Image.new("RGB", (pil.width + 6, pil.height + 6), (215, 215, 210))  # hairline edge
    page.paste(pil, (3, 3))
    rgba = page.convert("RGBA").rotate(angle, expand=True, resample=Image.BICUBIC)
    alpha = rgba.split()[3]
    m = 60  # margin so the blur is never clipped into a box
    shadow = Image.new("RGBA", (rgba.width + 2 * m, rgba.height + 2 * m), (40, 30, 20, 0))
    mask = Image.new("L", shadow.size, 0)
    mask.paste(alpha.point(lambda a: 110 if a > 0 else 0), (m, m))
    shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(18)))
    return rgba, shadow, m


manifest = json.load(open(os.path.join(SRC, "manifest.json"), encoding="utf-8"))
for i, t in enumerate(manifest):
    doc = fitz.open(os.path.join(SRC, t["file"]))
    pm = doc[0].get_pixmap(dpi=110)
    page = Image.frombytes("RGB", (pm.width, pm.height), pm.samples)
    scale = 610 / page.height
    page = page.resize((int(page.width * scale), 610), Image.LANCZOS)

    top, bottom = BG.get(t["category"], BG["Planner"])
    canvas = gradient(top, bottom).convert("RGBA")

    # a faint second sheet peeking out behind, for depth
    back = Image.new("RGB", page.size, (250, 250, 247))
    b_rgba, b_shadow, bm = page_with_shadow(back, 5 if i % 2 == 0 else -5)
    bx, by = (W - b_rgba.width) // 2 + (34 if i % 2 == 0 else -34), (H - b_rgba.height) // 2 + 6
    canvas.alpha_composite(b_shadow, (bx + 6 - bm, by + 12 - bm))
    canvas.alpha_composite(b_rgba, (bx, by))

    angle = -3 if i % 2 == 0 else 3
    p_rgba, p_shadow, pm_ = page_with_shadow(page, angle)
    px, py = (W - p_rgba.width) // 2, (H - p_rgba.height) // 2
    canvas.alpha_composite(p_shadow, (px + 8 - pm_, py + 14 - pm_))
    canvas.alpha_composite(p_rgba, (px, py))

    # small category pill
    d = ImageDraw.Draw(canvas)
    label = t["category"].upper()
    try:
        font = ImageFont.truetype("arialbd.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    tw = d.textlength(label, font=font)
    d.rounded_rectangle((28, 28, 28 + tw + 40, 74), radius=23, fill=(18, 18, 18, 240))
    d.text((48, 51), label, font=font, fill=(217, 249, 157), anchor="lm")

    slug = os.path.splitext(t["file"])[0]
    canvas.convert("RGB").save(os.path.join(OUT, slug + ".jpg"), quality=82, optimize=True)
    print("ok", slug)
print(len(manifest), "previews ->", OUT)
