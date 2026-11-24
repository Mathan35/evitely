"""Generate matching responsive WebP variants for the birthday invitation cards."""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "public" / "images" / "gallery" / "birthday"
OUTPUT_DIR = SOURCE_DIR / "super-res"
MODEL_URL = "https://huggingface.co/qualcomm/Real-ESRGAN-General-x4v3"
SCALE = 4
TILE = 128
STRIDE = 96
PADDING = 16


def tile_positions(length: int) -> list[int]:
    final = length - TILE
    positions = list(range(0, final + 1, STRIDE))

    if positions[-1] != final:
        positions.append(final)

    return positions


def super_resolve(image: np.ndarray, session: ort.InferenceSession) -> np.ndarray:
    image_height, image_width = image.shape[:2]
    padded = cv2.copyMakeBorder(
        image, PADDING, PADDING, PADDING, PADDING, cv2.BORDER_REFLECT_101
    )
    height, width = padded.shape[:2]
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    accumulator = np.zeros((height * SCALE, width * SCALE, 3), dtype=np.float32)
    weights = np.zeros((height * SCALE, width * SCALE, 1), dtype=np.float32)
    window = cv2.createHanningWindow((TILE * SCALE, TILE * SCALE), cv2.CV_32F)

    for y in tile_positions(height):
        for x in tile_positions(width):
            tile = padded[y : y + TILE, x : x + TILE]
            tensor = tile[:, :, ::-1].transpose(2, 0, 1)[None].astype(np.float32) / 255.0
            result = session.run([output_name], {input_name: tensor})[0][0]
            result = result.transpose(1, 2, 0)[:, :, ::-1]
            y0, x0 = y * SCALE, x * SCALE
            accumulator[y0 : y0 + TILE * SCALE, x0 : x0 + TILE * SCALE] += result * window[:, :, None]
            weights[y0 : y0 + TILE * SCALE, x0 : x0 + TILE * SCALE] += window[:, :, None]

    result = np.clip(accumulator / np.maximum(weights, 1e-6), 0, 1)
    y0, x0 = PADDING * SCALE, PADDING * SCALE

    return (
        result[y0 : y0 + image_height * SCALE, x0 : x0 + image_width * SCALE] * 255
    ).round().astype(np.uint8)


def save_webp(path: Path, image: np.ndarray) -> None:
    ok, encoded = cv2.imencode(".webp", image, [cv2.IMWRITE_WEBP_QUALITY, 92])

    if not ok:
        raise RuntimeError(f"Unable to encode WebP image: {path}")

    path.write_bytes(encoded.tobytes())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, help=f"ONNX model from {MODEL_URL}")
    parser.add_argument(
        "--from-existing-4x",
        action="store_true",
        help="Create missing 8K variants from generated 4× images without loading the model",
    )
    parser.add_argument("--overwrite", action="store_true", help="Regenerate variants that already exist")
    args = parser.parse_args()

    if not args.from_existing_4x and args.model is None:
        parser.error("--model is required unless --from-existing-4x is set")

    if args.model is not None and not args.model.is_file():
        raise FileNotFoundError(f"ONNX model not found: {args.model}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sources = sorted(SOURCE_DIR.glob("birthday-card-*.jpg"))

    if not sources:
        raise FileNotFoundError(f"No birthday card source images found in {SOURCE_DIR}")

    if args.from_existing_4x:
        for source in sources:
            image = cv2.imread(str(source), cv2.IMREAD_COLOR)

            if image is None:
                raise RuntimeError(f"Unable to read birthday card source image: {source}")

            key = source.stem.removeprefix("birthday-card-")
            enhanced_path = OUTPUT_DIR / f"birthday-card-{key}-4x.webp"
            eight_k_path = OUTPUT_DIR / f"birthday-card-{key}-8k.webp"

            if not args.overwrite and eight_k_path.is_file():
                print(f"{key}: 8K variant already exists")
                continue

            enhanced = cv2.imread(str(enhanced_path), cv2.IMREAD_COLOR)

            if enhanced is None:
                raise FileNotFoundError(f"4× birthday card image not found or unreadable: {enhanced_path}")

            eight_k = cv2.resize(
                enhanced,
                (image.shape[1] * 8, image.shape[0] * 8),
                interpolation=cv2.INTER_LANCZOS4,
            )
            save_webp(eight_k_path, eight_k)
            print(f"{key}: generated {eight_k.shape[1]}x{eight_k.shape[0]} 8K variant")

        return

    session_options = ort.SessionOptions()
    session_options.intra_op_num_threads = 4
    session_options.inter_op_num_threads = 1
    session_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    session = ort.InferenceSession(
        str(args.model), sess_options=session_options, providers=["CPUExecutionProvider"]
    )

    for source in sources:
        image = cv2.imread(str(source), cv2.IMREAD_COLOR)

        if image is None:
            raise RuntimeError(f"Unable to read birthday card image: {source}")

        key = source.stem.removeprefix("birthday-card-")
        paths = [
            OUTPUT_DIR / f"birthday-card-{key}.webp",
            OUTPUT_DIR / f"birthday-card-{key}-2x.webp",
            OUTPUT_DIR / f"birthday-card-{key}-4x.webp",
            OUTPUT_DIR / f"birthday-card-{key}-8k.webp",
        ]

        if not args.overwrite and all(path.is_file() for path in paths):
            print(f"{key}: variants already exist")
            continue

        enhanced = super_resolve(image, session)
        variants = [
            cv2.resize(
                enhanced,
                (image.shape[1], image.shape[0]),
                interpolation=cv2.INTER_AREA,
            ),
            cv2.resize(
                enhanced,
                (image.shape[1] * 2, image.shape[0] * 2),
                interpolation=cv2.INTER_AREA,
            ),
            enhanced,
            cv2.resize(
                enhanced,
                (image.shape[1] * 8, image.shape[0] * 8),
                interpolation=cv2.INTER_LANCZOS4,
            ),
        ]

        for path, variant in zip(paths, variants):
            save_webp(path, variant)

        print(
            f"{key}: {image.shape[1]}x{image.shape[0]} -> "
            f"{variants[3].shape[1]}x{variants[3].shape[0]}"
        )


if __name__ == "__main__":
    main()
