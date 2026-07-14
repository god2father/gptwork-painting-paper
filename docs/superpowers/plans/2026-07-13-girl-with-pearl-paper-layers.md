# 《戴珍珠耳环的少女》剪纸分层素材实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成一张 1536 × 1920 的《戴珍珠耳环的少女》GPT 剪纸主图、完整背景、12 个透明移动图层、12 个遮罩、图层总览和可复现生成记录。

**Architecture:** 采用主画面优先流程：先确认唯一主图，再以主图为编辑目标生成背景和纯色键控图层，本地去除键控色并保持统一画布坐标。Python/Pillow 脚本只负责确定性的尺寸、alpha、遮罩、重组和总览验证；所有视觉内容由内置图像生成工具生成或编辑。

**Tech Stack:** Built-in image generation, Python 3, Pillow 12+, `remove_chroma_key.py`, PowerShell, `unittest`, Git.

## Global Constraints

- 参考视频仅用于研究效果语言，不从中截图、抠图或提取可发布素材。
- 完整作品和所有独立图层均使用 GPT 生成或编辑。
- 主图、背景和所有图层使用 1536 × 1920 的 4:5 坐标系，禁止逐层自动裁边。
- 输出 12 个独立移动图层，不把已列图层合并以降低工作量。
- 图层包含窄暖白纸边，不烘焙明显投影；网页统一添加右下柔和阴影。
- 默认使用内置图像生成工具和纯绿色 `#00ff00` 键控背景。
- 未经用户确认，不切换到需要 API 密钥的原生透明度备用流程。
- 不增加人物、文字、道具、花纹、首饰、边框、桌面、手部、水印或视频叙事元素。
- 第一幅素材未通过自动检查和实际视觉检查前，不开始网站实现。

## File Map

- `scripts/validate_painting_assets.py`: 校验文件、尺寸、alpha、透明角、生成记录和遮罩。
- `scripts/build_layer_preview.py`: 从背景和图层生成遮罩、重组图和图层总览。
- `tests/test_painting_asset_scripts.py`: 使用小尺寸真实图像验证两个脚本。
- `assets/originals/painting-01/original.png`: 确认后的完整主图。
- `assets/originals/painting-01/generation.json`: 主图、背景、图层提示词与处理记录。
- `assets/generated/painting-01/*.png`: 内置图像生成的键控中间图；目录已被 `.gitignore` 排除。
- `assets/layers/painting-01/background.webp`: 无人物完整背景。
- `assets/layers/painting-01/layer-001-*.webp` 至 `layer-012-*.webp`: 12 个透明移动层。
- `assets/layers/painting-01/masks/*.png`: 每个移动层的 alpha 遮罩。
- `assets/layers/painting-01/layer-preview.png`: 背景、12 层和重组状态的总览。
- `docs/manual-review.md`: 视觉检查结果和未决项。
- `assets/originals/sources.md`: 实际 GPT 生成记录入口。

---

### Task 1: 建立素材合同检查

**Files:**
- Create: `tests/test_painting_asset_scripts.py`
- Create: `scripts/validate_painting_assets.py`

**Interfaces:**
- Produces: `EXPECTED_LAYERS: tuple[str, ...]`
- Produces: `validate_assets(root: Path, expected_size: tuple[int, int] = (1536, 1920)) -> list[str]`
- CLI: `python scripts/validate_painting_assets.py [project-root]`

- [ ] **Step 1: 写失败测试**

Create `tests/test_painting_asset_scripts.py` with:

```python
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
```

- [ ] **Step 2: 运行测试并确认因模块缺失而失败**

Run: `python tests/test_painting_asset_scripts.py`

Expected: `ModuleNotFoundError: No module named 'scripts.validate_painting_assets'`.

- [ ] **Step 3: 实现最小校验脚本**

Create `scripts/validate_painting_assets.py` with:

