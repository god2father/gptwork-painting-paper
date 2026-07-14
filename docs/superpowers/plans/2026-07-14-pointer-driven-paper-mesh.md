# 鼠标驱动的 3D 纸张网格实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 点击纸片后，用单个 Three.js 细分网格替代固定 CSS 折面，让纸片沿水平 X 轴向用户连续卷起，并跟随鼠标改变弯曲、扭转、光影和阴影。

**架构：** 原有 DOM + GSAP 拼画保持不变。`LayeredStage` 内增加一个不接收事件的透明 WebGL 覆盖层；只有选中的纸片进入 Three.js。纯形变数学与渲染生命周期分离，便于测试和降级。

**技术栈：** Vue 3、TypeScript、Three.js 0.185.1、GSAP、Pinia、Vitest、Vite。

## 全局约束

- 第一阶段仍只实现《戴珍珠耳环的少女》。
- 图层位置和 3D 参数由 `manifests/paintings/painting-01.json` 驱动。
- 通用组件不得包含作品专用坐标或图层 ID。
- WebGL 失败时保留 DOM 纸片和标签，不出现空白。
- `prefers-reduced-motion` 下不运行鼠标跟随循环。
- 不改动现有拼画轨迹和标签交互。
- 最终视觉手感由用户在浏览器中确认。

---

### 任务 1：配置契约与纯形变数学

**文件：**
- 修改：`src/types/painting.ts`
- 修改：`src/lib/scene/painting.ts`
- 修改：`src/lib/scene/painting.test.ts`
- 修改：`manifests/paintings/painting.schema.json`
- 修改：`manifests/paintings/painting-01.json`
- 创建：`src/lib/motion/paperDeformation.ts`
- 创建：`src/lib/motion/paperDeformation.test.ts`

**接口：**
- 产生 `PaperMeshConfig`：`segmentsX`、`segmentsY`、`maxBend`、`maxLift`、`maxTwist`、`damping`。
- 产生 `deformPaperVertex(vertex, size, state, config): Point3`，供 Three.js 渲染器逐顶点调用。

- [ ] **步骤 1：先写失败测试**

场景测试要求六个图层都有合法 `selection3d.mesh`。形变测试要求：上半部 X/Y 不变；下边缘 `z > 0`；弯曲和扭转输入被限制在 `[-1, 1]`；最大输出不超过配置上限。

```ts
const result = deformPaperVertex(
  { x: 0, y: -50, z: 0 },
  { width: 100, height: 100 },
  { bend: 1, twist: 0 },
  config,
)
expect(result.z).toBeGreaterThan(0)
```

- [ ] **步骤 2：运行测试并确认失败**

```powershell
npm run test -- src/lib/scene/painting.test.ts src/lib/motion/paperDeformation.test.ts
```

预期：缺少 `selection3d.mesh` 和 `deformPaperVertex`。

- [ ] **步骤 3：实现最小配置解析和形变函数**

```ts
const progress = clamp(-vertex.y / (size.height / 2), 0, 1)
const angleX = degreesToRadians(config.maxBend * clamp(state.bend, 0, 1) * progress)
const distance = Math.max(0, -vertex.y)
const y = -distance * Math.cos(angleX)
const z = config.maxLift * state.bend * 0.15 + distance * Math.sin(angleX)
```

再按 `progress * maxTwist * state.twist` 绕 Y 轴旋转 X/Z。上半部分只允许整体浅抬升，不改变 X/Y。

- [ ] **步骤 4：运行目标测试**

```powershell
npm run test -- src/lib/scene/painting.test.ts src/lib/motion/paperDeformation.test.ts
```

预期：全部通过。

- [ ] **步骤 5：提交**

```powershell
git add manifests/paintings src/types/painting.ts src/lib/scene src/lib/motion/paperDeformation*
git commit -m "feat: model pointer-driven paper deformation"
```

---

### 任务 2：单网格 Three.js 渲染器

**文件：**
- 修改：`package.json`
- 修改：`package-lock.json`
- 创建：`src/features/stage/usePaperMesh.ts`
- 创建：`src/features/stage/PaperMeshOverlay.vue`

**接口：**
- `usePaperMesh()` 返回 `mount(canvas, stage, scene)`、`select(layer)`、`updatePointer(x, y)`、`clear()`、`dispose()`。
- `PaperMeshOverlay` 接收 `scene` 和 `layer`，暴露 `updatePointer(x, y)`，发出 `ready(id | null)` 与 `error(id)`。

- [ ] **步骤 1：安装固定版本依赖**

```powershell
npm install three@0.185.1
npm install -D @types/three@0.185.1
```

- [ ] **步骤 2：创建失败的组件契约测试**

