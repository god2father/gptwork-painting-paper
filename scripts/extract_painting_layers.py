import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from scripts.validate_painting_assets import EXPECTED_LAYERS

REFERENCE_SIZE = (1536, 1920)

REGIONS = {
    "layer-001-scarf-tail.webp": (
        ("polygon", (930, 160, 1030, 210, 1120, 330, 1160, 520, 1190, 760, 1250, 1030, 1340, 1370, 1320, 1430, 1160, 1510, 1080, 1450, 1080, 1190, 1060, 900, 1050, 620, 1010, 420)),
    ),
    "layer-002-torso.webp": (
        ("polygon", (620, 1040, 850, 990, 1040, 1020, 1140, 1150, 1200, 1450, 1240, 1920, 290, 1920, 360, 1700, 430, 1450, 500, 1200)),
    ),
    "layer-003-neck-ear.webp": (
        ("polygon", (660, 720, 850, 690, 930, 780, 950, 900, 900, 1010, 760, 1120, 620, 1030, 570, 930)),
    ),
    "layer-004-face-base.webp": (
        ("polygon", (520, 420, 650, 420, 790, 480, 880, 590, 890, 760, 840, 900, 750, 1010, 620, 1050, 480, 1040, 390, 970, 350, 850, 350, 650, 390, 500)),
    ),
    "layer-005-face-shadow.webp": (
        ("polygon", (600, 500, 760, 480, 875, 600, 875, 820, 830, 940, 740, 1010, 650, 940, 660, 780, 620, 700)),
        ("polygon", (500, 560, 590, 550, 620, 720, 560, 840, 500, 800, 470, 690)),
        ("polygon", (500, 920, 720, 930, 760, 1010, 620, 1050, 480, 1030)),
    ),
    "layer-006-face-highlight.webp": (
        ("polygon", (400, 480, 540, 450, 580, 560, 520, 660, 480, 800, 520, 920, 430, 960, 360, 840, 360, 620)),
        ("polygon", (490, 560, 535, 540, 550, 760, 515, 820, 480, 760)),
        ("polygon", (500, 720, 680, 700, 650, 900, 520, 920)),
    ),
    "layer-007-eyes-brows.webp": (
        ("polygon", (350, 585, 410, 560, 465, 590, 460, 650, 400, 670, 350, 640)),
        ("polygon", (520, 590, 585, 565, 660, 610, 650, 680, 580, 700, 515, 650)),
        ("polygon", (355, 545, 430, 535, 470, 555, 440, 570, 360, 570)),
        ("polygon", (520, 550, 600, 535, 670, 570, 650, 590, 530, 575)),
    ),
    "layer-008-yellow-wrap.webp": (
        ("polygon", (680, 150, 800, 120, 930, 150, 1040, 220, 1110, 320, 1100, 430, 1030, 500, 930, 410, 800, 300, 650, 270)),
    ),
    "layer-009-blue-headband.webp": (
        ("polygon", (370, 300, 520, 250, 760, 250, 920, 300, 1040, 400, 1050, 590, 980, 720, 900, 820, 820, 760, 740, 660, 650, 570, 560, 500, 380, 450)),
    ),
    "layer-010-white-collar.webp": (
        ("polygon", (550, 1110, 620, 1030, 760, 1010, 940, 1000, 1070, 1050, 980, 1090, 820, 1110, 700, 1160, 610, 1240, 540, 1280)),
    ),
    "layer-011-pearl.webp": (
        (
            "polygon",
            (
                880, 920, 897, 924, 909, 936, 915, 952, 914, 975,
                905, 994, 890, 1007, 871, 1004, 856, 994, 847, 976,
                846, 954, 853, 936, 865, 925,
            ),
        ),
        (
            "polygon",
            (
                875, 876, 883, 878, 882, 889, 885, 897, 882, 907,
                884, 919, 879, 925, 873, 919, 874, 909, 872, 900,
                875, 891, 872, 883,
            ),
        ),
    ),
    "layer-012-pearl-highlight.webp": (
        ("ellipse", (860, 942, 892, 979)),
    ),
}

