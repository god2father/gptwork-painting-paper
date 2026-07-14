import { gsap } from 'gsap'
import { clampProgress } from '../scene/painting'
import type { PaintingScene } from '../../types/painting'

export function layerProgress(progress: number, start: number, duration: number): number {
  return clampProgress((progress - start) / duration)
}

export function chapterProgress(progress: number, start: number, end: number): number {
  return clampProgress((progress - start) / (end - start))
}

export function buildTimeline(
  scene: PaintingScene,
  elements: Map<string, HTMLElement>,
  stage: HTMLElement,
): gsap.core.Timeline {
  const scaleX = stage.clientWidth / scene.canvas.width
  const scaleY = stage.clientHeight / scene.canvas.height
  const timeline = gsap.timeline({ paused: true })
  const atelier = stage.closest<HTMLElement>('.atelier')
  const camera = atelier?.querySelector<HTMLElement>('[data-motion-camera]')
  const frame = atelier?.querySelector<HTMLElement>('[data-motion-frame]')
  const wipeTop = atelier?.querySelector<HTMLElement>('[data-motion-wipe-top]')
  const wipeBottom = atelier?.querySelector<HTMLElement>('[data-motion-wipe-bottom]')
  const chapter = (id: string) => scene.chapters.find((entry) => entry.id === id)!

  const reveal = chapter('reveal')
  if (wipeTop) {
    timeline.fromTo(wipeTop, { yPercent: 0 }, {
      yPercent: -110,
      duration: (reveal.end - reveal.start) * scene.duration,
      ease: 'power3.inOut',
      immediateRender: false,
    }, reveal.start * scene.duration)
  }
  if (wipeBottom) {
    timeline.fromTo(wipeBottom, { yPercent: 0 }, {
      yPercent: 110,
      duration: (reveal.end - reveal.start) * scene.duration,
      ease: 'power3.inOut',
      immediateRender: false,
    }, reveal.start * scene.duration)
  }

  const arrival = chapter('arrival')
  if (frame) {
    timeline.fromTo(frame, {
      y: Math.min(window.innerHeight * 0.12, 120),
      rotation: 1.5,
      scale: 0.96,
    }, {
      y: 0,
      rotation: 0,
      scale: 1,
      duration: (arrival.end - arrival.start) * scene.duration,
      ease: 'power3.out',
      immediateRender: false,
    }, arrival.start * scene.duration)
  }

  const focus = chapter('focus')
  if (camera) {
    timeline.fromTo(camera, {
      x: scene.camera.collapsed.x,
      y: scene.camera.collapsed.y,
      z: scene.camera.collapsed.z,
      scale: scene.camera.collapsed.scale,
      rotation: scene.camera.collapsed.rotation,
    }, {
      x: scene.camera.focused.x,
      y: scene.camera.focused.y,
      z: scene.camera.focused.z,
      scale: scene.camera.focused.scale,
      rotation: scene.camera.focused.rotation,
      duration: (focus.end - focus.start) * scene.duration,
      ease: 'sine.inOut',
      immediateRender: false,
    }, focus.start * scene.duration)
  }

  for (const layer of scene.layers) {
    const element = elements.get(layer.id)
    if (!element) continue
    timeline.fromTo(element, {
      x: layer.collapsed.x * scaleX,
      y: layer.collapsed.y * scaleY,
      z: layer.collapsed.z,
      scale: layer.collapsed.scale,
      rotation: layer.collapsed.rotation,
      opacity: layer.collapsed.opacity,
    }, {
      x: layer.expanded.x * scaleX,
      y: layer.expanded.y * scaleY,
      z: layer.expanded.z,
      scale: layer.expanded.scale,
      rotation: layer.expanded.rotation,
      opacity: layer.expanded.opacity,
      duration: layer.animation.duration * scene.duration,
      ease: layer.animation.ease,
      immediateRender: false,
      '--layer-lift': layer.shadow,
    }, layer.animation.start * scene.duration)
  }

  timeline.set({}, {}, scene.duration)
  return timeline
}
