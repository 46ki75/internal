import { Show, splitProps, type JSX } from "solid-js";

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
    <div class={local.class} {...others}>
      <WritingAssessmentsScore score={local.score} label={true} />

      <Show when={local.japanese_context}>
        <WritingAssessmentResult
          plaintext={props.japanese_context ?? ""}
          heading="Japanese Context"
          underline={false}
        >
          {local.japanese_context}
        </WritingAssessmentResult>
      </Show>

      <WritingAssessmentResult
        plaintext={props.original_text}
        heading="Original Sentence"
        color="#ae6e6e"
      >
        {local.original_text}
      </WritingAssessmentResult>

      <WritingAssessmentResult
        plaintext={props.revised_text}
        heading="Revised Sentence"
        color="#659878"
      >
        {local.revised_text}
      </WritingAssessmentResult>

      <WritingAssessmentResult
        plaintext={props.justification}
        heading="justification"
      >
        {local.justification}
      </WritingAssessmentResult>

      <WritingAssessmentResult plaintext={props.register} heading="register">
        {local.register}
      </WritingAssessmentResult>
    </div>
  );
};