```python
import json
import sys
from pathlib import Path

from PIL import Image

EXPECTED_LAYERS = (
    "layer-001-scarf-tail.webp",
    "layer-002-torso.webp",
    "layer-003-neck-ear.webp",
    "layer-004-face-base.webp",
    "layer-005-face-shadow.webp",
    "layer-006-face-highlight.webp",
    "layer-007-eyes-brows.webp",
    "layer-008-yellow-wrap.webp",
    "layer-009-blue-headband.webp",
    "layer-010-white-collar.webp",
    "layer-011-pearl.webp",
    "layer-012-pearl-highlight.webp",
)


def validate_assets(
    root: Path, expected_size: tuple[int, int] = (1536, 1920)
) -> list[str]:
    problems: list[str] = []
    originals = root / "assets" / "originals" / "painting-01"
    layers = root / "assets" / "layers" / "painting-01"
    masks = layers / "masks"

    required = (
        originals / "original.png",
        originals / "generation.json",
        layers / "background.webp",
        layers / "layer-preview.png",
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
```

- [ ] **Step 4: 运行单测并确认通过**

Run: `python tests/test_painting_asset_scripts.py`

Expected: `Ran 3 tests` and `OK`.

- [ ] **Step 5: 对真实目录运行校验并确认素材缺失失败**

Run: `python scripts/validate_painting_assets.py`

Expected: exit code 1 with missing paths under `assets/originals/painting-01/` and `assets/layers/painting-01/`.

- [ ] **Step 6: 提交素材合同**

```powershell
git add scripts/validate_painting_assets.py tests/test_painting_asset_scripts.py
git commit -m "test: define painting asset contract"
```

---

### Task 2: 生成并确认唯一主图

**Files:**
- Create: `assets/generated/painting-01/master-source.png` (ignored)
- Create: `assets/originals/painting-01/original.png`
- Create: `assets/originals/painting-01/generation.json`

**Interfaces:**
- Consumes: confirmed design spec and built-in image generation.
- Produces: the sole edit target for all background and layer generation.

- [ ] **Step 1: 创建目标目录**

Run:

```powershell
New-Item -ItemType Directory -Force assets/generated/painting-01 | Out-Null
New-Item -ItemType Directory -Force assets/originals/painting-01 | Out-Null
New-Item -ItemType Directory -Force assets/layers/painting-01/masks | Out-Null
```

- [ ] **Step 2: 使用内置图像生成工具生成主图**

Use this exact prompt:

```text
Use case: stylized-concept
Asset type: master artwork for an interactive museum website
Primary request: create a recognizable paper-collage reinterpretation of Girl with a Pearl Earring, preserving the iconic over-the-shoulder pose, direct backward gaze, blue-and-ochre headscarf, single pearl earring, warm face, brown garment, white collar, and deep green-black background
Scene/backdrop: continuous deep green-black matte paper backdrop with subtle fibers, no frame and no surrounding desk
Subject: one head-and-shoulders young woman, face slightly left of center, scarf tail extending toward the lower right, calm expression, clear eyes and pearl
Style/medium: refined hand-cut paper collage combined with museum-quality art print, layered matte paper planes, restrained 2.5D depth, recognizable classical composition
Composition/framing: 4:5 portrait canvas, generous margin around head and shoulders for layer animation, subject occupies about 72 to 80 percent of canvas height
Lighting/mood: soft light from upper left, quiet museum atmosphere, gentle tonal transitions rendered as paper shapes
Color palette: deep green-black, ultramarine blue, warm ochre yellow, warm skin tones, brown garment, warm off-white paper edges
Materials/textures: subtle paper fibers, narrow warm-white cut edges, crisp facial features, no heavy grain
Constraints: no text, no watermark, no frame, no desk, no hands, no extra person, no extra jewelry, no added props, no cast shadow outside the paper pieces, no thick sticker outline
Avoid: plastic 3D, glossy skin, neon colors, heavy film grain, distorted eyes, duplicate pearl, modern clothing, decorative background pattern
```

- [ ] **Step 3: 打开生成结果并只检查主图硬条件**

Use `view_image` on the returned image. Reject the image if any of these fail:

