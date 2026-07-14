<script setup lang="ts">
import type { PaintingLayer } from '../../types/painting'

defineProps<{
  layer: PaintingLayer | null
  errors: string[]
}>()

defineEmits<{ clear: [] }>()
</script>

<template>
  <aside class="inspector" aria-live="polite" aria-label="图层信息">
    <p class="eyebrow">LAYER INSPECTOR</p>
    <template v-if="layer">
      <p class="inspector__index">Z {{ String(layer.z).padStart(3, '0') }}</p>
      <h2>{{ layer.name }}</h2>
      <p>{{ layer.description }}</p>
      <button class="text-button" type="button" @click="$emit('clear')">清除选择</button>
    </template>
    <template v-else>
      <h2>纸片档案</h2>
      <p>点击画面中的纸片，查看它在构图中的作用。拆解后更容易选择细小图层。</p>
    </template>
    <p v-if="errors.length" class="inspector__error">资源载入失败：{{ errors.join('、') }}</p>
  </aside>
</template>
