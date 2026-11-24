"""Keep edge-connected ornaments. Wipe inner letters and pills only."""

from __future__ import annotations

import glob
import os

import cv2
import numpy as np

SCREEN_DIR = r"C:\Users\Abcom\Sites\wedding-invitation\public\images\gallery\previews\wedding"


def local_std(gray: np.ndarray, k: int = 9) -> np.ndarray:
    g = gray.astype(np.float32)
    mean = cv2.GaussianBlur(g, (k, k), 0)
    sq = cv2.GaussianBlur(g**2, (k, k), 0)
    return np.sqrt(np.maximum(sq - mean**2, 0))


def paper_color(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    std = local_std(gray, 11)
    wash = img[std < 9]
    if len(wash) < 80:
        wash = img[std < 16]
    if len(wash) < 80:
        h, w = img.shape[:2]
        wash = img[int(h * 0.35) : int(h * 0.55), int(w * 0.35) : int(w * 0.65)].reshape(-1, 3)
    return np.median(wash.reshape(-1, 3), axis=0).astype(np.float32)


def geometric_frame(h: int, w: int) -> np.ndarray:
    p = np.zeros((h, w), np.uint8)
    p[:4, :] = 255
    p[:, :4] = 255
    p[:, w - 4 :] = 255
    p[h - 4 :, :] = 255
    return p


def ornament_protect(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    paper = paper_color(img)
    dist = np.linalg.norm(img.astype(np.float32) - paper, axis=2)
    seeds = []
    for x in range(0, w, 2):
        if dist[1, x] > 22:
            seeds.append((x, 1))
        if dist[h - 2, x] > 22:
            seeds.append((x, h - 2))
    for y in range(0, h, 2):
        if dist[y, 1] > 22:
            seeds.append((1, y))
        if dist[y, w - 2] > 22:
            seeds.append((w - 2, y))
    ffmask = np.zeros((h + 2, w + 2), np.uint8)
    flags = 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8)
    src = img.copy()
    for seed in seeds[:400]:
        x, y = seed
        if ffmask[y + 1, x + 1]:
            continue
        cv2.floodFill(src, ffmask, seed, 0, (14, 14, 14), (14, 14, 14), flags)
    protect = ffmask[1:-1, 1:-1]
    protect = cv2.dilate(protect, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    if protect.mean() > 0.40 * 255:
        protect = geometric_frame(h, w)
    else:
        protect = cv2.bitwise_or(protect, geometric_frame(h, w))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 40, 120)
    # Protect corner/side ornaments only — a full top strip also covers titles.
    outer = np.zeros((h, w), np.uint8)
    outer[:, : int(w * 0.12)] = 255
    outer[:, int(w * 0.88) :] = 255
    outer[int(h * 0.90) :, :] = 255
    outer[: int(h * 0.04), :] = 255
    outer[: int(h * 0.14), : int(w * 0.22)] = 255
    outer[: int(h * 0.14), int(w * 0.78) :] = 255
    outer[int(h * 0.86) :, : int(w * 0.22)] = 255
    outer[int(h * 0.86) :, int(w * 0.78) :] = 255
    edge_art = cv2.dilate(cv2.bitwise_and(edges, outer), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    return cv2.bitwise_or(protect, edge_art)


def letter_strokes(gray: np.ndarray) -> np.ndarray:
    h, w = gray.shape
    std = local_std(gray, 9)
    dark = np.zeros_like(gray)
    bright = np.zeros_like(gray)
    for k in (
        cv2.getStructuringElement(cv2.MORPH_RECT, (19, 3)),
        cv2.getStructuringElement(cv2.MORPH_RECT, (3, 11)),
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)),
    ):
        dark = np.maximum(dark, cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, k))
        bright = np.maximum(bright, cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, k))
    inner = np.zeros((h, w), dtype=bool)
    inner[int(h * 0.08) : int(h * 0.88), int(w * 0.10) : int(w * 0.90)] = True
    sample = inner & (std < 18)
    if sample.sum() < 400:
        sample = inner
    dthr = max(12, int(np.percentile(dark[sample], 96)))
    bthr = max(12, int(np.percentile(bright[sample], 96)))
    mask = np.zeros_like(gray)
    mask[(dark > dthr) & inner] = 255
    mask[(bright > bthr) & inner] = 255
    return mask


