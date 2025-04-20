<template>
  <template v-if="ankiStore.getCurrentAnki?.blockList != null">
    <div class="card">
      <div class="card-header">
        <Icon class="icon" icon="mdi:tooltip-question-outline" />
        <ElmInlineText bold text="FRONT" id="front" />
      </div>
      <div class="card-body">
        <ElmJsonRenderer
          :key="`${ankiStore.getCurrentAnki.pageId}:front`"
          :json="ankiStore.getCurrentAnki.blockList.front"
        />
      </div>
    </div>

    <template v-if="ankiStore.isShowAnswer">
      <div class="card">
        <div class="card-header">
          <Icon class="icon" icon="mdi:question-answer" />
          <ElmInlineText bold text="BACK" id="back" />
        </div>
        <div class="card-body">
          <ElmJsonRenderer
            :key="`${ankiStore.getCurrentAnki.pageId}:back`"
            :json="ankiStore.getCurrentAnki.blockList.back"
          />
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <Icon class="icon" icon="mdi:bookshelf" />
          <ElmInlineText bold text="EXPLANATION" id="explanation" />
        </div>
        <div class="card-body">
          <ElmJsonRenderer
            :key="`${ankiStore.getCurrentAnki.pageId}:explanation`"
            :json="ankiStore.getCurrentAnki.blockList.explanation"
          />
        </div>
      </div>
    </template>
  </template>
</template>

<script setup lang="ts">
import { ElmJsonRenderer, ElmInlineText } from "@elmethis/core";
import { Icon } from "@iconify/vue/dist/iconify.js";

const ankiStore = useAnkiStore();
</script>

<style scoped lang="scss">
@use "../../scss/_mixins.scss";

.icon {
  @include mixins.icon;
  color: #868e9c;
}

.card {
  margin-block: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 0 0.125rem rgba(black, 0.2);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  box-sizing: border-box;
  padding: 0.5rem;
  border-bottom: solid 1px rgba(gray, 0.3);
  background-color: rgba(white, 0.6);

  [data-theme="dark"] & {
    background-color: rgba(black, 0.5);
  }
}

.card-body {
  box-sizing: border-box;
  padding: 0.5rem;
  background-color: rgba(white, 0.3);

  [data-theme="dark"] & {
    background-color: rgba(black, 0.3);
  }
}
</style>
