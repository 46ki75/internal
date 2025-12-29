<template>
  <div class="queue" id="queue">
    <Icon icon="mdi:academic-cap" class="icon" height="1rem" />
    <ElmInlineText :text="`Should Learn: ${ankiStore.getShouldLearnCount}`" />

    <Icon icon="mdi:chart-bar-stacked" class="icon" height="1rem" />
    <ElmInlineText
      :text="`Queue: ${ankiStore.fetchAnkiListState.results.length}`"
    />

    <span
      v-if="ankiStore.getCurrentAnki?.is_review_required"
      class="review-label"
    >
      Review Required
    </span>
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText } from "@elmethis/vue";
import { Icon } from "@iconify/vue";
const ankiStore = useAnkiStore();
</script>

<style scoped lang="scss">
@use "../../scss/_mixins.scss";

.icon {
  color: #b69545;
}

.queue {
  height: 2rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}

.review-label {
  color: #be5252;
  padding: 0.25rem;
  border: 1px solid #be5252;
  border-radius: 2px;
}
</style>
