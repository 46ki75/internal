<template>
  <div class="queue" id="queue">
    <Icon icon="mdi:academic-cap" class="icon" />
    <ElmInlineText :text="`Should Learn: ${ankiStore.getShouldLearnCount}`" />

    <Icon icon="mdi:chart-bar-stacked" class="icon" />
    <ElmInlineText :text="`Queue: ${ankiStore.ankiList.length}`" />
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText } from '@elmethis/core'
import { Icon } from '@iconify/vue'
const ankiStore = useAnkiStore()
</script>

<style scoped lang="scss">
@use '../../scss/_mixins.scss';

.icon {
  @include mixins.icon;
}

.queue {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}
</style>
