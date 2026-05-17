#!/usr/bin/env python3
"""
Generate PWA icons for JEE Discipline System.
Produces all required PNG sizes from scratch using Pillow.
Run: python3 scripts/generate-icons.py
"""
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.run(["pip", "install", "Pillow", "--break-system-packages", "-q"])
    from PIL import Image, ImageDraw, ImageFont

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
OUT_DIR = Path(__file__).parent.parent / "public" / "icons"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BG = (15, 25, 34)          # #0F1922 — card bg
ACCENT = (59, 130, 246)    # #3B82F6 — blue accent
TEXT_COLOR = (226, 234, 244)  # #E2EAF4

def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Rounded rect background (simulate with circle corners)
    r = size * 0.18  # corner radius
    margin = size * 0.06

    # Accent bar at top
    bar_h = size * 0.06
    draw.rectangle([margin, margin, size - margin, margin + bar_h], fill=ACCENT)

    # Letter "J" centred
    font_size = int(size * 0.45)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "J"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1] + size * 0.04  # slight downward nudge

    draw.text((tx, ty), text, font=font, fill=TEXT_COLOR)

    # Small "EE" subscript
    sub_size = int(size * 0.18)
    try:
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", sub_size)
    except Exception:
        sub_font = ImageFont.load_default()

    sub_text = "EE"
    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sw = sub_bbox[2] - sub_bbox[0]
    sx = (size - sw) / 2 - sub_bbox[0]
    sy = ty + th + size * 0.01

    draw.text((sx, sy), sub_text, font=sub_font, fill=(*ACCENT, 220))

    return img


for sz in SIZES:
    icon = draw_icon(sz)
    path = OUT_DIR / f"icon-{sz}x{sz}.png"
    icon.save(path, "PNG")
    print(f"  ✓ {path.name}")

# Placeholder screenshots (solid color with text)
for fname, w, h, label in [
    ("screenshot-wide.png", 1280, 720, "JEE Discipline — Dashboard"),
    ("screenshot-narrow.png", 390, 844, "JEE Discipline"),
]:
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((w - tw) / 2, (h - th) / 2), label, font=font, fill=TEXT_COLOR)
    img.save(OUT_DIR / fname, "PNG")
    print(f"  ✓ {fname}")

print("\nAll icons generated in public/icons/")
