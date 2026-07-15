import json
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate_painting_assets import EXPECTED_LAYERS, validate_assets
from scripts.extract_painting_layers import extract_layers
from scripts.extract_painting_02_layers import LAYER_REGIONS as PAINTING_02_LAYERS, extract_layers as extract_painting_02_layers
from scripts.build_layer_preview import build_preview

SEMANTIC_LAYERS = (
    "layer-001-torso-collar.webp",
    "layer-002-face-neck.webp",
    "layer-003-blue-headscarf.webp",
    "layer-004-yellow-wrap-tail.webp",
    "layer-005-eyes-brows.webp",
    "layer-006-pearl-highlight.webp",
)


def create_fixture(root: Path, size: tuple[int, int] = (4, 5)) -> None:
    originals = root / "assets" / "originals" / "painting-01"
    environment = root / "assets" / "environment" / "painting-01"
    layers = root / "assets" / "layers" / "painting-01"
    masks = layers / "masks"
    originals.mkdir(parents=True)
    environment.mkdir(parents=True)
    masks.mkdir(parents=True)

    Image.new("RGB", size, "#17201d").save(originals / "original.png")
    Image.new("RGB", (16, 9), "#8d6949").save(environment / "workspace.webp")
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
    def test_uses_six_semantic_subject_layers(self) -> None:
        self.assertEqual(EXPECTED_LAYERS, SEMANTIC_LAYERS)

    def test_complete_fixture_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            create_fixture(root)
            self.assertEqual(validate_assets(root, expected_size=(4, 5)), [])

    def test_missing_workspace_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            create_fixture(root)
            (root / "assets" / "environment" / "painting-01" / "workspace.webp").unlink()
            problems = validate_assets(root, expected_size=(4, 5))
            self.assertTrue(any("workspace.webp" in problem for problem in problems))

    def test_non_wide_workspace_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            create_fixture(root)
            workspace = root / "assets" / "environment" / "painting-01" / "workspace.webp"
            Image.new("RGB", (8, 8), "#8d6949").save(workspace)
            problems = validate_assets(root, expected_size=(4, 5))
            self.assertTrue(any("16:9" in problem for problem in problems))

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


class ExtractPaintingLayersTest(unittest.TestCase):
    def test_extracts_all_registered_alpha_layers(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            originals = root / "assets" / "originals" / "painting-01"
            originals.mkdir(parents=True)
            Image.new("RGB", (64, 80), "#c58b55").save(originals / "original.png")

            outputs = extract_layers(root)

            self.assertEqual([path.name for path in outputs], list(EXPECTED_LAYERS))
            for path in outputs:
                with Image.open(path) as image:
                    self.assertEqual(image.size, (64, 80))
                    self.assertIn("A", image.getbands())
                    alpha = image.getchannel("A")
                    self.assertIsNotNone(alpha.getbbox())
                    self.assertEqual(alpha.getpixel((0, 0)), 0)


class BuildLayerPreviewTest(unittest.TestCase):
    def test_builds_masks_and_preview(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            create_fixture(root)
            layers = root / "assets" / "layers" / "painting-01"
            (layers / "layer-preview.png").unlink()
            output = build_preview(root, tile_size=(40, 50))
            self.assertTrue(output.is_file())
            with Image.open(output) as preview:
                self.assertEqual(preview.size, (160, 200))
            for filename in EXPECTED_LAYERS:
                mask = layers / "masks" / f"{Path(filename).stem}.png"
                with Image.open(mask) as image:
                    self.assertEqual(image.mode, "L")


class ExtractPainting02LayersTest(unittest.TestCase):
    def test_extracts_six_registered_layers_and_relief_maps(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            originals = root / "assets" / "originals" / "painting-02"
            layers = root / "assets" / "layers" / "painting-02"
            originals.mkdir(parents=True)
            layers.mkdir(parents=True)
            Image.new("RGB", (120, 200), "#7d5738").save(originals / "original.png")
            Image.new("RGB", (120, 200), "#302820").save(layers / "background.webp")

            outputs = extract_painting_02_layers(root)

            self.assertEqual(len(outputs), len(PAINTING_02_LAYERS))
            self.assertTrue((layers / "relief-color.webp").is_file())
            self.assertTrue((layers / "relief-depth.webp").is_file())
            for path in outputs:
                with Image.open(path) as image:
                    self.assertEqual(image.size, (120, 200))
                    self.assertIn("A", image.getbands())
                    self.assertIsNotNone(image.getchannel("A").getbbox())


if __name__ == "__main__":
    unittest.main()
