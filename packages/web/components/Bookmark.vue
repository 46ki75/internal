<template>
  <ElmHeading1 text="Bookmarks" />
  <ElmInlineText v-if="bookmarkStore.loading" text="LOADING..." />
  <div v-else>{{ JSON.stringify(bookmarkStore.tags) }}</div>
  <!-- <div v-else>{{ JSON.stringify(bookmarkStore.bookmarkList) }}</div> -->

  <p v-if="bookmarkStore.error">ERROR</p>
</template>

<script setup lang="ts">
import { ElmHeading1, ElmInlineText } from '@elmethis/core'

const bookmarkStore = useBookmarkStore()

onMounted(async () => {
  console.log('fetching bookmarks')
  await bookmarkStore.fetch()
})
</script>

<style scoped></style>
