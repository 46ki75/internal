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
        <template v-for="bookmark in b.bookmarkListNodeList">
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

  <ElmParagraph v-if="bookmarkStore.error">ERROR</ElmParagraph>
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
</script>

<style scoped lang="scss">
.bookmark-container {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
}
</style>
