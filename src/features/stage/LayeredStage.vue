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
const sortedLayers = computed(() => [...props.scene.layers].sort((a, b) => a.z - b.z))
const reliefOverlay = ref<InstanceType<typeof PortraitReliefOverlay> | null>(null)
const reliefReady = ref(false)
const reliefActive = computed(() => props.assembled && reliefReady.value)

function reportError(id: string) {
  if (!failedLayers.value.includes(id)) failedLayers.value.push(id)
  emit('error', id)
}

function updatePointer(event: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  const x = (event.clientX - rect.left) / rect.width * 2 - 1
  const y = (event.clientY - rect.top) / rect.height * 2 - 1
  reliefOverlay.value?.updatePointer(x, y)
}

function relaxPointer() {
  reliefOverlay.value?.updatePointer(0, 0)
}

onMounted(async () => {
  await nextTick()
  const elements = new Map<string, HTMLElement>()
  canvas.value?.querySelectorAll<HTMLElement>('[data-layer-id]').forEach((element) => {
    const id = element.dataset.layerId
    if (id) elements.set(id, element)
  })
  emit('ready', elements)
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
      <div class="artwork__grain" aria-hidden="true" />
    </div>
    <figcaption class="sr-only">
      纸片会沿轨迹逐层拼合成画，完成后转为可随指针改变光影的立体浮雕；点击画面区域可查看说明。
    </figcaption>
  </figure>
</template>
