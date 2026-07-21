import { createMemo, For, Show, splitProps, type JSX } from "solid-js";
import { clsx } from "clsx";

import styles from "./writing-assessments-feedback-container.module.css";
import {
  WritingAssessmentsFeedback,
  type WritingAssessmentsFeedbackProps,
} from "./writing-assessments-feedback";
import { ElmHeading } from "@elmethis/solid";

const GROUPS = [
  { type: "error", heading: "Error" },
  { type: "intent_check", heading: "Intent Check" },
  { type: "observation", heading: "Observation" },
] as const;

export type WritingAssessmentsFeedbackContainerProps =
  JSX.HTMLAttributes<HTMLDivElement> & {
    feedbacks: WritingAssessmentsFeedbackProps[];
  };

export const WritingAssessmentsFeedbackContainer = (
  props: WritingAssessmentsFeedbackContainerProps,
) => {
  const [local, others] = splitProps(props, ["class", "feedbacks"]);

  return (
    <div
      class={clsx(
        styles["writing-assessments-feedback-container"],
        local.class,
      )}
      {...others}
    >
      <For each={GROUPS}>
        {(group) => {
          const feedbacks = createMemo(() =>
            local.feedbacks.filter((feedback) => feedback.type === group.type),
          );

          return (
            <Show when={feedbacks().length > 0}>
              <section class={styles["section"]}>
                <ElmHeading level={3}>{group.heading}</ElmHeading>

                <For each={feedbacks()}>
                  {(feedback) => <WritingAssessmentsFeedback {...feedback} />}
                </For>
              </section>
            </Show>
          );
        }}
      </For>
    </div>
  );
};
