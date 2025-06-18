<template>
  <div :class="$style.fixed"></div>
</template>

<script setup lang="ts">
export interface CommandPaletteProps {}

withDefaults(defineProps<CommandPaletteProps>(), {});
</script>

<style module lang="scss">
.fixed {
  position: fixed;
  z-index: 5;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(black, 0.2);
}
</style>
