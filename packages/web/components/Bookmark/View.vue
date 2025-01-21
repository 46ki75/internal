<template>
  <div>
    <ElmHeading1 text="Bookmarks" />
    <ElmBlockFallback v-if="bookmarkStore.bookmarkList.length === 0" />
    <div class="global-fade-in" v-else>
      <div
        v-for="b in bookmarkStore.classifiedBookmarkList"
        :style="{ marginBlock: '1rem' }"
      >
        <ElmTag :text="b.tag.name" :color="b.tag.color" />
        <div class="bookmark-container">
          <template v-for="(bookmark, index) in b.bookmarkList">
            <ElmBookmarkIcon
              v-if="bookmark.url != null"
              :name="bookmark.name ?? bookmark.url ?? ''"
              :favicon="
                bookmark.favicon ??
                'https://www.svgrepo.com/show/197996/internet.svg'
              "
              :href="bookmark.url ?? ''"
              class="fade-in"
              :style="{
                animationDelay: `${index * 25}ms`
              }"
            />
          </template>
        </div>
      </div>
    </div>

    <ElmParagraph v-if="bookmarkStore.error != null">{{
      bookmarkStore.error
    }}</ElmParagraph>
  </div>
</template>

<script setup lang="ts">
import {
  ElmBlockFallback,
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
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation-name: fade-in;
  animation-duration: 500ms;
  animation-fill-mode: both;
}

.bookmark-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
  grid-template-rows: repeat(auto-fill, minmax(2rem, 1fr));
  grid-template-areas:
    'header header'
    'main sidebar';
}
</style>
