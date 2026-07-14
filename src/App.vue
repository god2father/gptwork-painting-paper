<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import rawScene from '../manifests/paintings/painting-01.json'
import { validatePaintingScene } from './lib/scene/painting'
import { useInteractionStore } from './stores/interaction'
import type { PaintingScene } from './types/painting'
import ArtworkHeader from './features/gallery/ArtworkHeader.vue'
import LayeredStage from './features/stage/LayeredStage.vue'
import LayerInspector from './features/inspector/LayerInspector.vue'
import { useStageMotion } from './features/stage/useStageMotion'
import TimelineControls from './features/timeline/TimelineControls.vue'

const store = useInteractionStore()
const errors = ref<string[]>([])
const chapter = ref<HTMLElement | null>(null)
let sceneError = ''
let scene: PaintingScene | undefined
try {
  scene = validatePaintingScene(rawScene)
} catch (error) {
  sceneError = error instanceof Error ? error.message : '未知配置错误'
}

const selectedLayer = computed(() => scene?.layers.find((layer) => layer.id === store.selectedLayerId) ?? null)
const motion = scene ? useStageMotion(scene) : null

function handleReady(elements: Map<string, HTMLElement>) {
  errors.value = []
  const stage = chapter.value?.querySelector<HTMLElement>('[data-testid="stage-canvas"]')
  if (chapter.value && stage) motion?.connect(chapter.value, stage, elements)
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
  <main v-if="scene" class="page-shell">
    <section ref="chapter" class="story-chapter" aria-label="作品拆解章节">
      <div class="museum-grid">
        <ArtworkHeader :title="scene.title" :subtitle="scene.subtitle" />
        <LayeredStage :scene="scene" @ready="handleReady" @error="reportError" />
        <LayerInspector :layer="selectedLayer" :errors="errors" @clear="store.selectLayer(null)" />
        <TimelineControls />
      </div>
    </section>
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
