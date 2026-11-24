"""Clean couple cutouts via green-screen key (no hole-fill that traps green)."""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")
OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")
PAGE_BG = (250, 246, 240, 255)


def greenness(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return np.clip((g - np.maximum(r, b)) / 50.0, 0.0, 1.0)


def keep_largest(mask: np.ndarray) -> np.ndarray:
    labeled, n = ndimage.label(mask)
    if n <= 1:
        return mask
    sizes = ndimage.sum(mask, labeled, range(1, n + 1))
    return labeled == (int(np.argmax(sizes)) + 1)


def chroma_key(src: Path, dest: Path, target_h: int = 900) -> None:
    rgb = np.array(Image.open(src).convert("RGB"), dtype=np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    gn = greenness(rgb)

    # Any green-dominant pixel is screen (including trapped pockets in hair)
    screen = (
        ((g > r + 18) & (g > b + 18) & (g > 60))
        | (gn > 0.35)
        | ((g > 180) & (g > r + 10) & (g > b + 10) & (gn > 0.15))
    )

    alpha = np.where(screen, 0.0, 255.0 * ((1.0 - gn) ** 2.0))

    subject = alpha > 100
    # Clean speckles only — do NOT fill holes (arms/hair gaps must stay open)
    subject = ndimage.binary_opening(subject, iterations=1)
    subject = ndimage.binary_closing(subject, iterations=1)
    subject = keep_largest(subject)

    # One-pixel shrink to drop AA fringe, then restore with soft edge
    core = ndimage.binary_erosion(subject, iterations=1)
    rim = subject & ~core
    alpha = np.zeros(subject.shape, dtype=np.float32)
    alpha[core] = 255.0
    alpha[rim] = 140.0

    # Despill on rim + near-edge
    edge = ndimage.binary_dilation(~(alpha > 200), iterations=3) & (alpha > 0)
    if edge.any():
        spill = np.maximum(0.0, g - np.maximum(r, b))
        rgb[:, :, 1] = np.where(edge, np.maximum(r, b) + spill * 0.05, g)
        for c in (0, 2):
            rgb[:, :, c] = np.where(edge, np.minimum(255, rgb[:, :, c] + spill * 0.12), rgb[:, :, c])

        lum = rgb.mean(axis=2)
        sat = rgb.max(axis=2) - rgb.min(axis=2)
        # Drop residual white / green rim pixels
        bad = edge & (
            ((lum > 205) & (sat < 45))
            | ((rgb[:, :, 1] > rgb[:, :, 0] + 16) & (rgb[:, :, 1] > rgb[:, :, 2] + 16))
        )
        alpha[bad] = 0

    # Zero RGB where transparent (prevents fringe bleed when browsers premultiply badly)
    transparent = alpha < 8
    rgb[transparent] = 0
    alpha[transparent] = 0

    out = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 255)]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    bbox = im.getbbox()
    if not bbox:
        raise SystemExit(f"empty mask for {src.name}")
    pad = 12
    x0, y0, x1, y1 = bbox
    w, hgt = im.size
    im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(hgt, y1 + pad)))

    scale = target_h / im.size[1]
    im = im.resize((max(1, int(im.size[0] * scale)), target_h), Image.Resampling.LANCZOS)
    im.save(dest, "PNG", optimize=True)

    canvas = Image.new("RGBA", im.size, PAGE_BG)
    canvas.alpha_composite(im)
    canvas.convert("RGB").save(OUT / f"_preview_{dest.stem}.jpg", quality=92)

    arr = np.array(im)
    a = arr[:, :, 3]
    rgb2 = arr[:, :, :3].astype(float)
    near = ndimage.binary_dilation(a < 40, iterations=2) & (a >= 40)
    eg = int(
        (
            near
            & (rgb2[:, :, 1] > rgb2[:, :, 0] + 22)
            & (rgb2[:, :, 1] > rgb2[:, :, 2] + 22)
        ).sum()
    )
    # green anywhere in opaque region
    opaque = a > 180
    eg_all = int(
        (
            opaque
            & (rgb2[:, :, 1] > rgb2[:, :, 0] + 30)
            & (rgb2[:, :, 1] > rgb2[:, :, 2] + 30)
            & (rgb2[:, :, 1] > 80)
        ).sum()
    )
    print(f"wrote {dest.name} {im.size} edge_green={eg} body_green={eg_all} bytes={dest.stat().st_size}")


def main() -> None:
    chroma_key(ASSETS / "countdown-groom-clean.jpg", OUT / "groom.png")
    chroma_key(ASSETS / "countdown-bride-clean.jpg", OUT / "bride.png")
    print("done")


if __name__ == "__main__":
    main()
