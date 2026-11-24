"""Extract native moodboard cells as generation references (no upscale)."""

from pathlib import Path

import cv2

SOURCE = Path(r"C:\Users\Abcom\Downloads\Wedding Venue Moodboard Grid.png")
OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\storage\app\venue-refs")

KEYS = [
    "glasshouse",
    "eucalyptus",
    "black-tie",
    "tropical",
    "vintage-botanical",
    "estate",
    "monochrome",
    "golden-hour",
    "foliage",
    "fairytale",
    "industrial",
    "castle",
    "harvest",
    "celestial",
    "vineyard",
    "deco",
    "rose-gold",
    "secret-garden",
    "cathedral",
    "wonderland",
]


def grid_boxes(x0: int, y0: int, x1: int, y1: int, cols: int, rows: int, gutter: int) -> list[tuple[int, int, int, int]]:
    inner_w = x1 - x0 - gutter * (cols - 1)
    inner_h = y1 - y0 - gutter * (rows - 1)
    cell_w = inner_w / cols
    cell_h = inner_h / rows
    boxes: list[tuple[int, int, int, int]] = []
    for row in range(rows):
        for col in range(cols):
            xa = int(round(x0 + col * (cell_w + gutter))) + 2
            ya = int(round(y0 + row * (cell_h + gutter))) + 2
            xb = int(round(x0 + col * (cell_w + gutter) + cell_w)) - 2
            yb = int(round(y0 + row * (cell_h + gutter) + cell_h)) - 2
            boxes.append((xa, ya, xb, yb))
    return boxes


def main() -> None:
    image = cv2.imread(str(SOURCE), cv2.IMREAD_COLOR)
    if image is None:
        raise SystemExit(f"Could not read {SOURCE}")

    print("source", image.shape)
    OUT.mkdir(parents=True, exist_ok=True)

    desktop_boxes = grid_boxes(17, 59, 1519, 598, 5, 4, 10)
    mobile_boxes = grid_boxes(17, 665, 1519, 1000, 10, 2, 9)

    for index, key in enumerate(KEYS):
        dx0, dy0, dx1, dy1 = desktop_boxes[index]
        mx0, my0, mx1, my1 = mobile_boxes[index]
        desktop = image[dy0:dy1, dx0:dx1]
        mobile = image[my0:my1, mx0:mx1]
        n = f"{index + 1:02d}"
        cv2.imwrite(str(OUT / f"desktop-{n}-{key}.png"), desktop)
        cv2.imwrite(str(OUT / f"mobile-{n}-{key}.png"), mobile)
        print(n, key, "desktop", desktop.shape, "mobile", mobile.shape)

    print("done", OUT)


if __name__ == "__main__":
    main()
