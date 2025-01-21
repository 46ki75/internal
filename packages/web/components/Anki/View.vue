<template>
  <template v-if="ankiStore.getCurrentAnki?.blockList != null">
    <ElmHeading1 text="front" id="front" />
    <ElmJsonRendererAsync
      :key="`${ankiStore.getCurrentAnki.pageId}:front`"
      :json="ankiStore.getCurrentAnki.blockList.front"
    />

    <template v-if="ankiStore.isShowAnswer">
      <ElmHeading1 text="back" id="back" />
      <ElmJsonRendererAsync
        :key="`${ankiStore.getCurrentAnki.pageId}:back`"
        :json="ankiStore.getCurrentAnki.blockList.back"
      />

      <ElmHeading1 text="explanation" id="explanation" />
      <ElmJsonRendererAsync
        :key="`${ankiStore.getCurrentAnki.pageId}:explanation`"
        :json="ankiStore.getCurrentAnki.blockList.explanation"
      />
    </template>

    <ElmButton v-else @click="ankiStore.setIsShowAnswer(true)" block>
      <ElmInlineText text="SHOW ANSWER" />
      <Icon icon="mdi:arrow-u-left-bottom" class="icon" />
    </ElmButton>
  </template>
</template>

<script setup lang="ts">
import {
  ElmButton,
  ElmHeading1,
  ElmInlineText,
  ElmJsonRendererAsync
} from '@elmethis/core'
import { Icon } from '@iconify/vue'

const ankiStore = useAnkiStore()
</script>

<style scoped lang="scss">
@use '../../scss/_mixins.scss';

.icon {
  @include mixins.icon;
}
</style>
