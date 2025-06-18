<template>
  <div>
    <span :class="$style.tag" :style="{ '--color': color }">
      <ElmMdiIcon :d="mdiBookmark" color="white" size="1em" />
      <span :class="$style.label">
        {{ label }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ElmMdiIcon } from "@elmethis/core";
import { mdiBookmark } from "@mdi/js";

export interface BookmarkTagProps {
  label: string;
  color: string;
}

withDefaults(defineProps<BookmarkTagProps>(), {});
</script>

<style module lang="scss">
.tag {
  padding: 0.25rem;
  border-radius: 0.125rem;
  background-color: var(--color);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.label {
  padding: 0 0.25rem;
  color: rgba(white, 0.8);
}
</style>
