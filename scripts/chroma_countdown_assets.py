from pathlib import Path

from PIL import Image

OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")
ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")
OUT.mkdir(parents=True, exist_ok=True)


def is_green(r: int, g: int, b: int) -> bool:
    if g > 90 and g > r + 35 and g > b + 35:
        return True
    if g > 140 and r < 120 and b < 120:
        return True
    if abs(r - 0) < 50 and g > 170 and abs(b - 0) < 50:
        return True
    # near-pure chroma
    if g > 200 and r < 80 and b < 80:
        return True
    return False


def chroma_key(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGBA")
    pixels = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            if is_green(r, g, b):
                pixels[x, y] = (r, g, b, 0)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    im.save(dest, "PNG")
    print(f"wrote {dest} {im.size}")


def main() -> None:
    chroma_key(ASSETS / "countdown-groom.jpg", OUT / "groom.png")
    chroma_key(ASSETS / "countdown-bride.jpg", OUT / "bride.png")

    pair = ASSETS / "wedding-countdown-couple.jpg"
    if pair.exists():
        im = Image.open(pair).convert("RGBA")
        pixels = im.load()
        w, h = im.size
        for y in range(h):
            for x in range(w):
                r, g, b, _a = pixels[x, y]
                if is_green(r, g, b):
                    pixels[x, y] = (r, g, b, 0)
        mid = w // 2
        for box, name in (
            ((0, 0, mid, h), "groom-alt.png"),
            ((mid, 0, w, h), "bride-alt.png"),
        ):
            part = im.crop(box)
            bbox = part.getbbox()
            if bbox:
                part = part.crop(bbox)
            dest = OUT / name
            part.save(dest, "PNG")
            print(f"wrote {dest} {part.size}")

    print("done")


if __name__ == "__main__":
    main()
