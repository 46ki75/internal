<template>
  <div class="bookmark-wrapper">
    <div
      v-for="convertedBookmark in convertedBookmarks"
      class="bookmark-container"
    >
      <div :class="{ tag: true, [convertedBookmark.tag.color]: true }">
        <font-awesome-icon :icon="['fas', 'tags']" />
        <span>{{ convertedBookmark.tag.name }}</span>
      </div>
      <div v-for="bookmark in convertedBookmark.bookmarks" class="bookmark">
        <img
          :src="bookmark.icon ?? getFaviconURL(bookmark.url)"
          alt=""
          class="favicon"
        />
        <Linktext :href="bookmark.url" :text="bookmark.name" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { Linktext } from 'elmethis'
import _ from 'lodash'

// # --------------------------------------------------------------------------------
//
// scripts
//
// # --------------------------------------------------------------------------------

interface Tag {
  id: string
  name: string
  color: string
}

interface Bookmark {
  name: string
  url: string
  tags: Tag[]
  icon: string
}

interface ConvertedBookmark {
  tag: Tag
  bookmarks: Bookmark[]
}

function getFaviconURL(url: string): string {
  const hostname = new URL(url).hostname
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
}

const { data } = useQuery({
  queryKey: ['Bookmarks'],
  queryFn: async () => $fetch<Bookmark[]>('/api/websites/bookmark'),
  staleTime: 3600
})

const tags = computed(() => {
  const tags = data.value?.map((bookmark) => bookmark.tags).flat() ?? []
  return _.uniqBy(tags, 'id')
})

const convertedBookmarks = computed(() => {
  const results: ConvertedBookmark[] = []
  if (data.value != null) {
    for (const tag of tags.value) {
      const convertedBookmark: ConvertedBookmark = { tag, bookmarks: [] }

      for (const bookmark of data.value) {
        if (bookmark.tags.map((t) => t.id).includes(tag.id)) {
          convertedBookmark.bookmarks.push(bookmark)
        }
      }

      results.push(convertedBookmark)
    }
  }
  return results
})
</script>

<style scoped lang="scss">
// # --------------------------------------------------------------------------------
//
// styles
//
// # --------------------------------------------------------------------------------

.bookmark-wrapper {
  padding: 0.5rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.bookmark-container {
  padding: 0.5rem;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.5rem;

  border-radius: 0.25rem;
  box-shadow: 0 0 0.25rem rgba($color: #000000, $alpha: 0.3);
  background-color: rgba($color: #888888, $alpha: 0.05);
}

.bookmark {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}

.favicon {
  width: 1.25rem;
  height: 1.25rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  opacity: 0.8;

  &.blue {
    background-color: rgba($color: #bdc5df, $alpha: 1);
  }
  &.red {
    background-color: rgba($color: #dfbdbd, $alpha: 1);
  }
  &.pink {
    background-color: rgba($color: #eed1dc, $alpha: 1);
  }
  &.yellow {
    background-color: rgba($color: #eee0ba, $alpha: 1);
  }
  &.green {
    background-color: rgba($color: #bddfc6, $alpha: 1);
  }
  &.purple {
    background-color: rgba($color: #d4bddf, $alpha: 1);
  }
  &.brown {
    background-color: rgba($color: #ddcec3, $alpha: 1);
  }
  &.orange {
    background-color: rgba($color: #f1d1b8, $alpha: 1);
  }
  &.gray {
    background-color: rgba($color: #e6e6e6, $alpha: 1);
  }
  &.default {
    background-color: rgba($color: #d3d3d3, $alpha: 1);
  }
}
</style>
