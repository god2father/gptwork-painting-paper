<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { resolveAssetUrl } from '../../lib/scene/painting'
import type { PaintingLayer, PaintingScene } from '../../types/painting'
import { usePaperMesh } from './usePaperMesh'

const props = defineProps<{
  scene: PaintingScene
  layer: PaintingLayer | null
}>()

const emit = defineEmits<{
  ready: [id: string | null]
  error: [id: string]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const mesh = usePaperMesh()
let mounted = false
let request = 0
let resizeObserver: ResizeObserver | null = null

async function syncLayer(layer: PaintingLayer | null) {
  const currentRequest = ++request
  emit('ready', null)
  if (!mounted || !layer) {
    mesh.clear()
    return
  }
  const ready = await mesh.select(layer, resolveAssetUrl(layer.src))
  if (currentRequest !== request) return
  if (ready) emit('ready', layer.id)
  else emit('error', layer.id)
}

function updatePointer(x: number, y: number) {
  mesh.updatePointer(x, y)
}

function loseContext(event: Event) {
  event.preventDefault()
  request += 1
  mesh.clear(true)
  emit('ready', null)
  if (props.layer) emit('error', props.layer.id)
}

onMounted(async () => {
  await nextTick()
  const stage = canvas.value?.parentElement
  if (!canvas.value || !stage) return
  mounted = mesh.mount(canvas.value, stage, props.scene)
  resizeObserver = new ResizeObserver(() => mesh.resize())
  resizeObserver.observe(stage)
  await syncLayer(props.layer)
})

watch(() => props.layer, (layer) => { void syncLayer(layer) })

onUnmounted(() => {
  resizeObserver?.disconnect()
  mesh.dispose()
})

defineExpose({ updatePointer })
</script>

<template>
  <canvas
    ref="canvas"
    class="paper-mesh-overlay"
    data-testid="paper-mesh-overlay"
    aria-hidden="true"
    @webglcontextlost="loseContext"
  />
</template>
