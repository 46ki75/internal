<template>
  <div class="wrapper">
    <label for="translate">Translation Input</label>
    <textarea
      name="translate"
      id="translate"
      @input="handleInputChange"
      :value="translateStore.input"
    />
    <ElmButton
      block
      :loading="translateStore.translateLoading"
      @click="translateStore.translate()"
    >
      Translate
    </ElmButton>

    <ElmCodeBlock
      v-if="translateStore.translateResponse"
      :code="translateStore.translateResponse"
    />
  </div>
</template>

<script setup lang="ts">
import { ElmButton, ElmCodeBlock } from "@elmethis/core";

const translateStore = useTranslateStore();

const handleInputChange = (e: Event) => {
  const inputVal = (e.target as HTMLTextAreaElement).value;
  translateStore.setInput(inputVal);
};
</script>

<style scoped lang="scss">
#translate {
  box-sizing: border-box;
  font-size: 1.25rem;
  opacity: 0.5;
  width: 100%;
  min-height: 200px;
}

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>
