<script setup lang="ts">
withDefaults(defineProps<{
  kind?: 'work' | 'layer' | 'error'
  title: string
  body?: string
}>(), { kind: 'work', body: '' })

defineEmits<{ clear: [] }>()
</script>

<template>
  <aside class="paper-label" :class="`paper-label--${kind}`" :aria-live="kind === 'layer' ? 'polite' : undefined">
    <span class="paper-label__pin" aria-hidden="true" />
    <p class="paper-label__index">{{ kind === 'work' ? 'COLLAGE · 01' : 'PAPER LAYER' }}</p>
    <h1 v-if="kind === 'work'">{{ title }}</h1>
    <h2 v-else>{{ title }}</h2>
    <p v-if="body" class="paper-label__body">{{ body }}</p>
    <button v-if="kind === 'layer'" type="button" @click="$emit('clear')">收起纸签</button>
  </aside>
</template>