- One subject only.
- Recognizable backward gaze.
- One pearl only.
- Blue and ochre headscarf with a clear trailing section.
- Deep green-black background without text, frame, desk or props.
- Clear paper planes and narrow warm-white edges.
- Safe margin around the subject.

- [ ] **Step 4: 保存原始输出并标准化画布**

Copy the selected built-in output to `assets/generated/painting-01/master-source.png`, then run:

```powershell
@'
from pathlib import Path
from PIL import Image, ImageOps
source = Path('assets/generated/painting-01/master-source.png')
target = Path('assets/originals/painting-01/original.png')
image = Image.open(source).convert('RGB')
image = ImageOps.fit(image, (1536, 1920), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
image.save(target, optimize=True)
print(target, image.size)
'@ | python -
```

Expected: `assets\originals\painting-01\original.png (1536, 1920)`.

- [ ] **Step 5: 写入实际生成记录**

Create `assets/originals/painting-01/generation.json` with these exact top-level fields and actual values from this run:

```json
{
  "paintingId": "painting-01",
  "title": "戴珍珠耳环的少女",
  "generatedAt": "2026-07-13",
  "tool": "built-in image generation",
  "assetPolicy": "effect reference only; no publishable pixels extracted from the reference video",
  "masterPrompt": "the exact prompt from Task 2 Step 2",
  "master": {
    "sourceOutput": "assets/generated/painting-01/master-source.png",
    "finalOutput": "assets/originals/painting-01/original.png",
    "normalization": "ImageOps.fit to 1536x1920 with LANCZOS"
  },
  "background": {},
  "layers": [],
  "processing": {
    "keyColor": "#00ff00",
    "removeChromaKeyScript": "C:/Users/tc/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py"
  },
  "review": []
}
```

Replace the `masterPrompt` value with the exact full prompt, not a summary.

- [ ] **Step 6: 提交确认后的主图**

```powershell
git add assets/originals/painting-01/original.png assets/originals/painting-01/generation.json
git commit -m "feat: add first painting master artwork"
```

---

### Task 3: 生成完整无人物背景

**Files:**
- Create: `assets/generated/painting-01/background-source.png` (ignored)
- Create: `assets/layers/painting-01/background.webp`
- Modify: `assets/originals/painting-01/generation.json`

**Interfaces:**
- Consumes: `assets/originals/painting-01/original.png` as the edit target.
- Produces: a full-canvas backdrop with no subject-shaped hole or ghost.

- [ ] **Step 1: 用 `view_image` 加载主图作为编辑目标**

Open `assets/originals/painting-01/original.png` and label it: `Image 1: edit target`.

- [ ] **Step 2: 使用内置图像编辑生成背景**

Use this exact prompt:

```text
Use case: precise-object-edit
Asset type: full background layer for an interactive paper-collage artwork
Input images: Image 1: edit target and sole visual reference
Primary request: remove the entire woman, clothing, headscarf, pearl, white collar, and every subject-shaped paper edge; fill all removed areas with a seamless continuation of the same deep green-black matte paper background
Style/medium: preserve the exact subtle paper fiber texture and upper-left light falloff from Image 1
Composition/framing: preserve the exact canvas, crop, viewpoint, and 4:5 framing
Constraints: change only the subject area; no human silhouette, no ghost, no blur patch, no frame, no text, no props, no new light source, no watermark
```

- [ ] **Step 3: 保存并标准化背景**

Copy the selected output to `assets/generated/painting-01/background-source.png`, then run:

```powershell
@'
from PIL import Image, ImageOps
source = Image.open('assets/generated/painting-01/background-source.png').convert('RGB')
source = ImageOps.fit(source, (1536, 1920), method=Image.Resampling.LANCZOS)
source.save('assets/layers/painting-01/background.webp', 'WEBP', lossless=True, quality=100)
print(source.size)
'@ | python -
```

Expected: `(1536, 1920)`.

- [ ] **Step 4: 实际打开背景检查补全**

