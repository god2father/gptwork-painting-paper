<script setup lang="ts">
import { computed } from 'vue'
import type { ArchiveConfig } from '../../types/painting'

const props = withDefaults(defineProps<{
  kind?: 'work' | 'layer' | 'intro' | 'action' | 'error'
  title: string
  body?: string
  actionLabel?: string
  pressed?: boolean
  disabled?: boolean
  archive?: ArchiveConfig
}>(), { kind: 'work', body: '', actionLabel: '', pressed: false, disabled: false })

defineEmits<{ clear: []; action: [] }>()

const indexLabel = computed(() => ({
  work: 'CURATORIAL RECORD',
  layer: 'CURATOR’S NOTE',
  intro: 'ABOUT THE WORK',
  action: 'LAYER CONTROL',
  error: 'NOTICE',
})[props.kind])
</script>

<template>
  <aside class="paper-label" :class="`paper-label--${kind}`" :aria-live="kind === 'layer' ? 'polite' : undefined">
    <details v-if="kind === 'intro'" class="paper-label__details">
      <summary>
        <span class="paper-label__index">{{ indexLabel }}</span>
        <strong>{{ title }}</strong>
        <span class="paper-label__summary-hint">展开档案</span>
      </summary>
      <div class="paper-label__fold">
        <span class="paper-label__pin" aria-hidden="true" />
        <p v-if="body" class="paper-label__body">{{ body }}</p>
        <small>点击标题可将档案重新折回画框侧边。</small>
      </div>
    </details>
    <template v-else>
      <span class="paper-label__pin" aria-hidden="true" />
      <p class="paper-label__index">{{ indexLabel }}</p>
      <h1 v-if="kind === 'work'">{{ title }}</h1>
      <h2 v-else>{{ title }}</h2>
      <p v-if="kind === 'work' && archive" class="paper-label__english-title">{{ archive.englishTitle }}</p>
      <p v-if="body" class="paper-label__body">{{ body }}</p>
      <dl v-if="kind === 'work' && archive" class="paper-label__metadata">
        <div><dt>ARTIST</dt><dd>{{ archive.artist }}</dd></div>
        <div><dt>DATE</dt><dd>{{ archive.year }}</dd></div>
      </dl>
      <p v-if="kind === 'work' && archive" class="paper-label__stamp">{{ archive.accession }}</p>
      <button v-if="kind === 'layer'" class="paper-label__close" type="button" @click="$emit('clear')">收起批注</button>
      <div v-else-if="actionLabel" class="paper-label__seal-control">
        <button
          class="paper-label__seal"
          type="button"
          :aria-label="actionLabel"
          :aria-pressed="pressed"
          :disabled="disabled"
          @click="$emit('action')"
        >
          <span aria-hidden="true">{{ pressed ? '合' : '拆' }}</span>
        </button>
        <span>{{ actionLabel }}</span>
      </div>
    </template>
  </aside>
</template>
