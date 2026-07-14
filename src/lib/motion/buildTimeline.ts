import { gsap } from 'gsap'
import { clampProgress } from '../scene/painting'
import type { PaintingScene } from '../../types/painting'

export function layerProgress(progress: number, start: number, duration: number): number {
  return clampProgress((progress - start) / duration)
}

export function buildTimeline(
  scene: PaintingScene,
  elements: Map<string, HTMLElement>,
  stage: HTMLElement,
): gsap.core.Timeline {
  const scaleX = stage.clientWidth / scene.canvas.width
  const scaleY = stage.clientHeight / scene.canvas.height
  const timeline = gsap.timeline({ paused: true })

  for (const layer of scene.layers) {
    const element = elements.get(layer.id)
    if (!element) continue
    timeline.fromTo(element, {
      x: layer.collapsed.x * scaleX,
      y: layer.collapsed.y * scaleY,
      scale: layer.collapsed.scale,
      rotation: layer.collapsed.rotation,
      opacity: layer.collapsed.opacity,
    }, {
      x: layer.expanded.x * scaleX,
      y: layer.expanded.y * scaleY,
      scale: layer.expanded.scale,
      rotation: layer.expanded.rotation,
      opacity: layer.expanded.opacity,
      duration: layer.animation.duration * scene.duration,
      ease: layer.animation.ease,
      immediateRender: false,
    }, layer.animation.start * scene.duration)
  }

  timeline.set({}, {}, scene.duration)
  return timeline
}
