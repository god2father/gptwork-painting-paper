import { describe, expect, it } from 'vitest'
import { layerProgress } from './buildTimeline'

describe('layer progress', () => {
  it('maps a layer interval into zero to one', () => {
    expect(layerProgress(0.1, 0.2, 0.4)).toBe(0)
    expect(layerProgress(0.4, 0.2, 0.4)).toBeCloseTo(0.5)
    expect(layerProgress(0.8, 0.2, 0.4)).toBe(1)
  })
})
