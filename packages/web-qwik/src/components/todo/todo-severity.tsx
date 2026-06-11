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
    className: string;
    d: string;
  }
> = {
  UNKNOWN: {
    className: styles.unknown,
    d: mdiHelpRhombus,
  },
  DEBUG: {
    className: styles.debug,
    d: mdiAlertOctagram,
  },
  INFO: {
    className: styles.info,
    d: mdiInformation,
  },
  WARN: {
    className: styles.warn,
    d: mdiAlert,
  },
  ERROR: {
    className: styles.error,
    d: mdiAlertOctagram,
  },
};

export const TodoSeverity = component$<TodoSeverityProps>(
  ({ class: className, style, severity }) => {
    return (
      <span
        class={[styles["todo-severity"], MAP[severity].className, className]}
        style={style}
      >
        <ElmMdiIcon d={MAP[severity].d} class={styles.icon} />
        <span class={styles.text}>{severity}</span>
      </span>
    );
  },
);
