import { z } from 'zod'

const ToDoSchema = z.object({
  id: z.string(),
  url: z.string(),
  source: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  isDone: z.boolean(),
  deadline: z.string().nullable().optional(),
  severity: z
    .enum(['UNKNOWN', 'INFO', 'WARN', 'ERROR', 'FATAL'])
    .default('UNKNOWN'),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional()
})

const PageInforSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  startCursor: z.string().nullable().optional(),
  endCursor: z.string().nullable().optional(),
  nextCursor: z.string().nullable().optional()
})

const EdgeSchema = z.object({
  node: ToDoSchema,
  cursor: z.string()
})

const ConnectionScema = z.object({
  edges: z.array(EdgeSchema),
  pageInfo: PageInforSchema
})

type Connection = z.infer<typeof ConnectionScema>

const query = /* GraphQL */ `
  query ToDo {
    githubNotificationList {
      ...ToDoFragment
    }
    notionTodoList {
      ...ToDoFragment
    }
  }

  fragment ToDoFragment on ToDoConnection {
    edges {
      node {
        id
        url
        source
        title
        description
        isDone
        deadline
        severity
        createdAt
        updatedAt
      }
    }
  }
`

export const useToDoStore = defineStore('todo', {
  state: () => {
    return {
      todoList: [] as Connection['edges'][number]['node'][],
      loading: false,
      error: null as string | null
    }
  },
  actions: {
    async fetch() {
      this.loading = true

      const authStore = useAuthStore()
      if (authStore.session.idToken == null) {
        await authStore.refreshAccessToken()
        if (authStore.session.idToken == null) {
          return
        }
      }

      try {
        const response = await $fetch<{
          data: {
            githubNotificationList: Connection
            notionTodoList: Connection
          }
        }>('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authStore.session.idToken
          },
          body: JSON.stringify({ query })
        })

        this.todoList = response.data.notionTodoList.edges
          .map((edge) => edge.node)
          .concat(
            response.data.githubNotificationList.edges.map((edge) => edge.node)
          )
      } catch (error: unknown) {
        this.error = (error as Error)?.message
      } finally {
        this.loading = false
      }
    }
  }
})
