<template>
  <div>
    <ElmHeading :level="1" text="Bookmarks" />
    <ElmBlockFallback v-if="bookmarkStore.bookmarkList.length === 0" />
    <div class="global-fade-in" v-else>
      <div v-for="tag in bookmarkStore.tags" :style="{ marginBlock: '1rem' }">
        <BookmarkTag
          v-if="tag"
          :label="tag.name"
          :color="tag.color"
          :style="{ marginBlock: '1rem' }"
        />
        <BookmarkList
          :bookmarks="
            convertBookmarks(bookmarkStore.getBookmarkListByTagId(tag?.id))
          "
        />
      </div>

      <BookmarkTag
        label="Untagged"
        color="gray"
        :style="{ marginBlock: '1rem' }"
      />
      <BookmarkList
        :bookmarks="convertBookmarks(bookmarkStore.getUntaggedBookmarkList)"
      />
    </div>

    <ElmParagraph v-if="bookmarkStore.error != null">{{
      bookmarkStore.error
    }}</ElmParagraph>
  </div>

  <BookmarkCreate />
</template>

<script setup lang="ts">
import { ElmBlockFallback, ElmHeading, ElmParagraph } from "@elmethis/core";
import { useWindowFocus } from "@vueuse/core";

import {
  BookmarkTag,
  BookmarkList,
  type BookmarkListProps,
} from "../../../components/src";

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

const convertBookmarks = (
  bookmarks: Bookmark[]
): BookmarkListProps["bookmarks"] => {
  const results = bookmarks.map((bookmark) => ({
    name: bookmark.name,
    href: bookmark.url,
    favicon: bookmark.favicon,
    notionUrl: bookmark.notionUrl,
    nsfw: bookmark.nsfw,
  }));
  return results;
};
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
