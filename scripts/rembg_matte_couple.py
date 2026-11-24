"""rembg + alpha matting + green despill for clean couple cutouts."""

from pathlib import Path

import numpy as np
from PIL import Image
from rembg import remove
from scipy import ndimage

ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")
OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")


def despill_and_clean(im: Image.Image) -> Image.Image:
    arr = np.array(im).astype(np.float32)
    rgb, alpha = arr[:, :, :3], arr[:, :, 3]
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    # Kill remaining green screen / spill everywhere
    gn = np.clip((g - np.maximum(r, b)) / 45.0, 0, 1)
    screen = ((g > r + 20) & (g > b + 20) & (g > 55)) | (gn > 0.4)
    alpha[screen] = 0

    edge = ndimage.binary_dilation(alpha < 40, iterations=3) & (alpha >= 40)
    spill = np.maximum(0.0, g - np.maximum(r, b))
    rgb[:, :, 1] = np.where(edge | (spill > 8), np.maximum(r, b) + spill * 0.08, g)

    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    white_edge = edge & (lum > 198) & (sat < 50)
    # Only punch white fringe in darker regions (hair), keep cream clothes
    dark_neighbor = ndimage.minimum_filter(lum, size=5) < 120
    alpha[white_edge & dark_neighbor] = 0

    rgb[alpha < 10] = 0
    alpha[alpha < 10] = 0

    subject = alpha > 80
    subject = ndimage.binary_opening(subject, iterations=1)
    labeled, n = ndimage.label(subject)
    if n > 1:
        sizes = ndimage.sum(subject, labeled, range(1, n + 1))
        subject = labeled == (int(np.argmax(sizes)) + 1)
    alpha = np.where(subject, np.maximum(alpha, 200), 0)

    out = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 255)]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def process(src_name: str, dest_name: str, target_h: int = 900) -> None:
    raw = Image.open(ASSETS / src_name).convert("RGBA")
    cut = remove(
        raw,
        alpha_matting=True,
        alpha_matting_foreground_threshold=230,
        alpha_matting_background_threshold=20,
        alpha_matting_erode_size=8,
    )
    cut = despill_and_clean(cut)
    bbox = cut.getbbox()
    if not bbox:
        raise SystemExit(f"empty {src_name}")
    pad = 12
    x0, y0, x1, y1 = bbox
    w, h = cut.size
    cut = cut.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))
    scale = target_h / cut.size[1]
    cut = cut.resize((max(1, int(cut.size[0] * scale)), target_h), Image.Resampling.LANCZOS)
    dest = OUT / dest_name
    cut.save(dest, "PNG", optimize=True)

    for bg, tag in [((250, 246, 240, 255), "light"), ((30, 20, 25, 255), "dark")]:
        canvas = Image.new("RGBA", cut.size, bg)
        canvas.alpha_composite(cut)
        canvas.convert("RGB").save(OUT / f"_preview_{dest.stem}_{tag}.jpg", quality=92)
    print(f"wrote {dest.name} {cut.size}")


def main() -> None:
    process("countdown-groom-clean.jpg", "groom-cut.png")
    process("countdown-bride-clean.jpg", "bride-cut.png")
    print("done")


if __name__ == "__main__":
    main()
