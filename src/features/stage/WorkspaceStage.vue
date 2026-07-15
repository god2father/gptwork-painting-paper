<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useInteractionStore } from '../../stores/interaction'
import { resolveAssetUrl } from '../../lib/scene/painting'
import { paintingSwipeDirection, type PaintingSwipeDirection, type SwipePoint } from '../../lib/motion/paintingSwipe'
import type { PaintingScene } from '../../types/painting'
import PaperLabel from './PaperLabel.vue'
import PortraitFrame from './PortraitFrame.vue'

const props = withDefaults(defineProps<{ scene: PaintingScene; assembled: boolean; opening?: boolean }>(), { opening: false })
const emit = defineEmits<{
  ready: [elements: Map<string, HTMLElement>]
  error: [id: string]
  swipe: [direction: PaintingSwipeDirection]
}>()
const store = useInteractionStore()
const selectedLayer = computed(() => props.scene.layers.find((layer) => layer.id === store.selectedLayerId) ?? null)
const atelier = ref<HTMLElement | null>(null)
const layerNote = ref<HTMLElement | null>(null)
const connector = ref<{ path: string; x1: number; y1: number; x2: number; y2: number } | null>(null)
const archiveStyle = computed(() => ({
  '--archive-paper': props.scene.archive.paperColor,
  '--archive-stamp': props.scene.archive.stampColor,
  '--archive-ink': props.scene.archive.inkColor,
}))
let connectorFrame = 0
let settleTimer = 0
let resizeObserver: ResizeObserver | null = null
let swipePointerId: number | null = null
let swipeStart: SwipePoint | null = null
let suppressSwipeClick = false

function clearFromBackdrop(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.stage-layer, .paper-label')) store.selectLayer(null)
}

