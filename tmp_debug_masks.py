import os
import sys

import cv2
import numpy as np

from tmp_rebuild_patterns import (
    letter_strokes,
    local_std,
    ornament_protect,
    photo_protect,
    type_mask,
)

base = r"C:\Users\Abcom\Sites\wedding-invitation\public\images\gallery\previews\wedding"
name = sys.argv[1] if len(sys.argv) > 1 else "tropical"
img = cv2.imread(os.path.join(base, f"{name}-screen.jpg"))
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
h, w = gray.shape
protect = ornament_protect(img)
photos = photo_protect(img, gray, protect)
local = cv2.GaussianBlur(img.astype(np.float32), (71, 71), 0)
ldist = np.linalg.norm(img.astype(np.float32) - local, axis=2)
strokes = letter_strokes(gray)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
v = hsv[:, :, 2].astype(np.int16)
std = local_std(gray, 11)
inner_std = std[int(h * 0.22) : int(h * 0.78), int(w * 0.22) : int(w * 0.78)]
photo_hero = float(np.percentile(inner_std, 75)) < 16.0
cy0, cy1 = int(h * 0.12), int(h * (0.42 if photo_hero else 0.70))
cx0, cx1 = int(w * 0.16), int(w * 0.84)
med = float(np.median(v[cy0:cy1, cx0:cx1]))
print("photo_hero", photo_hero, "medV", med, "cy", cy0, cy1)
panel = np.zeros((h, w), np.uint8)
if med < 95:
    panel[v > med + 48] = 255
else:
    panel[v < med - 42] = 255
panel[:cy0, :] = 0
panel[cy1:, :] = 0
panel[:, :cx0] = 0
panel[:, cx1:] = 0
ink = np.zeros((h, w), np.uint8)
ink[(ldist > 10) & (strokes > 0)] = 255
ink[panel > 0] = 255
title_band = np.zeros((h, w), dtype=bool)
title_band[int(h * 0.16) : int(h * 0.46), int(w * 0.12) : int(w * 0.88)] = True
print("ldist>32 title frac", ((ldist > 32) & title_band).mean())
print("protect overlap ldist32 title", ((protect > 0) & (ldist > 32) & title_band).mean())
ink[(ldist > 32) & title_band] = 255
print("ink before protect", ink.mean() / 255)
ink[protect > 0] = 0
print("ink after protect", ink.mean() / 255)
ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
ink = cv2.dilate(ink, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
ink[protect > 0] = 0
n, labels, stats, _ = cv2.connectedComponentsWithStats(ink, 8)
print("n", n, "ink after morph", ink.mean() / 255)
thr = 0.22 * h * w
kept = 0
for i in range(1, n):
    x, y, bw, bh, area = stats[i]
    prot = (protect[labels == i] > 0).mean()
    skip = []
    if area < 40:
        skip.append("tiny")
    if area < 140 and bw < 22 and bh < 22:
        skip.append("star")
    if prot > 0.40:
        skip.append(f"prot{prot:.2f}")
    if area > thr:
        skip.append(f"huge{area / h / w:.2f}")
    if bw > w * 0.88 and bh > h * 0.28:
        skip.append("wide")
    tag = ",".join(skip) if skip else "KEEP"
    if tag == "KEEP" or area > 200:
        print(f"  cc{i} area={area} frac={area/h/w:.3f} bbox=({x},{y},{bw}x{bh}) prot={prot:.2f} {tag}")
    if not skip:
        kept += area
print("kept frac", kept / (h * w))
letters = type_mask(img, gray, protect, photos)
print("type_mask frac", letters.mean() / 255)
dbg = img.copy()
dbg[protect > 0] = (0, 255, 0)
dbg[letters > 0] = (0, 0, 255)
cv2.imwrite(os.path.join(base, f"_dbg-{name}.jpg"), dbg)
