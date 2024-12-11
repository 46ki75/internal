import { defineStore } from 'pinia'
import { uniqBy } from 'lodash-es'

interface Bookmark {
  id: string
  name: string | null
  url: string | null
  favicon: string | null
  tags: Array<{
    id: string
    name: string
    color: string
  }>
}

interface Response {
  data: {
    bookmarkList: Bookmark[]
  }
}

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

      const authStore = useAuthStore()
      if (authStore.session.idToken == null) {
        await authStore.checkSession()
      }

      const response = await $fetch<Response>('/api/graphql', {
        method: 'POST',
        headers: {
          Authorization: `${authStore.session.idToken}`
        },
        body: {
          query: `#graphql
            query BookmarkQuery {
              bookmarkList {
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
            }
        `
        }
      })

      this.bookmarkList = response.data.bookmarkList
      console.log(response.data)
      console.log(this.bookmarkList)

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
