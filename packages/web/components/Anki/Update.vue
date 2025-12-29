<template>
  <div>
    <ElmBlockFallback v-if="ankiStore.updateAnkiState.loading" />

    <div v-else class="update-button">
      <ElmButton
        @click="ankiStore.updateAnkiByPerformanceRating(0)"
        :loading="ankiStore.updateAnkiState.loading"
        block
      >
        <span>× FORGETFUL [Q]</span>
      </ElmButton>

      <ElmButton
        @click="ankiStore.updateAnkiByPerformanceRating(1)"
        :loading="ankiStore.updateAnkiState.loading"
        block
      >
        <span>× INCORRECT [W]</span>
      </ElmButton>

      <ElmButton
        @click="ankiStore.updateAnkiByPerformanceRating(2)"
        :loading="ankiStore.updateAnkiState.loading"
        block
      >
        <span>× ALMOST [E]</span>
      </ElmButton>

      <ElmButton
        @click="ankiStore.updateAnkiByPerformanceRating(3)"
        :loading="ankiStore.updateAnkiState.loading"
        block
        primary
      >
        <span>✓ LUCKY [A]</span>
      </ElmButton>

      <ElmButton
        @click="ankiStore.updateAnkiByPerformanceRating(4)"
        :loading="ankiStore.updateAnkiState.loading"
        block
        primary
      >
        <span>✓ CORRECT [S]</span>
      </ElmButton>

      <ElmButton
        @click="ankiStore.updateAnkiByPerformanceRating(5)"
        :loading="ankiStore.updateAnkiState.loading"
        block
        primary
      >
        <span>✓ CONFIDENT [D]</span>
      </ElmButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";
import { ElmButton, ElmBlockFallback } from "@elmethis/vue";

const ankiStore = useAnkiStore();

type Key = "q" | "w" | "e" | "a" | "s" | "d";

onKeyStroke(["q", "w", "e", "a", "s", "d"] as Key[], (e) => {
  if (ankiStore.isShowAnswer) {
    e.preventDefault();

    const map: Record<Key, 1 | 2 | 3 | 4 | 5 | 6> = {
      q: 1,
      w: 2,
      e: 3,
      a: 4,
      s: 5,
      d: 6,
    };

    ankiStore.updateAnkiByPerformanceRating(map[e.key as Key]);
  }
});
</script>

<style scoped lang="scss">
.update-button {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 0.5rem;
  font-size: 0.85rem !important;
}
</style>
