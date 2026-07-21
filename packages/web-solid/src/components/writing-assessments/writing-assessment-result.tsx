import { Show, type JSX } from "solid-js";

import { ElmInlineText } from "@elmethis/solid";

import styles from "./writing-assessment-result.module.css";

type WritingAssessmentResultProps = {
  children: JSX.Element;
  color?: string;
  heading: string;
  marker?: string;
  underline?: boolean;
};

export const WritingAssessmentResult = (
  props: WritingAssessmentResultProps,
) => (
  <>
    <div class={styles["heading"]}>
      <ElmInlineText size="0.75rem" underline={props.underline ?? true}>
        {props.heading}
      </ElmInlineText>
    </div>

    <div class={styles["result"]}>
      <Show when={props.marker}>
        <ElmInlineText color={props.color} class={styles["marker"]}>
          {props.marker}&nbsp;
        </ElmInlineText>
      </Show>
      <ElmInlineText color={props.color}>{props.children}</ElmInlineText>
    </div>
  </>
);
