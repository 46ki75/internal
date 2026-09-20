import type { JSX } from "solid-js";

import { ElmCopyIcon, ElmInlineText } from "@elmethis/solid";

import styles from "./writing-assessment-result.module.css";

type WritingAssessmentResultProps = {
  children: JSX.Element;
  plaintext: string;
  color?: string;
  heading: string;
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
      <ElmCopyIcon content={props.plaintext} />
      <ElmInlineText color={props.color}>{props.children}</ElmInlineText>
    </div>
  </>
);
