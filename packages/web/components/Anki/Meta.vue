<template>
  <div class="queue" id="queue">
    <AcademicCapIcon class="icon" />
    <ElmInlineText :text="`Should Learn: ${ankiStore.getShouldLearnCount}`" />

    <QueueListIcon class="icon" />
    <ElmInlineText :text="`Queue: ${ankiStore.ankiList.length}`" />
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText } from '@elmethis/core'
import { AcademicCapIcon, QueueListIcon } from '@heroicons/vue/24/solid'
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
