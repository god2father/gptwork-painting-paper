<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  kind?: 'work' | 'layer' | 'intro' | 'action' | 'error'
  title: string
  body?: string
  actionLabel?: string
  pressed?: boolean
  disabled?: boolean
}>(), { kind: 'work', body: '', actionLabel: '', pressed: false, disabled: false })

defineEmits<{ clear: []; action: [] }>()

const indexLabel = computed(() => ({
  work: 'COLLAGE · 01',
  layer: 'PAPER LAYER',
  intro: 'ABOUT THE WORK',
  action: 'LAYERS · 06',
  error: 'NOTICE',
})[props.kind])
</script>

<template>
  <aside class="paper-label" :class="`paper-label--${kind}`" :aria-live="kind === 'layer' ? 'polite' : undefined">
    <span class="paper-label__pin" aria-hidden="true" />
    <p class="paper-label__index">{{ indexLabel }}</p>
    <h1 v-if="kind === 'work'">{{ title }}</h1>
    <h2 v-else>{{ title }}</h2>
    <p v-if="body" class="paper-label__body">{{ body }}</p>
    <button v-if="kind === 'layer'" type="button" @click="$emit('clear')">收起纸签</button>
    <button v-else-if="actionLabel" type="button" :aria-pressed="pressed" :disabled="disabled" @click="$emit('action')">{{ actionLabel }}</button>
  </aside>
</template>