function updateConnector() {
  const root = atelier.value
  const note = layerNote.value
  const id = store.selectedLayerId
  if (!root || !note || !id) {
    connector.value = null
    return
  }
  const layer = [...root.querySelectorAll<HTMLElement>('[data-layer-id]')].find((item) => item.dataset.layerId === id)
  if (!layer) return
  const rootRect = root.getBoundingClientRect()
  const layerRect = layer.getBoundingClientRect()
  const noteRect = note.getBoundingClientRect()
  const x1 = layerRect.left + layerRect.width / 2 - rootRect.left
  const y1 = layerRect.top + layerRect.height / 2 - rootRect.top
  const noteOnRight = noteRect.left > layerRect.left
  const x2 = (noteOnRight ? noteRect.left : noteRect.right) - rootRect.left
  const y2 = noteRect.top + Math.min(72, noteRect.height / 2) - rootRect.top
  const bend = x1 + (x2 - x1) * .55
  connector.value = { path: `M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 }
}

function scheduleConnector() {
  cancelAnimationFrame(connectorFrame)
  connectorFrame = requestAnimationFrame(updateConnector)
}

function startSwipe(event: PointerEvent) {
  if (!props.assembled || event.pointerType !== 'touch') return
  swipePointerId = event.pointerId
  swipeStart = { x: event.clientX, y: event.clientY, time: event.timeStamp }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function finishSwipe(event: PointerEvent) {
  if (event.pointerId !== swipePointerId || !swipeStart) return
  const target = event.currentTarget as HTMLElement
  const direction = paintingSwipeDirection(
    swipeStart,
    { x: event.clientX, y: event.clientY, time: event.timeStamp },
    target.clientHeight,
  )
  target.releasePointerCapture(event.pointerId)
  swipePointerId = null
  swipeStart = null
  if (!direction) return
  suppressSwipeClick = true
  emit('swipe', direction)
}

function cancelSwipe() {
  swipePointerId = null
  swipeStart = null
}

function blockSwipeClick(event: MouseEvent) {
  if (!suppressSwipeClick) return
  suppressSwipeClick = false
  event.preventDefault()
  event.stopPropagation()
}

watch(() => store.selectedLayerId, async (id) => {
  clearTimeout(settleTimer)
  if (!id) {
    connector.value = null
    return
  }
  await nextTick()
  scheduleConnector()
  settleTimer = window.setTimeout(scheduleConnector, 650)
})

onMounted(() => {
  if (!atelier.value) return
  resizeObserver = new ResizeObserver(scheduleConnector)
  resizeObserver.observe(atelier.value)
})

onUnmounted(() => {
  cancelAnimationFrame(connectorFrame)
  clearTimeout(settleTimer)
  resizeObserver?.disconnect()
})
</script>

<template>
  <section ref="atelier" class="atelier" :style="archiveStyle" :data-opening="opening" :aria-label="`${scene.title}纸艺工作台`" @click="clearFromBackdrop" @pointermove="scheduleConnector">
    <img
      class="atelier__workspace"
      :src="resolveAssetUrl(scene.environment.workspace.src)"
      :alt="scene.environment.workspace.alt"
      draggable="false"
      @error="emit('error', 'workspace')"
    />
    <div class="atelier__shade" aria-hidden="true" />
    <div
      class="atelier__painting-transition"
      @pointerdown="startSwipe"
      @pointerup="finishSwipe"
      @pointercancel="cancelSwipe"
      @click.capture="blockSwipeClick"
    >
      <div class="atelier__camera" data-motion-camera>
        <div class="atelier__paper-bed" :style="{ '--art-ratio': scene.canvas.width / scene.canvas.height }">
          <PortraitFrame :scene="scene" :assembled="assembled" @ready="emit('ready', $event)" @error="emit('error', $event)" />
        </div>
      </div>
    </div>
    <PaperLabel class="atelier__work-label" kind="work" :title="scene.title" :body="scene.subtitle" :archive="scene.archive" />
    <PaperLabel class="atelier__intro-label" kind="intro" title="作品介绍" :body="scene.introduction" />
    <PaperLabel
      class="atelier__explode-label"
      kind="action"
      title="拆解画面"
      body="让所有可点击纸片沿各自的轨迹同时离开原位。"
      :action-label="store.isExploded ? '收拢全部图层' : '炸开全部图层'"
      :pressed="store.isExploded"
      :disabled="!assembled"
      @action="store.toggleExploded"
    />
    <Transition name="paper-note">
      <div v-if="selectedLayer" ref="layerNote" class="atelier__layer-note">
        <PaperLabel
          class="atelier__layer-label"
          kind="layer"
          :title="selectedLayer.name"
          :body="selectedLayer.description"
          @clear="store.selectLayer(null)"
        />
      </div>
    </Transition>
    <svg v-if="connector" class="atelier__connector" aria-hidden="true">
      <path class="atelier__connector-shadow" :d="connector.path" />
      <path class="atelier__connector-thread" :d="connector.path" />
      <path class="atelier__connector-braid" :d="connector.path" />
      <circle :cx="connector.x1" :cy="connector.y1" r="3" />
      <circle :cx="connector.x2" :cy="connector.y2" r="4" />
    </svg>
    <div class="atelier__wipe atelier__wipe--top atelier__wipe--static" data-motion-wipe-top-static aria-hidden="true"><span><b class="atelier__cut-mark">紙</b></span></div>
    <div class="atelier__wipe atelier__wipe--bottom atelier__wipe--static" data-motion-wipe-bottom-static aria-hidden="true"><span><b class="atelier__cut-mark">紙</b></span></div>
    <div class="atelier__wipe atelier__wipe--top atelier__wipe--cut" data-motion-wipe-top aria-hidden="true"><span><b class="atelier__cut-mark">紙</b></span></div>
    <div class="atelier__wipe atelier__wipe--bottom atelier__wipe--cut" data-motion-wipe-bottom aria-hidden="true"><span><b class="atelier__cut-mark">紙</b></span></div>
    <div class="atelier__paper-knife" data-motion-paper-knife aria-hidden="true" />
  </section>
</template>
