import { createMemo, Show, type JSX } from "solid-js";

import styles from "./todo.module.css";
import { ElmInlineIcon, ElmInlineText, ElmMdiIcon } from "@elmethis/solid";

import NotionIcon from "~/assets/notion.svg?url";
import { mdiCalendar, mdiRefresh } from "@mdi/js";

import { Temporal } from "@js-temporal/polyfill";
import { components } from "~/openapi/schema";
import { TodoSeverity } from "./todo-severity";

export interface DeadlineProps {
  class?: string;

  style?: JSX.CSSProperties;

  deadline?: string | null;
}

export const Deadline = (props: DeadlineProps) => {
  const duration = createMemo(() => {
    if (!props.deadline) return null;
    const today = Temporal.Now.plainDateISO();
    const durationInDays = today
      .until(Temporal.PlainDate.from(props.deadline))
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

    return {
      date: Temporal.PlainDate.from(props.deadline).toString().substring(0, 10),
      text,
      color,
    };
  });

  return (
    <Show when={duration()} keyed fallback={<div>-</div>}>
      {(value) => (
        <div
          class={`${styles["todo-item-deadline"]} ${props.class ?? ""}`}
          style={props.style}
        >
          <ElmInlineText size="1rem">{value.date}</ElmInlineText>
          <ElmInlineText size="0.85rem" color={value.color} bold>
            {value.text}
          </ElmInlineText>
        </div>
      )}
    </Show>
  );
};

type Severity = components["schemas"]["ToDoSeverityResponse"];

export interface TodoProps {
  class?: string;

  style?: JSX.CSSProperties;

  id: string;
  title: string;
  url: string;
  deadline?: string | null;
  severity: Severity;
  is_recurring: boolean;
  is_done: boolean;
  isLoading?: boolean;
  onClick: (id: string, isDone: boolean) => void | Promise<void>;
}

export const Todo = (props: TodoProps) => {
  return (
    <div
      class={`${styles["todo-item-row"]} ${props.class ?? ""}`}
      classList={{
        [styles.loading]: Boolean(props.isLoading),
        [styles["is-done"]]: props.is_done,
      }}
      style={props.style}
    >
      <button
        type="button"
        aria-label={
          props.is_done
            ? `Mark ${props.title} incomplete`
            : `Mark ${props.title} complete`
        }
        aria-pressed={props.is_done}
        class={styles["todo-item-checkbox"]}
        classList={{ [styles["is-done"]]: props.is_done }}
        style={{
          padding: "0",
          "background-color": props.is_done ? undefined : "transparent",
        }}
        onClick={() => props.onClick(props.id, !props.is_done)}
      />

      <ElmInlineIcon src={NotionIcon} class={styles["todo-item-notion-icon"]} />
      <ElmMdiIcon
        d={mdiRefresh}
        size="1.5rem"
        color={props.is_recurring ? "#59b57c" : "gray"}
        class={styles["todo-item-recurring-icon"]}
        classList={{ [styles.disabled]: !props.is_recurring }}
      />

      <TodoSeverity
        class={styles["todo-item-severity"]}
        severity={props.severity}
      />

      <ElmMdiIcon
        d={mdiCalendar}
        size="1.25rem"
        style={{
          opacity: props.deadline ? 1 : 0.25,
        }}
        class={styles["todo-item-deadline-icon"]}
      />

      <Deadline
        deadline={props.deadline}
        class={styles["todo-item-deadline"]}
      />

      <a href={props.url} class={styles["todo-item-text"]}>
        {props.title}
      </a>

      <Show when={props.isLoading}>
        <div class={styles["loading-bar"]} />
      </Show>
    </div>
  );
};
