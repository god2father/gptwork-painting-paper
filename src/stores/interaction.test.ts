import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useInteractionStore } from './interaction'

beforeEach(() => setActivePinia(createPinia()))

describe('interaction store', () => {
  it('clamps progress and pauses for manual input', () => {
    const store = useInteractionStore()
    store.play()
    store.setProgress(2, true)
    expect(store.progress).toBe(1)
    expect(store.isPlaying).toBe(false)
  })

  it('resets progress and selection', () => {
    const store = useInteractionStore()
    store.setProgress(0.7)
    store.selectLayer('layer-001-scarf-tail')
    store.reset()
    expect(store.progress).toBe(0)
    expect(store.selectedLayerId).toBeNull()
  })

  it('replays from the beginning', () => {
    const store = useInteractionStore()
    store.setProgress(0.8)
    store.replay()
    expect(store.progress).toBe(0)
    expect(store.isPlaying).toBe(true)
  })

  it('toggles a selected paper layer', () => {
    const store = useInteractionStore()
    store.toggleLayer('layer-006-pearl-highlight')
    expect(store.selectedLayerId).toBe('layer-006-pearl-highlight')
    store.toggleLayer('layer-006-pearl-highlight')
    expect(store.selectedLayerId).toBeNull()
  })

  it('toggles and resets the exploded layer view', () => {
    const store = useInteractionStore()
    store.toggleExploded()
    expect(store.isExploded).toBe(true)
    store.reset()
    expect(store.isExploded).toBe(false)
  })

  it('keeps an approved orientation session while changing paintings', () => {
    const store = useInteractionStore()
    store.enableOrientation()
    store.reset()
    expect(store.orientationEnabled).toBe(true)
  })
})
