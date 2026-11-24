"""Clean chroma-key for countdown couple assets — preserve hair, no white fringe."""

from pathlib import Path

from PIL import Image, ImageFilter

ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")
OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")
OUT.mkdir(parents=True, exist_ok=True)


def green_score(r: int, g: int, b: int) -> float:
    """How 'chroma green' a pixel is (0..1+)."""
    if g <= r and g <= b:
        return 0.0
    dominance = (g - max(r, b)) / 255.0
    brightness = g / 255.0
    return max(0.0, dominance * 2.2 + max(0.0, brightness - 0.35) * 0.35)


def process(src: Path, dest: Path, target_h: int = 900) -> None:
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size

    # Pass 1: alpha from green score + despill remaining edge greens into warm skin tone
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            score = green_score(r, g, b)

            if score > 0.22:
                # Fully transparent background
                px[x, y] = (0, 0, 0, 0)
                continue

            if score > 0.06 or (g > r + 12 and g > b + 8):
                # Edge despill: pull green toward red/blue average so hair stays dark, not white/mint
                avg = (r + b) // 2
                ng = min(g, avg + 8)
                # Soft alpha on semi-green fringe
                alpha = int(255 * max(0.0, 1.0 - score * 3.2))
                px[x, y] = (r, ng, b, alpha)
            else:
                px[x, y] = (r, g, b, 255)

    # Light morphological close on alpha to fill tiny holes without eating hair
    r_ch, g_ch, b_ch, a_ch = im.split()
    a_ch = a_ch.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    # Slight blur for soft edges
    a_ch = a_ch.filter(ImageFilter.GaussianBlur(0.6))
    im = Image.merge("RGBA", (r_ch, g_ch, b_ch, a_ch))

    bbox = im.getbbox()
    if not bbox:
        raise SystemExit(f"empty after key: {src}")
    im = im.crop(bbox)

    # Trim remaining near-transparent border noise
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 18:
                px[x, y] = (0, 0, 0, 0)
            elif a < 255 and green_score(r, g, b) > 0.1:
                px[x, y] = (0, 0, 0, 0)

    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)

    scale = target_h / im.size[1]
    im = im.resize((max(1, int(im.size[0] * scale)), target_h), Image.Resampling.LANCZOS)
    im.save(dest, "PNG", optimize=True)
    print(f"wrote {dest.name} {im.size} bytes={dest.stat().st_size}")


def main() -> None:
    pairs = [
        (ASSETS / "countdown-groom-clean.jpg", OUT / "groom.png"),
        (ASSETS / "countdown-bride-clean.jpg", OUT / "bride.png"),
    ]
    for src, dest in pairs:
        if not src.exists():
            # fallback to earlier assets
            alt = ASSETS / src.name.replace("-clean", "")
            src = alt if alt.exists() else src
        process(src, dest)
    print("done")


if __name__ == "__main__":
    main()
