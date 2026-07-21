import { Show, splitProps, type JSX } from "solid-js";
import { clsx } from "clsx";

import styles from "./writing-assessments-feedback.module.css";
import { ElmInlineText, ElmMdiIcon } from "@elmethis/solid";
import { WritingAssessmentResult } from "./writing-assessment-result";
import {
  mdiSignalCellular1,
  mdiSignalCellular2,
  mdiSignalCellular3,
} from "@mdi/js";

export type WritingAssessmentsFeedbackProps =
  JSX.HTMLAttributes<HTMLDivElement> & {
    id: string;
    type: "error" | "intent_check" | "observation";
    layer?: "idiom" | "style" | null;
    severity: "low" | "medium" | "high";
    original: string;
    revised: string;
    pattern?: string | null;
    reason: string;
  };

const SEVERITY_ICON_MAP = {
  low: mdiSignalCellular1,
  medium: mdiSignalCellular2,
  high: mdiSignalCellular3,
} as const;

export const WritingAssessmentsFeedback = (
  props: WritingAssessmentsFeedbackProps,
) => {
  const [local, others] = splitProps(props, [
    "class",
    "children",
    "id",
    "type",
    "layer",
    "severity",
    "original",
    "revised",
    "pattern",
    "reason",
  ]);

  return (
    <div
      class={clsx(styles["writing-assessments-feedback"], local.class)}
      {...others}
    >
      <header
        class={clsx(styles["header"], {
          [styles["low"]]: local.severity === "low",
          [styles["medium"]]: local.severity === "medium",
          [styles["high"]]: local.severity === "high",
        })}
      >
        <div
          class={clsx(styles["severity"], {
            [styles["low"]]: local.severity === "low",
            [styles["medium"]]: local.severity === "medium",
            [styles["high"]]: local.severity === "high",
          })}
        >
          <ElmMdiIcon d={SEVERITY_ICON_MAP[local.severity]} size="1.25rem" />
          {local.severity}
        </div>

        <Show when={local.layer}>
          <ElmInlineText class={styles["layer"]}>{local.layer}</ElmInlineText>
        </Show>

        <ElmInlineText class={styles["id"]}>{local.id}</ElmInlineText>
      </header>

      <WritingAssessmentResult heading="Original" marker="-" color="#ae6e6e">
        {local.original}
      </WritingAssessmentResult>

      <WritingAssessmentResult heading="Revised" marker="+" color="#659878">
        {local.revised}
      </WritingAssessmentResult>

      <WritingAssessmentResult heading="Reason" marker="?">
        {local.reason}
      </WritingAssessmentResult>

      <Show when={local.pattern}>
        <WritingAssessmentResult heading="Pattern" marker="!" color="#8d799f">
          {local.pattern}
        </WritingAssessmentResult>
      </Show>
    </div>
  );
};
