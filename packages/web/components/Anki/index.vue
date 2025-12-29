<template>
  <div class="wrapper">
    <AnkiControl />

    <ElmBlockFallback
      v-if="ankiStore.fetchAnkiListState.results.length === 0"
    />
    <template v-else>
      <AnkiMeta />

      <div>
        <AnkiView v-if="ankiStore.getCurrnetAnkiBlocks != null" />
        <div v-else class="justify-center">
          <ElmSquareLoadingIcon />
        </div>
      </div>
    </template>

    <div class="update">
      <ElmButton
        v-if="!ankiStore.isShowAnswer"
        @click="ankiStore.setIsShowAnswer(true)"
        block
      >
        <ElmInlineText text="SHOW ANSWER" />
        <Icon icon="mdi:arrow-u-left-bottom" class="icon" />
      </ElmButton>

      <AnkiUpdate v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ElmBlockFallback,
  ElmButton,
  ElmDotLoadingIcon,
  ElmInlineText,
  ElmSquareLoadingIcon,
} from "@elmethis/vue";
import { onKeyStroke } from "@vueuse/core";
import { Icon } from "@iconify/vue";

const ankiStore = useAnkiStore();

onMounted(async () => {
  await ankiStore.idempotentFetch();
});

onKeyStroke(["Enter", " "], (e) => {
  e.preventDefault();
  ankiStore.setIsShowAnswer(true);
});
</script>

<style scoped lang="scss">
.wrapper {
  width: 100%;
  max-width: 800px;
}

.update {
  box-sizing: border-box;
  padding: 0.25rem;
  border-radius: 0.25rem;
  width: calc(100% - 1rem);
  max-width: 800px;
  position: fixed;
  z-index: 100;
  bottom: 0;

  background-color: rgba(#f2f2f2, 0.9);
  [data-theme="dark"] & {
    background-color: rgba(#262626, 0.9);
  }
}

.justify-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 8rem;
}
</style>
