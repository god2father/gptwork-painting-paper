<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useInteractionStore } from '../../stores/interaction'
import { resolveAssetUrl } from '../../lib/scene/painting'
import type { PaintingScene } from '../../types/painting'
import StageLayer from './StageLayer.vue'
import PaperMeshOverlay from './PaperMeshOverlay.vue'

const props = defineProps<{ scene: PaintingScene }>()
const emit = defineEmits<{
  ready: [elements: Map<string, HTMLElement>]
  error: [id: string]
}>()
const store = useInteractionStore()
const canvas = ref<HTMLElement | null>(null)
const failedLayers = ref<string[]>([])
const sortedLayers = computed(() => [...props.scene.layers].sort((a, b) => a.z - b.z))
const selectedLayer = computed(() => props.scene.layers.find((layer) => layer.id === store.selectedLayerId) ?? null)
const meshOverlay = ref<InstanceType<typeof PaperMeshOverlay> | null>(null)
const meshReadyId = ref<string | null>(null)

function reportError(id: string) {
  if (!failedLayers.value.includes(id)) failedLayers.value.push(id)
  emit('error', id)
}

function updatePointer(event: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  const x = (event.clientX - rect.left) / rect.width * 2 - 1
  const y = (event.clientY - rect.top) / rect.height * 2 - 1
  meshOverlay.value?.updatePointer(x, y)
}

function relaxPointer() {
  meshOverlay.value?.updatePointer(0, 1)
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
      :style="{ aspectRatio: `${scene.canvas.width} / ${scene.canvas.height}` }"
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
        :mesh-active="meshReadyId === layer.id"
        @select="store.toggleLayer"
        @error="reportError"
      />
      <PaperMeshOverlay
        ref="meshOverlay"
        :scene="scene"
        :layer="selectedLayer"
        @ready="meshReadyId = $event"
        @error="reportError"
      />
      <div class="artwork__grain" aria-hidden="true" />
    </div>
    <figcaption class="sr-only">
      纸片会沿轨迹逐层拼合；聚焦并点击纸片可将它浮起并查看说明。
    </figcaption>
  </figure>
</template>
