import { ref } from 'vue'
import { defineStore } from 'pinia'
import { clampProgress } from '../lib/scene/painting'

export const useInteractionStore = defineStore('interaction', () => {
  const progress = ref(0)
  const isPlaying = ref(false)
  const selectedLayerId = ref<string | null>(null)
  const isExploded = ref(false)

  function setProgress(value: number, manual = false) {
    progress.value = clampProgress(value)
    if (manual) isPlaying.value = false
  }

  function play() {
    if (progress.value >= 1) progress.value = 0
    isPlaying.value = true
  }

  function pause() {
    isPlaying.value = false
  }

  function reset() {
    progress.value = 0
    isPlaying.value = false
    selectedLayerId.value = null
    isExploded.value = false
  }

  function replay() {
    progress.value = 0
    isPlaying.value = true
  }

  function selectLayer(id: string | null) {
    selectedLayerId.value = id
  }

  function toggleLayer(id: string) {
    selectedLayerId.value = selectedLayerId.value === id ? null : id
  }

  function toggleExploded() {
    isExploded.value = !isExploded.value
  }

  return { progress, isPlaying, selectedLayerId, isExploded, setProgress, play, pause, reset, replay, selectLayer, toggleLayer, toggleExploded }
})
