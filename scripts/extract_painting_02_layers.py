import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


REFERENCE_SIZE = (1200, 2000)

LAYER_REGIONS = {
    "layer-001-man-robes.webp": (
        ("polygon", (72, 500, 182, 438, 350, 455, 500, 530, 620, 680, 690, 770, 650, 860, 590, 930, 585, 1250, 620, 1490, 520, 1590, 420, 1630, 360, 1795, 250, 1780, 215, 1600, 78, 1550, 50, 1170)),
    ),
    "layer-002-woman-gown.webp": (
        ("polygon", (785, 545, 930, 535, 1080, 575, 1195, 690, 1200, 2000, 780, 2000, 650, 1860, 615, 1670, 650, 1400, 605, 1030, 620, 780)),
        ("polygon", (625, 660, 820, 620, 860, 775, 760, 860, 590, 815)),
    ),
    "layer-003-man-portrait.webp": (
        ("polygon", (185, 245, 250, 210, 405, 215, 505, 300, 490, 425, 425, 480, 275, 478, 205, 425, 175, 340)),
        ("polygon", (252, 320, 430, 315, 455, 505, 375, 555, 270, 510, 230, 410)),
        ("polygon", (274, 555, 330, 530, 365, 600, 346, 700, 300, 740, 270, 665)),
    ),
    "layer-004-woman-portrait.webp": (
        ("polygon", (790, 360, 885, 330, 1015, 365, 1060, 500, 1045, 690, 935, 720, 815, 665, 775, 515)),
        ("polygon", (835, 395, 985, 390, 1015, 585, 955, 650, 850, 620, 810, 505)),
    ),
    "layer-005-joined-hands.webp": (
        ("polygon", (565, 735, 620, 710, 700, 745, 770, 785, 758, 845, 700, 870, 625, 830, 570, 810)),
    ),
    "layer-006-dog.webp": (
        ("polygon", (440, 1570, 500, 1515, 590, 1535, 650, 1590, 720, 1615, 770, 1700, 755, 1845, 690, 1920, 575, 1950, 465, 1915, 420, 1830, 405, 1690)),
    ),
}


def _mask(shapes: tuple[tuple[str, tuple[int, ...]], ...], size: tuple[int, int]) -> Image.Image:
    scale = 2
    sx = size[0] / REFERENCE_SIZE[0]
    sy = size[1] / REFERENCE_SIZE[1]
    mask = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw = ImageDraw.Draw(mask)
    for shape, values in shapes:
        scaled = tuple(round(value * (sx if index % 2 == 0 else sy) * scale) for index, value in enumerate(values))
        if shape == "polygon":
            draw.polygon(tuple(zip(scaled[::2], scaled[1::2])), fill=255)
        else:
            draw.ellipse(scaled, fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS)


def extract_layers(root: Path) -> list[Path]:
    original = Image.open(root / "assets/originals/painting-02/original.png").convert("RGBA")
    layers_dir = root / "assets/layers/painting-02"
    masks_dir = layers_dir / "masks"
    generated_dir = root / "assets/generated/painting-02"
    masks_dir.mkdir(parents=True, exist_ok=True)
    generated_dir.mkdir(parents=True, exist_ok=True)

    outputs: list[Path] = []
    masks: dict[str, Image.Image] = {}
    for filename, shapes in LAYER_REGIONS.items():
        alpha = _mask(shapes, original.size)
        layer = original.copy()
        layer.putalpha(alpha)
        output = layers_dir / filename
        layer.save(output, "WEBP", lossless=True, quality=100)
        alpha.save(masks_dir / f"{Path(filename).stem}.png", optimize=True)
        masks[filename] = alpha
        outputs.append(output)

    original.convert("RGB").save(layers_dir / "relief-color.webp", "WEBP", quality=95, method=6)
    luminance = ImageOps.grayscale(original).filter(ImageFilter.GaussianBlur(8))
    depth = ImageEnhance.Contrast(luminance).enhance(0.72).point(lambda value: 28 + value * 0.42)
    for filename, boost in (
        ("layer-001-man-robes.webp", 48),
        ("layer-002-woman-gown.webp", 56),
        ("layer-003-man-portrait.webp", 88),
        ("layer-004-woman-portrait.webp", 92),
        ("layer-005-joined-hands.webp", 104),
        ("layer-006-dog.webp", 72),
    ):
        raised = ImageChops.add(depth, Image.new("L", depth.size, boost), scale=1, offset=0)
        depth = Image.composite(raised, depth, masks[filename])
    depth.filter(ImageFilter.GaussianBlur(3)).save(layers_dir / "relief-depth.webp", "WEBP", quality=96, method=6)

    background = Image.open(layers_dir / "background.webp").convert("RGBA")
    composite = background.copy()
    for output in outputs:
        composite.alpha_composite(Image.open(output).convert("RGBA"))
    composite.convert("RGB").resize((300, 500), Image.Resampling.LANCZOS).save(layers_dir / "layer-preview.png", optimize=True)
    return outputs


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    outputs = extract_layers(root)
    print(f"extracted {len(outputs)} painting-02 layers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
