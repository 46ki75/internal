import { Show, splitProps, type JSX } from "solid-js";
import { clsx } from "clsx";

import styles from "./writing-assesments.module.css";
import { ElmInlineText } from "@elmethis/solid";
import { WritingAssessmentResult } from "./writing-assessment-result";

export type WritingAssesmentsProps = JSX.HTMLAttributes<HTMLDivElement> & {
  japanese_context: string | null | undefined;
  original_text: string;
  revised_text: string;
  justification: string;
  register: string;
  score: 1 | 2 | 3 | 4 | 5;
};

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

export const WritingAssesments = (props: WritingAssesmentsProps) => {
  const [local, others] = splitProps(props, [
    "class",
    "japanese_context",
    "original_text",
    "revised_text",
    "justification",
    "register",
    "score",
  ]);

  return (
    <div class={clsx(styles["writing-assesments"], local.class)} {...others}>
      <div class={styles["score"]}>
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

        <ElmInlineText
          class={styles["score-label"]}
          color={SCORE_COLOR_MAP[local.score]}
        >
          {SCORE_LABEL_MAP[local.score]}
        </ElmInlineText>
      </div>

      <Show when={local.japanese_context}>
        <WritingAssessmentResult heading="Japanese Context" underline={false}>
          {local.japanese_context}
        </WritingAssessmentResult>
      </Show>

      <WritingAssessmentResult
        heading="Original Sentence"
        marker="-"
        color="#ae6e6e"
      >
        {local.original_text}
      </WritingAssessmentResult>

      <WritingAssessmentResult
        heading="Revised Sentence"
        marker="+"
        color="#659878"
      >
        {local.revised_text}
      </WritingAssessmentResult>

      <WritingAssessmentResult heading="Justification">
        {local.justification}
      </WritingAssessmentResult>

      <WritingAssessmentResult heading="Register">
        {local.register}
      </WritingAssessmentResult>
    </div>
  );
};
