import { component$, type CSSProperties } from "@qwik.dev/core";

import styles from "./todo-severity.module.css";
import { components } from "~/openapi/schema";
import {
  mdiAlert,
  mdiAlertOctagram,
  mdiHelpRhombus,
  mdiInformation,
} from "@mdi/js";
import { ElmMdiIcon } from "@elmethis/qwik";

type Severity = components["schemas"]["ToDoSeverityResponse"];

export interface TodoSeverityProps {
  class?: string;

  style?: CSSProperties;

  severity: Severity;
}

const MAP: Record<
  Severity,
  {
    color: string;
    d: string;
  }
> = {
  UNKNOWN: {
    color: "#868e9c",
    d: mdiHelpRhombus,
  },
  DEBUG: {
    color: "#9a776b",
    d: mdiAlertOctagram,
  },
  INFO: {
    color: "#4c6da2",
    d: mdiInformation,
  },
  WARN: {
    color: "#bfa056",
    d: mdiAlert,
  },
  ERROR: {
    color: "#b34444",
    d: mdiAlertOctagram,
  },
};

export const TodoSeverity = component$<TodoSeverityProps>(
  ({ class: className, style, severity }) => {
    return (
      <span
        class={[styles["todo-severity"], className]}
        style={{ ...style, "--color": MAP[severity].color }}
      >
        <ElmMdiIcon d={MAP[severity].d} class={styles.icon} />
        <span class={styles.text}>{severity}</span>
      </span>
    );
  },
);
