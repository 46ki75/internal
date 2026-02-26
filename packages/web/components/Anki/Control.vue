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

    <ElmButton
      @click="ankiStore.toggleCurrentAnkiReviewRequired()"
      block
      :loading="
        ankiStore.getCurrentAnki?.page_id != null
          ? ankiStore.fetchAnkiBlocksState[ankiStore.getCurrentAnki?.page_id]
              ?.loading || ankiStore.updateAnkiState.loading
          : true
      "
      :disabled="ankiStore.getCurrentAnki == null"
    >
      <Icon
        class="icon"
        :icon="
          ankiStore.getCurrentAnki?.is_review_required
            ? 'mdi:alert-octagram-outline'
            : 'mdi:dot'
        "
        :color="
          ankiStore.getCurrentAnki?.is_review_required ? '#c56565' : undefined
        "
      />
    </ElmButton>

    <ElmButton
      block
      @click="
        ankiStore.getCurrentAnki?.page_id != null &&
        ankiStore.fetchAnkiBlocks({
          ankiId: ankiStore.getCurrentAnki?.page_id,
          forceUpdate: true,
        })
      "
      :loading="
        ankiStore.getCurrentAnki?.page_id != null
          ? ankiStore.fetchAnkiBlocksState[ankiStore.getCurrentAnki?.page_id]
              ?.loading
          : true
      "
    >
      <Icon class="icon" icon="mdi:reload" />
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
  gap: 0.5rem;
  margin-block: 0.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr 64px 64px;
}

.icon {
  @include mixins.icon;
}
</style>
