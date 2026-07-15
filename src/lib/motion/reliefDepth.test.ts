import { describe, expect, it } from 'vitest'
import { depthToZ } from './reliefDepth'

describe('depthToZ', () => {
  it('maps the grayscale range to the configured relief depth', () => {
    expect(depthToZ(0, 52)).toBe(0)
    expect(depthToZ(255, 52)).toBe(52)
  })

  it('clamps invalid grayscale and depth inputs', () => {
    expect(depthToZ(-20, 52)).toBe(0)
    expect(depthToZ(400, 52)).toBe(52)
    expect(depthToZ(255, -10)).toBe(0)
  })
})
