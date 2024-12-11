import { defineStore } from 'pinia'
import { uniqBy } from 'lodash-es'
import { z } from 'zod'
import { relayConnectionSchema } from '~/utils/relay'

const bokmarkSchema = z.object({
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
})

type Bookmark = z.infer<typeof bokmarkSchema>

const bookmarkResponseSchema = relayConnectionSchema(bokmarkSchema)

type BookmarkResponse = z.infer<typeof bookmarkResponseSchema>

type ClassifiedBookmarkList = Array<{
  tag: {
    id: string
    name: string
    color: string
  }
  bookmark: Array<Bookmark>
}>

interface BookmarkState {
  loading: boolean
  error: boolean
  bookmarkList: Bookmark[]
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
        await authStore.checkSession()
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
        body: {
          query: `#graphql
            query Bookmark {
              bookmarkList(input: {pageSize: 100}) {
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
        }
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
    tags(): Bookmark['tags'] {
      const tags = this.bookmarkList.flatMap((bookmark) => bookmark.tags)
      const uniqueTags = uniqBy(tags, (tag) => tag.id)
      return uniqueTags
    },
    classifiedBookmarkList(): ClassifiedBookmarkList {
      const results: ClassifiedBookmarkList = []
      const uniqueTags = this.tags

      for (const tag of uniqueTags) {
        results.push({ tag, bookmark: [] })
      }

      const bookmarkList = this.bookmarkList
      for (const bookmark of bookmarkList) {
        for (const tag of bookmark.tags) {
          const index = results.findIndex((result) => result.tag.id === tag.id)
          results[index].bookmark.push(bookmark)
        }
      }

      return results
    }
  }
})
