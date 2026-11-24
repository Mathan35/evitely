"""Upscale full front-card screens (with original type) for sharp hero use."""

from __future__ import annotations

import glob
import os

import cv2
import numpy as np

SRC = r"C:\Users\Abcom\Sites\wedding-invitation\public\images\gallery\previews\wedding"


def to_hex(bgr: np.ndarray) -> str:
    return "#{:02x}{:02x}{:02x}".format(int(bgr[2]), int(bgr[1]), int(bgr[0]))


def light_wash(img: np.ndarray) -> tuple[np.ndarray, np.ndarray, float]:
    h, w = img.shape[:2]
    patch = img[int(h * 0.32) : int(h * 0.62), int(w * 0.22) : int(w * 0.78)]
    med = np.median(patch.reshape(-1, 3), axis=0)
    luma = float(0.114 * med[0] + 0.587 * med[1] + 0.299 * med[2])
    if luma >= 210:
        wash = med
    elif luma >= 150:
        wash = med * 0.35 + 255 * 0.65
    else:
        wash = med * 0.18 + 255 * 0.82
    surface = np.clip(wash * 0.93 + np.array([12.0, 14.0, 16.0]), 0, 255)
    return wash, surface, luma


def main() -> None:
    for path in sorted(glob.glob(os.path.join(SRC, "*-screen.jpg"))):
        key = os.path.basename(path).replace("-screen.jpg", "")
        img = cv2.imread(path)
        if img is None:
            raise SystemExit(f"missing {path}")
        h, w = img.shape[:2]
        hero = cv2.resize(img, (w * 4, h * 4), interpolation=cv2.INTER_LANCZOS4)
        dest = os.path.join(SRC, f"{key}-hero.jpg")
        cv2.imwrite(dest, hero, [int(cv2.IMWRITE_JPEG_QUALITY), 96])
        wash, surface, luma = light_wash(img)
        print(
            f"{key}: wash {to_hex(wash)}  surface {to_hex(surface)}  luma {luma:.0f}  "
            f"{hero.shape[1]}x{hero.shape[0]}  {os.path.getsize(dest) // 1024}kb"
        )


if __name__ == "__main__":
    main()
