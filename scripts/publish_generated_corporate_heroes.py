"""Publish generated corporate photos into product paths. Does not touch invitation cards."""

from pathlib import Path

import cv2
import numpy as np

ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")
ROOT = Path(r"C:\Users\Abcom\Sites\wedding-invitation")
PREVIEW = ROOT / "public" / "images" / "gallery" / "previews" / "corporate"
GALLERY = ROOT / "public" / "images" / "gallery" / "corporate"

KEYS = [
    "tech-frontier",
    "leadership",
    "industry-gala",
    "sustainable",
    "creative-summit",
    "trade",
    "fintech",
    "cowork",
    "healthcare",
    "jubilee",
    "ai-summit",
    "design-thinking",
    "real-estate",
    "diversity",
    "aerospace",
    "nonprofit",
    "retreat",
    "hr",
    "cyber",
    "dinner-circle",
]

DESKTOP = (3840, 2160)
MOBILE = (2160, 3840)
LINK = (1920, 1080)


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


def main() -> None:
    missing: list[str] = []
    for key in KEYS:
        desktop_src = ASSETS / f"{key}-hero-desktop.jpg"
        mobile_src = ASSETS / f"{key}-hero-mobile.jpg"
        desktop = cv2.imread(str(desktop_src), cv2.IMREAD_COLOR)
        mobile = cv2.imread(str(mobile_src), cv2.IMREAD_COLOR)
        if desktop is None:
            missing.append(str(desktop_src))
            continue
        if mobile is None:
            missing.append(str(mobile_src))
            continue

        print(key, "src desktop", desktop.shape, "mobile", mobile.shape)
        save_jpeg(PREVIEW / f"{key}-hero-desktop.jpg", fit(cover(desktop, 16 / 9), DESKTOP))
        save_jpeg(PREVIEW / f"{key}-hero-mobile.jpg", fit(cover(mobile, 9 / 16), MOBILE))
        save_jpeg(GALLERY / f"link-{key}.jpg", fit(cover(desktop, 16 / 9), LINK), 92)

    if missing:
        raise SystemExit("Missing: " + ", ".join(missing))
    print("published corporate heroes and website tiles; cards untouched")


if __name__ == "__main__":
    main()
