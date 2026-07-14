import type { DepthTransform, PaintingLayer, PaintingScene, SceneChapter, Size } from '../../types/painting'

const assets = import.meta.glob(['/assets/layers/*/*.webp', '/assets/environment/*/*.webp'], {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string`)
  return value
}

function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a number`)
  return value
}

function transform(value: unknown, label: string): DepthTransform {
  const item = record(value, label)
  const parsed = {
    x: number(item.x, `${label}.x`),
    y: number(item.y, `${label}.y`),
    scale: number(item.scale, `${label}.scale`),
    rotation: number(item.rotation, `${label}.rotation`),
    opacity: number(item.opacity, `${label}.opacity`),
    z: number(item.z, `${label}.z`),
  }
  if (parsed.scale <= 0) throw new Error(`${label}.scale must be positive`)
  if (parsed.opacity < 0 || parsed.opacity > 1) throw new Error(`${label}.opacity must be between 0 and 1`)
  return parsed
}

function layer(value: unknown, index: number): PaintingLayer {
  const item = record(value, `layers[${index}]`)
  const animation = record(item.animation, `layers[${index}].animation`)
  const parallax = record(item.parallax, `layers[${index}].parallax`)
  const bounds = record(item.bounds, `layers[${index}].bounds`)
  const start = number(animation.start, `layers[${index}].animation.start`)
  const duration = number(animation.duration, `layers[${index}].animation.duration`)
  const parsedBounds = {
    x: number(bounds.x, `layers[${index}].bounds.x`),
    y: number(bounds.y, `layers[${index}].bounds.y`),
    width: number(bounds.width, `layers[${index}].bounds.width`),
    height: number(bounds.height, `layers[${index}].bounds.height`),
  }
  const shadow = number(item.shadow, `layers[${index}].shadow`)
  if (start < 0 || start > 1) throw new Error(`layers[${index}].animation.start must be between 0 and 1`)
  if (duration <= 0 || duration > 1) throw new Error(`layers[${index}].animation.duration must be between 0 and 1`)
  if (parsedBounds.x < 0 || parsedBounds.y < 0 || parsedBounds.width <= 0 || parsedBounds.height <= 0) {
    throw new Error(`layers[${index}].bounds must be positive and inside the canvas origin`)
  }
  if (shadow < 0 || shadow > 1) throw new Error(`layers[${index}].shadow must be between 0 and 1`)
  return {
    id: text(item.id, `layers[${index}].id`),
    name: text(item.name, `layers[${index}].name`),
    src: text(item.src, `layers[${index}].src`),
    alt: text(item.alt, `layers[${index}].alt`),
    description: text(item.description, `layers[${index}].description`),
    z: number(item.z, `layers[${index}].z`),
    bounds: parsedBounds,
    collapsed: transform(item.collapsed, `layers[${index}].collapsed`),
    expanded: transform(item.expanded, `layers[${index}].expanded`),
    shadow,
    animation: { start, duration, ease: text(animation.ease, `layers[${index}].animation.ease`) },
    parallax: {
      x: number(parallax.x, `layers[${index}].parallax.x`),
      y: number(parallax.y, `layers[${index}].parallax.y`),
    },
  }
}

function chapter(value: unknown, index: number): SceneChapter {
  const item = record(value, `chapters[${index}]`)
  const id = text(item.id, `chapters[${index}].id`) as SceneChapter['id']
  const start = number(item.start, `chapters[${index}].start`)
  const end = number(item.end, `chapters[${index}].end`)
  if (start < 0 || end > 1 || end <= start) throw new Error(`chapters[${index}] has an invalid range`)
  return { id, start, end }
}

export function validatePaintingScene(value: unknown): PaintingScene {
  const item = record(value, 'scene')
  const canvas = record(item.canvas, 'canvas')
  const background = record(item.background, 'background')
  const environment = record(item.environment, 'environment')
  const workspace = record(environment.workspace, 'environment.workspace')
  const camera = record(item.camera, 'camera')
  if (!Array.isArray(item.chapters) || item.chapters.length === 0) throw new Error('chapters must be a non-empty array')
  const chapters = item.chapters.map(chapter)
  chapters.forEach((entry, index) => {
    if (index > 0 && entry.start < chapters[index - 1].end) throw new Error('chapters must be ordered and non-overlapping')
  })
  if (!Array.isArray(item.layers) || item.layers.length === 0) throw new Error('layers must be a non-empty array')
  const layers = item.layers.map(layer)
  const ids = new Set<string>()
  for (const entry of layers) {
    if (ids.has(entry.id)) throw new Error(`duplicate layer id: ${entry.id}`)
    ids.add(entry.id)
  }
  const width = number(canvas.width, 'canvas.width')
  const height = number(canvas.height, 'canvas.height')
  const duration = number(item.duration, 'duration')
  if (width <= 0 || height <= 0 || duration <= 0) throw new Error('canvas and duration must be positive')
  return {
    id: text(item.id, 'id'),
    title: text(item.title, 'title'),
    subtitle: text(item.subtitle, 'subtitle'),
    duration,
    canvas: { width, height },
    background: { src: text(background.src, 'background.src'), alt: text(background.alt, 'background.alt') },
    environment: {
      workspace: {
        src: text(workspace.src, 'environment.workspace.src'),
        alt: text(workspace.alt, 'environment.workspace.alt'),
      },
    },
    camera: {
      collapsed: transform(camera.collapsed, 'camera.collapsed'),
      focused: transform(camera.focused, 'camera.focused'),
    },
    chapters,
    layers,
  }
}

export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function toStageOffset(x: number, y: number, canvas: Size, stage: Size): { x: number; y: number } {
  return { x: x * stage.width / canvas.width, y: y * stage.height / canvas.height }
}

export function resolveAssetUrl(path: string): string {
  const url = assets[path]
  if (!url) throw new Error(`asset not found: ${path}`)
  return url
}
