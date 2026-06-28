import { component$, type CSSProperties } from "@qwik.dev/core";

import styles from "./anki-header.module.css";
import { ElmInlineText, ElmMdiIcon } from "@elmethis/qwik";
import { mdiSchool, mdiTrayFull } from "@mdi/js";

export interface AnkiHeaderProps {
  class?: string;
  style?: CSSProperties;

  /** Number of cards whose `next_review_at` is due. */
  shouldLearnCount: number;
  /** Total number of cards in the queue. */
  queueCount: number;
}

/** "Should Learn / Queue" count summary. */
export const AnkiHeader = component$<AnkiHeaderProps>(
  ({ class: className, style, shouldLearnCount, queueCount }) => (
    <div class={[styles["anki-header"], className]} style={style}>
      <ElmMdiIcon d={mdiSchool} color="#6987b8" />
      <ElmInlineText>Should Learn: {shouldLearnCount}</ElmInlineText>
      <ElmMdiIcon d={mdiTrayFull} color="#6987b8" />
      <ElmInlineText>Queue: {queueCount}</ElmInlineText>
    </div>
  ),
);
