import { For, Show, type JSX } from "solid-js";

import styles from "./anki-grade-bar.module.css";
import { ElmButton, ElmInlineText } from "@elmethis/solid";

/**
 * Card grades, ordered worst → best. `key` is the keyboard shortcut and
 * `rating` is the SM-2 grade handed back to the caller. `AnkiReviewer` reuses
 * this same map to wire up the keydown shortcuts, so the buttons and the
 * keyboard never drift apart.
 */
export const RATINGS = [
  { rating: 0, label: "FORGETFUL", key: "q" },
  { rating: 1, label: "INCORRECT", key: "w" },
  { rating: 2, label: "ALMOST", key: "e" },
  { rating: 3, label: "LUCKY", key: "a" },
  { rating: 4, label: "CORRECT", key: "s" },
  { rating: 5, label: "CONFIDENT", key: "d" },
] as const;

export interface AnkiGradeBarProps {
  class?: string;
  style?: JSX.CSSProperties;

  /** false → "Show Answer" button; true → the grading grid. */
  isShowingAnswer: boolean;
  /** Reveal the answer. */
  onShowAnswer: () => void;
  /** Grade the current card (SM-2 rating, 0..5). */
  onRate: (rating: number) => void;
}

/** Bottom action bar: reveal the answer, then grade the card. */
export const AnkiGradeBar = (props: AnkiGradeBarProps) => {
  return (
    <div
      class={`${styles["button-container"]} ${props.class ?? ""}`}
      style={props.style}
    >
      <Show
        when={props.isShowingAnswer}
        fallback={
          <ElmButton block onClick={() => props.onShowAnswer()}>
            <ElmInlineText kbd>Enter</ElmInlineText>
            <span>Show Answer</span>
          </ElmButton>
        }
      >
        <div class={styles["update-button-container"]}>
          <For each={RATINGS}>
            {({ rating, label, key }) => (
              <ElmButton
                block
                onClick={() => props.onRate(rating)}
                primary={rating >= 3}
              >
                <ElmInlineText kbd>{key.toUpperCase()}</ElmInlineText>
                <span>{label}</span>
              </ElmButton>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