LAYER_GROUPS = {
    "layer-001-torso-collar.webp": (
        "layer-002-torso.webp",
        "layer-010-white-collar.webp",
    ),
    "layer-002-face-neck.webp": (
        "layer-003-neck-ear.webp",
        "layer-004-face-base.webp",
        "layer-005-face-shadow.webp",
        "layer-006-face-highlight.webp",
    ),
    "layer-003-blue-headscarf.webp": ("layer-009-blue-headband.webp",),
    "layer-004-yellow-wrap-tail.webp": (
        "layer-001-scarf-tail.webp",
        "layer-008-yellow-wrap.webp",
    ),
    "layer-005-eyes-brows.webp": ("layer-007-eyes-brows.webp",),
    "layer-006-pearl-highlight.webp": (
        "layer-011-pearl.webp",
        "layer-012-pearl-highlight.webp",
    ),
}


def _scaled(values: tuple[int, ...], size: tuple[int, int]) -> tuple[int, ...]:
    sx = size[0] / REFERENCE_SIZE[0]
    sy = size[1] / REFERENCE_SIZE[1]
    return tuple(round(value * (sx if index % 2 == 0 else sy)) for index, value in enumerate(values))


def _mask_for(filename: str, size: tuple[int, int]) -> Image.Image:
    scale = 2
    large_size = (size[0] * scale, size[1] * scale)
    mask = Image.new("L", large_size, 0)
    draw = ImageDraw.Draw(mask)
    for shape, values in REGIONS[filename]:
        points = tuple(value * scale for value in _scaled(values, size))
        if shape == "polygon":
            draw.polygon(tuple(zip(points[::2], points[1::2])), fill=255)
        else:
            draw.ellipse(points, fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS)


def extract_layers(root: Path) -> list[Path]:
    original_path = root / "assets" / "originals" / "painting-01" / "original.png"
    generated = root / "assets" / "generated" / "painting-01"
    layers = root / "assets" / "layers" / "painting-01"
    generated.mkdir(parents=True, exist_ok=True)
    layers.mkdir(parents=True, exist_ok=True)
    masks = layers / "masks"
    masks.mkdir(parents=True, exist_ok=True)

    original = Image.open(original_path).convert("RGBA")
    fill_path = layers / "relief-color-no-pearl-v2.webp"
    no_pearl_fill = Image.open(fill_path).convert("RGBA") if fill_path.is_file() else original
    pearl_alpha = ImageChops.lighter(
        _mask_for("layer-011-pearl.webp", original.size),
        _mask_for("layer-012-pearl-highlight.webp", original.size),
    )
    fill_alpha = pearl_alpha.filter(ImageFilter.MaxFilter(29)).filter(
        ImageFilter.GaussianBlur(5)
    )
    base_without_pearl = Image.composite(no_pearl_fill, original, fill_alpha)

    outputs: list[Path] = []
    for filename in EXPECTED_LAYERS:
        alpha = Image.new("L", original.size, 0)
        for source in LAYER_GROUPS[filename]:
            alpha = ImageChops.lighter(alpha, _mask_for(source, original.size))
        source = original if filename == "layer-006-pearl-highlight.webp" else base_without_pearl
        layer = source.copy()
        layer.putalpha(alpha)

        keyed = Image.new("RGB", original.size, "#00ff00")
        keyed.paste(source.convert("RGB"), mask=alpha)
        keyed.save(generated / f"{Path(filename).stem}.png", optimize=True)
        alpha.save(masks / f"{Path(filename).stem}.png", optimize=True)

        output = layers / filename
        layer.save(output, "WEBP", lossless=True, quality=100)
        outputs.append(output)
    return outputs


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    outputs = extract_layers(root)
    print(f"extracted {len(outputs)} registered layers from GPT master")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
