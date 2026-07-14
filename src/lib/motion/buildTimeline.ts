import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { clampProgress } from '../scene/painting'
import type { PaintingScene } from '../../types/painting'

gsap.registerPlugin(MotionPathPlugin)

export function layerProgress(progress: number, start: number, duration: number): number {
  return clampProgress((progress - start) / duration)
}

export function chapterProgress(progress: number, start: number, end: number): number {
  return clampProgress((progress - start) / (end - start))
}

export function assemblyEnd(scene: PaintingScene): number {
  return Math.max(...scene.layers.map((layer) => layer.assembly.start + layer.assembly.duration))
}

export function buildTimeline(
  scene: PaintingScene,
  elements: Map<string, HTMLElement>,
  stage: HTMLElement,
): gsap.core.Timeline {
  const atelier = stage.closest<HTMLElement>('.atelier')
  const camera = atelier?.querySelector<HTMLElement>('[data-motion-camera]')
  const frame = atelier?.querySelector<HTMLElement>('[data-motion-frame]')
  const wipeTop = atelier?.querySelector<HTMLElement>('[data-motion-wipe-top]')
  const wipeBottom = atelier?.querySelector<HTMLElement>('[data-motion-wipe-bottom]')
  const timeline = gsap.timeline({ paused: true })

  if (wipeTop) timeline.to(wipeTop, { yPercent: -110, duration: 0.68, ease: 'power3.inOut' }, 0)
  if (wipeBottom) timeline.to(wipeBottom, { yPercent: 110, duration: 0.68, ease: 'power3.inOut' }, 0)
  if (camera) timeline.fromTo(camera, { scale: 0.97 }, { scale: 1, duration: 1.15, ease: 'sine.out' }, 0.18)
  if (frame) {
    timeline.fromTo(frame, { y: 70, rotation: 1.4, opacity: 0 }, {
      y: 0, rotation: 0, opacity: 1, duration: 0.85, ease: 'power3.out', immediateRender: false,
    }, 0.22)
  }

  const scaleX = stage.clientWidth / scene.canvas.width
  const scaleY = stage.clientHeight / scene.canvas.height

  scene.layers.forEach((layer) => {
    const element = elements.get(layer.id)
    if (!element) return
    const from = { x: layer.assembly.from.x * scaleX, y: layer.assembly.from.y * scaleY }
    const via = { x: layer.assembly.via.x * scaleX, y: layer.assembly.via.y * scaleY }
    timeline.set(element, {
      x: from.x,
      y: from.y,
      z: layer.selection3d.z * 0.25,
      rotation: layer.assembly.from.rotation,
      scale: layer.assembly.from.scale,
      opacity: 0,
    }, 0)
    timeline.to(element, {
      motionPath: {
        path: [from, via, { x: 0, y: 0 }],
        curviness: 1.35,
        autoRotate: false,
      },
      z: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      duration: layer.assembly.duration,
      ease: layer.assembly.ease,
    }, layer.assembly.start)
  })

  timeline.set({}, {}, assemblyEnd(scene) + 0.15)
  return timeline
}