Use `view_image` on `background.webp`. Reject if a face, shoulder, scarf or pearl silhouette remains, or if the center contains a blurred patch.

- [ ] **Step 5: 更新生成记录**

Set `background` in `generation.json` to:

```json
{
  "prompt": "the exact prompt from Task 3 Step 2",
  "sourceOutput": "assets/generated/painting-01/background-source.png",
  "finalOutput": "assets/layers/painting-01/background.webp"
}
```

Replace `prompt` with the exact full prompt.

---

### Task 4: 从主图提取 12 个键控图层

**Files:**
- Create: `assets/generated/painting-01/layer-001-scarf-tail.png` through `layer-012-pearl-highlight.png` (ignored)
- Create: `assets/layers/painting-01/layer-001-scarf-tail.webp` through `layer-012-pearl-highlight.webp`
- Modify: `assets/originals/painting-01/generation.json`

**Interfaces:**
- Consumes: the same confirmed `original.png` for every edit.
- Produces: full-canvas keyed source and alpha WebP for each row below.

- [ ] **Step 1: 对每个图层执行一次独立内置编辑调用**

For every row, start with this exact invariant block, then append the row's exact target sentence:

```text
Use case: background-extraction
Asset type: one full-canvas layer for an interactive paper-collage artwork
Input images: Image 1: confirmed master artwork and edit target
Primary request: isolate exactly the requested paper piece from Image 1
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local background removal
Composition/framing: preserve the exact 4:5 canvas, crop, scale, position, silhouette, facial identity, lighting, color, texture, and pixel alignment from Image 1; do not crop to the object
Constraints: keep only the requested piece including its narrow warm-white paper edge; replace every other area with uniform #00ff00; no shadow, gradient, texture, reflection, floor, text, watermark, restyling, repositioning, scaling, or additional paper pieces; do not use #00ff00 inside the requested piece
```

| Output source | Exact target sentence |
|---|---|
| `layer-001-scarf-tail.png` | `Keep only the long blue-and-ochre scarf tail hanging behind the head toward the lower right; exclude the crown wrap and blue forehead band.` |
| `layer-002-torso.png` | `Keep only the brown shoulder and torso garment; exclude the white collar, neck, face, scarf, pearl, and background.` |
| `layer-003-neck-ear.png` | `Keep only the visible neck and ear paper piece; exclude face planes, clothing, collar, scarf, pearl, eyes, and background.` |
| `layer-004-face-base.png` | `Keep only the complete base face silhouette from forehead through chin, without separate highlight, shadow, eyes, brows, scarf, neck, ear, pearl, or background pieces.` |
| `layer-005-face-shadow.png` | `Keep only the darker facial paper planes along the nose side, cheek, jaw, and under-chin regions; exclude the face base and all other pieces.` |
| `layer-006-face-highlight.png` | `Keep only the lighter facial paper planes on the forehead, nose bridge, cheek, and lip-adjacent highlights; exclude the face base and all other pieces.` |
| `layer-007-eyes-brows.png` | `Keep only both eyes, eyelids, and eyebrow paper details in their exact original positions; exclude skin, nose, lips, scarf, and background.` |
| `layer-008-yellow-wrap.png` | `Keep only the ochre-yellow crown wrap on top and behind the head; exclude the blue forehead band and long scarf tail.` |
| `layer-009-blue-headband.png` | `Keep only the ultramarine-blue forehead and head band that overlaps the hairline and yellow wrap; exclude the yellow wrap and long scarf tail.` |
| `layer-010-white-collar.png` | `Keep only the warm-white collar below the neck; exclude clothing, neck, face, scarf, pearl, and background.` |
| `layer-011-pearl.png` | `Keep only the pearl earring body and its small connector at the ear; exclude the separate bright highlight, ear, face, clothing, and background.` |
| `layer-012-pearl-highlight.png` | `Keep only the small bright highlight paper piece on the pearl in its exact position; exclude the pearl body and every other piece.` |

- [ ] **Step 2: 每次调用后检查键控源图**

Use `view_image` for each source. Reject and retry only that layer when:

