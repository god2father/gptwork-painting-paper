import { describe, expect, it } from 'vitest'
import scene from '../../../manifests/paintings/painting-01.json'
import { clampProgress, resolveAssetUrl, toStageOffset, validatePaintingScene } from './painting'

describe('painting scene contract', () => {
  it('accepts the six-layer atelier scene', () => {
    const parsed = validatePaintingScene(scene) as unknown as {
      environment: { workspace: { src: string } }
      chapters: Array<{ id: string; start: number; end: number }>
      layers: Array<{ expanded: { z: number }; shadow: number }>
    }
    expect(parsed.layers).toHaveLength(6)
    expect(parsed.environment.workspace.src).toBe('/assets/environment/painting-01/workspace.webp')
    expect(parsed.chapters.map(({ id }) => id)).toEqual(['reveal', 'arrival', 'focus', 'layers', 'observe'])
    expect(parsed.layers.every((layer) => Number.isFinite(layer.expanded.z))).toBe(true)
  })

  it('rejects duplicate ids', () => {
    expect(() => validatePaintingScene({ ...scene, layers: [scene.layers[0], scene.layers[0]] }))
      .toThrow('duplicate layer id')
  })

  it('requires a configured hit area for every layer', () => {
    const { bounds: _bounds, ...withoutBounds } = scene.layers[0] as typeof scene.layers[0] & { bounds?: unknown }
    expect(() => validatePaintingScene({ ...scene, layers: [withoutBounds, ...scene.layers.slice(1)] }))
      .toThrow('bounds')
  })

  it('rejects unordered chapter ranges', () => {
    expect(() => validatePaintingScene({
      ...scene,
      chapters: [
        { id: 'reveal', start: 0.2, end: 0.3 },
        { id: 'arrival', start: 0.1, end: 0.4 },
      ],
    })).toThrow('chapters')
  })

  it('rejects shadow strength outside zero to one', () => {
    expect(() => validatePaintingScene({
      ...scene,
      layers: [{ ...scene.layers[0], shadow: 2 }, ...scene.layers.slice(1)],
    })).toThrow('shadow')
  })

  it('requires JSON-driven three-dimensional selection transforms', () => {
    const parsed = validatePaintingScene(scene) as unknown as {
      layers: Array<{ selection3d: { z: number; rotateX: number; rotateY: number; scale: number; foldAngle: number } }>
    }
    expect(parsed.layers.every((layer) => layer.selection3d.z > 0)).toBe(true)
    expect(parsed.layers.every((layer) => Math.abs(layer.selection3d.rotateX) <= 14)).toBe(true)
    expect(parsed.layers.every((layer) => Math.abs(layer.selection3d.rotateY) <= 14)).toBe(true)
    expect(parsed.layers.every((layer) => layer.selection3d.foldAngle === 45)).toBe(true)
  })

  it('gives every paper piece a visible ordered assembly path', () => {
    const parsed = validatePaintingScene(scene) as unknown as {
      layers: Array<{ assembly: { start: number; duration: number; from: { x: number; y: number }; via: { x: number; y: number } } }>
    }
    const starts = parsed.layers.map((layer) => layer.assembly.start)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
    expect(new Set(starts).size).toBe(parsed.layers.length)
    expect(parsed.layers.every((layer) => Math.hypot(layer.assembly.from.x, layer.assembly.from.y) >= 320)).toBe(true)
    expect(parsed.layers.every((layer) => layer.assembly.duration >= 0.9)).toBe(true)
  })

  it('converts canvas pixels to stage pixels', () => {
    expect(toStageOffset(192, 108, { width: 1920, height: 1080 }, { width: 960, height: 540 }))
      .toEqual({ x: 96, y: 54 })
  })

  it('clamps progress', () => {
    expect(clampProgress(-1)).toBe(0)
    expect(clampProgress(2)).toBe(1)
  })

  it('does not expose source or review images to the runtime bundle', () => {
    expect(() => resolveAssetUrl('/assets/originals/painting-01/original.png')).toThrow('asset not found')
  })

  it('resolves the generated workspace at runtime', () => {
    expect(resolveAssetUrl('/assets/environment/painting-01/workspace.webp')).toMatch(/^\/?@fs|^data:|^\/assets\//)
  })
})
