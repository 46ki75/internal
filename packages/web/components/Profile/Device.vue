<template>
  <div :key="id" :class="$style.device">
    <ElmMdiIcon :class="$style.left" :d="mdiMonitor" size="2rem" />

    <div :class="$style.right">
      <div>
        <div :title="name" :class="$style.name">
          {{ name ?? "不明なデバイス" }}
        </div>
      </div>

      <div :class="$style['vertical-center']">
        <ElmMdiIcon :d="mdiDevices" size="1.25rem" />
        <ElmInlineText
          :text="`初回ログイン - ${createDate?.toLocaleString()}`"
        />
      </div>

      <div :class="$style['vertical-center']">
        <ElmMdiIcon :d="mdiAccountClock" size="1.25rem" />
        <ElmInlineText
          :text="`最終ログイン - ${lastAuthenticatedDate?.toLocaleString()}`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText, ElmMdiIcon } from "@elmethis/core";
import { mdiMonitor, mdiDevices, mdiAccountClock } from "@mdi/js";

defineProps<{
  id: string;
  name?: string;
  createDate?: Date;
  lastAuthenticatedDate?: Date;
  ip?: string;
}>();
</script>

<style module lang="scss">
.device {
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 0 0.125rem rgba(black, 0.3);
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}

.left {
  padding: 1rem;
  flex-shrink: 0;
}

.right {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 0.5rem;
}

.name {
  box-sizing: border-box;
  width: calc(100% - 4.5rem);
  font-weight: bold;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  word-break: keep-all;

  color: #494f59;

  [data-theme="dark"] & {
    color: #cccfd5;
  }
}

.vertical-center {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
