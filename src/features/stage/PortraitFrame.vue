<script setup lang="ts">
import type { PaintingScene } from '../../types/painting'
import LayeredStage from './LayeredStage.vue'

defineProps<{ scene: PaintingScene; assembled: boolean }>()
defineEmits<{
  ready: [elements: Map<string, HTMLElement>]
  error: [id: string]
}>()
</script>

<template>
  <div class="portrait-frame" data-motion-frame>
    <LayeredStage :scene="scene" :assembled="assembled" @ready="$emit('ready', $event)" @error="$emit('error', $event)" />
  </div>
</template>
