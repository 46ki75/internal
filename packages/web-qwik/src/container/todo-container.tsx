import {
  $,
  component$,
  useComputed$,
  useContext,
  useOnWindow,
  useSignal,
  useStore,
  useVisibleTask$,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./todo-container.module.css";
import {
  ElmBlockFallback,
  ElmHeading,
  ElmInlineText,
  ElmMdiIcon,
} from "@elmethis/qwik";
import { openApiClient } from "~/openapi/client";
import { AuthContext } from "~/context/auth-context";

import { mdiAlert, mdiSortCalendarAscending, mdiSync } from "@mdi/js";

import { Temporal } from "@js-temporal/polyfill";
import { Todo } from "~/components/todo/todo";

import { delay } from "es-toolkit";
import { paths } from "~/openapi/schema";

export interface TodoContainerProps {
  class?: string;

  style?: CSSProperties;
}

type ToDo =
  paths["/api/v1/to-do"]["get"]["responses"]["200"]["content"]["application/json"][number];

export const TodoContainer = component$<TodoContainerProps>(
  ({ class: className, style }) => {
    const authStore = useContext(AuthContext);

    const todos = useSignal<ToDo[]>([]);
    const isLoading = useSignal(true);

    const execute = $(async () => {
      isLoading.value = true;
      try {
        await authStore.tokens.refresh(authStore);
        const accessToken = authStore.tokens.accessToken;

        if (accessToken == null) throw new Error("Access token is null");

        const res = await openApiClient.GET("/api/v1/to-do", {
          params: {
            header: { Authorization: `Bearer ${accessToken}` },
          },
        });

        document.startViewTransition(async () => {
          todos.value = res.data || [];
          await delay(0);
        });
      } finally {
        isLoading.value = false;
      }
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(async () => {
      await execute();
    });
    useOnWindow("focus", execute);

    const updateStateStore = useStore<{
      updatingIds: Array<string>;
    }>({
      updatingIds: [],
    });

    const handleUpdate = $(async (id: string) => {
      if (updateStateStore.updatingIds.includes(id)) return;

      updateStateStore.updatingIds.push(id);

      try {
        await authStore.tokens.refresh(authStore);
        const accessToken = authStore.tokens.accessToken;

        if (accessToken == null) throw new Error("Access token is null");

        await openApiClient.PUT("/api/v1/to-do", {
          params: { header: { Authorization: `Bearer ${accessToken}` } },
          body: { id: id, is_done: true },
        });

        if (todos.value != null) {
          document.startViewTransition(async () => {
            todos.value = todos.value?.filter((item) => item.id !== id);
            await delay(0);
          });
        }
      } finally {
        const index = updateStateStore.updatingIds.indexOf(id);
        if (index !== -1) {
          updateStateStore.updatingIds.splice(index, 1);
        }
      }
    });

    const sort = useSignal<"deadline" | "severity">("deadline");

    const handleSort = $((newSort: "deadline" | "severity") => {
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document
      ) {
        document.startViewTransition(() => {
          sort.value = newSort;
        });
      } else {
        sort.value = newSort;
      }
    });

    const sortedTodos = useComputed$(() => {
      if (!todos.value) return [];

      const sorted = [...todos.value];

      const deadlineSortFn = (
        a: (typeof todos.value)[0],
        b: (typeof todos.value)[0],
      ) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;

        return Temporal.PlainDate.from(a.deadline)
          .since(Temporal.PlainDate.from(b.deadline))
          .total({ unit: "day" });
      };

      const severitySortFn = (
        a: (typeof todos.value)[0],
        b: (typeof todos.value)[0],
      ) => {
        const severityOrder: Record<string, number> = {
          Error: 4,
          Warn: 3,
          Info: 2,
          Backlog: 1,
          Unknown: 0,
        };

        return severityOrder[b.severity] - severityOrder[a.severity];
      };

      if (sort.value === "deadline") {
        return sorted.sort(
          (a, b) => deadlineSortFn(a, b) || severitySortFn(a, b),
        );
      } else {
        return sorted.sort(
          (a, b) => severitySortFn(a, b) || deadlineSortFn(a, b),
        );
      }
    });

    return (
      <div class={[styles["todo-container"], className]} style={style}>
        <ElmHeading level={3}>To Do</ElmHeading>

        <div class={styles["sort-container"]}>
          <div
            class={[
              styles["sort-button"],
              { [styles["selected"]]: sort.value === "deadline" },
            ]}
            onClick$={() => handleSort("deadline")}
          >
            <ElmMdiIcon d={mdiSortCalendarAscending} />
            <ElmInlineText>Deadline</ElmInlineText>
          </div>

          <div
            class={[
              styles["sort-button"],
              { [styles["selected"]]: sort.value === "severity" },
            ]}
            onClick$={() => handleSort("severity")}
          >
            <ElmMdiIcon d={mdiAlert} />
            <ElmInlineText>Severity</ElmInlineText>
          </div>

          <ElmMdiIcon
            d={mdiSync}
            size="1.5rem"
            class={[
              styles["sync-icon"],
              { [styles["loading"]]: isLoading.value },
            ]}
            color={isLoading.value ? "#cdb57b" : undefined}
          />
        </div>

        {todos.value.length === 0 ? (
          <ElmBlockFallback></ElmBlockFallback>
        ) : (
          <div class={styles["todo-item-container"]}>
            {sortedTodos.value?.map((item) => (
              <Todo
                key={item.id}
                id={item.id}
                title={item.title}
                url={item.url}
                deadline={item.deadline}
                severity={item.severity}
                is_recurring={item.is_recurring}
                style={{
                  viewTransitionName: `todo-${item.id}`,
                }}
                onClick$={handleUpdate}
                isLoading={updateStateStore.updatingIds.includes(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);
