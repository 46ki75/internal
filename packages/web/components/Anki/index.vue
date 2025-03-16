<template>
  <div class="wrapper">
    <AnkiControl />

    <ElmBlockFallback v-if="ankiStore.ankiList.length === 0" />
    <template v-else>
      <AnkiMeta />

      <div>
        <AnkiView />
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
import { ElmBlockFallback, ElmButton, ElmInlineText } from "@elmethis/core";
import { onKeyStroke } from "@vueuse/core";
import { Icon } from "@iconify/vue";

const router = useRouter();
const ankiStore = useAnkiStore();

onMounted(async () => {
  if (ankiStore.ankiList.length === 0) {
    await ankiStore.init();
  }
});

watch(
  () => ankiStore.getCurrentAnki?.pageId,
  () => {
    router.push({ hash: "#button-container" });
  }
);

onKeyStroke(["Enter", " "], (e) => {
  e.preventDefault();
  ankiStore.setIsShowAnswer(true);
});
</script>

<style scoped lang="scss">
.wrapper {
  width: 100%;
  max-width: 800px;
  margin-bottom: 100vh;
}

.update {
  box-sizing: border-box;
  padding: 0.5rem;
  margin-block: 0.25rem;
  border-radius: 0.25rem;
  width: 100%;
  max-width: 800px;
  position: fixed;
  bottom: 0;

  background-color: rgba(#f2f2f2, 0.9);
  [data-theme="dark"] & {
    background-color: rgba(#262626, 0.9);
  }
}
</style>
