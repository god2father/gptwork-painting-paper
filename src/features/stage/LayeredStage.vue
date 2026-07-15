<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useInteractionStore } from '../../stores/interaction'
import { resolveAssetUrl } from '../../lib/scene/painting'
import type { PaintingScene } from '../../types/painting'
import StageLayer from './StageLayer.vue'
import PortraitReliefOverlay from './PortraitReliefOverlay.vue'

const props = defineProps<{ scene: PaintingScene; assembled: boolean }>()
const emit = defineEmits<{
  ready: [elements: Map<string, HTMLElement>]
  error: [id: string]
}>()
const store = useInteractionStore()
const canvas = ref<HTMLElement | null>(null)
const failedLayers = ref<string[]>([])
const layerElements = new Map<string, HTMLElement>()
const sortedLayers = computed(() => [...props.scene.layers].sort((a, b) => a.z - b.z))
const reliefOverlay = ref<InstanceType<typeof PortraitReliefOverlay> | null>(null)
const reliefReady = ref(false)
const reliefActive = computed(() => props.assembled && reliefReady.value)
const highlightStyle = computed(() => props.scene.ambientHighlight ? {
  left: `${props.scene.ambientHighlight.x}%`,
  top: `${props.scene.ambientHighlight.y}%`,
  width: `${props.scene.ambientHighlight.size}%`,
  '--highlight-duration': `${props.scene.ambientHighlight.duration}s`,
  '--highlight-delay': `${props.scene.ambientHighlight.delay}s`,
} : {})

function reportError(id: string) {
  if (!failedLayers.value.includes(id)) failedLayers.value.push(id)
  emit('error', id)
}

function updatePointer(event: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  const x = (event.clientX - rect.left) / rect.width * 2 - 1
  const y = (event.clientY - rect.top) / rect.height * 2 - 1
  updateLayerParallax(x, y)
  reliefOverlay.value?.updatePointer(x, y)
}

function relaxPointer() {
  updateLayerParallax(0, 0)
  reliefOverlay.value?.updatePointer(0, 0)
}

function updateLayerParallax(x: number, y: number) {
  props.scene.layers.forEach((layer) => {
    const element = layerElements.get(layer.id)
    element?.style.setProperty('--parallax-x', `${x * layer.parallax.x}px`)
    element?.style.setProperty('--parallax-y', `${y * layer.parallax.y}px`)
  })
  const highlight = props.scene.ambientHighlight
  canvas.value?.style.setProperty('--highlight-parallax-x', `${x * (highlight?.parallax.x ?? 0)}px`)
  canvas.value?.style.setProperty('--highlight-parallax-y', `${y * (highlight?.parallax.y ?? 0)}px`)
}

onMounted(async () => {
  await nextTick()
  canvas.value?.querySelectorAll<HTMLElement>('[data-layer-id]').forEach((element) => {
    const id = element.dataset.layerId
    if (id) layerElements.set(id, element)
  })
  emit('ready', layerElements)
})

defineExpose({ canvas, failedLayers })
</script>

<template>
  <figure class="artwork" :aria-label="`${scene.title}互动分层舞台`">
    <div
      ref="canvas"
      class="artwork__canvas"
      :class="{ 'artwork__canvas--relief-active': reliefActive }"
      :style="{ aspectRatio: `${scene.canvas.width} / ${scene.canvas.height}`, '--relief-transition': `${scene.relief.transitionDuration}s` }"
      data-testid="stage-canvas"
      @pointermove="updatePointer"
      @pointerleave="relaxPointer"
    >
      <img
        class="artwork__background"
        :src="resolveAssetUrl(scene.background.src)"
        :alt="scene.background.alt"
        draggable="false"
        @error="reportError('background')"
      />
      <StageLayer
        v-for="layer in sortedLayers"
        :key="layer.id"
        :layer="layer"
        :canvas="scene.canvas"
        :selected="store.selectedLayerId === layer.id"
        :exploded="store.isExploded"
        :ambient-active="reliefActive && !store.isExploded && !store.selectedLayerId"
        @select="store.toggleLayer"
        @error="reportError"
      />
      <PortraitReliefOverlay
        ref="reliefOverlay"
        :scene="scene"
        :active="assembled && !store.isExploded"
        @ready="reliefReady = $event"
        @error="reportError"
      />
      <span
        v-if="scene.ambientHighlight"
        class="artwork__ambient-highlight"
        :class="{ 'artwork__ambient-highlight--active': reliefActive && !store.isExploded && !store.selectedLayerId }"
        :style="highlightStyle"
        aria-hidden="true"
      />
      <div class="artwork__grain" aria-hidden="true" />
    </div>
    <figcaption class="sr-only">
      纸片会沿轨迹逐层拼合成画，完成后转为可随指针改变光影的立体浮雕；点击画面区域可查看说明。
    </figcaption>
  </figure>
</template>