def photo_protect(img: np.ndarray, gray: np.ndarray, protect: np.ndarray) -> np.ndarray:
    h, w = gray.shape
    out = np.zeros((h, w), np.uint8)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.dilate(cv2.Canny(blur, 40, 120), np.ones((3, 3), np.uint8))
    cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in cnts:
        x, y, bw, bh = cv2.boundingRect(c)
        box = bw * bh
        if box < 0.07 * h * w or box > 0.36 * h * w:
            continue
        if bw < w * 0.38 or bw > w * 0.86:
            continue
        if bh < h * 0.14 or bh > h * 0.42:
            continue
        peri = cv2.arcLength(c, True)
        ap = cv2.approxPolyDP(c, 0.04 * peri, True)
        fill = cv2.contourArea(c) / max(box, 1)
        if len(ap) == 4 and fill > 0.82:
            cv2.rectangle(out, (x, y), (x + bw, y + bh), 255, -1)
        elif fill > 0.78 and 0.42 * w < bw < 0.86 * w and 0.16 * h < bh < 0.42 * h:
            cv2.rectangle(out, (x, y), (x + bw, y + bh), 255, -1)

    std = local_std(gray, 11)
    tex = np.zeros((h, w), np.uint8)
    inner = np.zeros((h, w), dtype=bool)
    inner[int(h * 0.18) : int(h * 0.82), int(w * 0.12) : int(w * 0.88)] = True
    tex[(std > 28) & inner] = 255
    tex[protect > 0] = 0
    tex = cv2.morphologyEx(tex, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(tex, 8)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        if bw < w * 0.40 or bw > w * 0.86:
            continue
        if bh < h * 0.16 or bh > h * 0.42:
            continue
        fill = area / max(bw * bh, 1)
        if fill < 0.48:
            continue
        p30 = float(np.percentile(std[y : y + bh, x : x + bw], 30))
        if p30 < 12:
            continue
        out[y : y + bh, x : x + bw] = 255
    out[protect > 0] = 0
    return cv2.dilate(out, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))


def type_mask(img: np.ndarray, gray: np.ndarray, protect: np.ndarray, photos: np.ndarray) -> np.ndarray:
    h, w = gray.shape
    local = cv2.GaussianBlur(img.astype(np.float32), (31, 31), 0)
    ldist = np.linalg.norm(img.astype(np.float32) - local, axis=2)
    strokes = letter_strokes(gray)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    s = hsv[:, :, 1].astype(np.int16)
    v = hsv[:, :, 2].astype(np.int16)
    std = local_std(gray, 11)
    inner_std = std[int(h * 0.22) : int(h * 0.78), int(w * 0.22) : int(w * 0.78)]
    photo_hero = float(np.percentile(inner_std, 75)) < 16.0
    cy0, cy1 = int(h * 0.08), int(h * (0.42 if photo_hero else 0.78))
    cx0, cx1 = int(w * 0.10), int(w * 0.90)
    med_v = float(np.median(v[cy0:cy1, cx0:cx1]))
    med_s = float(np.median(s[cy0:cy1, cx0:cx1]))
    script = np.zeros((h, w), np.uint8)
    band = np.zeros((h, w), dtype=bool)
    band[cy0:cy1, cx0:cx1] = True
    if med_v < 95:
        script[(v > med_v + 40) & band] = 255
        top = np.zeros((h, w), dtype=bool)
        top[: int(h * 0.22), int(w * 0.08) : int(w * 0.92)] = True
        script[(v > 165) & top] = 255
    if photo_hero:
        script[(v > 215) & (s < 90) & (ldist > 8) & band] = 255
    else:
        script[(v < med_v - 38) & band] = 255
        script[(v > 205) & (s < 110) & (ldist > 14) & band] = 255
        if med_s > 140:
            script[(v > med_v - 8) & (s < med_s - 70) & (ldist > 12) & band] = 255
    ink = np.zeros((h, w), np.uint8)
    ink[(ldist > 8) & (strokes > 0)] = 255
    ink[script > 0] = 255
    ink[protect > 0] = 0
    ink[photos > 0] = 0
    flora = np.zeros((h, w), dtype=bool)
    flora[: int(h * 0.26), : int(w * 0.30)] = True
    flora[: int(h * 0.26), int(w * 0.70) :] = True
    flora[int(h * 0.74) :, : int(w * 0.30)] = True
    flora[int(h * 0.74) :, int(w * 0.70) :] = True
    flora[:, : int(w * 0.14)] = True
    flora[:, int(w * 0.86) :] = True
    ink[(s > 48) & flora] = 0
    ink[:, : int(w * 0.06)] = 0
    ink[:, int(w * 0.94) :] = 0
    ink[: int(h * 0.02), :] = 0
    ink[int(h * 0.98) :, :] = 0
    ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    ink = cv2.dilate(ink, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2)))
    ink[protect > 0] = 0
    ink[photos > 0] = 0
    n, labels, stats, _ = cv2.connectedComponentsWithStats(ink, 8)
    out = np.zeros_like(ink)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        fill = area / max(bw * bh, 1)
        if area < 28:
            continue
        if area < 90 and bw < 16 and bh < 16:
            continue
        if (photos[labels == i] > 0).mean() > 0.18:
            continue
        if (protect[labels == i] > 0).mean() > 0.40:
            continue
        if area > 0.18 * h * w and fill > 0.55:
            continue
        if bw > w * 0.90 and bh > h * 0.22 and fill > 0.50:
            continue
        out[labels == i] = 255
    return cv2.dilate(out, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2)))


