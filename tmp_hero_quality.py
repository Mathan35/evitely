"""Rebuild wedding hero JPEGs at 8K with iterative back-projection sharpening."""

from __future__ import annotations

import glob
import os

import cv2
import numpy as np

SRC = r"C:\Users\Abcom\Sites\wedding-invitation\public\images\gallery\previews\wedding"
TARGET_LONG = 7680  # 8K UHD long edge
IBP_ITERS = 16


def ibp_scale(img: np.ndarray, scale: int) -> np.ndarray:
    src_h, src_w = img.shape[:2]
    tw, th = src_w * scale, src_h * scale
    src = img.astype(np.float32)
    hr = cv2.resize(img, (tw, th), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
    for _ in range(IBP_ITERS):
        down = cv2.resize(hr, (src_w, src_h), interpolation=cv2.INTER_AREA)
        err = src - down
        err_up = cv2.resize(err, (tw, th), interpolation=cv2.INTER_LANCZOS4)
        hr = np.clip(hr + 0.85 * err_up, 0, 255)
    return hr


def unsharp(img: np.ndarray, amount: float, sigma: float) -> np.ndarray:
    blur = cv2.GaussianBlur(img, (0, 0), sigma)
    return np.clip(img * amount + blur * (1.0 - amount), 0, 255)


def to_8k(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    # Neural-style IBP to 4x, then LANCZOS to 8K long edge
    hr = ibp_scale(img, 4)
    hr = unsharp(hr, 1.55, 1.05)
    long_edge = max(h * 4, w * 4)
    scale = TARGET_LONG / long_edge
    tw, th = int(round(w * 4 * scale)), int(round(h * 4 * scale))
    out = cv2.resize(hr, (tw, th), interpolation=cv2.INTER_LANCZOS4)
    out = unsharp(out, 1.22, 1.35)
    return np.clip(out, 0, 255).astype(np.uint8)


def encode(path: str, img: np.ndarray) -> None:
    params = [
        int(cv2.IMWRITE_JPEG_QUALITY),
        92,
        int(cv2.IMWRITE_JPEG_OPTIMIZE),
        1,
        int(cv2.IMWRITE_JPEG_PROGRESSIVE),
        1,
    ]
    cv2.imwrite(path, img, params)
    size = os.path.getsize(path)
    if size > 5_500_000:
        params[1] = 86
        cv2.imwrite(path, img, params)


def main() -> None:
    paths = sorted(glob.glob(os.path.join(SRC, "*-screen.jpg")))
    for path in paths:
        key = os.path.basename(path).replace("-screen.jpg", "")
        img = cv2.imread(path)
        if img is None:
            raise SystemExit(f"missing {path}")
        hero = to_8k(img)
        dest = os.path.join(SRC, f"{key}-hero.jpg")
        encode(dest, hero)
        print(f"{key}: {hero.shape[1]}x{hero.shape[0]}  {os.path.getsize(dest) // 1024}kb")


if __name__ == "__main__":
    main()
