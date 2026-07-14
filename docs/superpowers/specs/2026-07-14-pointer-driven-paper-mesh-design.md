# Pointer-Driven Paper Mesh Design

## Goal

Replace the selected layer's fixed two-half CSS fold with a genuinely three-dimensional, pointer-driven paper deformation that recalls the reference video's continuous spatial unfolding. The existing six-piece assembly, click label, selection toggle, blank-space reset, and Escape reset remain unchanged.

## Confirmed Interaction

1. The portrait assembles along the existing configured paths.
2. Clicking a paper layer selects it and shows its existing label.
3. Only the selected layer becomes a live 3D paper mesh.
4. The horizontal X axis through the layer center is the primary hinge. The top region stays visually anchored while the lower region curves toward the viewer.
5. Pointer vertical movement controls bend strength. Pointer horizontal movement adds restrained twist and changes the highlight direction.
6. Motion follows the pointer with damping rather than snapping to each event.
7. Clicking the selected layer again, clicking blank space, pressing Escape, or closing the label restores the flat DOM layer.

This is not a fixed 45-degree fold. Forty-five degrees is the nominal maximum bend, reached progressively across several mesh rows. The visible result must be a continuous curved surface without a hard seam.

## Rendering Architecture

The assembled painting and entrance animation remain DOM + GSAP. A single transparent Three.js canvas is mounted directly over the artwork canvas and has `pointer-events: none`. It renders nothing until a layer is selected.

When selection begins:

- the selected layer asset is loaded as a Three.js texture;
- a subdivided plane is positioned over that layer's configured bounds;
- the DOM copy remains visible until the texture is ready, then only its visual content is hidden while its accessible button and hit area remain active;
- all unselected layers continue to render as normal DOM elements.

This hybrid boundary avoids moving the entire artwork into WebGL and keeps the existing assembly, labels, keyboard controls, and JSON scene contract intact.

## Mesh and Camera

- Use one `PerspectiveCamera`, positioned so one world unit maps to one stage pixel at `z = 0`.
- Cap renderer pixel ratio at `1.5`.
- Use one plane per selected layer with enough rows to produce a smooth curl; default `16 × 24` segments.
- Map the layer texture across the full painting canvas and crop it to the configured layer bounds, matching the existing DOM image alignment.
- Recompute the camera and plane placement through `ResizeObserver` when the artwork canvas changes size.

## Deformation Model

The original flat vertex positions are retained. Each animation frame derives new positions from those originals and the damped interaction state.

- Vertices in the upper half remain close to their original plane.
- Bend influence grows smoothly from zero at the horizontal center to one at the lower edge.
- The lower rows rotate progressively around the X axis toward positive Z, producing a continuous curl toward the camera.
- Pointer X adds at most `±8°` of Y-axis twist; it must not replace the primary X-axis curl.
- Pointer Y maps bend strength within a safe configured range: moving upward increases the curl toward the viewer, while moving downward relaxes it; the mesh cannot invert.
- Release uses the same damped state so the paper settles instead of snapping flat.

The deformation parameters are JSON-driven per layer. Extend `selection3d` with mesh segment counts, maximum bend, maximum lift, twist, and damping. The generic renderer must not contain painting-specific coordinates or layer IDs.

## Material, Back, and Light

- Front surface: the existing transparent layer texture.
- Back surface: the same alpha silhouette filled with warm uncoated-paper color, so a strongly curled area reveals a plausible reverse side.
- Lighting: one soft ambient light and one directional light whose horizontal component follows the pointer slightly.
- Shadow: apply a soft CSS `drop-shadow` to the otherwise transparent WebGL canvas; offset and blur increase with the damped lift.
- Do not add bevels, glossy highlights, metallic shading, or a thick plastic edge.

## Component Boundaries

### `PaperMeshOverlay.vue`

Owns the transparent overlay element, receives the selected layer and scene, forwards stage-relative pointer coordinates, and reports readiness or texture failure. It does not own selection state.

### `usePaperMesh.ts`

Owns the Three.js renderer, camera, texture, meshes, resize handling, animation frame, and disposal. It exposes select, updatePointer, resize, and clear operations.

### `paperDeformation.ts`

Contains pure deformation calculations used by the renderer and unit tests. Given flat vertex coordinates and damped interaction values, it returns the updated position. It has no DOM, Vue, or Three.js dependency.

### Existing stage components

`WorkspaceStage` and `LayeredStage` continue to own pointer events and selection presentation. `StageLayer` returns to one visual image rather than duplicating the texture into two CSS facets.

## Failure and Fallback

- WebGL unavailable: keep the normal DOM layer selected with the current label and a restrained static Z-lift; do not show a broken canvas.
- Texture load failure: leave the DOM layer visible, emit the existing asset error, and dispose partial WebGL resources.
- Context loss: restore the DOM layer immediately and allow a later selection to retry.
- Reduced motion: use a static shallow lift with no pointer-following animation.
- Touch devices: selection uses a centered preset curl; pointer twist is omitted.

## Performance and Lifecycle

- One renderer, one active mesh, and one animation loop maximum.
- Start the loop only while a mesh is active or settling.
- Pause when the page is hidden.
- Dispose textures, geometry, materials, and renderer listeners on layer change and component unmount.
- Do not render inactive layers in WebGL.

## Accessibility

- Existing layer buttons, accessible names, focus styling, `aria-pressed`, labels, and Escape behavior remain.
- Keyboard activation selects the mesh using the centered preset pointer position.
- The WebGL canvas is decorative and `aria-hidden="true"`.
- No interaction depends exclusively on hover.

## Validation

- Unit-test the deformation function: upper anchor stability, positive-Z lower curl, maximum bend clamping, and pointer twist limits.
- Component-test that the overlay exists once, selected DOM visuals hide only after mesh readiness, and clearing selection restores them.
- Keep the existing selection, stage rendering, scene validation, and assembly tests passing.
- Run `npm test`, `npm run typecheck`, and `npm run build`.
- The user performs final visual judgment in the browser, checking continuous curvature, pointer response, paper back visibility, shadow/highlight coherence, and smooth restoration.

## Explicit Non-Goals

- No physics engine, cloth simulation, or collision detection.
- No conversion of the complete stage or assembly animation to WebGL.
- No gyroscope interaction.
- No simultaneous deformation of multiple layers.
- No reuse or redistribution of frames from the reference video.
