<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { resolveAssetUrl } from '../../lib/scene/painting'
import type { PaintingScene } from '../../types/painting'
import { usePortraitRelief } from './usePortraitRelief'

const props = defineProps<{
  scene: PaintingScene
  active: boolean
}>()

const emit = defineEmits<{
  ready: [ready: boolean]
  error: [id: string]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const loaded = ref(false)
const relief = usePortraitRelief()
let resizeObserver: ResizeObserver | null = null

function updatePointer(x: number, y: number) {
  relief.updatePointer(x, y)
}

function loseContext(event: Event) {
  event.preventDefault()
  loaded.value = false
  relief.setActive(false)
  emit('ready', false)
  emit('error', 'relief')
}

watch(() => props.active, (active) => relief.setActive(active && loaded.value))

onMounted(async () => {
  await nextTick()
  const stage = canvas.value?.parentElement
  if (!canvas.value || !stage || !relief.mount(canvas.value, stage, props.scene)) {
    emit('ready', false)
    emit('error', 'relief')
    return
  }
  resizeObserver = new ResizeObserver(() => relief.resize())
  resizeObserver.observe(stage)
  const breezeLayer = props.scene.layers.find((layer) => layer.ambient?.kind === 'breeze' && layer.ambient.region)
  loaded.value = await relief.load(
    resolveAssetUrl(props.scene.relief.colorMap),
    resolveAssetUrl(props.scene.relief.depthMap),
    breezeLayer ? resolveAssetUrl(breezeLayer.src) : undefined,
  )
  emit('ready', loaded.value)
  if (!loaded.value) emit('error', 'relief')
  relief.setActive(props.active && loaded.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  relief.dispose()
})

defineExpose({ updatePointer })
</script>

<template>
  <canvas
    ref="canvas"
    class="portrait-relief-overlay"
    :class="{ 'portrait-relief-overlay--active': active && loaded }"
    data-testid="portrait-relief-overlay"
    :data-relief-active="active"
    aria-hidden="true"
    @webglcontextlost="loseContext"
  />
</template>
