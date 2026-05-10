import {
  component$,
  QRL,
  useComputed$,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./todo.module.css";
import { ElmInlineIcon, ElmInlineText, ElmMdiIcon } from "@elmethis/qwik";

import NotionIcon from "~/assets/notion.svg?url";
import { mdiCalendar, mdiRefresh } from "@mdi/js";

import { Temporal } from "@js-temporal/polyfill";

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

export interface TodoProps {
  class?: string;

  style?: CSSProperties;

  id: string;
  title: string;
  url: string;
  deadline?: string | null;
  severity: "Unknown" | "Backlog" | "Info" | "Warn" | "Error";
  is_recurring: boolean;
  isLoading?: boolean;
  onClick$?: QRL<(id: string) => Promise<void>>;
}

const colorMap: Record<
  "Unknown" | "Backlog" | "Info" | "Warn" | "Error",
  string
> = {
  Unknown: "#868e9c",
  Backlog: "#9a776b",
  Info: "#4c6da2",
  Warn: "#bfa056",
  Error: "#b34444",
};

export const Todo = component$<TodoProps>(
  ({
    class: className,
    style,
    id,
    title,
    url,
    deadline,
    severity,
    is_recurring,
    isLoading,
    onClick$,
  }) => {
    return (
      <div
        key={id}
        class={[
          styles["todo-item-row"],
          className,
          {
            [styles["loading"]]: isLoading,
          },
        ]}
        style={style}
      >
        <span
          class={[styles["todo-item-checkbox"]]}
          onClick$={() => onClick$?.(id)}
        ></span>

        <ElmInlineIcon
          src={NotionIcon}
          class={styles["todo-item-notion-icon"]}
        />
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

        <span
          class={styles["todo-item-severity"]}
          style={{ "--color": colorMap[severity] }}
        >
          {severity}
        </span>

        <ElmMdiIcon
          d={mdiCalendar}
          size="1.25rem"
          style={{
            opacity: deadline ? 1 : 0.25,
          }}
          class={styles["todo-item-deadline-icon"]}
        />

        <Deadline deadline={deadline} class={styles["todo-item-deadline"]} />

        <a
          href={url.replace("https://", "notion://")}
          class={styles["todo-item-text"]}
        >
          {title}
        </a>
      </div>
    );
  },
);
