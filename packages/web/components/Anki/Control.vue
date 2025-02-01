<template>
  <div class="button-container" id="button-container">
    <ElmButton
      @click="ankiStore.editCurrentAnki()"
      block
      :loading="ankiStore.ankiList.length === 0"
    >
      <Icon icon="mdi:file-document-edit-outline" class="icon" />
      <ElmInlineText text="Edit" />
    </ElmButton>

    <ElmButton
      @click="ankiStore.create()"
      block
      :loading="ankiStore.createState.loading"
    >
      <Icon icon="mdi:sparkles-outline" class="icon" />
      <ElmInlineText text="NEW" />
    </ElmButton>
  </div>
</template>

<script setup lang="ts">
import { ElmButton, ElmInlineText } from '@elmethis/core'
import { Icon } from '@iconify/vue'

const ankiStore = useAnkiStore()
</script>

<style scoped lang="scss">
@use '../../scss/_mixins.scss';

.button-container {
  box-sizing: border-box;
  display: flex;
  gap: 0.5rem;
  margin-block: 1.5rem;
}

.icon {
  @include mixins.icon;
}
</style>
