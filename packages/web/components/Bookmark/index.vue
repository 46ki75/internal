<template>
  <div>
    <ElmHeading :level="1" text="Bookmarks" />

    <ElmTextField
      v-model="bookmarkStore.searchKeyword"
      label="keyword"
      icon="text"
    />

    <ElmBlockFallback v-if="bookmarkStore.convertedBookmarkList.length === 0" />

    <div class="global-fade-in" v-else>
      <div
        v-for="bookmark in bookmarkStore.convertedBookmarkList"
        :style="{ marginBlock: '1rem' }"
      >
        <BookmarkTag
          v-if="bookmark.tag"
          :label="bookmark.tag.name"
          :color="bookmark.tag.color"
          :style="{ marginBlock: '1rem' }"
        />
        <BookmarkList
          :bookmarks="
            bookmark.bookmarkList.map(
              ({ name, url, favicon, notionUrl, nsfw }) => ({
                name,
                href: url,
                favicon,
                notionUrl,
                nsfw,
              })
            )
          "
        />
      </div>
    </div>

    <ElmParagraph v-if="bookmarkStore.error != null">{{
      bookmarkStore.error
    }}</ElmParagraph>
  </div>

  <BookmarkCreate />
</template>

<script setup lang="ts">
import {
  ElmBlockFallback,
  ElmHeading,
  ElmParagraph,
  ElmTextField,
} from "@elmethis/core";
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
