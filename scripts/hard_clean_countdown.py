"""Aggressive white/green fringe cleanup + page-bg preview."""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")
PAGE_BG = (250, 246, 240, 255)


def hard_clean(path: Path) -> None:
    im = Image.open(path).convert("RGBA")
    a = np.array(im).astype(np.float32)
    rgb, alpha = a[:, :, :3], a[:, :, 3]

    transparent = alpha < 20
    edge = ndimage.binary_dilation(transparent, iterations=3) & (alpha >= 20)
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)

    kill = edge & (
        ((lum > 185) & (sat < 55))
        | ((lum > 160) & (sat < 30) & (alpha < 240))
        | ((rgb[:, :, 0] > 200) & (rgb[:, :, 1] > 200) & (rgb[:, :, 2] > 200))
    )
    alpha[kill] = 0

    green = (
        (rgb[:, :, 1] > rgb[:, :, 0] + 25)
        & (rgb[:, :, 1] > rgb[:, :, 2] + 20)
        & (rgb[:, :, 1] > 80)
        & edge
    )
    alpha[green] = 0

    soft = edge & (alpha > 0)
    if soft.any():
        for c in range(3):
            ch = rgb[:, :, c]
            ch[soft] = np.minimum(ch[soft], np.maximum(ch[soft] - 18, ch[soft] * 0.92))
            rgb[:, :, c] = ch
        alpha[soft] = np.minimum(alpha[soft], alpha[soft] * 0.92 + 8)

    solid = alpha > 150
    filled = ndimage.binary_fill_holes(solid)
    holes = filled & ~solid
    if holes.any():
        known = solid.copy()
        rgb_fix = rgb.copy()
        for _ in range(8):
            for c in range(3):
                dil = ndimage.grey_dilation(np.where(known, rgb_fix[:, :, c], 0), size=(3, 3))
                rgb_fix[:, :, c] = np.where(known, rgb_fix[:, :, c], dil)
            known = ndimage.binary_dilation(known, iterations=1)
        rgb[holes] = rgb_fix[holes]
        alpha[holes] = 255

    out = np.dstack([rgb, alpha]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(path, optimize=True)
    print(f"cleaned {path.name} killed={int(kill.sum())} green={int(green.sum())} holes={int(holes.sum())}")


def preview(path: Path) -> None:
    fg = Image.open(path).convert("RGBA")
    canvas = Image.new("RGBA", fg.size, PAGE_BG)
    canvas.alpha_composite(fg)
    dest = OUT / f"_preview_{path.stem}.jpg"
    canvas.convert("RGB").save(dest, quality=92)
    print(f"preview {dest.name}")


def main() -> None:
    for name in ("groom.png", "bride.png"):
        p = OUT / name
        hard_clean(p)
        preview(p)


if __name__ == "__main__":
    main()
