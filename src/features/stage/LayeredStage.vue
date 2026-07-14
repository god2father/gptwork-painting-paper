<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useInteractionStore } from '../../stores/interaction'
import { resolveAssetUrl } from '../../lib/scene/painting'
import type { PaintingScene } from '../../types/painting'
import StageLayer from './StageLayer.vue'

const props = defineProps<{ scene: PaintingScene }>()
const emit = defineEmits<{
  ready: [elements: Map<string, HTMLElement>]
  error: [id: string]
}>()
const store = useInteractionStore()
const canvas = ref<HTMLElement | null>(null)
const failedLayers = ref<string[]>([])
const sortedLayers = computed(() => [...props.scene.layers].sort((a, b) => a.z - b.z))

function reportError(id: string) {
  if (!failedLayers.value.includes(id)) failedLayers.value.push(id)
  emit('error', id)
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
        @select="store.toggleLayer"
        @error="reportError"
      />
      <div class="artwork__grain" aria-hidden="true" />
    </div>
    <figcaption class="sr-only">
      纸片会沿轨迹逐层拼合；聚焦并点击纸片可将它浮起并查看说明。
    </figcaption>
  </figure>
</template>
