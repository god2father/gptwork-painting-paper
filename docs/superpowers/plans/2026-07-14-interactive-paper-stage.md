# Interactive Paper Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-ready Vue page that assembles and interactively explodes the 12 GPT-derived layers of 《戴珍珠耳环的少女》.

**Architecture:** One validated painting manifest feeds a generic stage, a single Pinia interaction store, and one GSAP timeline. Scroll, playback, reset and range input all write the same normalized progress; pointer parallax uses a nested element so it never overwrites GSAP transforms.

**Tech Stack:** Node.js 20+, Vue 3, Vite, TypeScript, Pinia, GSAP + ScrollTrigger, Vitest, Playwright, CSS.

## Global Constraints

- First release implements one painting only.
- Artwork-specific positions, copy and motion live in JSON, never in the generic stage components.
- Reference video and music are not shipped or rendered by the site.
- Do not add a UI library, CSS framework, second state library or asset-copy plugin.
- Support 1920×1080 and 390×844 without horizontal overflow.
- Respect `prefers-reduced-motion` and preserve keyboard access.
- Completion requires typecheck, unit tests, end-to-end tests, production build and three inspected screenshots.

---

### Task 1: Project runtime and scene contract

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/env.d.ts`
- Create: `src/types/painting.ts`
- Create: `src/lib/scene/painting.ts`
- Create: `src/lib/scene/painting.test.ts`
- Create: `manifests/paintings/painting.schema.json`
- Create: `manifests/paintings/painting-01.json`

**Interfaces:**
- Produces `PaintingScene`, `PaintingLayer`, `LayerTransform`.
- Produces `validatePaintingScene(value: unknown): PaintingScene`.
- Produces `resolveAssetUrl(path: string): string` from a Vite asset glob.

- [ ] **Step 1: Add package scripts and dependencies**

Use scripts `dev`, `build`, `preview`, `typecheck`, `test`, `test:e2e`, and `test:e2e:update`. Runtime dependencies are exactly `vue`, `pinia`, and `gsap`; developer dependencies are exactly Vite, the Vue plugin, TypeScript, vue-tsc, Vitest, jsdom, Playwright, and Node types.

- [ ] **Step 2: Write failing scene tests**

```ts
import { describe, expect, it } from 'vitest'
import scene from '../../../manifests/paintings/painting-01.json'
import { clampProgress, toStageOffset, validatePaintingScene } from './painting'

