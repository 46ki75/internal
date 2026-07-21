import { Show, splitProps, type JSX } from "solid-js";
import { ElmInlineText } from "@elmethis/solid";
import { clsx } from "clsx";

import styles from "./writing-assessments-score.module.css";

const SCORE_COLOR_MAP = {
  1: "#ae6e6e",
  2: "#b09a66",
  3: "#8d799f",
  4: "#68779f",
  5: "#659878",
} as const;

const SCORE_LABEL_MAP = {
  1: "Hard to Follow",
  2: "Awkward",
  3: "Clear but non Native",
  4: "Near Native",
  5: "Native Like",
};

export type WritingAssessmentsScoreProps =
  JSX.HTMLAttributes<HTMLDivElement> & {
    score: 1 | 2 | 3 | 4 | 5;
    label: boolean;
  };

export const WritingAssessmentsScore = (
  props: WritingAssessmentsScoreProps,
) => {
  const [local, others] = splitProps(props, ["class", "score", "label"]);

  return (
    <div
      class={clsx(styles["writing-assessments-score"], local.class)}
      {...others}
    >
      <div
        class={styles["score-indicator"]}
        data-score={local.score}
        style={{ color: SCORE_COLOR_MAP[local.score] }}
        aria-hidden="true"
      >
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>

      <Show when={local.label}>
        <ElmInlineText
          class={styles["score-label"]}
          color={SCORE_COLOR_MAP[local.score]}
        >
          {SCORE_LABEL_MAP[local.score]}
        </ElmInlineText>
      </Show>
    </div>
  );
};
