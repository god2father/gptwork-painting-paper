# 名画素材与生成记录

## 当前策略

- 参考视频只用于分析效果，不从视频截图、抠图或提取可发布素材。
- 第一幅作品的完整画面由 GPT 生成；独立透明图层从该 GPT 母版按可复现蒙版裁切。
- 生成后必须记录提示词、生成日期、模型/工具、输入参考、后续编辑和本地文件。
- 如果未来使用公共领域原画作为生成输入，仍需记录作者、馆藏、原图链接和许可。
- 第一幅作品不使用公共领域原画或参考视频像素作为生成输入。

## 外部原图来源

| 编号 | 作品 | 作者 | 馆藏/来源 | 许可 | 本地文件 |
|---|---|---|---|---|---|

## GPT 生成记录

| 编号 | 作品/用途 | 生成日期 | 模型/工具 | 提示词或记录文件 | 输入参考 | 本地文件 | 后续编辑 |
|---|---|---|---|---|---|---|---|
| painting-01-master | 《戴珍珠耳环的少女》纸艺母版 | 2026-07-13 | built-in image generation | `assets/originals/painting-01/generation.json` | 文字提示词，无图像输入 | `assets/originals/painting-01/original.png` | 统一缩放裁切到 1536×1920 |
| painting-01-background | 深绿黑纸张背景 | 2026-07-13 | built-in image generation edit | `assets/originals/painting-01/generation.json` | GPT 母版 | `assets/layers/painting-01/background.webp` | 移除人物后无损 WebP 标准化 |
| painting-01-layers | 12 个透明运动图层 | 2026-07-13 | Pillow registered-mask extraction | `scripts/extract_painting_layers.py` | GPT 母版 | `assets/layers/painting-01/layer-*.webp` | 2 倍抗锯齿蒙版、全画布原位裁切、无损 WebP |
| painting-01-relief | 肖像 3D 浅浮雕颜色与深度纹理 | 2026-07-15 | built-in image generation edit + Pillow | `assets/originals/painting-01/generation.json` | GPT 母版 | `assets/layers/painting-01/relief-color.webp`、`relief-depth.webp` | GPT 深度引导与原位语义蒙版融合，统一到 1536×1920 |

## 未采用的生成尝试

曾用内置图像编辑尝试直接生成色键图层，但细小明暗片会混入整张脸，较大物件也会被自动居中。相关尝试未进入项目可消费素材；最终层全部从已确认的 GPT 母版原位裁切，以保证重组一致性。
