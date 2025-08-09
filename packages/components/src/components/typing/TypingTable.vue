<template>
  <table :class="$style.table">
    <thead>
      <tr>
        <th><ElmInlineText bold text="ID" /></th>
        <th><ElmInlineText bold text="Text" /></th>
        <th><ElmInlineText bold text="Description" /></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="value in data" :key="value.id">
        <td><ElmInlineText :text="value.id" /></td>
        <td><ElmInlineText :text="value.text" /></td>
        <td><ElmInlineText :text="value.description" /></td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ElmInlineText } from "@elmethis/core";

export interface TypingTableProps {
  data: Array<{
    id: string;
    text: string;
    description: string;
  }>;
}

withDefaults(defineProps<TypingTableProps>(), {});
</script>

<style module lang="scss">
.table {
  padding: 0.25rem;

  th {
    padding: 0.75rem 0.25rem;
    border-bottom: 1px solid rgba(gray, 0.5);
  }

  td {
    padding: 0.75rem 0.25rem;
    border-bottom: 1px dashed rgba(gray, 0.5);
  }
}
</style>
