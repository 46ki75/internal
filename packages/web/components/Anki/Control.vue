<template>
  <div class="button-container" id="button-container">
    <ElmButton
      @click="editAnki(ankiStore.getCurrentAnki?.url)"
      block
      :disabled="ankiStore.getCurrentAnki == null"
    >
      <Icon icon="mdi:file-document-edit-outline" class="icon" />
      <ElmInlineText text="Edit" />
    </ElmButton>

    <ElmButton
      @click="ankiStore.createAnki()"
      block
      :loading="ankiStore.createAnkiState.loading"
    >
      <Icon icon="mdi:sparkles-outline" class="icon" />
      <ElmInlineText text="NEW" />
    </ElmButton>
  </div>

  <div class="button-container">
    <ElmButton
      @click="ankiStore.toggleCurrentAnkiReviewRequired()"
      block
      :loading="ankiStore.updateAnkiState.loading"
      :disabled="ankiStore.getCurrentAnki == null"
    >
      <Icon
        :icon="
          ankiStore.getCurrentAnki?.is_review_required
            ? 'mdi:check-circle-outline'
            : 'mdi:alert-octagram-outline'
        "
        class="icon"
      />
      <ElmInlineText
        :text="
          ankiStore.getCurrentAnki?.is_review_required
            ? 'Mark this Anki card as Reviewed'
            : 'Mark this Anki card as Review Required'
        "
      />
    </ElmButton>
  </div>
</template>

<script setup lang="ts">
import { ElmButton, ElmInlineText } from "@elmethis/vue";
import { Icon } from "@iconify/vue";

const ankiStore = useAnkiStore();

const editAnki = (url?: string) => {
  if (url) window.location.assign(url.replace("https://", "notion://"));
};
</script>

<style scoped lang="scss">
@use "../../scss/_mixins.scss";

.button-container {
  box-sizing: border-box;
  display: flex;
  gap: 0.5rem;
  margin-block: 0.5rem;
}

.icon {
  @include mixins.icon;
}
</style>
