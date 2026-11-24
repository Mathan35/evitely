"""AI background removal for clean cartoon couple cutouts."""

from pathlib import Path

from PIL import Image
from rembg import remove

ASSETS = Path(r"C:\Users\Abcom\.cursor\projects\c-Users-Abcom-Sites-wedding-invitation\assets")
OUT = Path(r"C:\Users\Abcom\Sites\wedding-invitation\public\images\countdown")
OUT.mkdir(parents=True, exist_ok=True)


def clean(src: Path, dest: Path, target_h: int = 900) -> None:
    raw = Image.open(src).convert("RGBA")
    cut = remove(raw)
    # Soften only the outer alpha a touch — do not erode opaque interior
    px = cut.load()
    w, h = cut.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 12:
                px[x, y] = (0, 0, 0, 0)
            elif a < 255 and g > r + 40 and g > b + 40:
                # kill leftover green fringe only
                px[x, y] = (0, 0, 0, 0)

    bbox = cut.getbbox()
    if bbox:
        # pad slightly so hair tips aren't clipped
        pad = 8
        x0, y0, x1, y1 = bbox
        cut = cut.crop(
            (
                max(0, x0 - pad),
                max(0, y0 - pad),
                min(w, x1 + pad),
                min(h, y1 + pad),
            )
        )

    scale = target_h / cut.size[1]
    cut = cut.resize((max(1, int(cut.size[0] * scale)), target_h), Image.Resampling.LANCZOS)
    cut.save(dest, "PNG", optimize=True)
    print(f"wrote {dest.name} {cut.size} bytes={dest.stat().st_size}")


def main() -> None:
    jobs = [
        ("countdown-groom-clean.jpg", "groom.png"),
        ("countdown-bride-clean.jpg", "bride.png"),
    ]
    for src_name, dest_name in jobs:
        src = ASSETS / src_name
        if not src.exists():
            raise SystemExit(f"missing {src}")
        clean(src, OUT / dest_name)
    print("done")


if __name__ == "__main__":
    main()
