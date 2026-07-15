export type PaintingSwipeDirection = 'next' | 'previous'

export interface SwipePoint {
  x: number
  y: number
  time: number
}

export function paintingSwipeDirection(start: SwipePoint, end: SwipePoint, height: number): PaintingSwipeDirection | null {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.abs(dy)
  const duration = Math.max(1, end.time - start.time)
  const threshold = Math.max(48, height * 0.11)
  const isFastSwipe = distance >= 36 && distance / duration >= 0.45
  if (distance <= Math.abs(dx) * 1.25 || (distance < threshold && !isFastSwipe)) return null
  return dy < 0 ? 'next' : 'previous'
}
