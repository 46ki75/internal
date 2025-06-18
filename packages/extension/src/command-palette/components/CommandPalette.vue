<template>
  <div><ElmCommandPalette :commands="[]" /></div>
</template>

<script setup lang="ts">
import { ElmCommandPalette } from "@elmethis/command-palette";

export interface CommandPaletteProps {}

withDefaults(defineProps<CommandPaletteProps>(), {});
</script>

<style module lang="scss"></style>
