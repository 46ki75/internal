import {
  $,
  component$,
  Fragment,
  useComputed$,
  useContext,
  useSignal,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./todo-container.module.css";
import {
  ElmBlockFallback,
  ElmHeading,
  ElmInlineIcon,
  ElmInlineText,
  ElmMdiIcon,
  useAsyncState,
} from "@elmethis/qwik";
import { openApiClient } from "~/openapi/client";
import { AuthContext } from "~/context/auth-context";

import NotionIcon from "~/assets/notion.svg?url";
import {
  mdiAlert,
  mdiCalendar,
  mdiRefresh,
  mdiSortCalendarAscending,
} from "@mdi/js";

import { Temporal } from "@js-temporal/polyfill";

const Deadline = component$(({ deadline }: { deadline?: string | null }) => {
  if (!deadline) return <div>-</div>;

  const duration = useComputed$(() => {
    const today = Temporal.Now.plainDateISO();
    const durationInDays = today
      .until(Temporal.PlainDate.from(deadline))
      .total({ unit: "day" });

    const color =
      durationInDays <= 0
        ? "#c56565"
        : durationInDays <= 3
          ? "#d48b70"
          : durationInDays <= 7
            ? "#cdb57b"
            : durationInDays <= 14
              ? "#59b57c"
              : "#5879b0";

    const text =
      durationInDays === 0
        ? "Today"
        : durationInDays < 0
          ? `${-durationInDays} days ago`
          : `${durationInDays} days remaining`;

    return { text, color };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <ElmInlineText size="1rem">
        {Temporal.PlainDate.from(deadline).toString().substring(0, 10)}
      </ElmInlineText>

      <ElmInlineText
        size="0.75rem"
        color={duration.value.color}
        style={{ paddingLeft: 2 }}
      >
        {duration.value.text}
      </ElmInlineText>
    </div>
  );
});

export interface TodoContainerProps {
  class?: string;

  style?: CSSProperties;
}

export const TodoContainer = component$<TodoContainerProps>(
  ({ class: className, style }) => {
    const authStore = useContext(AuthContext);

    const { state, isLoading } = useAsyncState(
      $(async () => {
        await authStore.tokens.refresh(authStore);
        const accessToken = authStore.tokens.accessToken;

        if (accessToken == null) throw new Error("Access token is null");

        const res = await openApiClient.GET("/api/v1/to-do", {
          params: {
            header: { Authorization: `Bearer ${accessToken}` },
          },
        });

        return res.data;
      }),
      [],
      {
        immediate: true,
      },
    );

    const colorMap: Record<"Unknown" | "Info" | "Warn" | "Error", string> = {
      Unknown: "#868e9c",
      Info: "#4c6da2",
      Warn: "#bfa056",
      Error: "#b34444",
    };

    const sort = useSignal<"deadline" | "severity">("deadline");

    const sortedTodos = useComputed$(() => {
      if (!state.value) return [];

      const sorted = [...state.value];

      const deadlineSortFn = (
        a: (typeof state.value)[0],
        b: (typeof state.value)[0],
      ) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;

        return Temporal.PlainDate.from(a.deadline)
          .since(Temporal.PlainDate.from(b.deadline))
          .total({ unit: "day" });
      };

      const severitySortFn = (
        a: (typeof state.value)[0],
        b: (typeof state.value)[0],
      ) => {
        const severityOrder: Record<string, number> = {
          Error: 3,
          Warn: 2,
          Info: 1,
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
            onClick$={() => (sort.value = "deadline")}
          >
            <ElmMdiIcon d={mdiSortCalendarAscending} />
            <ElmInlineText>Deadline</ElmInlineText>
          </div>

          <div
            class={[
              styles["sort-button"],
              { [styles["selected"]]: sort.value === "severity" },
            ]}
            onClick$={() => (sort.value = "severity")}
          >
            <ElmMdiIcon d={mdiAlert} />
            <ElmInlineText>Severity</ElmInlineText>
          </div>
        </div>

        {isLoading.value ? (
          <ElmBlockFallback></ElmBlockFallback>
        ) : (
          <div class={styles["todo-item-container"]}>
            {sortedTodos.value?.map((item) => (
              <Fragment key={item.id}>
                <ElmInlineIcon src={NotionIcon} />
                <span>
                  {item.is_recurring && (
                    <ElmMdiIcon d={mdiRefresh} color="#59b57c" />
                  )}
                </span>
                <span
                  class={styles["todo-item-severity"]}
                  style={{ "--color": colorMap[item.severity] }}
                >
                  {item.severity}
                </span>
                <ElmInlineText href={item.url}>{item.title}</ElmInlineText>

                <ElmMdiIcon
                  d={mdiCalendar}
                  style={{
                    opacity: item.deadline ? 1 : 0.25,
                  }}
                />

                <Deadline deadline={item.deadline} />
              </Fragment>
            ))}
          </div>
        )}
      </div>
    );
  },
);
