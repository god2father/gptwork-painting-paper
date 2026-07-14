import { describe, expect, it } from 'vitest'
import scene from '../../../manifests/paintings/painting-01.json'
import { clampProgress, resolveAssetUrl, toStageOffset, validatePaintingScene } from './painting'

describe('painting scene contract', () => {
  it('accepts the first 12-layer scene', () => {
    expect(validatePaintingScene(scene).layers).toHaveLength(12)
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
})
