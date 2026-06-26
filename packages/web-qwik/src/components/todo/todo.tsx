import {
  component$,
  QRL,
  useComputed$,
  type CSSProperties,
} from "@qwik.dev/core";

import styles from "./todo.module.css";
import { ElmInlineIcon, ElmInlineText, ElmMdiIcon } from "@elmethis/qwik";

import NotionIcon from "~/assets/notion.svg?url";
import { mdiCalendar, mdiRefresh } from "@mdi/js";

import { Temporal } from "@js-temporal/polyfill";
import { components } from "~/openapi/schema";
import { TodoSeverity } from "./todo-severity";

export interface DeadlineProps {
  class?: string;

  style?: CSSProperties;

  deadline?: string | null;
}

export const Deadline = component$<DeadlineProps>(
  ({ class: className, style, deadline }) => {
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
      <div class={[styles["todo-item-deadline"], className]} style={style}>
        <ElmInlineText size="1rem">
          {Temporal.PlainDate.from(deadline).toString().substring(0, 10)}
        </ElmInlineText>

        <ElmInlineText size="0.85rem" color={duration.value.color} bold>
          {duration.value.text}
        </ElmInlineText>
      </div>
    );
  },
);

type Severity = components["schemas"]["ToDoSeverityResponse"];

export interface TodoProps {
  class?: string;

  style?: CSSProperties;

  id: string;
  title: string;
  url: string;
  deadline?: string | null;
  severity: Severity;
  is_recurring: boolean;
  is_done: boolean;
  isLoading?: boolean;
  onClick$: QRL<(id: string, is_done: boolean) => Promise<void>>;
}

export const Todo = component$<TodoProps>((props) => {
  const {
    class: className,
    style,
    id,
    title,
    url,
    deadline,
    severity,
    is_recurring,
    is_done,
    isLoading,
  } = props;

  return (
    <div
      key={id}
      class={[
        styles["todo-item-row"],
        className,
        {
          [styles["loading"]]: isLoading,
          [styles["is-done"]]: is_done,
        },
      ]}
      style={style}
    >
      <span
        class={[
          styles["todo-item-checkbox"],
          {
            [styles["is-done"]]: is_done,
          },
        ]}
        onClick$={() => props.onClick$(props.id, !props.is_done)}
      ></span>

      <ElmInlineIcon src={NotionIcon} class={styles["todo-item-notion-icon"]} />
      <ElmMdiIcon
        d={mdiRefresh}
        size="1.5rem"
        color={is_recurring ? "#59b57c" : "gray"}
        class={[
          styles["todo-item-recurring-icon"],
          {
            [styles["disabled"]]: !is_recurring,
          },
        ]}
      />

      <TodoSeverity class={styles["todo-item-severity"]} severity={severity} />

      <ElmMdiIcon
        d={mdiCalendar}
        size="1.25rem"
        style={{
          opacity: deadline ? 1 : 0.25,
        }}
        class={styles["todo-item-deadline-icon"]}
      />

      <Deadline deadline={deadline} class={styles["todo-item-deadline"]} />

      <a href={url} class={styles["todo-item-text"]}>
        {title}
      </a>

      {isLoading && <div class={styles["loading-bar"]}></div>}
    </div>
  );
});
