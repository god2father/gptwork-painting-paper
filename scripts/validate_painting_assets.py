import json
import sys
from pathlib import Path

from PIL import Image

EXPECTED_LAYERS = (
    "layer-001-torso-collar.webp",
    "layer-002-face-neck.webp",
    "layer-003-blue-headscarf.webp",
    "layer-004-yellow-wrap-tail.webp",
    "layer-005-eyes-brows.webp",
    "layer-006-pearl-highlight.webp",
)


def validate_assets(
    root: Path, expected_size: tuple[int, int] = (1536, 1920)
) -> list[str]:
    problems: list[str] = []
    originals = root / "assets" / "originals" / "painting-01"
    layers = root / "assets" / "layers" / "painting-01"
    masks = layers / "masks"
    workspace = root / "assets" / "environment" / "painting-01" / "workspace.webp"

    required = (
        originals / "original.png",
        originals / "generation.json",
        layers / "background.webp",
        layers / "layer-preview.png",
        workspace,
    )
    for path in required:
        if not path.is_file() or path.stat().st_size == 0:
            problems.append(f"missing or empty: {path.relative_to(root)}")

    for path in (originals / "original.png", layers / "background.webp"):
        if not path.is_file():
            continue
        with Image.open(path) as image:
            if image.size != expected_size:
                problems.append(f"wrong size: {path.relative_to(root)} = {image.size}")

    if workspace.is_file():
        with Image.open(workspace) as image:
            if abs(image.width / image.height - 16 / 9) > 1 / image.height:
                problems.append(
                    f"workspace must be 16:9: {workspace.relative_to(root)} = {image.size}"
                )

    record_path = originals / "generation.json"
    if record_path.is_file():
        try:
            record = json.loads(record_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            problems.append(f"invalid generation.json: {error}")
        else:
            for key in ("paintingId", "tool", "masterPrompt", "layers"):
                if not record.get(key):
                    problems.append(f"generation.json missing field: {key}")

    for filename in EXPECTED_LAYERS:
        path = layers / filename
        mask_path = masks / f"{Path(filename).stem}.png"
        if not path.is_file() or path.stat().st_size == 0:
            problems.append(f"missing or empty: {path.relative_to(root)}")
            continue
        with Image.open(path) as image:
            if image.size != expected_size:
                problems.append(f"wrong size: {path.relative_to(root)} = {image.size}")
            if "A" not in image.getbands():
                problems.append(f"missing alpha: {path.relative_to(root)}")
            else:
                alpha = image.getchannel("A")
                if alpha.getbbox() is None:
                    problems.append(f"empty alpha: {path.relative_to(root)}")
                corners = (
                    alpha.getpixel((0, 0)),
                    alpha.getpixel((image.width - 1, 0)),
                    alpha.getpixel((0, image.height - 1)),
                    alpha.getpixel((image.width - 1, image.height - 1)),
                )
                if any(value != 0 for value in corners):
                    problems.append(f"opaque corner: {path.relative_to(root)}")
        if not mask_path.is_file() or mask_path.stat().st_size == 0:
            problems.append(f"missing or empty: {mask_path.relative_to(root)}")
        else:
            with Image.open(mask_path) as mask:
                if mask.size != expected_size or mask.mode != "L":
                    problems.append(f"invalid mask: {mask_path.relative_to(root)}")

    return problems


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    problems = validate_assets(root)
    if problems:
        print("\n".join(f"ERROR: {problem}" for problem in problems))
        return 1
    print(f"painting-01 assets valid: {len(EXPECTED_LAYERS)} transparent layers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
