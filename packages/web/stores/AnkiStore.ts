import { cloneDeep } from 'lodash-es'
import { z } from 'zod'

interface AnkiStoreState {
  ankiList: AnkiResponse['edges'][number]['node'][]
  nextCursor?: string
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
      this.nextCursor = response.data.ankiList.pageInfo.nextCursor ?? undefined
      await this.fetchAnkiList({ pageSize: 2 })
      await this.fetchAnkiList({ pageSize: 50 })
    },
    async fetchAnkiList({ pageSize }: { pageSize: number }) {
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
          variables: { pageSize, nextCursor: this.nextCursor }
        }
      })

      this.ankiList = [
        ...this.ankiList,
        ...response.data.ankiList.edges.map((edge) => edge.node)
      ]
      this.nextCursor = response.data.ankiList.pageInfo.nextCursor ?? undefined
    },
    async next() {
      this.ankiList = this.ankiList.slice(1)

      if (this.ankiList.length < 5) {
        await this.fetchAnkiList({ pageSize: 30 })
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
      const [next] = this.ankiList
      return next
    }
  }
})
