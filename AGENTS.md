# AGENTS.md

## 项目目标

构建一个可交互的“世界名画剪纸拆解”网站。参考抖音视频的视觉语言，但不复制发布其视频或音乐，也不使用视频冒充网页交互。

## 默认技术栈

- Node.js 20+
- Vue 3 + Vite + TypeScript
- GSAP + ScrollTrigger
- Pinia
- Vitest
- Playwright
- FFmpeg / FFprobe

## 工程约束

1. 先分析输入，再编码。
2. 第一阶段只实现一幅名画。
3. 动画必须由 JSON 配置驱动。
4. 核心组件不得包含某一幅名画的硬编码位置。
5. 图像和视频处理必须保留来源记录。
6. 不允许创建假的 `reference-video.mp4`。
7. 无法获取输入时必须明确阻塞原因，并继续完成不依赖该输入的结构工作。
8. 所有成功声明必须有实际命令输出或文件检查支持。

## 推荐目录边界

- `src/features/gallery/`：作品选择
- `src/features/stage/`：通用分层舞台
- `src/features/timeline/`：时间轴控制
- `src/features/inspector/`：图层信息
- `src/lib/scene/`：配置校验与坐标换算
- `src/lib/motion/`：GSAP 时间轴构建
- `src/types/`：共享类型
- `manifests/paintings/`：作品配置
- `assets/layers/`：分层透明素材
- `tests/visual/`：视觉基准与实际截图

## 完成定义

只有当类型检查、单测、端到端测试和生产构建全部通过，并且视觉基准截图已生成时，才可声明第一幅作品完成。
