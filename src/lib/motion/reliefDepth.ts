export function depthToZ(value: number, depthScale: number): number {
  const normalized = Math.min(255, Math.max(0, value)) / 255
  return normalized * Math.max(0, depthScale)
}
