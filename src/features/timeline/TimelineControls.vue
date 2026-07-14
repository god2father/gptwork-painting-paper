<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useInteractionStore } from '../../stores/interaction'

const store = useInteractionStore()
const reducedMotion = ref(false)
let media: MediaQueryList | null = null
const percent = computed(() => `${Math.round(store.progress * 100)}%`)

function togglePlayback() {
  if (reducedMotion.value) {
    store.setProgress(store.progress < 0.5 ? 1 : 0, true)
  } else if (store.isPlaying) {
    store.pause()
  } else {
    store.play()
  }
}

function updateProgress(event: Event) {
  store.setProgress(Number((event.target as HTMLInputElement).value), true)
}

function updateMotionPreference() {
  reducedMotion.value = media?.matches ?? false
}

onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotionPreference()
  media.addEventListener('change', updateMotionPreference)
})

onUnmounted(() => media?.removeEventListener('change', updateMotionPreference))
</script>

<template>
  <nav class="timeline-controls" aria-label="作品拆解控制">
    <button
      class="timeline-controls__play"
      type="button"
      :aria-label="store.isPlaying ? '暂停拆解动画' : '播放拆解动画'"
      :aria-pressed="store.isPlaying"
      @click="togglePlayback"
    >
      {{ store.isPlaying ? 'Ⅱ' : '▶' }}
    </button>
    <label class="timeline-controls__range">
      <span class="sr-only">拆解进度</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        :value="store.progress"
        aria-label="拆解进度"
        @input="updateProgress"
      />
      <output aria-live="polite">{{ percent }}</output>
    </label>
    <details class="timeline-controls__more">
      <summary aria-label="更多控制">•••</summary>
      <div class="timeline-controls__menu">
        <button type="button" aria-label="重新播放拆解动画" @click="store.replay">重新播放</button>
        <button type="button" aria-label="还原完整作品" @click="store.reset">还原作品</button>
      </div>
    </details>
  </nav>
</template>
