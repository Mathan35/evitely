"""Publish wedding and housewarming invitation card photos. Does not touch website heroes."""

from pathlib import Path

import cv2
import numpy as np

ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")
ROOT = Path(r"C:\Users\Abcom\Sites\wedding-invitation")

HOUSEWARMING = [
    "hearth",
    "architecture",
    "sweet-home",
    "bungalow",
    "gilded",
    "foliage",
    "urban-flat",
    "welcome-bbq",
    "ivy",
    "midnight-gala",
    "suburban",
    "creative-house",
    "seaside",
    "industrial",
    "garden",
    "sunset-roof",
    "neighborhood",
    "ivy-brick",
    "whimsical-move",
    "hearth-dinner",
]

WEDDING = [
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

MOBILE = (2160, 2880)
DESKTOP = (2880, 2160)
TILE = (1600, 1600)


def find_src(stem: str) -> Path | None:
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        path = ASSETS / f"{stem}{ext}"
        if path.exists():
            return path
    matches = sorted(ASSETS.glob(f"*{stem}*"))
    return matches[0] if matches else None


def cover(image: np.ndarray, aspect: float) -> np.ndarray:
    height, width = image.shape[:2]
    current = width / max(height, 1)
    if current > aspect:
        next_width = max(1, int(height * aspect))
        x0 = (width - next_width) // 2
        return image[:, x0 : x0 + next_width]
    next_height = max(1, int(width / aspect))
    y0 = (height - next_height) // 2
    return image[y0 : y0 + next_height]


def fit(image: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    width, height = size
    current = image
    while current.shape[1] * 2 < width and current.shape[0] * 2 < height:
        current = cv2.resize(current, (current.shape[1] * 2, current.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
    current = cv2.resize(current, (width, height), interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(current, (0, 0), 0.8)
    return cv2.addWeighted(current, 1.18, blur, -0.18, 0)


def save_jpeg(path: Path, image: np.ndarray, quality: int = 94) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), image, [int(cv2.IMWRITE_JPEG_QUALITY), quality, int(cv2.IMWRITE_JPEG_OPTIMIZE), 1])


def publish(prefix: str, keys: list[str], folder: str) -> list[str]:
    gallery = ROOT / "public" / "images" / "gallery" / folder
    missing: list[str] = []
    for key in keys:
        mobile_src = find_src(f"{prefix}-card-{key}-mobile")
        desktop_src = find_src(f"{prefix}-card-{key}-desktop")
        mobile = cv2.imread(str(mobile_src), cv2.IMREAD_COLOR) if mobile_src else None
        desktop = cv2.imread(str(desktop_src), cv2.IMREAD_COLOR) if desktop_src else None
        if mobile is None:
            missing.append(f"{prefix}-card-{key}-mobile")
            continue
        if desktop is None:
            missing.append(f"{prefix}-card-{key}-desktop")
            continue
        print(folder, key, "mobile", mobile.shape, "desktop", desktop.shape)
        save_jpeg(gallery / f"card-{key}-mobile.jpg", fit(cover(mobile, 3 / 4), MOBILE))
        save_jpeg(gallery / f"card-{key}-desktop.jpg", fit(cover(desktop, 4 / 3), DESKTOP))
        save_jpeg(gallery / f"card-{key}.jpg", fit(cover(desktop, 1), TILE), 92)
    return missing


def main() -> None:
    missing = publish("hw", HOUSEWARMING, "housewarming") + publish("wd", WEDDING, "wedding")
    if missing:
        raise SystemExit("Missing: " + ", ".join(missing))
    print("published wedding and housewarming cards; website heroes untouched")


if __name__ == "__main__":
    main()
