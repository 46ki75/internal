import type { has } from 'lodash-es'
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

const fragment = /* GraphQL */ `
  fragment ToDoFragment on ToDo {
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
`

const query = /* GraphQL */ `
  query ToDo {
    githubNotificationList {
      ...ToDoConnectionFragment
    }
    notionTodoList {
      ...ToDoConnectionFragment
    }
  }

  fragment ToDoConnectionFragment on ToDoConnection {
    edges {
      node {
        ...ToDoFragment
      }
    }
  }

  ${fragment}
`

const createMutation = /* GraphQL */ `
  mutation CreateToDO($title: String!) {
    createTodo(input: { title: $title }) {
      ...ToDoFragment
    }
  }

  ${fragment}
`

const updateMutation = /* GraphQL */ `
  mutation UpdateToDo($id: String!, $isDone: Boolean!) {
    updateTodo(input: { id: $id, isDone: $isDone }) {
      ...ToDoFragment
    }
  }
  ${fragment}
`

export const useToDoStore = defineStore('todo', {
  state: () => {
    return {
      todoList: [] as Connection['edges'][number]['node'][],

      fetchState: {
        loading: false,
        error: null as string | null
      },

      createState: {
        loading: false,
        error: null as string | null
      },

      updateState: {
        loading: false,
        error: null as string | null
      }
    }
  },
  actions: {
    async fetch() {
      this.fetchState.loading = true
      this.fetchState.error = null

      const authStore = useAuthStore()
      await authStore.refreshIfNeed()

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
            Authorization: authStore.session.accessToken as string
          },
          body: JSON.stringify({ query })
        })

        this.todoList = response.data.notionTodoList.edges
          .map((edge) => edge.node)
          .concat(
            response.data.githubNotificationList.edges.map((edge) => edge.node)
          )
      } catch (error: unknown) {
        this.fetchState.error = (error as Error)?.message
      } finally {
        this.fetchState.loading = false
      }
    },
    async create({ title }: { title: string }) {
      this.createState.loading = true

      const authStore = useAuthStore()
      await authStore.refreshIfNeed()

      try {
        const response = await $fetch<{
          data: { createTodo: Connection['edges'][number]['node'] }
        }>('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authStore.session.accessToken as string
          },
          body: JSON.stringify({
            query: createMutation,
            variables: { title }
          })
        })

        this.todoList.push(response.data.createTodo)
      } catch (error: unknown) {
        this.createState.error = (error as Error)?.message
      } finally {
        this.createState.loading = false
      }
    },
    async update({ id, isDone }: { id: string; isDone: boolean }) {
      this.updateState.loading = true

      const authStore = useAuthStore()
      await authStore.refreshIfNeed()

      try {
        const response = await $fetch<{
          data: { updateTodo: Connection['edges'][number]['node'] }
        }>('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authStore.session.accessToken as string
          },
          body: JSON.stringify({
            query: updateMutation,
            variables: { id, isDone }
          })
        })

        this.todoList = this.todoList.filter((todo) => todo.id !== id)
      } catch (error: unknown) {
        this.updateState.error = (error as Error)?.message
      } finally {
        this.updateState.loading = false
      }
    }
  }
})
