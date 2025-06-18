<template>
  <div>
    <ElmCommandPalette
      :commands="[
        {
          id: '0556d566-59db-4638-ae38-9633ea5b2ef3',
          label: 'Do Nothing',
          onInvoke: () => {},
        },
      ]"
      :on-command-invoked="close"
    />
  </div>
</template>

<script setup lang="ts">
import { ElmCommandPalette } from "@elmethis/command-palette";

const isShown = defineModel<boolean>();

const close = () => {
  console.log("Close!");
  isShown.value = false;
};

export interface CommandPaletteProps {}

withDefaults(defineProps<CommandPaletteProps>(), {});
</script>

<style module lang="scss"></style>
