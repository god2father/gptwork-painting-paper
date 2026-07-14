# Paper Atelier Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current museum-grid prototype with a GPT-generated overhead paper atelier and a logically layered, restrained Girl with a Pearl Earring paper performance.

**Architecture:** Preserve the existing Vue/Pinia/GSAP single-progress architecture. Add one generated environment asset, regroup the existing GPT master into six semantic transparent subject layers plus the fixed background, extend the scene manifest with environment/camera/chapter data, and render the scene through a generic workspace stage. All painting-specific movement and asset paths remain in JSON.

**Tech Stack:** Node.js 24 bundled runtime, Vue 3, Vite, TypeScript 5.9, Pinia, GSAP/ScrollTrigger, Vitest, Playwright, Pillow, built-in image generation.

## Global Constraints

- Work in `D:\work\gptwork-painting-paper\.worktrees\pearl-layer-assets` on `agent/pearl-layer-assets`.
- Do not add UI, state, animation, or CSS framework dependencies.
- First release continues to contain one painting only.
- Runtime animation and artwork-specific positions must remain JSON-driven.
- Generated assets must record prompt, tool, date, purpose, and local file mapping.
- Do not commit or publish the reference video, its frames, audio, subtitles, or music.
- Use the bundled Node.js 24 path for every npm command.
- Complete means typecheck, unit tests, Python asset tests, Playwright tests, production build, and inspected screenshots all pass.

---

### Task 1: Generate the atelier environment and regroup portrait layers

**Files:**
- Create: `assets/originals/painting-01/environment-generation.json`
- Create: `assets/environment/painting-01/workspace.webp`
- Modify: `scripts/extract_painting_layers.py`
- Modify: `scripts/validate_painting_assets.py`
- Modify: `scripts/build_layer_preview.py`
- Modify: `tests/test_painting_asset_scripts.py`
- Replace generated files under: `assets/layers/painting-01/`

**Interfaces:**
- Consumes: the existing GPT master at `assets/originals/painting-01/original.png` and its recorded generation metadata.
- Produces: `workspace.webp`, fixed `background.webp`, six semantic transparent WebP subject layers, six masks, and an updated visual contact sheet.

- [ ] **Step 1: Write the failing semantic-layer asset test**

Set `EXPECTED_LAYERS` in the test fixture to exactly:

```python
EXPECTED_LAYERS = (
    "layer-001-torso-collar.webp",
    "layer-002-face-neck.webp",
    "layer-003-blue-headscarf.webp",
    "layer-004-yellow-wrap-tail.webp",
    "layer-005-eyes-brows.webp",
    "layer-006-pearl-highlight.webp",
)
```

Add an assertion that `assets/environment/painting-01/workspace.webp` exists, is RGB/RGBA, and has a 16:9 aspect ratio within one pixel of rounding.

- [ ] **Step 2: Run the asset test and verify it fails**

Run:

```powershell
python -m unittest tests.test_painting_asset_scripts -v
```

Expected: failure because the current extractor and validator still require twelve old layer names and no workspace asset exists.

- [ ] **Step 3: Generate one original overhead atelier image**

Use the built-in image generation tool with this project-bound prompt:

```text
Use case: stylized-concept
Asset type: full-screen website environment background
Primary request: create a premium overhead artist workbench for an interactive handcrafted paper-art portrait
Scene/backdrop: warm aged oak tabletop viewed perfectly from above; restrained paper scraps, masking tape, two graphite pencils, a metal ruler and one ceramic ink cup placed only around the outer 15 percent of the frame; the center 60 percent remains calm and unobstructed
Style/medium: photoreal handcrafted editorial still life, museum-catalog quality, subtle stop-motion craft atmosphere
Composition/framing: exact 16:9 landscape, symmetrical visual balance without looking staged, large clean central negative space for a portrait frame overlay
Lighting/mood: soft directional daylight from upper left, every cast shadow falls gently to lower right
Color palette: warm brown wood, oatmeal paper, muted charcoal, low-saturation ochre
Materials/textures: real wood grain, deckled handmade paper fibers, matte tools, no plastic shine
Constraints: no hands, no people, no artwork, no picture frame in the center, no readable text, no logos, no watermark, no dramatic depth of field, no dark vignette
```

