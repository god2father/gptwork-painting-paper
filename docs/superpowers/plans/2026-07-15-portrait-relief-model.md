# Portrait Relief Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the current six-piece assembly, then replace the flat completed portrait with one mouse-responsive 3D relief mesh generated from a GPT depth map.

**Architecture:** The DOM layers and GSAP timeline remain responsible for assembly and accessible hit regions. A new scene-level Three.js overlay loads one color texture and one grayscale depth map, displaces a subdivided plane once, recomputes normals, and only animates the completed model's rotation and light. If WebGL or either texture fails, the current DOM portrait remains visible.

**Tech Stack:** Vue 3, TypeScript, Three.js 0.185.1, GSAP, Vitest, Vite, GPT image generation, Pillow for deterministic asset normalization.

---

### Task 1: Generate registered relief assets

**Files:**
- Reference: `assets/originals/painting-01/original.png`
- Create: `assets/generated/painting-01/relief-depth-source.png`
- Create: `assets/layers/painting-01/relief-color.webp`
- Create: `assets/layers/painting-01/relief-depth.webp`
- Modify: `assets/originals/painting-01/generation.json`
- Modify: `assets/originals/sources.md`

- [ ] **Step 1: Generate the depth source with the built-in image tool**

Use `assets/originals/painting-01/original.png` as the edit target and this prompt:

```text
Use case: precise-object-edit
Asset type: registered grayscale displacement map for a browser 3D portrait relief
Input image: Image 1 is the exact edit target and registration reference
Primary request: convert the exact portrait into a smooth orthographic height map while preserving the exact canvas, crop, silhouette, pose, proportions, and position of every feature
Depth convention: pure white is closest to the viewer; pure black is farthest
Depth structure: background nearly flat and dark; torso broad medium depth; collar, scarf and face progressively closer; nose, lips and pearl locally closest; eye sockets and folds gently recessed
Style: continuous sculpted bas-relief depth, not lighting, not a grayscale photograph, not separate paper cutouts
Constraints: monochrome grayscale only; no color; no cast shadows; no texture; no paper fibers; no outlines; no text; no frame; no added or removed anatomy; face contours must remain continuous; preserve one pearl and the exact backward gaze
Avoid: hard contour bands, inverted depth, duplicate features, plastic render, background gradient unrelated to geometry
```

Save the selected output non-destructively as `assets/generated/painting-01/relief-depth-source.png`.

- [ ] **Step 2: Normalize project assets**

Use Pillow to convert the existing GPT master to an 88-quality RGB WebP at `1536 × 1920`, and fit the generated depth source to `1536 × 1920`, convert it to `L`, autocontrast it, and save it as a 92-quality grayscale WebP. Do not alter the source files.

- [ ] **Step 3: Inspect both assets**

Open `relief-color.webp` and `relief-depth.webp`. Confirm identical dimensions, one portrait, aligned silhouette, dark flat background, and smooth face/scarf/torso depth without text or duplicate features.

- [ ] **Step 4: Record provenance**

Add the exact prompt, generation date `2026-07-15`, built-in image generation tool, source image, generated source, normalized outputs, and Pillow normalization steps to `generation.json` and `sources.md`.

- [ ] **Step 5: Commit the assets**

```powershell
git add assets/generated/painting-01/relief-depth-source.png assets/layers/painting-01/relief-color.webp assets/layers/painting-01/relief-depth.webp assets/originals/painting-01/generation.json assets/originals/sources.md
git commit -m "assets: add portrait relief depth map"
```

---

### Task 2: Add the scene relief contract and displacement math

**Files:**
- Modify: `src/types/painting.ts`
- Modify: `src/lib/scene/painting.ts`
- Modify: `src/lib/scene/painting.test.ts`
- Modify: `manifests/paintings/painting.schema.json`
- Modify: `manifests/paintings/painting-01.json`
- Create: `src/lib/motion/reliefDepth.ts`
- Create: `src/lib/motion/reliefDepth.test.ts`

- [ ] **Step 1: Write failing tests**

Require a scene-level `relief` object with `colorMap`, `depthMap`, `segmentsX`, `segmentsY`, `depthScale`, `tiltX`, `tiltY`, `damping`, and `transitionDuration`. Add pure-math tests proving grayscale `0` maps to zero depth, grayscale `255` maps to `depthScale`, and values are clamped.

- [ ] **Step 2: Run the tests and confirm RED**

```powershell
npm test -- src/lib/scene/painting.test.ts src/lib/motion/reliefDepth.test.ts
```

Expected: failure because `relief` and `depthToZ` do not exist.

- [ ] **Step 3: Implement the minimal contract**

Add `ReliefConfig` to `PaintingScene`, parse and validate positive segment counts, depth, transition, damping between zero and one, and safe tilt angles. Implement:

```ts
export function depthToZ(value: number, depthScale: number): number {
  const normalized = Math.min(255, Math.max(0, value)) / 255
  return normalized * Math.max(0, depthScale)
}
```

Configure painting 01 with `120 × 150` segments, `depthScale: 52`, `tiltX: 4`, `tiltY: 6`, `damping: 0.1`, and `transitionDuration: 0.8`.

- [ ] **Step 4: Run tests and type checking**

```powershell
npm test -- src/lib/scene/painting.test.ts src/lib/motion/reliefDepth.test.ts
npm run typecheck
```

Expected: all targeted tests and type checking pass.

- [ ] **Step 5: Commit the contract**

