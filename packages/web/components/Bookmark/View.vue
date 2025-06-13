<template>
  <div>
    <ElmHeading :level="1" text="Bookmarks" />
    <ElmBlockFallback v-if="bookmarkStore.bookmarkList.length === 0" />
    <div class="global-fade-in" v-else>
      <div v-for="tag in bookmarkStore.tags" :style="{ marginBlock: '1rem' }">
        <div v-if="tag">
          <ElmInlineText :text="tag.name" :color="tag.color" />
        </div>
        <div class="bookmark-container">
          <template
            v-for="(bookmark, index) in bookmarkStore.getBookmarkListByTagId(
              tag?.id
            )"
          >
            <BookmarkIcon
              :name="bookmark.name"
              :favicon="bookmark.favicon"
              :href="bookmark.url"
              :notionUrl="bookmark.notionUrl"
              :nsfw="bookmark.nsfw"
            />
          </template>
        </div>
      </div>

      <div>
        <ElmInlineText text="Untagged" color="gray" />
      </div>
      <div class="bookmark-container">
        <template
          v-for="(bookmark, index) in bookmarkStore.getUntaggedBookmarkList"
        >
          <BookmarkIcon
            :name="bookmark.name"
            :favicon="bookmark.favicon"
            :href="bookmark.url"
            :notionUrl="bookmark.notionUrl"
            :nsfw="bookmark.nsfw"
          />
        </template>
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
  ElmHeading,
  ElmInlineText,
  ElmParagraph,
} from "@elmethis/core";
import { useWindowFocus } from "@vueuse/core";

const bookmarkStore = useBookmarkStore();

onMounted(async () => {
  console.log("fetching bookmarks");
  await bookmarkStore.fetch();
});

const focused = useWindowFocus();
watch(focused, async () => {
  if (focused.value) {
    await bookmarkStore.fetch();
  }
});
</script>

<style scoped lang="scss">
.bookmark-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
  grid-template-rows: repeat(auto-fill, minmax(2rem, 1fr));
  grid-template-areas:
    "header header"
    "main sidebar";
  gap: 0.25rem;
}
</style>
