<template>
  <div
    :class="$style.severity"
    :style="{
      '--color': ICON_MAP[level].color,
    }"
  >
    <ElmMdiIcon
      :d="ICON_MAP[level].icon"
      :color="ICON_MAP[level].color"
      size="1.25rem"
    />
    <ElmInlineText :text="level" />
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText, ElmMdiIcon } from "@elmethis/vue";
import {
  mdiAlert,
  mdiAlertOctagon,
  mdiCrosshairsQuestion,
  mdiInformation,
} from "@mdi/js";

export interface ToDoSeverityProps {
  level: "Unknown" | "Info" | "Warn" | "Error";
}

const ICON_MAP: Record<
  ToDoSeverityProps["level"],
  {
    icon: string;
    color: string;
  }
> = {
  Unknown: {
    icon: mdiCrosshairsQuestion,
    color: "#9771bd",
  },
  Info: {
    icon: mdiInformation,
    color: "#6987b8",
  },
  Warn: {
    icon: mdiAlert,
    color: "#b69545",
  },
  Error: {
    icon: mdiAlertOctagon,
    color: "#c56565",
  },
};

withDefaults(defineProps<ToDoSeverityProps>(), {});
</script>

<style module lang="scss">
.severity {
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--color);
  border-radius: 0.125rem;
  user-select: none;
}
</style>
