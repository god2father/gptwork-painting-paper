import json
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate_painting_assets import EXPECTED_LAYERS, validate_assets


def create_fixture(root: Path, size: tuple[int, int] = (4, 5)) -> None:
    originals = root / "assets" / "originals" / "painting-01"
    layers = root / "assets" / "layers" / "painting-01"
    masks = layers / "masks"
    originals.mkdir(parents=True)
    masks.mkdir(parents=True)

    Image.new("RGB", size, "#17201d").save(originals / "original.png")
    Image.new("RGB", size, "#17201d").save(layers / "background.webp", lossless=True)
    Image.new("RGB", size, "#eee7d7").save(layers / "layer-preview.png")

    record = {
        "paintingId": "painting-01",
        "tool": "built-in image generation",
        "masterPrompt": "fixed prompt",
        "layers": list(EXPECTED_LAYERS),
    }
    (originals / "generation.json").write_text(
        json.dumps(record, ensure_ascii=False), encoding="utf-8"
    )

    for filename in EXPECTED_LAYERS:
        image = Image.new("RGBA", size, (0, 0, 0, 0))
        image.putpixel((size[0] // 2, size[1] // 2), (240, 230, 210, 255))
        image.save(layers / filename, lossless=True)
        mask = image.getchannel("A")
        mask.save(masks / f"{Path(filename).stem}.png")


class ValidatePaintingAssetsTest(unittest.TestCase):
    def test_complete_fixture_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            create_fixture(root)
            self.assertEqual(validate_assets(root, expected_size=(4, 5)), [])

    def test_rgb_layer_fails_alpha_check(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            create_fixture(root)
            layer = root / "assets" / "layers" / "painting-01" / EXPECTED_LAYERS[0]
            Image.new("RGB", (4, 5), "white").save(layer, lossless=True)
            problems = validate_assets(root, expected_size=(4, 5))
            self.assertTrue(any("alpha" in problem for problem in problems))

    def test_incomplete_generation_record_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            create_fixture(root)
            record = root / "assets" / "originals" / "painting-01" / "generation.json"
            record.write_text("{}", encoding="utf-8")
            problems = validate_assets(root, expected_size=(4, 5))
            self.assertTrue(any("generation.json" in problem for problem in problems))


if __name__ == "__main__":
    unittest.main()