Inspect the generated image at full resolution. Copy the accepted result into the project, convert it to WebP with Pillow at quality 92, and save the original prompt/tool/date/file mapping in `environment-generation.json`.

- [ ] **Step 4: Regroup the GPT portrait master deterministically**

Retain the existing polygon definitions as source masks, then define these unions in `extract_painting_layers.py`:

```python
LAYER_GROUPS = {
    "layer-001-torso-collar.webp": (
        "layer-002-torso.webp",
        "layer-010-white-collar.webp",
    ),
    "layer-002-face-neck.webp": (
        "layer-003-neck-ear.webp",
        "layer-004-face-base.webp",
        "layer-005-face-shadow.webp",
        "layer-006-face-highlight.webp",
    ),
    "layer-003-blue-headscarf.webp": ("layer-009-blue-headband.webp",),
    "layer-004-yellow-wrap-tail.webp": (
        "layer-001-scarf-tail.webp",
        "layer-008-yellow-wrap.webp",
    ),
    "layer-005-eyes-brows.webp": ("layer-007-eyes-brows.webp",),
    "layer-006-pearl-highlight.webp": (
        "layer-011-pearl.webp",
        "layer-012-pearl-highlight.webp",
    ),
}
```

For each output, combine source masks with `ImageChops.lighter`, copy pixels only from the GPT master, and export lossless WebP with alpha. Remove obsolete generated twelve-layer runtime files only after the six replacements and their masks pass validation.

- [ ] **Step 5: Validate and visually inspect the new asset set**

Run:

```powershell
python scripts/extract_painting_layers.py .
python scripts/build_layer_preview.py .
python scripts/validate_painting_assets.py .
python -m unittest tests.test_painting_asset_scripts -v
```

Expected: six transparent semantic layers, fixed background, 16:9 workspace, updated masks/contact sheet, and all Python tests pass. Open `workspace.webp` and `layer-preview.png`; reject the asset if central negative space is obstructed or the light direction is inconsistent.

- [ ] **Step 6: Commit the asset stage**

```powershell
git add assets scripts tests/test_painting_asset_scripts.py
git commit -m "feat: create semantic atelier artwork assets"
```

---

### Task 2: Extend and migrate the JSON scene contract

**Files:**
- Modify: `src/types/painting.ts`
- Modify: `src/lib/scene/painting.ts`
- Modify: `src/lib/scene/painting.test.ts`
- Modify: `manifests/paintings/painting.schema.json`
- Modify: `manifests/paintings/painting-01.json`

**Interfaces:**
- Produces: validated `environment`, `camera`, `chapters`, and six semantic `layers` with depth/shadow data.
- Consumers: `WorkspaceStage.vue`, `buildTimeline.ts`, and Playwright tests.

- [ ] **Step 1: Add failing contract tests**

Add tests that require:

```ts
scene.environment.workspace.src
scene.environment.workspace.alt
scene.chapters.map(({ id, start, end }) => ({ id, start, end }))
scene.layers.length === 6
scene.layers.every((layer) => Number.isFinite(layer.expanded.z))
scene.layers.every((layer) => layer.shadow >= 0 && layer.shadow <= 1)
```

Also reject overlapping/out-of-order chapter ranges and runtime asset paths outside `/assets/environment/` or `/assets/layers/`.

- [ ] **Step 2: Run the targeted scene tests and verify failure**

```powershell
npm run test -- src/lib/scene/painting.test.ts
```

Expected: failures for missing environment, chapter, depth, and shadow properties.

- [ ] **Step 3: Add the minimum typed configuration**

Add these shared shapes:

```ts
export interface SceneChapter {
  id: 'reveal' | 'arrival' | 'focus' | 'layers' | 'observe'
  start: number
  end: number
}

export interface EnvironmentAsset {
  src: string
  alt: string
}

export interface DepthTransform extends LayerTransform {
  z: number
}
```

Change `PaintingLayer.collapsed` and `.expanded` to `DepthTransform`, add `shadow: number`, add `environment.workspace`, `camera`, and `chapters` to `PaintingScene`, and validate them without adding a schema library.

- [ ] **Step 4: Migrate the painting manifest**

Use chapter windows exactly `0–0.12`, `0.12–0.28`, `0.28–0.42`, `0.42–0.82`, and `0.82–1`. Replace the twelve old layer entries with the six semantic entries. Keep face/neck expanded XY travel within 12 canvas pixels, headscarf within 36 pixels, torso within 24 pixels, eyes within 3 pixels, and pearl within 16 pixels. Use Z values from 10 to 72 and rotations no larger than 2.5 degrees.

