<script setup lang="ts">
import { computed } from 'vue'
import { useInteractionStore } from '../../stores/interaction'
import { resolveAssetUrl } from '../../lib/scene/painting'
import type { PaintingScene } from '../../types/painting'
import PaperLabel from './PaperLabel.vue'
import PortraitFrame from './PortraitFrame.vue'

const props = defineProps<{ scene: PaintingScene; assembled: boolean }>()
const emit = defineEmits<{
  ready: [elements: Map<string, HTMLElement>]
  error: [id: string]
}>()
const store = useInteractionStore()
const selectedLayer = computed(() => props.scene.layers.find((layer) => layer.id === store.selectedLayerId) ?? null)

function clearFromBackdrop(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.stage-layer, .paper-label')) store.selectLayer(null)
}
</script>

<template>
  <section class="atelier" :aria-label="`${scene.title}纸艺工作台`" @click="clearFromBackdrop">
    <img
      class="atelier__workspace"
      :src="resolveAssetUrl(scene.environment.workspace.src)"
      :alt="scene.environment.workspace.alt"
      draggable="false"
      @error="emit('error', 'workspace')"
    />
    <div class="atelier__shade" aria-hidden="true" />
    <div class="atelier__camera" data-motion-camera>
      <div class="atelier__paper-bed">
        <PortraitFrame :scene="scene" :assembled="assembled" @ready="emit('ready', $event)" @error="emit('error', $event)" />
      </div>
    </div>
    <PaperLabel class="atelier__work-label" kind="work" :title="scene.title" :body="scene.subtitle" />
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
      <PaperLabel
        v-if="selectedLayer"
        class="atelier__layer-label"
        kind="layer"
        :title="selectedLayer.name"
        :body="selectedLayer.description"
        @clear="store.selectLayer(null)"
      />
    </Transition>
    <div class="atelier__wipe atelier__wipe--top" data-motion-wipe-top aria-hidden="true" />
    <div class="atelier__wipe atelier__wipe--bottom" data-motion-wipe-bottom aria-hidden="true" />
  </section>
</template>
