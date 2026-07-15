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

export function openingOffset(opening: boolean): number {
  return opening ? 1.62 : 0
}

export function buildTimeline(
  scene: PaintingScene,
  elements: Map<string, HTMLElement>,
  stage: HTMLElement,
  onComplete?: () => void,
): gsap.core.Timeline {
  const atelier = stage.closest<HTMLElement>('.atelier')
  const camera = atelier?.querySelector<HTMLElement>('[data-motion-camera]')
  const frame = atelier?.querySelector<HTMLElement>('[data-motion-frame]')
  const wipeTopStatic = atelier?.querySelector<HTMLElement>('[data-motion-wipe-top-static]')
  const wipeBottomStatic = atelier?.querySelector<HTMLElement>('[data-motion-wipe-bottom-static]')
  const wipeTop = atelier?.querySelector<HTMLElement>('[data-motion-wipe-top]')
  const wipeBottom = atelier?.querySelector<HTMLElement>('[data-motion-wipe-bottom]')
  const paperKnife = atelier?.querySelector<HTMLElement>('[data-motion-paper-knife]')
  const opening = atelier?.dataset.opening === 'true'
  const introOffset = openingOffset(opening)
  const timeline = gsap.timeline({ paused: true, onComplete })

  if (opening) {
    if (wipeTopStatic) timeline.fromTo(wipeTopStatic, { clipPath: 'inset(0 0% 0 0)' }, { clipPath: 'inset(0 100% 0 0)', duration: 0.82, ease: 'power2.inOut' }, 0)
    if (wipeBottomStatic) timeline.fromTo(wipeBottomStatic, { clipPath: 'inset(0 0% 0 0)' }, { clipPath: 'inset(0 100% 0 0)', duration: 0.82, ease: 'power2.inOut' }, 0)
    if (wipeTop) {
      timeline.fromTo(wipeTop, { clipPath: 'inset(0 0 0 100%)', yPercent: 0 }, { clipPath: 'inset(0 0 0 0%)', duration: 0.82, ease: 'power2.inOut' }, 0)
      timeline.to(wipeTop, { yPercent: -115, duration: 0.78, ease: 'power3.in' }, 0.84)
    }
    if (wipeBottom) {
      timeline.fromTo(wipeBottom, { clipPath: 'inset(0 0 0 100%)', yPercent: 0 }, { clipPath: 'inset(0 0 0 0%)', duration: 0.82, ease: 'power2.inOut' }, 0)
      timeline.to(wipeBottom, { yPercent: 115, duration: 0.78, ease: 'power3.in' }, 0.84)
    }
    if (paperKnife) {
      timeline.fromTo(paperKnife, { x: 0, opacity: 1, rotation: -4 }, { x: -(atelier?.clientWidth ?? stage.clientWidth) - 190, rotation: -1, duration: 0.82, ease: 'power2.inOut' }, 0)
      timeline.to(paperKnife, { opacity: 0, duration: 0.06 }, 0.82)
    }
  }
  if (camera) timeline.fromTo(camera, { scale: 0.97 }, { scale: 1, duration: 1.15, ease: 'sine.out' }, introOffset + 0.18)
  if (frame) {
    timeline.fromTo(frame, { y: 70, rotation: 1.4, opacity: 0 }, {
      y: 0, rotation: 0, opacity: 1, duration: 0.85, ease: 'power3.out', immediateRender: false,
    }, introOffset + 0.22)
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
    }, introOffset + layer.assembly.start)
  })

  timeline.set({}, {}, introOffset + assemblyEnd(scene) + 0.15)
  return timeline
}
