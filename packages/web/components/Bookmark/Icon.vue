<template>
  <ElmBookmarkIcon
    v-if="bookmark.url != null"
    :name="bookmark.name ?? bookmark.url ?? ''"
    :favicon="bookmark.favicon ?? undefined"
    :href="bookmark.url ?? ''"
    class="fade-in"
    :style="{
      animationDelay: `${index * 25}ms`,
    }"
  />
</template>

<script setup lang="ts">
import { ElmBookmarkIcon } from "@elmethis/core";

defineProps<{
  index: number;
  bookmark: Bookmark;
}>();
</script>

<style lang="scss" scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation-name: fade-in;
  animation-duration: 500ms;
  animation-fill-mode: both;
}
</style>