- [ ] **Step 5: Run contract tests, typecheck, and asset validation**

```powershell
npm run test -- src/lib/scene/painting.test.ts
npm run typecheck
python scripts/validate_painting_assets.py .
```

Expected: all pass and no obsolete twelve-layer runtime path remains in the manifest.

- [ ] **Step 6: Commit the contract migration**

```powershell
git add src/types src/lib/scene manifests/paintings
git commit -m "feat: model the paper atelier scene"
```

---

### Task 3: Build the generic workspace stage and paper labels

**Files:**
- Create: `src/features/stage/WorkspaceStage.vue`
- Create: `src/features/stage/PortraitFrame.vue`
- Create: `src/features/stage/PaperLabel.vue`
- Create: `src/features/stage/WorkspaceStage.test.ts`
- Modify: `src/features/stage/StageLayer.vue`
- Modify: `src/App.vue`
- Modify: `src/styles.css`
- Remove after replacement: `src/features/gallery/ArtworkHeader.vue`
- Remove after replacement: `src/features/inspector/LayerInspector.vue`

**Interfaces:**
- `WorkspaceStage` emits `ready(elements: StageElements)` and `error(id: string)`.
- `StageElements` contains `camera`, `frame`, `wipeTop`, `wipeBottom`, and `layers: Map<string, HTMLElement>`.
- `PaperLabel` accepts `kind`, `title`, and optional `body` without knowing the painting ID.

- [ ] **Step 1: Write the failing SSR stage test**

Assert rendered HTML contains the environment image alt text, two paper-wipe elements, one portrait frame, six layer buttons, a compact work label, and no `museum-grid`, `artwork-header`, or persistent `complementary` inspector.

- [ ] **Step 2: Run the targeted test and verify failure**

```powershell
npm run test -- src/features/stage/WorkspaceStage.test.ts
```

Expected: failure because `WorkspaceStage.vue` does not exist.

- [ ] **Step 3: Implement the workspace component boundary**

Use semantic markup:

```vue
<section class="atelier" :aria-label="`${scene.title}纸艺工作台`">
  <img class="atelier__workspace" :src="resolveAssetUrl(scene.environment.workspace.src)" :alt="scene.environment.workspace.alt" />
  <div class="atelier__camera" data-motion-camera>
    <PaperLabel kind="work" :title="scene.title" />
    <div class="atelier__paper-bed">
      <PortraitFrame :scene="scene" @ready="forwardReady" @error="forwardError" />
    </div>
  </div>
  <div class="atelier__wipe atelier__wipe--top" data-motion-wipe-top />
  <div class="atelier__wipe atelier__wipe--bottom" data-motion-wipe-bottom />
</section>
```

Make the paper bed and frame with CSS-native shapes over the GPT workspace; use subtle `clip-path` deckled edges, consistent lower-right shadows, and no decorative text.

- [ ] **Step 4: Make individual layers physically readable**

Move clipping to `.stage-layer__parallax`, keep the button overflow visible, and give the button a `::before` hit target with `width: max(100%, 44px)` and `height: max(100%, 44px)`. Render layer depth through CSS variable `--layer-z`, use `drop-shadow` from configured shadow strength, and keep focus outlines visible outside the cropped image.

- [ ] **Step 5: Replace the three-column App composition**

Render only `WorkspaceStage`, the conditional selected-layer `PaperLabel`, and `TimelineControls` inside the sticky chapter. Preserve the existing scene error card and `Escape` handler. The selected-layer label must disappear when there is no selection.

- [ ] **Step 6: Verify static rendering and responsive bounds**

```powershell
npm run test -- src/features/stage/WorkspaceStage.test.ts
npm run typecheck
npm run build
```

Expected: pass; the build includes the workspace WebP and six semantic layer WebPs, not old twelve-layer WebPs.

- [ ] **Step 7: Commit the workspace layout**

```powershell
git add src/features src/App.vue src/styles.css
git commit -m "feat: build the overhead paper atelier"
```

---

### Task 4: Choreograph the five-act GSAP performance

