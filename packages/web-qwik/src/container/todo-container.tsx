import {
  $,
  component$,
  Fragment,
  useContext,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./todo-container.module.css";
import {
  ElmBlockFallback,
  ElmHeading,
  ElmInlineIcon,
  ElmInlineText,
  useAsyncState,
} from "@elmethis/qwik";
import { openApiClient } from "~/openapi/client";
import { AuthContext } from "~/context/auth-context";

import NotionIcon from "~/assets/notion.svg?url";

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
                <span
                  class={styles["todo-item-severity"]}
                  style={{ "--color": colorMap[item.severity] }}
                >
                  {item.severity}
                </span>
                <ElmInlineText href={item.url}>{item.title}</ElmInlineText>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    );
  },
);
