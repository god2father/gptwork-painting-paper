<script setup lang="ts">
import { computed } from 'vue'
import { resolveAssetUrl } from '../../lib/scene/painting'
import type { PaintingLayer, Size } from '../../types/painting'

const props = defineProps<{
  layer: PaintingLayer
  canvas: Size
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  error: [id: string]
}>()

const buttonStyle = computed(() => ({
  left: `${props.layer.bounds.x / props.canvas.width * 100}%`,
  top: `${props.layer.bounds.y / props.canvas.height * 100}%`,
  width: `${props.layer.bounds.width / props.canvas.width * 100}%`,
  height: `${props.layer.bounds.height / props.canvas.height * 100}%`,
  zIndex: props.layer.z,
  '--layer-shadow': props.layer.shadow,
  '--select-z': `${props.layer.selection3d.z}px`,
  '--select-rotate-x': `${props.layer.selection3d.rotateX}deg`,
  '--select-rotate-y': `${props.layer.selection3d.rotateY}deg`,
  '--select-scale': props.layer.selection3d.scale,
  '--select-base-z': `${props.layer.selection3d.z * 0.25}px`,
  '--fold-left-z': `${props.layer.selection3d.z * 0.62}px`,
  '--fold-crease-z': `${props.layer.selection3d.z * 0.62 + 3}px`,
  '--fold-angle': `${props.layer.selection3d.foldAngle}deg`,
  '--fold-angle-negative': `${-props.layer.selection3d.foldAngle}deg`,
}))

const imageStyle = computed(() => ({
  left: `${-props.layer.bounds.x / props.layer.bounds.width * 100}%`,
  top: `${-props.layer.bounds.y / props.layer.bounds.height * 100}%`,
  width: `${props.canvas.width / props.layer.bounds.width * 100}%`,
  height: `${props.canvas.height / props.layer.bounds.height * 100}%`,
}))
</script>

<template>
  <button
    class="stage-layer"
    :class="{ 'stage-layer--selected': selected }"
    :style="buttonStyle"
    type="button"
    :aria-label="`查看图层：${layer.name}`"
    :aria-pressed="selected"
    :data-layer-id="layer.id"
    data-motion-layer
    @click="emit('select', layer.id)"
  >
    <span class="stage-layer__parallax" aria-hidden="true">
      <span class="stage-layer__facet stage-layer__facet--left">
        <img class="stage-layer__image" :src="resolveAssetUrl(layer.src)" alt="" :style="imageStyle" draggable="false" @error="emit('error', layer.id)" />
      </span>
      <span class="stage-layer__facet stage-layer__facet--right">
        <img class="stage-layer__image" :src="resolveAssetUrl(layer.src)" alt="" :style="imageStyle" draggable="false" @error="emit('error', layer.id)" />
      </span>
      <span class="stage-layer__crease">
        <img class="stage-layer__image" :src="resolveAssetUrl(layer.src)" alt="" :style="imageStyle" draggable="false" />
      </span>
    </span>
  </button>
</template>