- Canvas or target position shifts.
- More than the requested paper piece remains.
- Part of the requested piece is missing.
- Background is not uniformly green at all four corners.
- Face identity, eyes, scarf colors or pearl geometry changes.

- [ ] **Step 3: 对 12 个键控源图执行透明化**

Run:

```powershell
$helper = 'C:\Users\tc\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
$sources = Get-ChildItem 'assets\generated\painting-01\layer-*.png'
foreach ($source in $sources) {
  $target = Join-Path 'assets\layers\painting-01' ($source.BaseName + '.webp')
  python $helper --input $source.FullName --out $target --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force
  if ($LASTEXITCODE -ne 0) { throw "透明化失败: $($source.Name)" }
}
```

Expected: 12 WebP files created.

- [ ] **Step 4: 标准化透明层画布而不裁边**

Run:

```powershell
@'
from pathlib import Path
from PIL import Image, ImageOps
folder = Path('assets/layers/painting-01')
for path in sorted(folder.glob('layer-*.webp')):
    image = Image.open(path).convert('RGBA')
    image = ImageOps.fit(image, (1536, 1920), method=Image.Resampling.LANCZOS)
    image.save(path, 'WEBP', lossless=True, quality=100)
    print(path.name, image.size, image.getbbox())
'@ | python -
```

Expected: 12 lines with `(1536, 1920)` and non-empty bounding boxes.

- [ ] **Step 5: 更新 `generation.json` 的 `layers`**

Record one object per layer with:

```json
{
  "id": "layer-001-scarf-tail",
  "prompt": "the exact invariant block plus the exact target sentence",
  "sourceOutput": "assets/generated/painting-01/layer-001-scarf-tail.png",
  "finalOutput": "assets/layers/painting-01/layer-001-scarf-tail.webp",
  "keyRemoval": "auto-key border; soft matte; transparent 12; opaque 220; despill"
}
```

Use the matching id and paths for all 12 records, and store each exact full prompt rather than a summary.

---

### Task 5: 生成遮罩、重组图和图层总览

**Files:**
- Modify: `tests/test_painting_asset_scripts.py`
- Create: `scripts/build_layer_preview.py`
- Create: `assets/layers/painting-01/masks/*.png`
- Create: `assets/layers/painting-01/layer-preview.png`

**Interfaces:**
- Consumes: `EXPECTED_LAYERS` and the complete background/layer directory.
- Produces: `build_preview(root: Path, tile_size: tuple[int, int] = (320, 400)) -> Path`.

- [ ] **Step 1: 增加失败测试**

Append before the `if __name__ == "__main__"` block in `tests/test_painting_asset_scripts.py`:

```python
from scripts.build_layer_preview import build_preview


class BuildLayerPreviewTest(unittest.TestCase):
    def test_builds_masks_and_preview(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            create_fixture(root)
            layers = root / "assets" / "layers" / "painting-01"
            (layers / "layer-preview.png").unlink()
            output = build_preview(root, tile_size=(40, 50))
            self.assertTrue(output.is_file())
            self.assertEqual(Image.open(output).size, (160, 200))
            for filename in EXPECTED_LAYERS:
                mask = layers / "masks" / f"{Path(filename).stem}.png"
                self.assertEqual(Image.open(mask).mode, "L")
```

- [ ] **Step 2: 运行测试并确认因模块缺失而失败**

Run: `python tests/test_painting_asset_scripts.py`

Expected: `ModuleNotFoundError: No module named 'scripts.build_layer_preview'`.

- [ ] **Step 3: 实现预览构建脚本**

Create `scripts/build_layer_preview.py` with:

```python
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

from scripts.validate_painting_assets import EXPECTED_LAYERS


def build_preview(
    root: Path, tile_size: tuple[int, int] = (320, 400)
) -> Path:
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
```

- [ ] **Step 4: 运行单测并确认通过**

Run: `python tests/test_painting_asset_scripts.py`

Expected: `Ran 4 tests` and `OK`.

