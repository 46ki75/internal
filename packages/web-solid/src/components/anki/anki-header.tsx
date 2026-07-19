import type { JSX } from "solid-js";

import styles from "./anki-header.module.css";
import { ElmInlineText, ElmMdiIcon } from "@elmethis/solid";
import { mdiSchool, mdiTrayFull } from "@mdi/js";

export interface AnkiHeaderProps {
  class?: string;
  style?: JSX.CSSProperties;

  /** Number of cards whose `next_review_at` is due. */
  shouldLearnCount: number;
  /** Total number of cards in the queue. */
  queueCount: number;
}

/** "Should Learn / Queue" count summary. */
export const AnkiHeader = (props: AnkiHeaderProps) => (
  <div
    class={`${styles["anki-header"]} ${props.class ?? ""}`}
    style={props.style}
  >
    <ElmMdiIcon d={mdiSchool} color="#6987b8" />
    <ElmInlineText>Should Learn: {props.shouldLearnCount}</ElmInlineText>
    <ElmMdiIcon d={mdiTrayFull} color="#6987b8" />
    <ElmInlineText>Queue: {props.queueCount}</ElmInlineText>
  </div>
);
