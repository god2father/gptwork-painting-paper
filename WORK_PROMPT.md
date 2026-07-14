# 给 GPT Work 的执行指令

你正在处理一个已经准备好目录结构的本地项目。请先完整阅读：

- `README-FIRST.md`
- `AGENTS.md`
- `brief.md`
- `docs/visual-style-spec.md`
- `docs/acceptance-criteria.md`
- `reference/source.json`

项目目标：分析 `reference/reference-video.mp4` 中的“世界名画剪纸拆解”效果，将它实现为真正可交互的网站，而不是播放视频或 GIF。

## 执行模式

你负责项目统筹、视频分析、图像素材处理、Codex 开发任务调度、浏览器验证和最终交付。Codex 负责代码、脚本、测试和构建。图像生成或编辑能力用于背景补全、纸张纹理、白边、缺失图层及视觉统一。

不要一开始制作三幅作品。先完成一幅名画的完整高质量样板，并确保核心架构可配置化。

## 阶段 0：环境与输入检查

1. 检查 `reference/reference-video.mp4` 是否存在且可由 FFmpeg 读取。
2. 若不存在，先运行适合当前系统的下载脚本：
   - Windows：`scripts/download-reference-video.ps1`
   - macOS/Linux：`scripts/download-reference-video.sh`
3. 如果下载脚本受到抖音登录、地区或风控限制，明确告诉用户把视频手动保存到该路径；不要伪造视频。
4. 运行参考资料预处理脚本：
   - Windows：`scripts/prepare-reference.ps1`
   - macOS/Linux：`scripts/prepare-reference.sh`
5. 检查 `assets/originals/`。没有原始名画时，先从视频关键帧识别作品名称，再寻找合法的公共领域高清图源，并在 `assets/originals/sources.md` 记录来源、作者、馆藏和许可。

## 阶段 1：视频分析

分析参考视频的连续变化，不要只描述单张截图。

输出：

- `docs/video-analysis.md`
- `manifests/timeline-analysis.json`
- `reference/contact-sheets/overview.jpg`

至少分析：

1. 视频总时长、分辨率、帧率、画面比例和音频信息。
2. 场景切换时间码。
3. 三幅名画的名称和出现顺序；不确定时标记置信度。
4. 每个场景的背景、中景、人物、前景、装饰纸片和文字层。
5. 每个纸片的进入方向、时间、位移、旋转、缩放、透明度、缓动和遮挡关系。
6. 镜头缩放、平移、视差、景深或抖动。
7. 剪纸白边、纸张纹理、阴影方向、光线、颗粒和色彩处理。
8. 哪些效果适合 DOM + GSAP，哪些需要 Canvas/WebGL，哪些只适合预生成图像。
9. 将“确定观察到的事实”和“推测的实现方式”分开记录。

## 阶段 2：第一幅名画分层

先确定第一幅作品，保存原始高清图到：

```text
assets/originals/painting-01/original.*
```

建立：

```text
assets/layers/painting-01/
  background.webp
  layer-001-*.webp
  layer-002-*.webp
  ...
  layer-preview.png
  masks/
```

要求：

1. 抠出主要人物、建筑、植物、道具和明显前景。
2. 修复被抠出对象遮挡的背景。
3. 保留透明通道，优先 WebP；需要无损中间文件时使用 PNG。
4. 所有纸片使用统一的暖白纸边、纸张纤维和右下方向柔和阴影。
5. 不要把整个画面简单风格化成一张剪纸图；必须是真正可独立移动的图层。
6. 输出图层总览页，并暂停进行一次视觉自检。
7. 对边缘错误、背景补全错误和无法确定的遮挡关系建立 `docs/manual-review.md`。

## 阶段 3：配置与网站开发

使用：

- Vue 3
- Vite
- TypeScript
- GSAP
- GSAP ScrollTrigger
- Pinia
- Vitest
- Playwright

优先使用 DOM + CSS 3D Transform + GSAP。只有当真实 Z 轴旋转、纸片弯曲或大量粒子确有必要时才引入 Three.js。

必须实现：

1. 名画选择首页。
2. 名画交互舞台。
3. 原画完整组合状态。
4. 自动拆解动画。
5. 滚动进度控制拆解。
6. 鼠标移动视差。
7. 播放、暂停、重播、还原和拖动时间轴。
8. 点击图层显示名称、构图作用和层级。
9. 原画模式与剪纸模式连续切换。
10. 移动端降级和 `prefers-reduced-motion` 支持。
11. 所有图层和时间轴数据由 `manifests/paintings/painting-01.scene.json` 驱动。
12. 新增作品时不得修改核心舞台组件。

禁止：

- 使用原视频、GIF、Canvas 录屏或一张长序列帧冒充交互。
- 把全部动画硬编码在单个 Vue 文件。
- 未经验证就一次性增加三幅作品。
- 随意生成名画中不存在的新人物或改变原画关键内容。

## 阶段 4：视觉回归

1. 从参考视频选择至少 8 个关键时间点。
2. 网页时间轴支持测试模式精确跳转。
3. Playwright 在同一视口和时间点截图。
4. 将截图放到 `tests/visual/actual/`。
5. 与 `tests/visual/reference/` 对比。
6. 重点调整构图、图层位置、阴影、纸边、节奏和镜头运动。
7. 不追求逐像素复制作者作品，但必须复现核心视觉语言和交互逻辑。

## 阶段 5：测试和交付

必须通过：

```text
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

最终交付：

- 完整源码
- 分层素材
- 所有配置文件
- 视频分析文档
- 人工检查清单
- 运行与部署说明
- 视觉回归截图
- 最终页面截图
- 素材来源与许可说明
- 尚未完成或无法自动完成的事项

执行过程中不要用“已经差不多”作为验收。每完成一个阶段，都要检查文件是否真实存在、命令是否实际运行、输出是否可复现。
