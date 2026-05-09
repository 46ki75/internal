import {
  $,
  component$,
  Fragment,
  useComputed$,
  useContext,
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
import { mdiCalendar, mdiRefresh } from "@mdi/js";

import { Temporal } from "@js-temporal/polyfill";

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

    const Deadline = component$(
      ({ deadline }: { deadline?: string | null }) => {
        if (!deadline) return <div>-</div>;

        const duration = useComputed$(() => {
          const today = Temporal.Now.plainDateISO();
          const deadlineDate = Temporal.PlainDate.from(deadline);
          const durationInDays = today
            .until(deadlineDate)
            .total({ unit: "day" });

          if (durationInDays === 0) {
            return { text: `Today`, color: "#c56565" };
          } else if (durationInDays < 0) {
            return { text: `${-durationInDays} days ago`, color: "#c56565" };
          } else if (durationInDays <= 3) {
            return {
              text: `${durationInDays} days remaining`,
              color: "#d48b70",
            };
          } else if (durationInDays <= 7) {
            return {
              text: `${durationInDays} days remaining`,
              color: "#cdb57b",
            };
          } else if (durationInDays <= 14) {
            return {
              text: `${durationInDays} days remaining`,
              color: "#59b57c",
            };
          }

          return {
            text: `${durationInDays} days remaining`,
            color: "#5879b0",
          };
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
      },
    );

    return (
      <div class={[styles["todo-container"], className]} style={style}>
        <ElmHeading level={3}>To Do</ElmHeading>

        {isLoading.value ? (
          <ElmBlockFallback></ElmBlockFallback>
        ) : (
          <div class={styles["todo-item-container"]}>
            {state.value?.map((item) => (
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
