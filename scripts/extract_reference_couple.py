"""Crop groom/bride from the user reference countdown image and clear checkerboard."""

from pathlib import Path

from PIL import Image

SRC = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown\joyful-reference.jpg")
OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")


def clear_checker(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # near-white / light gray checker cells
            if r > 220 and g > 220 and b > 220:
                px[x, y] = (r, g, b, 0)
                continue
            # mid gray checker (~180-200)
            if abs(r - g) < 12 and abs(g - b) < 12 and 165 < r < 210:
                px[x, y] = (r, g, b, 0)
                continue
            # soft fringe of checker near whites
            if abs(r - g) < 8 and abs(g - b) < 8 and r > 200:
                px[x, y] = (r, g, b, 0)
    return im


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    print("ref", w, h)

    # Characters sit at the far left and right; timer occupies the center band.
    # Crop generous character regions then clear checker.
    groom = clear_checker(im.crop((0, int(h * 0.08), int(w * 0.28), int(h * 0.98))))
    bride = clear_checker(im.crop((int(w * 0.72), int(h * 0.08), w, int(h * 0.98))))

    for part, name in ((groom, "groom-ref.png"), (bride, "bride-ref.png")):
        bbox = part.getbbox()
        if bbox:
            part = part.crop(bbox)
        dest = OUT / name
        part.save(dest, "PNG")
        print("wrote", dest, part.size)


if __name__ == "__main__":
    main()