**Files:**
- Modify: `src/lib/motion/buildTimeline.ts`
- Modify: `src/lib/motion/buildTimeline.test.ts`
- Modify: `src/features/stage/useStageMotion.ts`

**Interfaces:**
- `buildTimeline(scene, elements, portrait)` consumes `StageElements` and returns one paused GSAP timeline with total duration `scene.duration`.
- `chapterProgress(progress, start, end)` returns a clamped local `0..1` progress.

- [ ] **Step 1: Add failing pure timing tests**

Test chapter clamping at values below, inside, and above each range. Test that layer animation begins only in the `layers` chapter and that eye travel stays within configured values.

- [ ] **Step 2: Run targeted motion tests and verify failure**

```powershell
npm run test -- src/lib/motion/buildTimeline.test.ts
```

Expected: failure for the missing chapter helper and new stage element contract.

- [ ] **Step 3: Build one timeline containing all five acts**

Animate:

- wipe top to `yPercent: -110` and wipe bottom to `yPercent: 110` during `reveal`;
- frame from `y: 12vh`, rotation `1.5`, scale `0.96`, shadow `0.35` to its resting state during `arrival`;
- camera from scale `1` to `1.12` during `focus`;
- each layer from collapsed XY/Z/rotation/shadow to expanded values during its JSON interval;
- pearl opacity/scale once near the end of the `layers` chapter;
- no automatic reverse at `observe`.

Use `transformPerspective: 1200` and `transformStyle: preserve-3d` on the portrait frame. Do not animate face parts beyond their manifest values.

- [ ] **Step 4: Restrict pointer parallax**

Apply pointer parallax only when a layer has non-zero configured parallax. Set face/neck and eyes parallax to zero in JSON. Apply a separate maximum 4px environment parallax to the camera and reset it on pointer leave. Keep the reduced-motion branch at stable combined/lightly-expanded endpoints.

- [ ] **Step 5: Verify motion tests and shared progress behavior**

```powershell
npm run test -- src/lib/motion/buildTimeline.test.ts src/stores/interaction.test.ts
npm run typecheck
```

Expected: all pass; playback, scroll, and range input continue changing the same Pinia `progress` value.

- [ ] **Step 6: Commit the performance**

```powershell
git add src/lib/motion src/features/stage/useStageMotion.ts manifests/paintings/painting-01.json
git commit -m "feat: choreograph the paper atelier performance"
```

---

### Task 5: Redesign controls and contextual layer information

**Files:**
- Modify: `src/features/timeline/TimelineControls.vue`
- Modify: `src/features/timeline/TimelineControls.test.ts`
- Modify: `src/styles.css`
- Modify: `src/App.vue`

**Interfaces:**
- Controls continue to call the existing interaction-store methods.
- The primary visible actions are play/pause and range progress; replay/reset live in a keyboard-accessible disclosure.

- [ ] **Step 1: Write a failing control-markup test**

Require one primary play/pause button, one labeled range, one `details` element named `更多控制`, replay and reset inside it, readable percentage output, and no three-button black toolbar markup.

- [ ] **Step 2: Run the targeted test and verify failure**

```powershell
npm run test -- src/features/timeline/TimelineControls.test.ts
```

Expected: failure because replay/reset are currently equal primary buttons.

- [ ] **Step 3: Implement the paper-ruler controls**

Use a warm translucent paper strip, a 1px dark-brown progress track, one circular 44px play button, and native `details/summary` for secondary actions. Use `aria-pressed`, a live percentage output, visible focus, and direct reduced-motion state switching.

- [ ] **Step 4: Implement contextual paper labels**

Anchor the selected-layer `PaperLabel` near the lower-right of the frame on desktop and directly below it on mobile. Include layer name, description, and clear button; do not reserve layout space when hidden.

- [ ] **Step 5: Verify controls and accessibility basics**

```powershell
npm run test -- src/features/timeline/TimelineControls.test.ts src/features/stage/WorkspaceStage.test.ts
npm run typecheck
```

Expected: pass; every control and stage layer has a Chinese accessible name and a 44px target.

- [ ] **Step 6: Commit the interaction polish**

```powershell
git add src/App.vue src/features/timeline src/features/stage/PaperLabel.vue src/styles.css
git commit -m "feat: add restrained atelier controls"
```

---

