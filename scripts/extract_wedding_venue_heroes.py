"""Crop the venue moodboard into 20 desktop + 20 mobile heroes and export 8K JPEGs."""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

SOURCE = Path(r"C:\Users\Abcom\Downloads\Wedding Venue Moodboard Grid.png")
ROOT = Path(r"C:\Users\Abcom\Sites\wedding-invitation")
PREVIEW = ROOT / "public" / "images" / "gallery" / "previews" / "wedding"
GALLERY = ROOT / "public" / "images" / "gallery" / "wedding"

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

DESKTOP_TARGET = (7680, 4320)  # 16:9
MOBILE_TARGET = (4320, 7680)  # 9:16
THUMB_DESKTOP = (1920, 1080)
THUMB_MOBILE = (1080, 1920)


def upscale(image: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    width, height = size
    current = image
    while current.shape[1] * 2 < width and current.shape[0] * 2 < height:
        current = cv2.resize(current, (current.shape[1] * 2, current.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
    current = cv2.resize(current, (width, height), interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(current, (0, 0), 1.15)
    return cv2.addWeighted(current, 1.28, blur, -0.28, 0)


def cover_crop(image: np.ndarray, aspect: float) -> np.ndarray:
    height, width = image.shape[:2]
    current = width / max(height, 1)
    if current > aspect:
        next_width = max(1, int(height * aspect))
        x0 = (width - next_width) // 2
        return image[:, x0 : x0 + next_width]
    next_height = max(1, int(width / aspect))
    y0 = (height - next_height) // 2
    return image[y0 : y0 + next_height]


def grid_boxes(x0: int, y0: int, x1: int, y1: int, cols: int, rows: int, gutter: int) -> list[tuple[int, int, int, int]]:
    inner_w = x1 - x0 - gutter * (cols - 1)
    inner_h = y1 - y0 - gutter * (rows - 1)
    cell_w = inner_w / cols
    cell_h = inner_h / rows
    boxes: list[tuple[int, int, int, int]] = []
    for row in range(rows):
        for col in range(cols):
            xa = int(round(x0 + col * (cell_w + gutter))) + 1
            ya = int(round(y0 + row * (cell_h + gutter))) + 1
            xb = int(round(x0 + col * (cell_w + gutter) + cell_w)) - 1
            yb = int(round(y0 + row * (cell_h + gutter) + cell_h)) - 1
            boxes.append((xa, ya, xb, yb))
    return boxes


def save_jpeg(path: Path, image: np.ndarray, quality: int = 93) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), image, [int(cv2.IMWRITE_JPEG_QUALITY), quality, int(cv2.IMWRITE_JPEG_OPTIMIZE), 1])


def main() -> None:
    image = cv2.imread(str(SOURCE), cv2.IMREAD_COLOR)
    if image is None:
        raise SystemExit(f"Could not read {SOURCE}")

    desktop_boxes = grid_boxes(17, 59, 1519, 598, 5, 4, 10)
    mobile_boxes = grid_boxes(17, 665, 1519, 1000, 10, 2, 9)

    if len(desktop_boxes) != 20 or len(mobile_boxes) != 20:
        raise SystemExit(f"Expected 20+20 crops, got {len(desktop_boxes)} desktop and {len(mobile_boxes)} mobile")

    PREVIEW.mkdir(parents=True, exist_ok=True)
    GALLERY.mkdir(parents=True, exist_ok=True)

    for index, key in enumerate(KEYS):
        dx0, dy0, dx1, dy1 = desktop_boxes[index]
        mx0, my0, mx1, my1 = mobile_boxes[index]
        desktop = cover_crop(image[dy0:dy1, dx0:dx1], 16 / 9)
        mobile = cover_crop(image[my0:my1, mx0:mx1], 9 / 16)

        save_jpeg(PREVIEW / f"{key}-hero-desktop.jpg", upscale(desktop, DESKTOP_TARGET), 93)
        save_jpeg(PREVIEW / f"{key}-hero-mobile.jpg", upscale(mobile, MOBILE_TARGET), 93)
        save_jpeg(GALLERY / f"link-{key}.jpg", upscale(desktop, THUMB_DESKTOP), 90)
        save_jpeg(GALLERY / f"card-{key}.jpg", upscale(mobile, THUMB_MOBILE), 90)
        print(f"{index + 1:02d} {key} desktop {desktop.shape} mobile {mobile.shape}")

    print("done")


if __name__ == "__main__":
    main()
