import { defineStore } from 'pinia'
import { uniqBy } from 'lodash-es'

import { useQuery } from '@vue/apollo-composable'
import { graphql } from '../graphql'

import type { BookmarkQuery } from '~/graphql/graphql'

const LIST_BOOKMARK = graphql(`
  query Bookmark {
    bookmarkList(input: { pageSize: 100 }) {
      edges {
        node {
          id
          name
          url
          favicon
          tags {
            id
            name
            color
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        nextCursor
      }
    }
  }
`)

interface BookmarkStoreState {
  loading: boolean
  error: boolean
  bookmarkList: Ref<BookmarkQuery | undefined, BookmarkQuery | undefined>
}

type Tag =
  BookmarkQuery['bookmarkList']['edges'][number]['node']['tags'][number]

type ClassifiedBookmarkList = Array<{
  tag: Tag
  bookmarkListNodeList: BookmarkQuery['bookmarkList']['edges'][number]['node'][]
}>

export const useBookmarkStore = defineStore('bookmark', {
  state: (): BookmarkStoreState => {
    const { result } = useQuery(LIST_BOOKMARK)
    return {
      loading: false,
      error: false,
      bookmarkList: result
    }
  },
  actions: {},
  getters: {
    tags(): Tag[] {
      const tags = this.bookmarkList?.bookmarkList.edges
        .map(({ node }) => node)
        .flatMap((bookmark) => bookmark.tags)
      const uniqueTags = uniqBy(tags, (tag) => tag.id)
      return uniqueTags
    },

    classifiedBookmarkList(): ClassifiedBookmarkList {
      const results: ClassifiedBookmarkList = []
      const uniqueTags = this.tags

      for (const tag of uniqueTags) {
        results.push({ tag, bookmarkListNodeList: [] })
      }

      const bookmarkListNodes =
        this.bookmarkList?.bookmarkList.edges.map(({ node }) => node) ?? []

      for (const bookmark of bookmarkListNodes) {
        for (const tag of bookmark.tags) {
          const index = results.findIndex((result) => result.tag.id === tag.id)
          results[index].bookmarkListNodeList.push(bookmark)
        }
      }

      return results
    }
  }
})