def button_mask(img: np.ndarray, gray: np.ndarray, protect: np.ndarray) -> np.ndarray:
    h, w = gray.shape
    local = cv2.GaussianBlur(img.astype(np.float32), (51, 51), 0)
    ldist = np.linalg.norm(img.astype(np.float32) - local, axis=2)
    std = local_std(gray, 9)
    band = np.zeros((h, w), dtype=bool)
    band[int(h * 0.38) : int(h * 0.97), int(w * 0.08) : int(w * 0.92)] = True
    cand = np.zeros((h, w), np.uint8)
    cand[(ldist > 20) & (std < 16.0) & band] = 255
    cand[protect > 0] = 0
    cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, np.ones((5, 17), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(cand, 8)
    out = np.zeros((h, w), np.uint8)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        aspect = bw / max(bh, 1)
        if area < 200 or y < h * 0.36:
            continue
        if bh > h * 0.12 or bh < 8:
            continue
        if aspect < 1.45 or bw < w * 0.18 or bw > w * 0.88:
            continue
        if x < w * 0.05 or x + bw > w * 0.95:
            continue
        out[labels == i] = 255
    return cv2.dilate(out, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 7)))


def side_glyphs(img: np.ndarray, protect: np.ndarray, photos: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    local = cv2.GaussianBlur(img.astype(np.float32), (21, 21), 0)
    ldist = np.linalg.norm(img.astype(np.float32) - local, axis=2)
    cand = np.zeros((h, w), np.uint8)
    inner = np.zeros((h, w), dtype=bool)
    inner[int(h * 0.12) : int(h * 0.62), int(w * 0.06) : int(w * 0.94)] = True
    cand[(ldist > 20) & inner] = 255
    cand[protect > 0] = 0
    cand[photos > 0] = 0
    cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2)))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(cand, 8)
    out = np.zeros((h, w), np.uint8)
    for i in range(1, n):
        _, _, bw, bh, area = stats[i]
        fill = area / max(bw * bh, 1)
        if area < 45 or area > 14000:
            continue
        if bh < 12 or bh > 130 or bw < 6 or bw > min(w * 0.82, 280):
            continue
        if fill > 0.88:
            continue
        if (protect[labels == i] > 0).mean() > 0.55:
            continue
        out[labels == i] = 255
    return out