```powershell
git add src/types/painting.ts src/lib/scene/painting.ts src/lib/scene/painting.test.ts src/lib/motion/reliefDepth.ts src/lib/motion/reliefDepth.test.ts manifests/paintings
git commit -m "feat: configure portrait relief depth"
```

---

### Task 3: Render one static displaced portrait mesh

**Files:**
- Create: `src/features/stage/usePortraitRelief.ts`
- Create: `src/features/stage/PortraitReliefOverlay.vue`
- Modify: `src/features/stage/WorkspaceStage.test.ts`

- [ ] **Step 1: Update the component contract test and confirm RED**

Require exactly one `data-testid="portrait-relief-overlay"` and no `paper-mesh-overlay` in SSR output.

```powershell
npm test -- src/features/stage/WorkspaceStage.test.ts
```

Expected: failure because the relief overlay does not exist.

- [ ] **Step 2: Implement the renderer**

Create one transparent `WebGLRenderer`, 35-degree perspective camera, ambient and directional lights, and a `Group` containing:

- a `PlaneGeometry` matching the stage with configured segments;
- vertices displaced once from the depth image through `depthToZ`;
- recomputed vertex normals;
- a rough `MeshStandardMaterial` using the registered color map;
- a shallow dark `BoxGeometry` backing plate behind the relief.

Expose `mount`, `load`, `setActive`, `updatePointer`, `resize`, and `dispose`. Limit DPR to `1.5`. Damped mouse input changes only group rotation and light position. Reduced motion renders a static front view without a continuous loop.

- [ ] **Step 3: Implement the Vue overlay**

Mount the renderer, load scene-configured assets, observe stage size, emit `ready(true)` only after both textures and geometry are ready, emit `error('relief')` on failure, expose `updatePointer`, and release every Three.js resource on unmount.

- [ ] **Step 4: Run targeted checks**

```powershell
npm test -- src/features/stage/WorkspaceStage.test.ts
npm run typecheck
```

Expected: component contract and type checking pass.

---

### Task 4: Switch from assembled DOM layers to the relief

**Files:**
- Modify: `src/App.vue`
- Modify: `src/features/stage/useStageMotion.ts`
- Modify: `src/features/stage/WorkspaceStage.vue`
- Modify: `src/features/stage/PortraitFrame.vue`
- Modify: `src/features/stage/LayeredStage.vue`
- Modify: `src/features/stage/StageLayer.vue`
- Modify: `src/features/stage/LayeredStage.test.ts`
- Modify: `src/styles.css`
- Delete: `src/features/stage/PaperMeshOverlay.vue`
- Delete: `src/features/stage/usePaperMesh.ts`

- [ ] **Step 1: Write the failing assembly-state tests**

Test that `useStageMotion.connect` can report completion, StageLayer remains one keyboard-accessible button, the relief-ready class hides only DOM visuals, and clicking a layer still exposes the existing `aria-pressed` state.

- [ ] **Step 2: Confirm RED**

```powershell
npm test -- src/features/stage/LayeredStage.test.ts src/features/stage/WorkspaceStage.test.ts
```

Expected: failure because no completion callback or relief-ready state exists.

- [ ] **Step 3: Wire assembly completion**

Track `assembled` in `App.vue`. Reset it before connecting the timeline, pass a callback to `useStageMotion.connect`, and pass the resulting boolean through `WorkspaceStage` and `PortraitFrame` to `LayeredStage`.

- [ ] **Step 4: Replace the selected-paper overlay**

Use `PortraitReliefOverlay` in `LayeredStage`. Hide `.artwork__background` and `.stage-layer__visual` only when both `assembled` and relief readiness are true. Keep all six buttons above the pointer-transparent canvas. Pointer motion controls the whole relief; pointer leave returns it to `(0, 0)`. Remove selected-layer mesh state and the two obsolete runtime files.

- [ ] **Step 5: Update styling and accessible copy**

Add a fade transition using `scene.relief.transitionDuration`, keep visible focus outlines, remove paper-mesh styles, and change the screen-reader caption to describe a completed relief that can be observed and labeled. Clicking, blank-space clearing, the close button, and Escape continue to affect labels only.

- [ ] **Step 6: Run component checks**

```powershell
npm test -- src/features/stage/LayeredStage.test.ts src/features/stage/WorkspaceStage.test.ts
npm run typecheck
```

Expected: all targeted checks pass.

- [ ] **Step 7: Commit integration**

```powershell
git add src/App.vue src/features/stage src/styles.css
git commit -m "feat: reveal portrait as a 3d relief"
```

---

### Task 5: Verify and publish the first version

**Files:**
- Modify only if verification finds a scoped defect.

- [ ] **Step 1: Run complete automated verification**

```powershell
npm test -- --run
npm run typecheck
npm run build
git diff --check
```

Expected: every command exits with code zero.

- [ ] **Step 2: Inspect the actual UI**

Open the local page, wait for assembly, and verify the DOM portrait fades into the relief, mouse movement changes face/scarf/torso perspective and lighting, all six labels remain clickable, Escape closes labels, and the browser console has no error.

- [ ] **Step 3: Synchronize through GitHub API**

Upload the exact local tree through the connected GitHub Git Data API, verify the remote tree SHA equals `git rev-parse HEAD^{tree}`, update `main` without force, and wait for the Pages workflow.

- [ ] **Step 4: Verify the public page**

Open `https://god2father.github.io/gptwork-painting-paper/`, confirm HTTP 200 for the page and relief assets, and verify the Pages Actions run succeeds.
