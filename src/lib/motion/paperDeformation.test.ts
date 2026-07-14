import { describe, expect, it } from 'vitest'
import { deformPaperVertex } from './paperDeformation'
import type { PaperMeshConfig } from '../../types/painting'

const config: PaperMeshConfig = {
  segmentsX: 16,
  segmentsY: 24,
  maxBend: 45,
  maxLift: 90,
  maxTwist: 8,
  damping: 0.14,
}

describe('paper mesh deformation', () => {
  it('keeps the upper paper plane anchored in x and y', () => {
    const result = deformPaperVertex(
      { x: 24, y: 30, z: 0 },
      { width: 100, height: 100 },
      { bend: 1, twist: 1 },
      config,
    )
    expect(result.x).toBe(24)
    expect(result.y).toBe(30)
  })

  it('curls the lower paper plane toward positive z', () => {
    const result = deformPaperVertex(
      { x: 0, y: -50, z: 0 },
      { width: 100, height: 100 },
      { bend: 1, twist: 0 },
      config,
    )
    expect(result.y).toBeGreaterThan(-50)
    expect(result.z).toBeGreaterThan(0)
    expect(result.z).toBeLessThanOrEqual(config.maxLift)
  })

  it('clamps bend and twist input to safe limits', () => {
    const oversized = deformPaperVertex(
      { x: 30, y: -50, z: 0 },
      { width: 100, height: 100 },
      { bend: 5, twist: -4 },
      config,
    )
    const clamped = deformPaperVertex(
      { x: 30, y: -50, z: 0 },
      { width: 100, height: 100 },
      { bend: 1, twist: -1 },
      config,
    )
    expect(oversized).toEqual(clamped)
  })
})
