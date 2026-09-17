#!/usr/bin/env python3
"""Regenerate the site icons from public/favicon.png (the source of truth).

Usage:  python3 scripts/make-icons.py
Needs:  Pillow  (python3 -m pip install Pillow)

Writes:
  public/favicon.ico          16/32/48/64 multi-size — legacy + the browser's
                              default /favicon.ico request (stops its 404)
  public/icon-192.png         192x192 — Chrome/Android, modern browsers
  public/apple-touch-icon.png 180x180 — iOS home screen

Referenced from the `icons` block in app/layout.tsx.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "favicon.png"
OUT = ROOT / "public"

ICO_SIZES = [16, 32, 48, 64]
PNG_ICONS = {"icon-192.png": 192, "apple-touch-icon.png": 180}


def square(img: Image.Image, size: int) -> Image.Image:
    """Centre-crop to a square, then resize with a high-quality filter."""
    w, h = img.size
    if w != h:
        side = min(w, h)
        img = img.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing source image: {SRC}")
    src = Image.open(SRC).convert("RGB")
    print(f"source: {SRC.name} {src.width}x{src.height}")

    square(src, max(ICO_SIZES)).save(
        OUT / "favicon.ico", format="ICO", sizes=[(s, s) for s in ICO_SIZES]
    )
    for name, size in PNG_ICONS.items():
        square(src, size).save(OUT / name, format="PNG", optimize=True)

    for name in ["favicon.ico", *PNG_ICONS]:
        print(f"wrote public/{name} ({ (OUT / name).stat().st_size } bytes)")


if __name__ == "__main__":
    main()
