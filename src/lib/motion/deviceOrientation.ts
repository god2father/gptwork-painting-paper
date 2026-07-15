export interface OrientationOrigin {
  beta: number
  gamma: number
  angle: number
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value))
}

export function orientationToPointer(beta: number, gamma: number, origin: OrientationOrigin, range = 22) {
  const angle = ((origin.angle % 360) + 360) % 360
  const horizontal = gamma - origin.gamma
  const vertical = beta - origin.beta
  const [x, y] = angle === 90
    ? [vertical, -horizontal]
    : angle === 270
      ? [-vertical, horizontal]
      : angle === 180
        ? [-horizontal, -vertical]
        : [horizontal, vertical]

  return { x: clamp(x / range), y: clamp(y / range) }
}
