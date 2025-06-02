<template>
  <div class="wrapper">
    <div v-if="!typingStore.loading && typingStore.typingList.length > 0">
      <ElmInlineText
        v-for="(target, index) in targetArray"
        :key="`${currentIndex}-${index}-${target.char}`"
        :text="target.char"
        :style="{
          fontFamily: 'SauceCodePro NFM, monospace',
          fontSize: '1.5rem',
          textDecoration:
            target.status === 'current' || target.status === 'incorrect'
              ? 'underline'
              : 'none',
          opacity: target.status === 'typed' ? 0.2 : 1,
        }"
        :color="target.status === 'incorrect' ? 'red' : undefined"
      />
    </div>

    <div v-if="targetTypingList[currentIndex]?.description">
      <ElmInlineText
        :text="targetTypingList[currentIndex].description"
        :style="{ opacity: 0.75 }"
      />
    </div>
    <ElmBlockFallback v-else />
  </div>
</template>

<script setup lang="ts">
import { ElmBlockFallback, ElmInlineText, useTyping } from "@elmethis/core";
import { onKeyStroke } from "@vueuse/core";
import { shuffle } from "lodash-es";

interface Typing {
  id: string;
  text: string;
  description: string;
}

onKeyStroke(" ", (e) => {
  e.preventDefault();
});

const typingStore = useTypingStore();

const targetTypingList = ref<Typing[]>([]);

const currentIndex = ref(0);

const { start, targetArray, isFinished } = useTyping();

const init = (typingList: Typing[]) => {
  currentIndex.value = 0;
  targetTypingList.value = shuffle(typingList);
  start(targetTypingList.value[currentIndex.value].text.toString());
};

onMounted(async () => {
  await typingStore.fetch();
  init(typingStore.typingList as Typing[]);
});

watch(isFinished, async () => {
  if (isFinished.value) {
    currentIndex.value = currentIndex.value + 1;
    start(targetTypingList.value[currentIndex.value].text.toString());
  }
});

watch(currentIndex, () => {
  if (
    targetTypingList.value.length !== 0 &&
    currentIndex.value === targetTypingList.value.length
  ) {
    init(typingStore.typingList as Typing[]);
  }
});
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
