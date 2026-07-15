<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useInteractionStore } from '../../stores/interaction'
import { resolveAssetUrl } from '../../lib/scene/painting'
import { orientationToPointer, type OrientationOrigin } from '../../lib/motion/deviceOrientation'
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
const orientationSupported = ref(false)
const orientationStatus = ref<'idle' | 'requesting' | 'active' | 'denied'>('idle')
const orientationLabel = computed(() => orientationStatus.value === 'active'
  ? '体感已开启 · 点按校准'
  : orientationStatus.value === 'requesting'
    ? '正在请求体感权限…'
    : orientationStatus.value === 'denied'
      ? '体感未授权 · 点击重试'
      : '开启体感交互')
let orientationOrigin: OrientationOrigin | null = null
let orientationListening = false
let orientationFrame = 0
let orientationX = 0
let orientationY = 0
let orientationTargetX = 0
let orientationTargetY = 0
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
  if (store.orientationEnabled) return
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  const x = (event.clientX - rect.left) / rect.width * 2 - 1
  const y = (event.clientY - rect.top) / rect.height * 2 - 1
  applyPointer(x, y)
}

function relaxPointer() {
  if (!store.orientationEnabled) applyPointer(0, 0)
}

function applyPointer(x: number, y: number) {
  updateLayerParallax(x, y)
  reliefOverlay.value?.updatePointer(x, y)
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

function animateOrientation() {
  orientationX += (orientationTargetX - orientationX) * 0.14
  orientationY += (orientationTargetY - orientationY) * 0.14
  applyPointer(orientationX, orientationY)
  if (Math.abs(orientationTargetX - orientationX) > 0.002 || Math.abs(orientationTargetY - orientationY) > 0.002) {
    orientationFrame = requestAnimationFrame(animateOrientation)
  } else {
    orientationFrame = 0
  }
}

function scheduleOrientation(x: number, y: number) {
  orientationTargetX = x
  orientationTargetY = y
  if (!orientationFrame) orientationFrame = requestAnimationFrame(animateOrientation)
}

function handleOrientation(event: DeviceOrientationEvent) {
  if (event.beta === null || event.gamma === null) return
  const angle = screen.orientation?.angle ?? 0
  if (!orientationOrigin || orientationOrigin.angle !== angle) {
    orientationOrigin = { beta: event.beta, gamma: event.gamma, angle }
    scheduleOrientation(0, 0)
    return
  }
  const point = orientationToPointer(event.beta, event.gamma, orientationOrigin)
  scheduleOrientation(point.x, point.y)
}

function startOrientation() {
  if (orientationListening) return
  window.addEventListener('deviceorientation', handleOrientation)
  orientationListening = true
  orientationStatus.value = 'active'
}

async function enableOrientation() {
  if (orientationStatus.value === 'active') {
    orientationOrigin = null
    scheduleOrientation(0, 0)
    return
  }
  orientationStatus.value = 'requesting'
  try {
    const orientationEvent = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    const permission = typeof orientationEvent.requestPermission === 'function'
      ? await orientationEvent.requestPermission()
      : 'granted'
    if (permission !== 'granted') {
      orientationStatus.value = 'denied'
      return
    }
    store.enableOrientation()
    startOrientation()
  } catch {
    orientationStatus.value = 'denied'
  }
}

onMounted(async () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  orientationSupported.value = 'DeviceOrientationEvent' in window
    && window.matchMedia('(pointer: coarse)').matches
    && !reducedMotion
  if (orientationSupported.value && store.orientationEnabled) startOrientation()
  await nextTick()
  canvas.value?.querySelectorAll<HTMLElement>('[data-layer-id]').forEach((element) => {
    const id = element.dataset.layerId
    if (id) layerElements.set(id, element)
  })
  emit('ready', layerElements)
})

onUnmounted(() => {
  if (orientationListening) window.removeEventListener('deviceorientation', handleOrientation)
  if (orientationFrame) cancelAnimationFrame(orientationFrame)
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
    <button
      v-if="orientationSupported && assembled"
      class="artwork__motion-control"
      type="button"
      :aria-pressed="orientationStatus === 'active'"
      :disabled="orientationStatus === 'requesting'"
      @click.stop="enableOrientation"
    >
      <span aria-hidden="true">◉</span>
      {{ orientationLabel }}
    </button>
    <figcaption class="sr-only">
      纸片会沿轨迹逐层拼合成画，完成后转为可随指针或手机倾斜改变光影的立体浮雕；点击画面区域可查看说明。
    </figcaption>
  </figure>
</template>
