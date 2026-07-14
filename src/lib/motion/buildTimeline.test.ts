import { describe, expect, it } from 'vitest'
import rawScene from '../../../manifests/paintings/painting-01.json'
import { validatePaintingScene } from '../scene/painting'
import { assemblyEnd, chapterProgress, layerProgress } from './buildTimeline'

describe('layer progress', () => {
  it('maps a layer interval into zero to one', () => {
    expect(layerProgress(0.1, 0.2, 0.4)).toBe(0)
    expect(layerProgress(0.4, 0.2, 0.4)).toBeCloseTo(0.5)
    expect(layerProgress(0.8, 0.2, 0.4)).toBe(1)
  })
})

describe('atelier chapter progress', () => {
  it('clamps progress inside a chapter range', () => {
    expect(chapterProgress(0.1, 0.28, 0.42)).toBe(0)
    expect(chapterProgress(0.35, 0.28, 0.42)).toBeCloseTo(0.5)
    expect(chapterProgress(0.6, 0.28, 0.42)).toBe(1)
  })

  it('keeps the gaze movement microscopic', () => {
    const eyes = validatePaintingScene(rawScene).layers.find((layer) => layer.id === 'layer-005-eyes-brows')
    expect(Math.abs(eyes?.expanded.x ?? 99)).toBeLessThanOrEqual(3)
    expect(Math.abs(eyes?.expanded.y ?? 99)).toBeLessThanOrEqual(3)
  })

  it('keeps the assembly visible for several seconds', () => {
    expect(assemblyEnd(validatePaintingScene(rawScene))).toBeGreaterThanOrEqual(5)
  })
})
