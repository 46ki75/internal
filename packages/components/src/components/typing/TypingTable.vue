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
        <td :class="$style.flex">
          <div :class="$style.icon" @click="deleteFunction(value.id)">
            <ElmMdiIcon :d="mdiDelete" color="#c56565" size="1.25rem" />
          </div>
          <ElmInlineText :text="value.id" />
        </td>
        <td><ElmInlineText :text="value.text" /></td>
        <td><ElmInlineText :text="value.description" /></td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ElmInlineText, ElmMdiIcon } from "@elmethis/vue";
import { mdiDelete } from "@mdi/js";

export interface TypingTableProps {
  data: Array<{
    id: string;
    text: string;
    description: string;
  }>;
  deleteFunction: (id: string) => Promise<void>;
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

.flex {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 100ms;

  &:hover {
    background-color: rgba(#868e9c, 0.2);
  }
}
</style>
