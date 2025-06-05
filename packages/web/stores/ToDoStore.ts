import { z } from "zod";

const ToDoSchema = z.object({
  id: z.string(),
  url: z.string(),
  source: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  isDone: z.boolean(),
  deadline: z.string().nullable().optional(),
  severity: z
    .enum(["UNKNOWN", "INFO", "WARN", "ERROR", "FATAL"])
    .default("UNKNOWN"),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

type ToDoSchemaType = z.infer<typeof ToDoSchema>;

const query = /* GraphQL */ `
  query ToDoList {
    toDoList {
      id
      source
      title
      description
      url
      isDone
      severity
      createdAt
      updatedAt
    }
  }
`;

const createMutation = /* GraphQL */ `
  mutation CreateToDO($title: String!) {
    createTodo(input: { title: $title }) {
      id
      source
      title
      description
      url
      isDone
      severity
      createdAt
      updatedAt
    }
  }
`;

const updateMutation = /* GraphQL */ `
  mutation UpdateToDo($id: String!, $isDone: Boolean!) {
    updateTodo(input: { id: $id, isDone: $isDone }) {
      id
      source
      title
      description
      url
      isDone
      severity
      createdAt
      updatedAt
    }
  }
`;

export const useToDoStore = defineStore("todo", {
  state: () => {
    return {
      toDoList: [] as ToDoSchemaType[],

      fetchState: {
        loading: false,
        error: null as string | null,
      },

      createState: {
        loading: false,
        error: null as string | null,
      },

      updateState: {
        loading: false,
        error: null as string | null,
      },
    };
  },
  actions: {
    async fetch() {
      this.fetchState.loading = true;
      this.fetchState.error = null;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const response = await $fetch<{
          data: {
            toDoList: ToDoSchemaType[];
          };
        }>("/api/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authStore.session.accessToken as string,
          },
          body: JSON.stringify({ query }),
        });

        this.toDoList = response.data.toDoList;
      } catch (error: unknown) {
        this.fetchState.error = (error as Error)?.message;
      } finally {
        this.fetchState.loading = false;
      }
    },
    async create({ title }: { title: string }) {
      this.createState.loading = true;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const response = await $fetch<{
          data: { createTodo: ToDoSchemaType };
        }>("/api/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authStore.session.accessToken as string,
          },
          body: JSON.stringify({
            query: createMutation,
            variables: { title },
          }),
        });

        this.toDoList.push(response.data.createTodo);
      } catch (error: unknown) {
        this.createState.error = (error as Error)?.message;
      } finally {
        this.createState.loading = false;
      }
    },
    async update({ id, isDone }: { id: string; isDone: boolean }) {
      this.updateState.loading = true;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const response = await $fetch<{
          data: { updateTodo: ToDoSchemaType };
        }>("/api/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authStore.session.accessToken as string,
          },
          body: JSON.stringify({
            query: updateMutation,
            variables: { id, isDone },
          }),
        });

        this.toDoList = this.toDoList.filter((todo) => todo.id !== id);
      } catch (error: unknown) {
        this.updateState.error = (error as Error)?.message;
      } finally {
        this.updateState.loading = false;
      }
    },
  },
});
