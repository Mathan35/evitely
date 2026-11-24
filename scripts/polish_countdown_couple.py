"""Re-cut couple art with rembg, then polish edges (no interior holes)."""

from pathlib import Path

import numpy as np
from PIL import Image
from rembg import remove
from scipy import ndimage

ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")
OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")


def polish(rgba: Image.Image) -> Image.Image:
    arr = np.array(rgba).astype(np.float32)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]

    # Kill chroma-green leftovers
    green = (arr[:, :, 1] > arr[:, :, 0] + 35) & (arr[:, :, 1] > arr[:, :, 2] + 30) & (arr[:, :, 1] > 90)
    alpha[green] = 0

    # Fill interior holes punched by imperfect masks
    solid = alpha > 140
    filled = ndimage.binary_fill_holes(solid)
    hole = filled & ~solid
    if hole.any():
        # Dilate RGB from neighbors into holes
        for c in range(3):
            ch = rgb[:, :, c].copy()
            ch[~solid] = 0
            weight = solid.astype(np.float32)
            for _ in range(4):
                ch = ndimage.uniform_filter(ch, size=3)
                weight_s = ndimage.uniform_filter(weight, size=3)
                ch = np.where(weight_s > 0, ch / np.maximum(weight_s, 1e-6) * weight_s, ch)
                # simpler: just use maximum filter of known pixels
            ch = rgb[:, :, c].copy()
            known = solid
            for _ in range(6):
                dil = ndimage.grey_dilation(np.where(known, ch, 0), size=(3, 3))
                known_dil = ndimage.binary_dilation(known, iterations=1)
                ch = np.where(known, ch, dil)
                known = known_dil
            rgb[:, :, c] = np.where(hole, ch, rgb[:, :, c])
        alpha[hole] = 255

    # Edge map: pixels with transparent neighbor
    transparent = alpha < 28
    edge = ndimage.binary_dilation(transparent, iterations=2) & (alpha >= 28)

    lum = rgb.mean(axis=2)
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    sat = mx - mn

    # Drop white / near-white fringe on silhouette
    white_fringe = edge & (lum > 195) & (sat < 48)
    soft_white = edge & (lum > 175) & (sat < 38) & (alpha < 230)
    alpha[white_fringe | soft_white] = 0

    # Despill: un-multiply assumed white background on remaining soft edges
    soft = edge & (alpha > 0) & (alpha < 250)
    if soft.any():
        a01 = np.clip(alpha[soft] / 255.0, 0.05, 1.0)
        for c in range(3):
            obs = rgb[:, :, c][soft]
            # observed ≈ fg*a + 255*(1-a) when cut from white
            fg = (obs - 255.0 * (1.0 - a01)) / a01
            rgb[:, :, c][soft] = np.clip(fg, 0, 255)
        # After despill, kill anything still near-white on the rim
        lum2 = rgb.mean(axis=2)
        sat2 = rgb.max(axis=2) - rgb.min(axis=2)
        still_white = edge & (alpha > 0) & (lum2 > 210) & (sat2 < 40)
        alpha[still_white] = 0

    # Slight outer alpha feather: only shrink very soft fringe, not body
    outer = ndimage.binary_dilation(alpha < 20, iterations=1) & (alpha > 0) & (alpha < 120)
    alpha[outer] = alpha[outer] * 0.35

    out = np.dstack([rgb, alpha]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    bbox = im.getbbox()
    if bbox:
        pad = 10
        x0, y0, x1, y1 = bbox
        w, h = im.size
        im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))
    return im


def process(src_name: str, dest_name: str, target_h: int = 900) -> None:
    src = ASSETS / src_name
    raw = Image.open(src).convert("RGBA")
    cut = remove(raw)
    polished = polish(cut)
    scale = target_h / polished.size[1]
    polished = polished.resize(
        (max(1, int(polished.size[0] * scale)), target_h),
        Image.Resampling.LANCZOS,
    )
    dest = OUT / dest_name
    polished.save(dest, "PNG", optimize=True)
    print(f"wrote {dest.name} {polished.size} bytes={dest.stat().st_size}")


def main() -> None:
    process("countdown-groom-clean.jpg", "groom.png")
    process("countdown-bride-clean.jpg", "bride.png")
    print("done")


if __name__ == "__main__":
    main()
