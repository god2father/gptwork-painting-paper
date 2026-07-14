import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

from scripts.validate_painting_assets import EXPECTED_LAYERS


def build_preview(root: Path, tile_size: tuple[int, int] = (320, 400)) -> Path:
    layers_dir = root / "assets" / "layers" / "painting-01"
    masks_dir = layers_dir / "masks"
    masks_dir.mkdir(parents=True, exist_ok=True)

    background = Image.open(layers_dir / "background.webp").convert("RGBA")
    composite = background.copy()
    items: list[tuple[str, Image.Image]] = [("background", background)]

    for filename in EXPECTED_LAYERS:
        layer = Image.open(layers_dir / filename).convert("RGBA")
        layer.getchannel("A").save(masks_dir / f"{Path(filename).stem}.png")
        composite.alpha_composite(layer)
        items.append((Path(filename).stem, layer))
    items.append(("recomposed", composite))

    columns, rows = 4, 4
    tile_width, tile_height = tile_size
    preview = Image.new("RGB", (columns * tile_width, rows * tile_height), "#e9e0cf")
    draw = ImageDraw.Draw(preview)

    for index, (label, image) in enumerate(items):
        x = (index % columns) * tile_width
        y = (index // columns) * tile_height
        thumb = ImageOps.contain(image, (tile_width - 16, tile_height - 36))
        offset = (x + (tile_width - thumb.width) // 2, y + 8)
        if thumb.mode == "RGBA":
            preview.paste(thumb, offset, thumb)
        else:
            preview.paste(thumb, offset)
        draw.text((x + 8, y + tile_height - 22), label, fill="#28231e")

    output = layers_dir / "layer-preview.png"
    preview.save(output, optimize=True)
    return output


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    output = build_preview(root)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
