<template>
  <main class="main">
    <ElmColorTable
      :colors="[
        { name: 'brown', code: '#a17c5b' },
        { name: 'crimson', code: '#c56565' },
        { name: 'amber', code: '#d48b70' },
        { name: 'gold', code: '#cdb57b' },
        { name: 'emerald', code: '#59b57c' },
        { name: 'blue', code: '#6987b8' },
        { name: 'purple', code: '#9771bd' },
        { name: 'pink', code: '#c9699e' },
        { name: 'slate', code: '#868e9c' },
      ]"
    />

    <div class="mono">
      <template v-for="(color, i) in mono">
        <ElmInlineText
          :text="`${(1 - 0.05 * i).toFixed(2)} | ${(0.05 * i).toFixed(2)}`"
        />
        <div>
          <ElmColorSample :color="color" />
        </div>
        <ElmInlineText :text="renderAnnotation(i)" />
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ElmColorSample, ElmColorTable, ElmInlineText } from "@elmethis/core";
import { hsl } from "polished";

const mono = new Array(21).fill(null).map((_, i) => hsl(0, 0, 1 * 0.05 * i));

const renderAnnotation = (i: number) => {
  const fixed = (1 - 0.05 * i).toFixed(2);
  if (fixed === "0.85") return "Background (Dark)";
  if (fixed === "0.80") return "Heading";
  if (fixed === "0.70") return "Text";
  if (fixed === "0.05") return "Background (Light)";
  return "";
};
</script>

<style scoped lang="scss">
.main {
  display: flex;
  max-width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3rem;
  overflow-x: scroll;
}

.mono {
  margin-bottom: 20rem;
  display: grid;
  grid-template-columns: 2fr 2fr 3fr;
  gap: 0.25rem 1rem;
}
</style>
