import type { JSX } from "solid-js";

import styles from "./todo-severity.module.css";
import { components } from "~/openapi/schema";
import {
  mdiAlert,
  mdiAlertOctagram,
  mdiHelpRhombus,
  mdiInformation,
} from "@mdi/js";
import { ElmMdiIcon } from "@elmethis/solid";

type Severity = components["schemas"]["ToDoSeverityResponse"];

export interface TodoSeverityProps {
  class?: string;

  style?: JSX.CSSProperties;

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

export const TodoSeverity = (props: TodoSeverityProps) => {
  return (
    <span
      class={`${styles["todo-severity"]} ${MAP[props.severity].className} ${props.class ?? ""}`}
      style={props.style}
    >
      <ElmMdiIcon d={MAP[props.severity].d} class={styles.icon} />
      <span class={styles.text}>{props.severity}</span>
    </span>
  );
};