describe('painting scene contract', () => {
  it('accepts the first 12-layer scene', () => {
    expect(validatePaintingScene(scene).layers).toHaveLength(12)
  })

  it('rejects duplicate ids', () => {
    expect(() => validatePaintingScene({ ...scene, layers: [scene.layers[0], scene.layers[0]] }))
      .toThrow('duplicate layer id')
  })

  it('converts canvas pixels to stage pixels', () => {
    expect(toStageOffset(192, 108, { width: 1920, height: 1080 }, { width: 960, height: 540 }))
      .toEqual({ x: 96, y: 54 })
  })

  it('clamps progress', () => {
    expect(clampProgress(-1)).toBe(0)
    expect(clampProgress(2)).toBe(1)
  })
})
```

- [ ] **Step 3: Run the test and confirm module/config failure**

Run: `npm install && npm run test -- src/lib/scene/painting.test.ts`

- [ ] **Step 4: Implement the strict runtime contract**

Validation must check the object shape, positive canvas and duration, non-empty background, non-empty layers, unique IDs, numeric transforms, `animation.start` in `0..1`, positive animation duration, and non-empty asset paths. `resolveAssetUrl` uses:

```ts
const assets = import.meta.glob('/assets/**/*.{png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
```

The manifest uses canvas `1536×1920`, background plus all 12 final WebP paths. In layer order 001–012, use expanded `(x, y, rotation)` values `(-260, 60, -4)`, `(-180, 240, -2)`, `(80, 160, 3)`, `(-80, 0, -1)`, `(-220, -80, -5)`, `(140, -100, 4)`, `(-300, -180, -3)`, `(160, -220, 4)`, `(300, -80, 5)`, `(-40, 260, -2)`, `(340, 120, 6)`, `(420, 40, 8)`. Every layer includes a Chinese name, alt text and description.

- [ ] **Step 5: Verify and commit**

Run: `npm run test -- src/lib/scene/painting.test.ts && npm run typecheck`

Commit: `feat: add painting scene contract`

---

### Task 2: Interaction store

**Files:**
- Create: `src/stores/interaction.ts`
- Create: `src/stores/interaction.test.ts`

**Interfaces:**
- Produces `useInteractionStore()` with `progress`, `isPlaying`, `selectedLayerId`, `setProgress`, `play`, `pause`, `reset`, `replay`, `selectLayer`.

- [ ] **Step 1: Write failing store tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useInteractionStore } from './interaction'

beforeEach(() => setActivePinia(createPinia()))

describe('interaction store', () => {
  it('clamps progress and pauses for manual input', () => {
    const store = useInteractionStore()
    store.play()
    store.setProgress(2, true)
    expect(store.progress).toBe(1)
    expect(store.isPlaying).toBe(false)
  })

  it('resets progress and selection', () => {
    const store = useInteractionStore()
    store.setProgress(.7)
    store.selectLayer('layer-001-scarf-tail')
    store.reset()
    expect(store.progress).toBe(0)
    expect(store.selectedLayerId).toBeNull()
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run test -- src/stores/interaction.test.ts`

- [ ] **Step 3: Implement the minimal Pinia store**

Use a setup store with `ref` state. `replay()` sets progress to `0` then sets playing true. `reset()` sets progress to `0`, playing false and clears selection. `setProgress(value, manual)` clamps through the scene helper and pauses only when `manual` is true.

- [ ] **Step 4: Verify and commit**

Run: `npm run test -- src/stores/interaction.test.ts && npm run typecheck`

Commit: `feat: add shared interaction state`

---

### Task 3: Generic layered stage and visual shell

**Files:**
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/styles.css`
- Create: `src/features/stage/LayeredStage.vue`
- Create: `src/features/stage/StageLayer.vue`
- Create: `src/features/gallery/ArtworkHeader.vue`
- Create: `src/features/inspector/LayerInspector.vue`

**Interfaces:**
- `LayeredStage` consumes a validated `PaintingScene` and emits `ready` with `Map<string, HTMLElement>`.
- `StageLayer` consumes one `PaintingLayer`, asset URL and selected state.
- `LayerInspector` consumes the selected `PaintingLayer | null`.

- [ ] **Step 1: Build semantic components**

`StageLayer` renders a full-canvas transparent image inside a full-canvas focusable button. The button uses `aria-label="查看图层：{name}"`, emits selection, and adds `data-layer-id`. The image uses the manifest alt text and `draggable="false"`.

`LayeredStage` renders the background, all layers sorted by `z`, an accessible caption, loading state and per-image error collection. Its aspect ratio comes from `scene.canvas`; no painting ID or layer name appears in component logic.

- [ ] **Step 2: Build the museum layout**

Use a warm `#eee7d8` page, dark `#101815` stage, dark brown `#2b241e` type, 1px warm borders and short paper-like shadows. Desktop uses a three-column header/stage/inspector grid with a sticky stage inside a `260vh` scroll chapter. Mobile below `800px` becomes one column and places inspector below the stage.

- [ ] **Step 3: Add loading and error behavior**

Invalid configuration shows a visible Chinese error card with a reload button. Individual image errors retain layout and appear in inspector text. The page never collapses to an empty canvas.

- [ ] **Step 4: Verify and commit**

Run: `npm run typecheck && npm run build`

Commit: `feat: render the layered museum stage`

---

### Task 4: One GSAP timeline, scroll and pointer motion

**Files:**
- Create: `src/lib/motion/buildTimeline.ts`
- Create: `src/lib/motion/buildTimeline.test.ts`
- Create: `src/features/stage/useStageMotion.ts`
- Modify: `src/features/stage/LayeredStage.vue`
- Modify: `src/App.vue`

**Interfaces:**
- `layerProgress(progress, start, duration): number` is a pure tested helper.
- `buildTimeline(scene, elements)` returns one paused `gsap.core.Timeline`.
- `useStageMotion` connects store progress, autoplay RAF, ScrollTrigger and cleanup.

- [ ] **Step 1: Write failing progress tests**

```ts
import { describe, expect, it } from 'vitest'
import { layerProgress } from './buildTimeline'

describe('layer progress', () => {
  it('maps a layer interval into zero to one', () => {
    expect(layerProgress(.1, .2, .4)).toBe(0)
    expect(layerProgress(.4, .2, .4)).toBeCloseTo(.5)
    expect(layerProgress(.8, .2, .4)).toBe(1)
  })
})
```

- [ ] **Step 2: Implement the timeline**

For every manifest layer, add a `fromTo` at `animation.start * scene.duration`, using collapsed and expanded transforms and the configured ease. The full timeline duration equals `scene.duration`. Store progress writes `timeline.progress(value)`; GSAP never owns application state.

- [ ] **Step 3: Connect scroll and autoplay**

ScrollTrigger uses the chapter as trigger, `start: 'top top'`, `end: 'bottom bottom'`, and writes normalized scroll progress only when autoplay is false. Autoplay advances using `requestAnimationFrame` and the scene duration. Active user scrolling or range input pauses autoplay.

- [ ] **Step 4: Add pointer parallax and reduced motion**

Pointer movement sets CSS variables on each image wrapper using the manifest parallax values. Pointer leave returns them to zero. Fine-pointer media query gates the handler. Reduced motion disables pointer transforms and maps progress below `.5` to collapsed, otherwise expanded, without tweening.

- [ ] **Step 5: Verify and commit**

Run: `npm run test -- src/lib/motion/buildTimeline.test.ts && npm run typecheck && npm run build`

Commit: `feat: animate configured paper layers`

---

### Task 5: Controls, selection and accessibility

**Files:**
- Create: `src/features/timeline/TimelineControls.vue`
- Modify: `src/features/inspector/LayerInspector.vue`
- Modify: `src/App.vue`
- Modify: `src/styles.css`

**Interfaces:**
- Controls consume store state and expose native buttons/range input.
- Inspector reads the scene layer matching `selectedLayerId`.

- [ ] **Step 1: Implement controls**

Add play/pause, replay and reset buttons plus `input type="range" min="0" max="1" step="0.001"`. Use Chinese accessible names, `aria-pressed` on play, a visible percentage, and 44px minimum hit targets. Range input calls `setProgress(value, true)`.

- [ ] **Step 2: Implement selection behavior**

Clicking or pressing Enter/Space on a layer selects it. Inspector announces name, description and z-order with `aria-live="polite"`. `Escape` clears selection. The selected layer receives only a narrow warm outline and small brightness lift.

- [ ] **Step 3: Verify keyboard and responsive CSS**

Tab order is header link-free content, stage layers, controls, then inspector controls. Focus rings remain visible. At 390px no element uses fixed desktop widths and the control bar wraps.

- [ ] **Step 4: Verify and commit**

Run: `npm run typecheck && npm run test && npm run build`

Commit: `feat: add accessible timeline controls`

---

### Task 6: Browser verification, screenshots and documentation

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/stage.spec.ts`
- Create: `tests/visual/actual/desktop-collapsed.png` (generated, ignored)
- Create: `tests/visual/actual/desktop-expanded.png` (generated, ignored)
- Create: `tests/visual/actual/mobile.png` (generated, ignored)
- Modify: `README-FIRST.md`

**Interfaces:**
- Playwright starts `npm run dev -- --host 127.0.0.1` and tests Chromium.

- [ ] **Step 1: Add end-to-end tests**

Tests assert the title and 12 layers render, play changes progress, pause freezes it, reset returns zero, range input reaches expanded state, selecting a layer updates inspector, Escape clears it, scrolling changes a layer transform, and both viewports have `document.documentElement.scrollWidth <= window.innerWidth`.

- [ ] **Step 2: Capture actual screenshots**

At 1920×1080 capture progress `0` and `1`; at 390×844 capture progress `.65`. Save them under `tests/visual/actual/` and open all three for visual inspection.

- [ ] **Step 3: Document operation and extension**

README must include Node 20+, `npm install`, development, tests, build, replacing assets, creating another painting manifest, and the rule that components remain artwork-agnostic.

- [ ] **Step 4: Run the full completion gate**

Run in this order:

```powershell
npm run typecheck
npm run test
npm run test:e2e
npm run build
python scripts/validate_painting_assets.py
```

Expected: every command exits `0`, Vitest has no failures, Playwright has no failures, and the asset validator prints `painting-01 assets valid: 12 transparent layers`.

- [ ] **Step 5: Commit and API-sync**

Commit: `feat: complete interactive pearl portrait`

Use the verified GitHub Git Data API workflow to create blobs from local Git objects, create the exact local tree, create a commit on remote `main`, update the ref without force, and confirm the remote tree SHA equals `git rev-parse HEAD^{tree}`.

## Plan Self-Review

- Spec coverage: layout, one manifest, controls, shared progress, scroll, autoplay, parallax, inspector, errors, accessibility, reduced motion, responsive behavior, tests, screenshots and README all have tasks.
- Placeholder scan: no task depends on undefined copy, paths or interfaces.
- Type consistency: scene, store, timeline and component boundaries use the same `PaintingScene`, `PaintingLayer`, normalized progress and layer ID contracts.
- Scope: multi-artwork UI, editor, upload, audio and server work remain excluded.
