<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import rawScene01 from '../manifests/paintings/painting-01.json'
import rawScene02 from '../manifests/paintings/painting-02.json'
import rawScene03 from '../manifests/paintings/painting-03.json'
import { validatePaintingScene } from './lib/scene/painting'
import { useInteractionStore } from './stores/interaction'
import type { PaintingScene } from './types/painting'
import WorkspaceStage from './features/stage/WorkspaceStage.vue'
import { useStageMotion } from './features/stage/useStageMotion'
import type { PaintingSwipeDirection } from './lib/motion/paintingSwipe'

const store = useInteractionStore()
const errors = ref<string[]>([])
const assembled = ref(false)
const chapter = ref<HTMLElement | null>(null)
let sceneError = ''
const scenes: PaintingScene[] = []
try {
  scenes.push(validatePaintingScene(rawScene01), validatePaintingScene(rawScene02), validatePaintingScene(rawScene03))
} catch (error) {
  sceneError = error instanceof Error ? error.message : '未知配置错误'
}

const activeIndex = ref(0)
const openingPlayed = ref(false)
const scene = computed(() => scenes[activeIndex.value])
const motions = scenes.map((item) => useStageMotion(item))

function handleReady(elements: Map<string, HTMLElement>) {
  errors.value = []
  assembled.value = false
  const stage = chapter.value?.querySelector<HTMLElement>('[data-testid="stage-canvas"]')
  if (chapter.value && stage) motions[activeIndex.value]?.connect(chapter.value, stage, elements, () => {
    assembled.value = true
    openingPlayed.value = true
  })
}

function switchPainting(index: number) {
  if (index === activeIndex.value) return
  motions[activeIndex.value]?.disconnect()
  store.reset()
  errors.value = []
  assembled.value = false
  openingPlayed.value = true
  activeIndex.value = index
}

function switchFromSwipe(direction: PaintingSwipeDirection) {
  const step = direction === 'next' ? 1 : -1
  switchPainting((activeIndex.value + step + scenes.length) % scenes.length)
}

function reload() {
  window.location.reload()
}

function reportError(id: string) {
  if (!errors.value.includes(id)) errors.value.push(id)
}

function clearWithEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') store.selectLayer(null)
}

onMounted(() => window.addEventListener('keydown', clearWithEscape))
onUnmounted(() => window.removeEventListener('keydown', clearWithEscape))
</script>

<template>
  <main v-if="scene" class="page-shell" :class="{ 'page-shell--opening': !openingPlayed }">
    <nav
      class="painting-switcher"
      :style="{ '--archive-paper': scene.archive.paperColor, '--archive-stamp': scene.archive.stampColor, '--archive-ink': scene.archive.inkColor }"
      aria-label="切换世界名画"
      :aria-hidden="!openingPlayed"
      :inert="!openingPlayed"
    >
      <button
        v-for="(option, index) in scenes"
        :key="option.id"
        type="button"
        :aria-pressed="index === activeIndex"
        @click="switchPainting(index)"
      >
        {{ option.title }}
      </button>
    </nav>
    <Transition name="painting-swap" :duration="950">
      <section ref="chapter" :key="scene.id" class="story-chapter" aria-label="作品拆解章节">
        <WorkspaceStage :scene="scene" :assembled="assembled" :opening="!openingPlayed" @ready="handleReady" @error="reportError" @swipe="switchFromSwipe" />
      </section>
    </Transition>
  </main>
  <main v-else class="error-shell">
    <section class="error-card" role="alert">
      <p class="eyebrow">SCENE ERROR</p>
      <h1>作品配置无法读取</h1>
      <p>{{ sceneError }}</p>
      <button type="button" @click="reload">重新加载</button>
    </section>
  </main>
</template>
