import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from "solid-js";
import { useQueryClient } from "@tanstack/solid-query";
import {
  ElmBlockFallback,
  ElmHeading,
  ElmInlineText,
  ElmMdiIcon,
} from "@elmethis/solid";
import autoAnimate from "@formkit/auto-animate";
import { mdiAlert, mdiSortCalendarAscending, mdiSync } from "@mdi/js";

import styles from "./todo-container.module.css";
import { Todo } from "~/components/todo/todo";
import { TodoForm } from "~/components/todo/todo-form";
import { createClientQuery } from "~/client-query";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { queryKeys } from "~/query-client";
import { sortTodos, type ToDo, type TodoSort } from "./todo-sort";

export interface TodoContainerProps {
  class?: string;
  style?: JSX.CSSProperties;
}

type Severity = ToDo["severity"];

export const TodoContainer = (props: TodoContainerProps) => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [updatingIds, setUpdatingIds] = createSignal<string[]>([]);
  const [sort, setSort] = createSignal<TodoSort>("deadline");
  let todoItemContainerRef!: HTMLDivElement;

  const todosQuery = createClientQuery({
    queryKey: queryKeys.todos,
    enabled: () => Boolean(auth.accessToken()),
    queryFn: async ({ signal }) => {
      await auth.refresh();
      const accessToken = auth.accessToken();
      if (accessToken == null) throw new Error("Access token is null");

      const { data, error, response } = await openApiClient.GET(
        "/api/v1/to-do",
        {
          params: {
            header: { Authorization: `Bearer ${accessToken}` },
          },
          signal,
        },
      );
      if (!data) {
        throw new Error(
          `Failed to fetch todos (${response.status}): ${JSON.stringify(error)}`,
        );
      }
      return data;
    },
  });

  const todos = createMemo(() =>
    !auth.accessToken() || todosQuery.isPending()
      ? []
      : (todosQuery.data() ?? []),
  );
  const sortedTodos = createMemo(() => sortTodos(todos(), sort()));

  onMount(() => {
    const animationController = autoAnimate(todoItemContainerRef);

    onCleanup(() => {
      if (animationController.destroy) animationController.destroy();
      else animationController.disable();
    });
  });

  const handleUpdate = async (id: string, isDone: boolean) => {
    if (updatingIds().includes(id)) return;
    setUpdatingIds((current) => [...current, id]);

    try {
      await auth.refresh();
      const accessToken = auth.accessToken();
      if (accessToken == null) return;

      const { data } = await openApiClient.PUT("/api/v1/to-do", {
        params: { header: { Authorization: `Bearer ${accessToken}` } },
        body: { id, is_done: isDone },
      });

      if (data) {
        queryClient.setQueryData<ToDo[]>(queryKeys.todos, (current = []) =>
          current.map((item) => (item.id === id ? data : item)),
        );
      }
    } finally {
      setUpdatingIds((current) => current.filter((item) => item !== id));
    }
  };

  const submit = async ({
    title,
    severity,
    deadline,
  }: {
    title: string;
    severity: Severity;
    deadline?: string;
  }) => {
    await auth.refresh();
    const accessToken = auth.accessToken();
    if (accessToken == null) throw new Error("Access token is null");

    const { data } = await openApiClient.POST("/api/v1/to-do", {
      params: {
        header: { Authorization: `Bearer ${accessToken}` },
      },
      body: { title, severity, deadline },
    });

    if (data) {
      queryClient.setQueryData<ToDo[]>(queryKeys.todos, (current = []) => [
        ...current,
        data,
      ]);
    }
  };

  return (
    <div
      class={`${styles["todo-container"]} ${props.class ?? ""}`}
      style={props.style}
    >
      <ElmHeading level={2}>To Do</ElmHeading>

      <TodoForm submit={submit} />

      <div class={styles["sort-container"]}>
        <div
          class={styles["sort-button"]}
          classList={{ [styles.selected]: sort() === "deadline" }}
          onClick={() => setSort("deadline")}
        >
          <ElmMdiIcon d={mdiSortCalendarAscending} />
          <ElmInlineText>Deadline</ElmInlineText>
        </div>

        <div
          class={styles["sort-button"]}
          classList={{ [styles.selected]: sort() === "severity" }}
          onClick={() => setSort("severity")}
        >
          <ElmMdiIcon d={mdiAlert} />
          <ElmInlineText>Severity</ElmInlineText>
        </div>

        <button
          type="button"
          class={styles["sync-button"]}
          aria-label="Refresh to-dos"
          disabled={todosQuery.isFetching()}
          onClick={() => void todosQuery.refetch()}
        >
          <ElmMdiIcon
            d={mdiSync}
            size="1.5rem"
            class={`${styles["sync-icon"]} ${todosQuery.isFetching() ? styles.loading : ""}`}
            color={todosQuery.isFetching() ? "#cdb57b" : undefined}
          />
        </button>
      </div>

      <div ref={todoItemContainerRef} class={styles["todo-item-container"]}>
        <Show when={todos().length > 0} fallback={<ElmBlockFallback />}>
          <For each={sortedTodos()}>
            {(item) => (
              <Todo
                id={item.id}
                title={item.title}
                url={item.url}
                deadline={item.deadline}
                severity={item.severity}
                is_recurring={item.is_recurring}
                is_done={item.is_done}
                onClick={handleUpdate}
                isLoading={updatingIds().includes(item.id)}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};
