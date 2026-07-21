import { Show, splitProps, type JSX } from "solid-js";
import { clsx } from "clsx";

import styles from "./writing-assesments.module.css";
import { WritingAssessmentResult } from "./writing-assessment-result";
import { WritingAssessmentsScore } from "./writing-assessments-score";

export type WritingAssesmentsProps = JSX.HTMLAttributes<HTMLDivElement> & {
  japanese_context: string | null | undefined;
  original_text: string;
  revised_text: string;
  justification: string;
  register: string;
  score: 1 | 2 | 3 | 4 | 5;
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
      <WritingAssessmentsScore score={local.score} label={true} />

      <Show when={local.japanese_context}>
        <WritingAssessmentResult heading="Japanese Context" underline={false}>
          {local.japanese_context}
        </WritingAssessmentResult>
      </Show>

      <WritingAssessmentResult heading="Original Sentence" color="#ae6e6e">
        {local.original_text}
      </WritingAssessmentResult>

      <WritingAssessmentResult heading="Revised Sentence" color="#659878">
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
