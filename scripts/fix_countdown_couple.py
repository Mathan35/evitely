"""Build clean transparent couple PNGs for the countdown (no checker artifacts)."""

from pathlib import Path

from PIL import Image, ImageFilter

OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")
ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")


def is_green(r: int, g: int, b: int) -> bool:
    if g > 85 and g > r + 28 and g > b + 28:
        return True
    if g > 130 and r < 125 and b < 125:
        return True
    if g > 190 and r < 90 and b < 90:
        return True
    return False


def is_near_black(r: int, g: int, b: int) -> bool:
    return r < 35 and g < 35 and b < 35


def chroma(src: Path, dest: Path, kill_black: bool = False) -> None:
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            if is_green(r, g, b) or (kill_black and is_near_black(r, g, b)):
                px[x, y] = (0, 0, 0, 0)
    # Soft edge cleanup: erode leftover fringe by making near-transparent low-sat greens gone
    bbox = im.getbbox()
    if not bbox:
        raise SystemExit(f"empty after chroma: {src}")
    im = im.crop(bbox)
    # Slight alpha feather via blur on alpha only
    r_ch, g_ch, b_ch, a_ch = im.split()
    a_ch = a_ch.filter(ImageFilter.MinFilter(3))
    im = Image.merge("RGBA", (r_ch, g_ch, b_ch, a_ch))
    # Resize to web-friendly height
    target_h = 720
    scale = target_h / im.size[1]
    im = im.resize((max(1, int(im.size[0] * scale)), target_h), Image.Resampling.LANCZOS)
    im.save(dest, "PNG", optimize=True)
    print(f"wrote {dest.name} {im.size} mode={im.mode}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    chroma(ASSETS / "countdown-groom.jpg", OUT / "groom.png", kill_black=True)
    chroma(ASSETS / "countdown-bride.jpg", OUT / "bride.png", kill_black=True)
    print("done")


if __name__ == "__main__":
    main()
