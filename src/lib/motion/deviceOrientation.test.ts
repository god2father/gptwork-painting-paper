import { describe, expect, it } from 'vitest'
import { orientationToPointer } from './deviceOrientation'

describe('device orientation pointer mapping', () => {
  it('calibrates, clamps and follows screen rotation', () => {
    expect(orientationToPointer(40, 20, { beta: 40, gamma: 20, angle: 0 })).toEqual({ x: 0, y: 0 })
    expect(orientationToPointer(80, -20, { beta: 40, gamma: 20, angle: 0 })).toEqual({ x: -1, y: 1 })
    expect(orientationToPointer(51, 31, { beta: 40, gamma: 20, angle: 90 })).toEqual({ x: 0.5, y: -0.5 })
  })
})
