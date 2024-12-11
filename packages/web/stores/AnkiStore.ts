import type { ElmJsonRendererProps } from '@elmethis/core'

interface Anki {
  pageId: string
  title: string | null
  description: string | null
  easeFactor: number
  repetitionCount: number
  nextReviewAt: string
  createdAt: string
  updatedAt: string
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  url: string
  blockList?: {
    front: ElmJsonRendererProps['json']
    back: ElmJsonRendererProps['json']
    explanation: ElmJsonRendererProps['json']
  }
}

interface AnkiStoreState {
  ankiList: Anki[]
}

export const useAnkiStore = defineStore('anki', {
  state: (): AnkiStoreState => ({
    ankiList: []
  }),
  actions: {
    async init() {
      const authStore = useAuthStore()
      if (authStore.session.idToken == null) {
        await authStore.refreshAccessToken()
      }

      const response = await $fetch<{ data: { ankiList: Anki[] } }>(
        '/api/graphql',
        {
          method: 'POST',
          headers: {
            Authorization: `${authStore.session.idToken}`
          },
          body: {
            query: `#graphql
            query AnkiListQuery($pageSize: Int!) {
                ankiList(input: {pageSize: $pageSize}) {
                    pageId
                    title
                    description
                    easeFactor
                    repetitionCount
                    nextReviewAt
                    createdAt
                    updatedAt
                    tags {
                        id
                        name
                        color
                    }
                    url
                    blockList {
                        front
                        back
                        explanation
                    }
                }
            }
          `,
            variables: { pageSize: 1 }
          }
        }
      )

      this.ankiList = response.data.ankiList
      await this.fetchAnkiList()
    },
    async fetchAnkiList() {
      const authStore = useAuthStore()
      const response = await $fetch<{ data: { ankiList: Anki[] } }>(
        '/api/graphql',
        {
          method: 'POST',
          headers: {
            Authorization: `${authStore.session.idToken}`
          },
          body: {
            query: `#graphql
              query AnkiListQuery($pageSize: Int!) {
                  ankiList(input: {pageSize: $pageSize}) {
                      pageId
                      title
                      description
                      easeFactor
                      repetitionCount
                      nextReviewAt
                      createdAt
                      updatedAt
                      tags {
                          id
                          name
                          color
                      }
                      url
                      blockList {
                          front
                          back
                          explanation
                      }
                  }
              }
            `,
            variables: { pageSize: 30 }
          }
        }
      )

      this.ankiList = [...this.ankiList, ...response.data.ankiList.slice(1)]
    },
    async next() {
      this.ankiList = this.ankiList.slice(1)

      if (this.ankiList.length < 3) {
        await this.fetchAnkiList()
      }
    }
  },
  getters: {
    getShouldLearnCount(): number {
      const nextReviewAtList = this.ankiList.map(
        (anki) => new Date(anki.nextReviewAt)
      )
      const now = new Date()

      return nextReviewAtList.filter((nextReviewAt) => nextReviewAt < now)
        .length
    },
    getCurrentAnki(): Anki | undefined {
      return this.ankiList[0]
    }
  }
})
