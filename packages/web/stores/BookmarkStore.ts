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
          notionUrl
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

export const bookmarkSchema = z.object({
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
  ),
  notionUrl: z.string()
})

type Bookmark = z.infer<typeof bookmarkSchema>

export const bookmarkResponseSchema = z.object({
  edges: z.array(
    z.object({
      node: bookmarkSchema,
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
  error: string | null
  bookmarkList: BookmarkResponse['edges'][number]['node'][]

  createLoading: boolean
  createError: string | null
}

export const useBookmarkStore = defineStore('bookmark', {
  state: (): BookmarkState => ({
    loading: false,
    error: null,
    bookmarkList: [],
    createLoading: false,
    createError: null
  }),
  actions: {
    async fetch() {
      this.loading = true
      this.error = null

      const authStore = useAuthStore()
      await authStore.refreshIfNeed()

      const cache = window.localStorage.getItem('Bookmark')
      if (cache != null) this.bookmarkList = JSON.parse(cache)

      try {
        const result = await $fetch<{
          data: { bookmarkList: BookmarkResponse }
        }>('/api/graphql', {
          method: 'POST',
          headers: {
            Authorization: authStore.session.accessToken as string
          },
          body: { query }
        })

        this.bookmarkList = result.data.bookmarkList.edges.map(
          (edge) => edge.node
        )

        window.localStorage.setItem(
          'Bookmark',
          JSON.stringify(this.bookmarkList)
        )
      } catch {
        this.error = "Couldn't fetch bookmark list"
      } finally {
        this.loading = false
      }
    },
    async create({ name, url }: { name: string; url: string }) {
      this.createLoading = true

      const authStore = useAuthStore()
      await authStore.refreshIfNeed()

      try {
        const response = await $fetch<{
          data: {
            createBookmark: BookmarkResponse['edges'][number]['node']
          }
        }>('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${authStore.session.accessToken}`
          },
          body: {
            query: /* GraphQL */ `
              mutation CreateBookmark($name: String!, $url: String!) {
                createBookmark(input: { name: $name, url: $url }) {
                  id
                  name
                  url
                  favicon
                  tags {
                    id
                    name
                    color
                  }
                  notionUrl
                }
              }
            `,
            variables: { name, url }
          }
        })

        this.bookmarkList.push(response.data.createBookmark)

        const { notionUrl } = response.data.createBookmark

        window.open(notionUrl.replace('https://', 'notion://'), '_blank')
      } catch {
        this.createError = "Couldn't create bookmark"
      } finally {
        this.createLoading = false
      }
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
