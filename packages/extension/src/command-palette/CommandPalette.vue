<template>
  <div>
    <div v-if="isShown" :class="$style.fixed"></div>
  </div>
</template>

<script setup lang="ts">
import { onKeyStroke, useMagicKeys, whenever } from "@vueuse/core";
import { ref } from "vue";

export interface CommandPaletteProps {}

withDefaults(defineProps<CommandPaletteProps>(), {});

const isShown = ref(false);

onKeyStroke("Escape", (e) => {
  e.preventDefault();
  isShown.value = false;
});

const { Ctrl_Shift_P } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === "p" &&
      e.type === "keydown"
    ) {
      e.preventDefault();
    }
  },
});

whenever(Ctrl_Shift_P, () => {
  isShown.value = true;
});
</script>

<style module lang="scss">
.fixed {
  position: fixed;
  z-index: 10000;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(#3e434b, 0.75);
}
</style>
