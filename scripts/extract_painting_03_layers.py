import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


SIZE = (1536, 1024)


def _polygon(points: tuple[tuple[int, int], ...]) -> Image.Image:
    scale = 2
    mask = Image.new("L", (SIZE[0] * scale, SIZE[1] * scale), 0)
    ImageDraw.Draw(mask).polygon([(x * scale, y * scale) for x, y in points], fill=255)
    return mask.resize(SIZE, Image.Resampling.LANCZOS)


def _union(*masks: Image.Image) -> Image.Image:
    result = Image.new("L", SIZE, 0)
    for mask in masks:
        result = ImageChops.lighter(result, mask)
    return result


def _color_masks(original: Image.Image) -> tuple[Image.Image, Image.Image]:
    rgb = np.asarray(original.convert("RGB"), dtype=np.int16)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    blue_paper = (blue > red + 9) & (green > red + 3) & (blue > 62)
    foam_paper = (red > 166) & (green > 158) & (blue > 132) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 62)
    return Image.fromarray((blue_paper * 255).astype("uint8")), Image.fromarray((foam_paper * 255).astype("uint8"))


def extract_layers(root: Path) -> list[Path]:
    original_path = root / "assets/originals/painting-03/original.png"
    background_source = root / "assets/generated/painting-03/background-source.png"
    original = Image.open(original_path).convert("RGBA").resize(SIZE, Image.Resampling.LANCZOS)
    background = Image.open(background_source).convert("RGB").resize(SIZE, Image.Resampling.LANCZOS)
    layers_dir = root / "assets/layers/painting-03"
    masks_dir = layers_dir / "masks"
    layers_dir.mkdir(parents=True, exist_ok=True)
    masks_dir.mkdir(parents=True, exist_ok=True)

    blue, foam = _color_masks(original)
    distant_region = _union(
        _polygon(((280, 650), (520, 650), (770, 700), (970, 660), (1090, 700), (1040, 785), (380, 805))),
        _polygon(((1180, 325), (1536, 350), (1536, 455), (1260, 430))),
    )
    fuji = _polygon(((510, 704), (575, 649), (615, 607), (654, 638), (716, 711), (684, 754), (541, 754)))
    side_boats = _union(
        _polygon(((26, 444), (84, 478), (170, 582), (457, 710), (473, 752), (401, 764), (213, 682), (102, 582))),
        _polygon(((1110, 650), (1451, 455), (1510, 486), (1454, 614), (1252, 736), (1125, 722))),
    )
    center_boat = _polygon(((252, 781), (391, 838), (590, 888), (810, 795), (846, 818), (747, 952), (478, 951), (319, 881)))
    left_wave_region = _polygon(((0, 380), (205, 500), (405, 675), (710, 757), (895, 827), (756, 1024), (0, 1024)))
    main_wave_region = _union(
        _polygon(((500, 50), (848, 8), (1160, 40), (1536, 295), (1536, 740), (1190, 730), (990, 670), (843, 520), (745, 344), (520, 430))),
        _polygon(((645, 585), (985, 565), (1320, 480), (1536, 520), (1536, 1024), (710, 1024))),
    )
    foam_region = _polygon(((310, 95), (900, 0), (1240, 60), (1536, 280), (1536, 600), (1210, 610), (990, 560), (820, 410), (530, 465), (370, 335)))
    lower_main_region = _polygon(((570, 430), (1536, 400), (1536, 1024), (650, 1024)))

    masks = {
        "layer-001-distant-sea.webp": ImageChops.multiply(blue, distant_region),
        "layer-002-fuji.webp": fuji,
        "layer-003-boats.webp": side_boats,
        "layer-004-left-wave.webp": ImageChops.multiply(ImageChops.lighter(blue, foam), left_wave_region),
        "layer-005-main-wave.webp": ImageChops.lighter(
            ImageChops.multiply(blue, main_wave_region),
            ImageChops.multiply(foam, lower_main_region),
        ),
        "layer-006-foam.webp": ImageChops.multiply(foam, foam_region),
        "layer-007-center-boat.webp": center_boat,
    }

    outputs: list[Path] = []
    for filename, alpha in masks.items():
        alpha = alpha.filter(ImageFilter.GaussianBlur(0.35))
        layer = original.copy()
        layer.putalpha(alpha)
        output = layers_dir / filename
        layer.save(output, "WEBP", lossless=True, quality=100, method=6)
        alpha.save(masks_dir / f"{Path(filename).stem}.png", optimize=True)
        outputs.append(output)

    background.save(layers_dir / "background.webp", "WEBP", quality=94, method=6)
    original.convert("RGB").save(layers_dir / "relief-color.webp", "WEBP", quality=95, method=6)
    luminance = ImageOps.grayscale(original).filter(ImageFilter.GaussianBlur(7))
    depth = ImageEnhance.Contrast(luminance).enhance(0.72).point(lambda value: 22 + value * 0.48)
    for filename, boost in (
        ("layer-001-distant-sea.webp", 20),
        ("layer-002-fuji.webp", 35),
        ("layer-003-boats.webp", 70),
        ("layer-004-left-wave.webp", 58),
        ("layer-005-main-wave.webp", 88),
        ("layer-006-foam.webp", 108),
        ("layer-007-center-boat.webp", 74),
    ):
        raised = ImageChops.add(depth, Image.new("L", SIZE, boost))
        depth = Image.composite(raised, depth, masks[filename])
    depth.filter(ImageFilter.GaussianBlur(3)).save(layers_dir / "relief-depth.webp", "WEBP", quality=96, method=6)

    preview = background.convert("RGBA")
    for output in outputs:
        preview.alpha_composite(Image.open(output).convert("RGBA"))
    preview.convert("RGB").resize((600, 400), Image.Resampling.LANCZOS).save(layers_dir / "layer-preview.png", optimize=True)

    return outputs


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    outputs = extract_layers(root)
    print(f"extracted {len(outputs)} painting-03 layers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
