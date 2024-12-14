<template>
  <ElmHeading1 text="Bookmarks" />
  <ElmInlineText v-if="bookmarkStore.loading" text="LOADING..." />
  <div v-else>
    <div
      v-for="b in bookmarkStore.classifiedBookmarkList"
      :style="{ marginBlock: '1rem' }"
    >
      <ElmTag :text="b.tag.name" color="gray" />
      <div class="bookmark-container">
        <template v-for="bookmark in b.bookmarkList">
          <ElmBookmarkIcon
            v-if="bookmark.url != null"
            :name="bookmark.name ?? bookmark.url ?? ''"
            :favicon="
              bookmark.favicon ??
              'https://www.svgrepo.com/show/197996/internet.svg'
            "
            :href="bookmark.url ?? ''"
          />
        </template>
      </div>
    </div>
  </div>

  <ElmParagraph v-if="bookmarkStore.error != null">{{
    bookmarkStore.error
  }}</ElmParagraph>
</template>

<script setup lang="ts">
import {
  ElmBookmarkIcon,
  ElmHeading1,
  ElmInlineText,
  ElmParagraph,
  ElmTag
} from '@elmethis/core'

const bookmarkStore = useBookmarkStore()

onMounted(async () => {
  console.log('fetching bookmarks')
  await bookmarkStore.fetch()
})
</script>

<style scoped lang="scss">
.bookmark-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
  grid-template-rows: repeat(auto-fill, minmax(2rem, 1fr));
  grid-template-areas:
    'header header'
    'main sidebar';
}
</style>
