<template>
  <div>
    <ElmHeading :level="1" text="Create Bookmark" />

    <div class="input-container">
      <ElmTextField v-model="name" label="Name" icon="archive" />
      <ElmTextField v-model="url" label="URL" icon="link" />

      <ElmButton
        block
        :loading="bookmarkStore.createLoading"
        @click="handleCreate"
      >
        Create Bookmark
      </ElmButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElmHeading, ElmButton, ElmTextField } from "@elmethis/core";

const bookmarkStore = useBookmarkStore();

const name = ref<string | undefined>();
const url = ref<string | undefined>();

const handleCreate = async () => {
  if (name.value != null && url.value != null) {
    await bookmarkStore.create({
      name: name.value,
      url: url.value,
    });
  }
};
</script>

<style scoped lang="scss">
.input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-block-start: 1rem;
}

.input {
  box-sizing: border-box;
  padding: 0.5rem;
  font-size: 1.25rem;
  opacity: 0.5;
  width: 100%;
}
</style>
