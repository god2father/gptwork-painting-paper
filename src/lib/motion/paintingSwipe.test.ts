import { describe, expect, it } from 'vitest'
import { paintingSwipeDirection } from './paintingSwipe'

describe('mobile painting swipe', () => {
  it('recognizes vertical swipes without stealing taps or horizontal gestures', () => {
    const start = { x: 200, y: 200, time: 0 }
    expect(paintingSwipeDirection(start, { x: 210, y: 100, time: 300 }, 500)).toBe('next')
    expect(paintingSwipeDirection(start, { x: 195, y: 260, time: 100 }, 500)).toBe('previous')
    expect(paintingSwipeDirection(start, { x: 202, y: 190, time: 100 }, 500)).toBeNull()
    expect(paintingSwipeDirection(start, { x: 300, y: 140, time: 200 }, 500)).toBeNull()
  })
})
