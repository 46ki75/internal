<template>
  <div>
    <ElmHeading1 text="Create Bookmark" />

    <div class="input-container">
      <label for="name"><ElmInlineText text="Name" /></label>
      <input id="name" class="input" type="text" v-model="name" />
      <label for="url"><ElmInlineText text="URL" /></label>
      <input id="url" class="input" type="text" v-model="url" />

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
import { ElmButton, ElmHeading1, ElmInlineText } from '@elmethis/core'

const bookmarkStore = useBookmarkStore()

const name = ref<string | null>()
const url = ref<string | null>()

const handleCreate = async () => {
  if (name.value != null && url.value != null) {
    await bookmarkStore.create({
      name: name.value,
      url: url.value
    })
  }
}
</script>

<style scoped lang="scss">
.input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-block-start: 1rem;
  margin-block-end: 20rem;
}

.input {
  box-sizing: border-box;
  padding: 0.5rem;
  font-size: 1.25rem;
  opacity: 0.5;
  width: 100%;
}
</style>
