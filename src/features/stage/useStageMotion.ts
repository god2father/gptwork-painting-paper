import { onUnmounted, watch } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useInteractionStore } from '../../stores/interaction'
import { buildTimeline } from '../../lib/motion/buildTimeline'
import type { PaintingScene } from '../../types/painting'

gsap.registerPlugin(ScrollTrigger)

export function useStageMotion(scene: PaintingScene) {
  const store = useInteractionStore()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const finePointer = window.matchMedia('(pointer: fine)')
  let timeline: gsap.core.Timeline | null = null
  let trigger: ScrollTrigger | null = null
  let resizeObserver: ResizeObserver | null = null
  let animationFrame = 0
  let previousTime = 0
  let disconnectPointer: (() => void) | null = null

  function applyProgress() {
    const value = reducedMotion.matches ? (store.progress < 0.5 ? 0 : 1) : store.progress
    timeline?.progress(value)
  }

  function runFrame(time: number) {
    if (!store.isPlaying) return
    if (previousTime === 0) previousTime = time
    const next = store.progress + (time - previousTime) / (scene.duration * 1000)
    previousTime = time
    store.setProgress(next)
    if (next >= 1) {
      store.pause()
      return
    }
    animationFrame = requestAnimationFrame(runFrame)
  }

  const stopProgressWatch = watch(() => store.progress, applyProgress)
  const stopPlayingWatch = watch(() => store.isPlaying, (playing) => {
    cancelAnimationFrame(animationFrame)
    previousTime = 0
    if (playing) animationFrame = requestAnimationFrame(runFrame)
  })

  function connect(chapter: HTMLElement, stage: HTMLElement, elements: Map<string, HTMLElement>) {
    timeline?.kill()
    trigger?.kill()
    resizeObserver?.disconnect()
    disconnectPointer?.()

    const rebuild = () => {
      timeline?.kill()
      timeline = buildTimeline(scene, elements, stage)
      applyProgress()
    }
    rebuild()
    resizeObserver = new ResizeObserver(rebuild)
    resizeObserver.observe(stage)

    trigger = ScrollTrigger.create({
      trigger: chapter,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: ({ progress }) => {
        if (!store.isPlaying) store.setProgress(progress)
      },
    })

    const pauseForUser = () => store.pause()
    window.addEventListener('wheel', pauseForUser, { passive: true })
    window.addEventListener('touchmove', pauseForUser, { passive: true })

    const resetParallax = () => {
      elements.forEach((element) => {
        const inner = element.querySelector<HTMLElement>('.stage-layer__parallax')
        inner?.style.setProperty('--parallax-x', '0px')
        inner?.style.setProperty('--parallax-y', '0px')
      })
    }
    const moveParallax = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches) return
      const rect = stage.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
      scene.layers.forEach((layer) => {
        const inner = elements.get(layer.id)?.querySelector<HTMLElement>('.stage-layer__parallax')
        inner?.style.setProperty('--parallax-x', `${x * layer.parallax.x}px`)
        inner?.style.setProperty('--parallax-y', `${y * layer.parallax.y}px`)
      })
    }
    stage.addEventListener('pointermove', moveParallax)
    stage.addEventListener('pointerleave', resetParallax)

    disconnectPointer = () => {
      window.removeEventListener('wheel', pauseForUser)
      window.removeEventListener('touchmove', pauseForUser)
      stage.removeEventListener('pointermove', moveParallax)
      stage.removeEventListener('pointerleave', resetParallax)
    }
  }

  const onMotionPreference = () => applyProgress()
  reducedMotion.addEventListener('change', onMotionPreference)

  onUnmounted(() => {
    stopProgressWatch()
    stopPlayingWatch()
    cancelAnimationFrame(animationFrame)
    timeline?.kill()
    trigger?.kill()
    resizeObserver?.disconnect()
    disconnectPointer?.()
    reducedMotion.removeEventListener('change', onMotionPreference)
  })

  return { connect }
}
