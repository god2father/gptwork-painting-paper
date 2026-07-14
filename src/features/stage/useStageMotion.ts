import { onUnmounted } from 'vue'
import type { PaintingScene } from '../../types/painting'
import { buildTimeline } from '../../lib/motion/buildTimeline'

export function useStageMotion(scene: PaintingScene) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let timeline: ReturnType<typeof buildTimeline> | null = null
  let resizeObserver: ResizeObserver | null = null

  function connect(_chapter: HTMLElement, stage: HTMLElement, elements: Map<string, HTMLElement>) {
    const rebuild = () => {
      timeline?.kill()
      timeline = buildTimeline(scene, elements, stage)
      if (reducedMotion.matches) timeline.progress(1)
      else timeline.play(0)
    }
    rebuild()
    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(rebuild)
    resizeObserver.observe(stage)
  }

  onUnmounted(() => {
    timeline?.kill()
    resizeObserver?.disconnect()
  })

  return { connect }
}
