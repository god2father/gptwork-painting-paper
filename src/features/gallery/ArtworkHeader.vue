<script setup lang="ts">
defineProps<{ title: string; subtitle: string }>()
</script>

<template>
  <header class="artwork-header">
    <p class="eyebrow">PAINTING · 01</p>
    <h1>{{ title }}</h1>
    <p class="artwork-header__subtitle">{{ subtitle }}</p>
    <p class="artwork-header__hint">向下滚动，逐层看见一幅画如何成立。</p>
  </header>
</template>