- [ ] **Step 5: 对真实素材生成遮罩和总览**

Run: `python -m scripts.build_layer_preview`

Expected: `assets\layers\painting-01\layer-preview.png`.

- [ ] **Step 6: 打开图层总览和重点透明层**

Use `view_image` on:

- `assets/layers/painting-01/layer-preview.png`
- `assets/layers/painting-01/layer-004-face-base.webp`
- `assets/layers/painting-01/layer-007-eyes-brows.webp`
- `assets/layers/painting-01/layer-009-blue-headband.webp`
- `assets/layers/painting-01/layer-011-pearl.webp`

Check for green fringe, missing edges, wrong layer membership, opaque corners, duplicate facial pieces and recomposition gaps.

---

### Task 6: 完成素材记录与最终验收

**Files:**
- Modify: `assets/originals/sources.md`
- Modify: `docs/manual-review.md`
- Modify: `assets/originals/painting-01/generation.json`
- Commit: all final assets, masks, scripts, tests and records.

**Interfaces:**
- Consumes: all Task 1–5 outputs.
- Produces: a verified first-painting asset package ready for the scene manifest.

- [ ] **Step 1: 运行完整自动检查**

```powershell
python tests/test_painting_asset_scripts.py
python -m scripts.build_layer_preview
python scripts/validate_painting_assets.py
```

Expected:

- `Ran 4 tests` and `OK`.
- Preview path printed.
- `painting-01 assets valid: 12 transparent layers`.

- [ ] **Step 2: 更新素材来源记录**

Add one row to the GPT generation table in `assets/originals/sources.md` with:

- 编号：`painting-01`
- 作品/用途：`《戴珍珠耳环的少女》互动剪纸主图与分层素材`
- 生成日期：`2026-07-13`
- 模型/工具：`built-in image generation + local chroma-key removal`
- 提示词或记录文件：`assets/originals/painting-01/generation.json`
- 输入参考：`无外部图片；参考视频仅用于效果分析`
- 本地文件：`assets/originals/painting-01/original.png; assets/layers/painting-01/`
- 后续编辑：`背景补全、逐层键控提取、alpha 去色、尺寸标准化、图层总览`

- [ ] **Step 3: 更新人工检查清单**

Replace the introductory placeholder in `docs/manual-review.md` with a dated `painting-01` section covering:

- 眼睛和眉部是否保持身份与视线。
- 珍珠主体和高光是否只有一份且位置正确。
- 蓝色头带、黄色包布和巾带边缘是否完整。
- 脸部基底、暗面和亮面重组后是否有缝隙。
- 白领、颈部和衣服遮挡是否合理。
- 背景是否无人物残影。
- 所有图层是否无绿边和不透明角。
- 若全部通过，写明“未发现待确认项”；否则逐条记录具体文件和问题。

- [ ] **Step 4: 在 `generation.json` 记录最终检查**

Set `review` to an array containing the actual checks, result, and any regenerated layer filenames. Do not write a pass result before the visual checks are performed.

- [ ] **Step 5: 检查 Git 范围并提交**

```powershell
git status -sb
git add scripts/validate_painting_assets.py scripts/build_layer_preview.py tests/test_painting_asset_scripts.py assets/originals/painting-01 assets/layers/painting-01 assets/originals/sources.md docs/manual-review.md
git diff --cached --stat
git commit -m "feat: add layered pearl portrait assets"
```

- [ ] **Step 6: 推送完成的素材版本**

Run: `git push`

Expected: the new commits are pushed to `origin/main` without uploading `assets/generated/` or reference media.

## Plan Self-Review

- Spec coverage: master, background, 12 layers, alpha, masks, preview, provenance, manual review and visual inspection all map to Tasks 1–6.
- Placeholder scan: runtime-generated paths and prompts use deterministic workspace paths; no implementation step depends on an undefined function or file.
- Interface consistency: `EXPECTED_LAYERS` is the single filename source shared by validation, masks and preview.
- Scope: this plan stops after the first painting asset package and does not begin Vue/GSAP website work.