在 `WorkspaceStage.test.ts` 中要求恰好一个 `data-testid="paper-mesh-overlay"`，并要求每个纸片恢复为一张 `.stage-layer__image`，不再出现 CSS facet。

- [ ] **步骤 3：实现渲染器生命周期**

渲染器使用透明抗锯齿画布、最高 `1.5` DPR、35° 透视相机。选中纸片时创建 `PlaneGeometry(bounds.width, bounds.height, segmentsX, segmentsY)`，使用纹理 `repeat/offset` 裁切到 bounds，前面使用透明 `MeshStandardMaterial`，背面使用采样纹理 alpha 的暖白 `ShaderMaterial`。

每帧从原始顶点调用 `deformPaperVertex`，更新 position、重新计算法线，再渲染。鼠标状态用配置中的 `damping` 插值；只在活动或复位时运行 RAF。

- [ ] **步骤 4：实现覆盖层组件和降级**

```vue
<canvas
  ref="canvas"
  class="paper-mesh-overlay"
  data-testid="paper-mesh-overlay"
  aria-hidden="true"
/>
```

Three 初始化或纹理加载失败时发出 `ready(null)` 和 `error(layer.id)`，DOM 图层保持可见。组件卸载、选中切换和上下文丢失时释放资源。

- [ ] **步骤 5：运行组件测试与类型检查**

```powershell
npm run test -- src/features/stage/WorkspaceStage.test.ts
npm run typecheck
```

预期：覆盖层契约通过，Three.js 类型无错误。

- [ ] **步骤 6：提交**

```powershell
git add package.json package-lock.json src/features/stage/usePaperMesh.ts src/features/stage/PaperMeshOverlay.vue src/features/stage/WorkspaceStage.test.ts
git commit -m "feat: render one selected paper mesh"
```

---

### 任务 3：舞台接线、删除旧折面并验证

**文件：**
- 修改：`src/features/stage/LayeredStage.vue`
- 修改：`src/features/stage/StageLayer.vue`
- 修改：`src/features/stage/WorkspaceStage.test.ts`
- 修改：`src/styles.css`

**接口：**
- `LayeredStage` 把当前选中图层交给 `PaperMeshOverlay`，并把舞台内鼠标坐标标准化为 `[-1, 1]`。
- `StageLayer` 新增 `meshActive`，只在 WebGL 网格准备完成后隐藏 `.stage-layer__visual`。

- [ ] **步骤 1：扩展失败测试**

测试 SSR 输出中每个纸片只有一个视觉图片；`meshActive=true` 时出现 `stage-layer--mesh-active`，并保留按钮、可访问名称和 `aria-pressed`。

- [ ] **步骤 2：接入选择与鼠标坐标**

```ts
const x = (event.clientX - rect.left) / rect.width * 2 - 1
const y = (event.clientY - rect.top) / rect.height * 2 - 1
meshOverlay.value?.updatePointer(x, y)
```

指针离开时传入 `(0, 1)` 让纸片放松。覆盖层 `ready(id)` 后才设置 `meshReadyId`。

- [ ] **步骤 3：删除旧 CSS 两折面**

`StageLayer` 恢复单个 `.stage-layer__visual > img`。删除 facet、crease、固定 `rotateX(45deg)` 样式；保留选择按钮焦点和 WebGL 失败时的静态浅抬升。

为 `.paper-mesh-overlay` 设置绝对定位、`z-index: 998`、`pointer-events: none`；活动 DOM 视觉内容透明但按钮仍位于 `z-index: 1000`。

- [ ] **步骤 4：运行全量自动验证**

```powershell
npm test
npm run typecheck
npm run build
git diff --check
```

预期：全部退出码为 0。

- [ ] **步骤 5：浏览器最小检查**

等待拼画完成，点击群青头巾，移动鼠标到舞台上方、下方、左侧和右侧，确认：网格连续、下半部朝用户、背面可见、影子随抬升变化、标签保持、再次点击和 Escape 复位。只记录明显功能缺陷；最终美术判断由用户完成。

- [ ] **步骤 6：提交并通过 GitHub API 同步**

```powershell
git add src/features/stage src/styles.css
git commit -m "feat: drive selected paper with the pointer"
```

使用 Git Data API 上传精确 blob、创建完整 tree，确认远端 tree SHA 等于 `git rev-parse HEAD^{tree}`，再无强制更新 `refs/heads/main`。

---

## 计划自检

- 已覆盖选中触发、X 轴连续卷曲、鼠标扭转、纸张背面、动态光影、降级、移动端、减少动态效果和资源释放。
- 形变函数、配置解析、组件结构和完整构建都有明确验证。
- 新依赖仅为实现真实网格弯曲所需的 Three.js 及其类型声明。
- 不包含占位步骤，不改动完整拼画时间轴，不把其他图层迁移到 WebGL。
