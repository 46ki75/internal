import { defineStore } from 'pinia'
import { uniqBy } from 'lodash-es'
import { z } from 'zod'

const query = /* GraphQL */ `
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
`

export const bookmarkResponseSchema = z.object({
  edges: z.array(
    z.object({
      node: z.object({
        id: z.string(),
        name: z.string().nullable(),
        url: z.string().nullable(),
        favicon: z.string().nullable(),
        tags: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            color: z.string()
          })
        )
      }),
      cursor: z.string()
    })
  ),
  pageInfo: z.object({
    hasNextPage: z.boolean().optional().nullable(),
    hasPreviousPage: z.boolean().optional().nullable(),
    startCursor: z.string().optional().nullable(),
    endCursor: z.string().optional().nullable(),
    nextCursor: z.string().optional().nullable()
  })
})

type BookmarkResponse = z.infer<typeof bookmarkResponseSchema>

type ClassifiedBookmarkList = Array<{
  tag: {
    id: string
    name: string
    color: string
  }
  bookmarkList: BookmarkResponse['edges'][number]['node'][]
}>

interface BookmarkState {
  loading: boolean
  error: boolean
  bookmarkList: BookmarkResponse['edges'][number]['node'][]
}

export const useBookmarkStore = defineStore('bookmark', {
  state: (): BookmarkState => ({
    loading: false,
    error: false,
    bookmarkList: []
  }),
  actions: {
    async fetch() {
      this.loading = true
      this.error = false

      const cache = window.localStorage.getItem('bookmarkList')

      if (cache) {
        this.bookmarkList = JSON.parse(cache)
        this.loading = false
      }

      const authStore = useAuthStore()
      if (authStore.session.idToken == null) {
        await authStore.refreshAccessToken()
        if (authStore.session.idToken == null) {
          this.loading = false
          return
        }
      }

      const response = await $fetch<{
        data: {
          bookmarkList: BookmarkResponse
        }
      }>('/api/graphql', {
        method: 'POST',
        headers: {
          Authorization: `${authStore.session.idToken}`
        },
        body: { query }
      })

      this.bookmarkList = response.data.bookmarkList.edges.map(
        (edge) => edge.node
      )

      window.localStorage.setItem(
        'bookmarkList',
        JSON.stringify(this.bookmarkList)
      )

      this.loading = false
    }
  },
  getters: {
    tags(): BookmarkResponse['edges'][number]['node']['tags'] {
      const tags = this.bookmarkList.flatMap((bookmark) => bookmark.tags)
      const uniqueTags = uniqBy(tags, (tag) => tag.id)
      return uniqueTags
    },
    classifiedBookmarkList(): ClassifiedBookmarkList {
      const results: ClassifiedBookmarkList = []
      const uniqueTags = this.tags

      for (const tag of uniqueTags) {
        results.push({ tag, bookmarkList: [] })
      }

      const bookmarkList = this.bookmarkList
      for (const bookmark of bookmarkList) {
        for (const tag of bookmark.tags) {
          const index = results.findIndex((result) => result.tag.id === tag.id)
          results[index].bookmarkList.push(bookmark)
        }
      }

      return results
    }
  }
})
