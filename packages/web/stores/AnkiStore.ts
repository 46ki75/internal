import type { ElmJsonRendererProps } from '@elmethis/core'
import { z } from 'zod'

// interface Anki {
//   pageId: string
//   title: string | null
//   description: string | null
//   easeFactor: number
//   repetitionCount: number
//   nextReviewAt: string
//   createdAt: string
//   updatedAt: string
//   tags: Array<{
//     id: string
//     name: string
//     color: string
//   }>
//   url: string
//   blockList?: {
//     front: ElmJsonRendererProps['json']
//     back: ElmJsonRendererProps['json']
//     explanation: ElmJsonRendererProps['json']
//   }
// }

interface AnkiStoreState {
  ankiList: AnkiResponse['edges'][number]['node'][]
}

export const ankiResponseSchema = z.object({
  edges: z.array(
    z.object({
      node: z.object({
        pageId: z.string(),
        title: z.string().nullable(),
        description: z.string().nullable(),
        easeFactor: z.number(),
        repetitionCount: z.number(),
        nextReviewAt: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        tags: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            color: z.string()
          })
        ),
        url: z.string(),
        blockList: z
          .object({
            front: z.any(),
            back: z.any(),
            explanation: z.any()
          })
          .optional()
          .nullable()
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

type AnkiResponse = z.infer<typeof ankiResponseSchema>

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

      const response = await $fetch<{
        data: { ankiList: AnkiResponse }
      }>('/api/graphql', {
        method: 'POST',
        headers: {
          Authorization: `${authStore.session.idToken}`
        },
        body: {
          query: `#graphql
            query AnkiListQuery($pageSize: Int!, $nextCursor: String) {
              ankiList(input: {pageSize: $pageSize, nextCursor: $nextCursor}) {
                edges {
                  node {
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
                    blockList{
                      front
                      back
                      explanation
                    }
                  }
                  cursor
                }
                pageInfo {
                  nextCursor
                }
              }
            }
          `,
          variables: { pageSize: 1 }
        }
      })

      this.ankiList = response.data.ankiList.edges.map((edge) => edge.node)
      await this.fetchAnkiList()
    },
    async fetchAnkiList() {
      const authStore = useAuthStore()
      const response = await $fetch<{
        data: { ankiList: AnkiResponse }
      }>('/api/graphql', {
        method: 'POST',
        headers: {
          Authorization: `${authStore.session.idToken}`
        },
        body: {
          query: `#graphql
            query AnkiListQuery($pageSize: Int!, $nextCursor: String) {
              ankiList(input: {pageSize: $pageSize, nextCursor: $nextCursor}) {
                edges {
                  node {
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
                    blockList{
                      front
                      back
                      explanation
                    }
                  }
                  cursor
                }
                pageInfo {
                  nextCursor
                }
              }
            }
            `,
          variables: { pageSize: 30 }
        }
      })

      this.ankiList = [
        ...this.ankiList,
        ...response.data.ankiList.edges.map((edge) => edge.node).slice(1)
      ]
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
    getCurrentAnki(): AnkiResponse['edges'][number]['node'] {
      return this.ankiList[0]
    }
  }
})
