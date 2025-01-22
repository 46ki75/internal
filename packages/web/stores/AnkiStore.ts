import { z } from 'zod'

interface AnkiStoreState {
  ankiList: AnkiResponse['edges'][number]['node'][]
  nextCursor?: string
  isShowAnswer: boolean
  updateLoading: boolean
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
    ankiList: [],
    nextCursor: undefined,
    isShowAnswer: false,
    updateLoading: false
  }),
  actions: {
    setIsShowAnswer(isShowAnswer: boolean) {
      this.isShowAnswer = isShowAnswer
    },
    async init() {
      const authStore = useAuthStore()
      await authStore.wait()

      const response = await $fetch<{
        data: { ankiList: AnkiResponse }
      }>('/api/graphql', {
        method: 'POST',
        headers: {
          Authorization: `${authStore.session.idToken}`
        },
        body: {
          query: /* GraphQL */ `
            query AnkiListQuery($pageSize: Int!, $nextCursor: String) {
              ankiList(
                input: { pageSize: $pageSize, nextCursor: $nextCursor }
              ) {
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
                    blockList {
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
      await authStore.wait()

      const response = await $fetch<{
        data: { ankiList: AnkiResponse }
      }>('/api/graphql', {
        method: 'POST',
        headers: {
          Authorization: `${authStore.session.idToken}`
        },
        body: {
          query: /* GraphQL */ `
            query AnkiListQuery($pageSize: Int!, $nextCursor: String) {
              ankiList(
                input: { pageSize: $pageSize, nextCursor: $nextCursor }
              ) {
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
                    blockList {
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
    },
    async create() {
      const authStore = useAuthStore()
      await authStore.wait()

      const response = await $fetch<{ data: { createAnki: { url: string } } }>(
        '/api/graphql',
        {
          method: 'POST',
          headers: {
            Authorization: `${authStore.session.idToken}`
          },
          body: {
            query: `#graphql
              mutation CreateAnki($title: String!) {
                createAnki(input: {title: $title}) {
                  url
                }
              }
          `,
            variables: { title: '' }
          }
        }
      )

      const url = response.data.createAnki.url.replace('https://', 'notion://')

      window.open(url, '_blank')
    },
    async update({
      pageId,
      easeFactor,
      repetitionCount,
      nextReviewAt
    }: {
      pageId: string
      easeFactor: number
      repetitionCount: number
      nextReviewAt: string
    }) {
      this.updateLoading = true

      try {
        const authStore = useAuthStore()
        await authStore.wait()

        const _ = await $fetch<{
          data: { updateAnki: { url: string } }
        }>('/api/graphql', {
          method: 'POST',
          headers: {
            Authorization: `${authStore.session.idToken}`
          },
          body: {
            query: `#graphql
            mutation UpdateAnki($pageId: String!, $easeFactor: Float!, $repetitionCount: Int!, $nextReviewAt: String!) {
              updateAnki(
                input: {pageId: $pageId, easeFactor: $easeFactor, repetitionCount: $repetitionCount, nextReviewAt: $nextReviewAt}
              ) {
                pageId
                easeFactor
                repetitionCount
                nextReviewAt
              }
            }
          `,
            variables: { pageId, easeFactor, repetitionCount, nextReviewAt }
          }
        })
      } catch (error) {
      } finally {
        this.isShowAnswer = false
        this.updateLoading = false
      }

      await this.next()
    },
    async updateAnkiByPerformanceRating(
      performanceRating: 0 | 1 | 2 | 3 | 4 | 5 | number
    ) {
      if (this.getCurrentAnki == null) {
        throw new Error('No current learn')
      } else {
        const maxInterval = 365 / 4
        const minInterval = 0.5

        if (performanceRating < 3) {
          this.getCurrentAnki.easeFactor = Math.max(
            1.3,
            this.getCurrentAnki.easeFactor * 0.85
          )
          this.getCurrentAnki.repetitionCount = 0
        } else {
          this.getCurrentAnki.easeFactor +=
            0.1 -
            (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02)
          this.getCurrentAnki.repetitionCount += 1
        }

        let newInterval
        if (performanceRating === 0) {
          newInterval = minInterval
        } else if (performanceRating === 1) {
          newInterval = minInterval
        } else if (performanceRating === 2) {
          newInterval = Math.max(
            minInterval,
            this.getCurrentAnki.repetitionCount
          )
        } else {
          let multiplier = 1
          if (performanceRating === 3) {
            multiplier = 1
          } else if (performanceRating === 4) {
            multiplier = 1.5
          } else if (performanceRating === 5) {
            multiplier = 2
          }
          newInterval = Math.min(
            maxInterval,
            Math.pow(
              this.getCurrentAnki.easeFactor,
              this.getCurrentAnki.repetitionCount
            ) * multiplier
          )
        }

        this.getCurrentAnki.nextReviewAt = new Date(
          Date.now() + newInterval * 24 * 60 * 60 * 1000
        ).toISOString()

        await this.update({
          pageId: this.getCurrentAnki.pageId,
          easeFactor: this.getCurrentAnki.easeFactor,
          repetitionCount: this.getCurrentAnki.repetitionCount,
          nextReviewAt: this.getCurrentAnki.nextReviewAt
        })
      }
    },
    editCurrentAnki() {
      const currentAnki = this.getCurrentAnki
      if (currentAnki == null) {
        throw new Error('No current learn')
      } else {
        const url = currentAnki.url.replace('https://', 'notion://')
        window.open(url, '_blank')
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
