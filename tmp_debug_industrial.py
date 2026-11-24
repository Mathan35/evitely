import os

import cv2
import numpy as np

from tmp_rebuild_patterns import ornament_protect, photo_protect, type_mask, side_glyphs, letter_strokes, local_std

base = r"C:\Users\Abcom\Sites\wedding-invitation\public\images\gallery\previews\wedding"
img = cv2.imread(os.path.join(base, "industrial-screen.jpg"))
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
h, w = gray.shape
protect = ornament_protect(img)
photos = cv2.dilate(photo_protect(img, gray, protect), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
letters = type_mask(img, gray, protect, photos)
print("h,w", h, w, "letters", letters.mean() / 255, "protect", protect.mean() / 255, "photos", photos.mean() / 255)
print("letters in top 22%", letters[: int(h * 0.22)].mean() / 255)
n, labels, stats, _ = cv2.connectedComponentsWithStats(letters, 8)
print("n", n)
for i in range(1, n):
    x, y, bw, bh, area = stats[i]
    if area > 80:
        print(f" cc{i} {area} ({x},{y},{bw}x{bh})")
dbg = img.copy()
dbg[letters > 0] = (0, 0, 255)
dbg[photos > 0] = (255, 0, 0)
cv2.imwrite(os.path.join(base, "_dbg-industrial.jpg"), dbg)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
v = hsv[:, :, 2]
top = v[: int(h * 0.22), int(w * 0.08) : int(w * 0.92)]
print("top V p50 p90 p99", np.percentile(top, 50), np.percentile(top, 90), np.percentile(top, 99))
print("top v>165 frac", (top > 165).mean())
