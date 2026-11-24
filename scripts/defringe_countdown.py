"""Remove white/green fringe from rembg cutouts."""

from pathlib import Path

from PIL import Image, ImageFilter

OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")


def has_transparent_neighbor(px, x: int, y: int, w: int, h: int) -> bool:
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 40:
                return True
    return False


def defringe(path: Path) -> None:
    im = Image.open(path).convert("RGBA")
    # Slight alpha erode to drop outer white halo, then restore body with max
    r, g, b, a = im.split()
    a_erode = a.filter(ImageFilter.MinFilter(3))
    im = Image.merge("RGBA", (r, g, b, a_erode))

    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            rr, gg, bb, aa = px[x, y]
            if aa == 0:
                continue

            # Kill leftover chroma green
            if gg > rr + 35 and gg > bb + 30 and gg > 90:
                px[x, y] = (0, 0, 0, 0)
                continue

            lum = (rr + gg + bb) / 3
            sat = max(rr, gg, bb) - min(rr, gg, bb)

            # White / light fringe on silhouette edge
            if has_transparent_neighbor(px, x, y, w, h):
                if lum > 200 and sat < 45:
                    px[x, y] = (0, 0, 0, 0)
                    continue
                if lum > 170 and sat < 35 and aa < 220:
                    px[x, y] = (0, 0, 0, 0)
                    continue
                # Soften remaining edge alpha
                if aa < 200 and lum > 150 and sat < 55:
                    px[x, y] = (rr, gg, bb, max(0, aa - 90))

    bbox = im.getbbox()
    if bbox:
        pad = 6
        x0, y0, x1, y1 = bbox
        im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))

    im.save(path, "PNG", optimize=True)
    print(f"defringed {path.name} {im.size}")


def main() -> None:
    for name in ("groom.png", "bride.png"):
        defringe(OUT / name)
    print("done")


if __name__ == "__main__":
    main()
