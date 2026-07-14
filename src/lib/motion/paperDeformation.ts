import type { PaperMeshConfig, Size } from '../../types/painting'

export interface Point3 {
  x: number
  y: number
  z: number
}

export interface PaperDeformationState {
  bend: number
  twist: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function radians(degrees: number): number {
  return degrees * Math.PI / 180
}

export function deformPaperVertex(
  vertex: Point3,
  size: Size,
  state: PaperDeformationState,
  config: PaperMeshConfig,
): Point3 {
  const bend = clamp(state.bend, 0, 1)
  const twist = clamp(state.twist, -1, 1)
  const baseLift = config.maxLift * bend * 0.15
  if (vertex.y >= 0) return { x: vertex.x, y: vertex.y, z: baseLift }

  const progress = clamp(-vertex.y / (size.height / 2), 0, 1)
  const easedProgress = progress * progress * (3 - 2 * progress)
  const angleX = radians(config.maxBend * bend * easedProgress)
  const distance = -vertex.y
  const curledY = -distance * Math.cos(angleX)
  const curledZ = baseLift + distance * Math.sin(angleX)
  const angleY = radians(config.maxTwist * twist * easedProgress)
  const cosY = Math.cos(angleY)
  const sinY = Math.sin(angleY)

  return {
    x: vertex.x * cosY + curledZ * sinY,
    y: curledY,
    z: clamp(-vertex.x * sinY + curledZ * cosY, 0, config.maxLift),
  }
}