def stamp_fill(img: np.ndarray, mask: np.ndarray, paper: np.ndarray) -> np.ndarray:
    if mask.sum() == 0:
        return img
    n0, labels0, stats0, _ = cv2.connectedComponentsWithStats(mask, 8)
    closed = np.zeros_like(mask)
    close_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    for i in range(1, n0):
        cc = (labels0 == i).astype(np.uint8) * 255
        x, y, bw, bh, area = stats0[i]
        fill = area / max(bw * bh, 1)
        if fill < 0.42:
            cc = cv2.morphologyEx(cc, cv2.MORPH_CLOSE, close_k)
        closed = cv2.bitwise_or(closed, cc)
    m = cv2.dilate(closed, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (4, 4)))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    out = img.copy()
    all_m = m > 0
    ring_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
    for i in range(1, n):
        cc = labels == i
        ring = cv2.dilate(cc.astype(np.uint8), ring_k) > 0
        ring &= ~all_m
        pix = img[ring]
        fill = np.median(pix.reshape(-1, 3), axis=0) if len(pix) >= 12 else paper
        out[cc] = fill
    return out


def rebuild(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    protect = ornament_protect(img)
    photos = cv2.dilate(photo_protect(img, gray, protect), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    paper = paper_color(img)
    std = local_std(gray, 11)
    inner_std = std[int(gray.shape[0] * 0.22) : int(gray.shape[0] * 0.78), int(gray.shape[1] * 0.22) : int(gray.shape[1] * 0.78)]
    photo_hero = float(np.percentile(inner_std, 75)) < 16.0
    h, w = gray.shape
    letters = type_mask(img, gray, protect, photos)
    letters[photos > 0] = 0
    if photo_hero:
        letters[int(gray.shape[0] * 0.42) :, :] = 0
    buttons = button_mask(img, gray, protect)
    buttons[photos > 0] = 0
    work = stamp_fill(img, buttons, paper)
    work = stamp_fill(work, letters, paper)
    gray2 = cv2.cvtColor(work, cv2.COLOR_BGR2GRAY)
    leftovers = type_mask(work, gray2, protect, photos)
    leftovers[photos > 0] = 0
    if photo_hero:
        leftovers[int(gray.shape[0] * 0.42) :, :] = 0
    work = stamp_fill(work, leftovers, paper)
    glyphs = side_glyphs(work, protect, photos)
    glyphs[photos > 0] = 0
    if photo_hero:
        glyphs[int(gray.shape[0] * 0.42) :, :] = 0
    work = stamp_fill(work, glyphs, paper)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    v = hsv[:, :, 2]
    paper_luma = float(0.114 * paper[0] + 0.587 * paper[1] + 0.299 * paper[2])
    if paper_luma < 110:
        ink = cv2.dilate(cv2.bitwise_or(letters, leftovers), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
        ink = cv2.bitwise_or(ink, cv2.dilate(glyphs, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))))
        ink[protect > 0] = 0
        ink[photos > 0] = 0
        work[ink > 0] = tuple(int(x) for x in paper)
        top = np.zeros((h, w), np.uint8)
        top[: int(h * 0.22), int(w * 0.07) : int(w * 0.93)] = 255
        bright = np.zeros((h, w), np.uint8)
        bright[(v > 158) & (top > 0)] = 255
        bright[protect > 0] = 0
        bright[photos > 0] = 0
        n, labels, stats, _ = cv2.connectedComponentsWithStats(bright, 8)
        large = tiny = 0
        keep = np.zeros((h, w), np.uint8)
        for i in range(1, n):
            _, _, bw, bh, area = stats[i]
            if area >= 80 and (bh >= 14 or bw >= 14):
                large += area
                keep[labels == i] = 255
            else:
                tiny += area
        if large > tiny * 0.35:
            work[keep > 0] = tuple(int(x) for x in paper)
        # Titles sitting in the side protect band (e.g. Metropolitan M)
        # and leftover initials: bright CCs not connected to the border frame.
        bright = np.zeros((h, w), np.uint8)
        bright[(v > 138) & (photos == 0)] = 255
        ff = np.zeros((h + 2, w + 2), np.uint8)
        src = bright.copy()
        flags = 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8)
        band = 10
        seeds = []
        for x in range(0, w, 2):
            for y in range(band):
                seeds.append((x, y))
                seeds.append((x, h - 1 - y))
        for y in range(0, h, 2):
            for x in range(band):
                seeds.append((x, y))
                seeds.append((w - 1 - x, y))
        for seed in seeds:
            x, y = seed
            if not bright[y, x] or ff[y + 1, x + 1]:
                continue
            cv2.floodFill(src, ff, seed, 0, 0, 0, flags)
        border_art = ff[1:-1, 1:-1]
        isolated = cv2.bitwise_and(bright, cv2.bitwise_not(border_art))
        isolated[: int(h * 0.03), :] = 0
        isolated[int(h * 0.97) :, :] = 0
        n, labels, stats, _ = cv2.connectedComponentsWithStats(isolated, 8)
        wipe = np.zeros((h, w), np.uint8)
        for i in range(1, n):
            x, y, bw, bh, area = stats[i]
            if area < 55 or area > 18000:
                continue
            if bh < 14 and bw < 14:
                continue
            # Keep starfield sparkles (compact, small)
            if area < 90 and max(bw, bh) < 22:
                continue
            wipe[labels == i] = 255
        wipe = cv2.dilate(wipe, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
        wipe[photos > 0] = 0
        wipe[border_art > 0] = 0
        work[wipe > 0] = tuple(int(x) for x in paper)
        # Hollow buttons / leftover button labels on dark cards
        bot = np.zeros((h, w), np.uint8)
        bot[int(h * 0.72) :, int(w * 0.08) : int(w * 0.92)] = 255
        lab = cv2.bitwise_and(bright, bot)
        lab[photos > 0] = 0
        lab[border_art > 0] = 0
        work[lab > 0] = tuple(int(x) for x in paper)
    else:
        # Light paper leftover initials / UI chrome. Never stamp edge florals.
        hsv = cv2.cvtColor(work, cv2.COLOR_BGR2HSV)
        v2 = hsv[:, :, 2]
        s2 = hsv[:, :, 1]
        ink = np.zeros((h, w), np.uint8)
        ink[(v2 < 118) & (photos == 0)] = 255
        inner = np.zeros((h, w), np.uint8)
        inner[int(h * 0.08) : int(h * 0.94), int(w * 0.02) : int(w * 0.98)] = 255
        ink = cv2.bitwise_and(ink, inner)
        n, labels, stats, _ = cv2.connectedComponentsWithStats(ink, 8)
        wipe = np.zeros((h, w), np.uint8)
        for i in range(1, n):
            x, y, bw, bh, area = stats[i]
            fill = area / max(bw * bh, 1)
            if area < 35 or area > 12000:
                continue
            if bh < 10 or bh > 160 or bw < 4 or bw > 260:
                continue
            pfrac = float((protect[labels == i] > 0).mean())
            in_margin = x < w * 0.18 or x + bw > w * 0.82 or y < h * 0.16 or y + bh > h * 0.84
            paren = fill < 0.42 and bw < 58 and bh > 36
            sat = float(np.median(s2[labels == i])) if area else 255
            ink_glyph = sat < 50 and area < 2800
            if in_margin and not paren and not ink_glyph:
                continue
            if pfrac > 0.20 and not paren and not ink_glyph:
                continue
            wipe[labels == i] = 255
        work[wipe > 0] = tuple(int(x) for x in paper)
        # White/light digits and labels on colored wash (calendar)
        bright = np.zeros((h, w), np.uint8)
        bright[(v2 > 188) & (photos == 0)] = 255
        bright[protect > 0] = 0
        n, labels, stats, _ = cv2.connectedComponentsWithStats(bright, 8)
        wipe = np.zeros((h, w), np.uint8)
        for i in range(1, n):
            _, _, bw, bh, area = stats[i]
            if area < 16 or area > 700:
                continue
            if bh > 42 or bw > 64:
                continue
            wipe[labels == i] = 255
        work[wipe > 0] = tuple(int(x) for x in paper)
    return work


def main() -> None:
    for path in sorted(glob.glob(os.path.join(SCREEN_DIR, "*-screen.jpg"))):
        img = cv2.imread(path)
        if img is None:
            raise SystemExit(f"missing {path}")
        out = path.replace("-screen.jpg", "-pattern.jpg")
        cv2.imwrite(out, rebuild(img), [int(cv2.IMWRITE_JPEG_QUALITY), 94])
        print("wrote", os.path.basename(out))


if __name__ == "__main__":
    main()
