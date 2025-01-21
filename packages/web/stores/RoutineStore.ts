import { execute } from '@com.46ki75/graphql'
import { z } from 'zod'

const RoutineSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
  isDone: z.boolean(),
  dayOfWeek: z.array(z.string())
})

const PageInforSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  startCursor: z.string().nullable().optional(),
  endCursor: z.string().nullable().optional(),
  nextCursor: z.string().nullable().optional()
})

const EdgeSchema = z.object({
  node: RoutineSchema,
  cursor: z.string()
})

const ConnectionScema = z.object({
  edges: z.array(EdgeSchema),
  pageInfo: PageInforSchema
})

type Routine = z.infer<typeof RoutineSchema>

type Connection = z.infer<typeof ConnectionScema>

const query = /* GraphQL */ `
  query ListRoutine($dayOfWeek: String) {
    routineList(input: { dayOfWeek: $dayOfWeek }) {
      edges {
        node {
          id
          url
          name
          dayOfWeekList
          isDone
        }
      }
    }
  }
`

const mutation = /* GraphQL */ `
  mutation UpdateRoutine($id: String!, $isDone: Boolean!) {
    updateRoutine(input: { id: $id, isDone: $isDone }) {
      id
      url
      name
      dayOfWeekList
      isDone
    }
  }
`

const dayOfWeekList = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

export const useRoutineStore = defineStore('routine', {
  state: () => {
    return {
      routineList: [] as Connection['edges'][number]['node'][],
      loading: false,
      error: null as string | null
    }
  },
  actions: {
    async fetch() {
      this.loading = true

      const authStore = useAuthStore()
      if (authStore.session.idToken == null) {
        await authStore.refresh()
        if (authStore.session.idToken == null) {
          return
        }
      }
      try {
        const response = await execute<{ routineList: Connection }>({
          endpoint: '/api/graphql',
          query,
          variables: {
            dayOfWeek: dayOfWeekList[new Date().getDay()]
          },
          headers: {
            Authorization: authStore.session.idToken
          }
        })

        this.routineList = response.routineList.edges.map((edge) => edge.node)
      } catch (error: unknown) {
        this.error = (error as Error)?.message
      } finally {
        this.loading = false
      }
    },
    async update({ id, isDone }: { id: string; isDone: boolean }) {
      const authStore = useAuthStore()
      if (authStore.session.idToken == null) {
        await authStore.refresh()
        if (authStore.session.idToken == null) {
          return
        }
      }
      try {
        const response = await $fetch<{
          data: {
            updateRoutine: Routine
          }
        }>('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authStore.session.idToken
          },
          body: JSON.stringify({
            query: mutation,
            variables: {
              id,
              isDone
            }
          })
        })

        const updatedRoutine = response.data.updateRoutine

        const index = this.routineList.findIndex((routine) => routine.id === id)
        if (index !== -1) {
          this.routineList[index] = updatedRoutine
        }
      } catch (error: unknown) {
        this.error = (error as Error)?.message
      }
    }
  }
})
