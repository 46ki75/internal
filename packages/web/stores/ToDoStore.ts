import { openApiClient } from "~/openapi/client";
import type { components } from "~/openapi/schema";

export const useToDoStore = defineStore("todo", {
  state: () => {
    return {
      toDoList: [] as components["schemas"]["ToDoResponse"][],

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

      if (authStore.session.accessToken == null) {
        this.fetchState.error = "Failed to fetch access token.";
        return;
      }

      try {
        const response = await openApiClient.GET("/api/v1/to-do", {
          params: {
            header: { Authorization: authStore.session.accessToken },
          },
        });

        if (response.data == null) return;

        this.toDoList = response.data;
      } catch (error: unknown) {
        this.fetchState.error = (error as Error)?.message;
      } finally {
        this.fetchState.loading = false;
      }
    },
    async create({
      title,
      description,
    }: {
      title: string;
      description?: string;
    }) {
      this.createState.loading = true;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      if (authStore.session.accessToken == null) {
        this.fetchState.error = "Failed to fetch access token.";
        return;
      }

      try {
        const response = await openApiClient.POST("/api/v1/to-do", {
          params: { header: { Authorization: authStore.session.accessToken } },
          body: {
            title,
            description,
            severity: "Info",
          },
        });

        if (response.data == null) return;

        this.toDoList.push(response.data);
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

      if (authStore.session.accessToken == null) {
        this.fetchState.error = "Failed to fetch access token.";
        return;
      }

      try {
        await openApiClient.PUT("/api/v1/to-do", {
          params: { header: { Authorization: authStore.session.accessToken } },
          body: { id, is_done: isDone },
        });

        this.toDoList = this.toDoList.filter((toDo) => toDo);
      } catch (error: unknown) {
        this.updateState.error = (error as Error)?.message;
      } finally {
        this.updateState.loading = false;
      }
    },
  },
});
