<template>
  <div :class="$style.box">
    <BookmarkIcon v-for="bookmark in bookmarks" v-bind="bookmark" />
  </div>
</template>

<script setup lang="ts">
import type { BookmarkIconProps } from "./BookmarkIcon.vue";
import BookmarkIcon from "./BookmarkIcon.vue";

export interface BookmarkListProps {
  bookmarks: BookmarkIconProps[];
}

withDefaults(defineProps<BookmarkListProps>(), {});
</script>

<style module lang="scss">
.box {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
  gap: 0.25rem;
}
</style>