### Task 6: Browser verification, visual baselines, documentation, and API sync

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/atelier.spec.ts`
- Create ignored outputs under: `tests/visual/actual/`
- Modify: `README-FIRST.md`
- Modify: `assets/originals/sources.md`

**Interfaces:**
- `npm run test:e2e` starts Vite and verifies desktop/mobile behavior.
- Visual screenshots are written as `desktop-composed.png`, `desktop-expanded.png`, and `mobile-composed.png`.

- [ ] **Step 1: Write the end-to-end test before final visual tuning**

Cover:

- workspace, title label, portrait frame, and six layer buttons are visible;
- play changes progress and pause stops it;
- range input reaches the expanded state;
- clicking one uniquely named layer displays its contextual paper label;
- `Escape` removes the label;
- reset returns progress to zero;
- 1920×1080 and 390×844 have `document.documentElement.scrollWidth === window.innerWidth`;
- desktop/mobile screenshots are saved to `tests/visual/actual/`.

- [ ] **Step 2: Install the matching Chromium runtime if missing and run E2E**

```powershell
npx playwright install chromium
npm run test:e2e
```

Expected: tests run against the local Vite app; fix product defects rather than weakening assertions.

- [ ] **Step 3: Inspect the page in a real browser**

Open the local page at 1920×1080 and 390×844. Inspect composed, mid-focus, expanded, selected-layer, keyboard-focus, and reduced-motion states. Compare them with the local reference contact sheets for visual language only. Verify that the frame is the dominant focal point, the workbench remains visible, no face fragment floats arbitrarily, and all shadows fall lower-right.

- [ ] **Step 4: Open and inspect every actual screenshot**

Open all three files under `tests/visual/actual/`. If any screenshot looks like a dashboard, has a black toolbar, obscures the portrait, clips controls, or loses the workbench composition, fix and regenerate before continuing.

- [ ] **Step 5: Update documentation and provenance**

Document Node 20+ requirements, install/run/test/build commands, generated workspace prompt and source record, how the semantic layers are derived from the GPT master, how to replace one environment asset, and how to add a future painting without editing core stage components.

- [ ] **Step 6: Run the complete completion gate**

```powershell
python -m unittest tests.test_painting_asset_scripts -v
npm run typecheck
npm run test
npm run test:e2e
npm run build
git diff --check
git status --short
```

Expected: every command exits zero, visual screenshots exist and were inspected, and only intentional ignored screenshot output remains outside Git.

- [ ] **Step 7: Commit the verified redesign**

```powershell
git add playwright.config.ts tests/e2e README-FIRST.md assets/originals/sources.md
git commit -m "test: verify the paper atelier experience"
```

- [ ] **Step 8: Synchronize through the GitHub Git Data API**

Upload exact local blob bytes from `git cat-file blob`, create a tree, confirm the created tree SHA equals `git rev-parse HEAD^{tree}`, create a commit whose parent is current remote `main`, and update `refs/heads/main` without force. Fetch the remote commit/tree through the API and confirm both match the intended local tree before reporting success.

---

## Plan Self-Review Result

- Every visual requirement in the approved redesign spec maps to an asset, component, motion, interaction, or verification task above.
- The six runtime subject-layer names are consistent across the extractor, validator, manifest, tests, and build expectations.
- The reference video remains read-only and outside the commit path.
- No new runtime dependency or painting-specific position is introduced into a core component.
- Browser screenshots and actual inspection remain mandatory completion gates.

## Approved Interaction Revision

The final user-approved direction replaces Tasks 4–6 interaction scope: remove scroll decomposition and timeline controls, keep a single short assembly entrance, and make direct layer selection the primary interaction. Each selected layer uses JSON-driven `selection3d` values for Z lift, X/Y rotation, and scale; clicking blank space, the selected layer again, the paper-label close action, or Escape restores it. The user owns final visual testing; implementation still runs unit tests, typecheck, and production build.

## Approved Center-Hinge Fold Revision

The selected paper layer uses its exact vertical center as a hinge. The left half remains the base plane while the right half rotates upward by exactly 45 degrees. The fold keeps the existing lift, crease highlight, shadow, label, toggle, backdrop-clear, and Escape behavior. Implement test-first by requiring every manifest layer to expose `foldAngle: 45`, then change only the existing facet clip paths and selected-state transforms. Verify with the focused scene/stage tests, full unit suite, typecheck, and production build; final visual judgment remains with the user.
