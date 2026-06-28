import { component$, type CSSProperties, type QRL } from "@qwik.dev/core";

import styles from "./anki-grade-bar.module.css";
import { ElmButton, ElmInlineText } from "@elmethis/qwik";

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
  style?: CSSProperties;

  /** false → "Show Answer" button; true → the grading grid. */
  isShowingAnswer: boolean;
  /** Reveal the answer. */
  onShowAnswer$: QRL<() => void>;
  /** Grade the current card (SM-2 rating, 0..5). */
  onRate$: QRL<(rating: number) => void>;
}

/** Bottom action bar: reveal the answer, then grade the card. */
export const AnkiGradeBar = component$<AnkiGradeBarProps>((props) => {
  const {
    class: className,
    style,
    isShowingAnswer,
    onShowAnswer$,
    onRate$,
  } = props;

  return (
    <div class={[styles["button-container"], className]} style={style}>
      {!isShowingAnswer ? (
        <ElmButton block onClick$={() => onShowAnswer$()}>
          <ElmInlineText kbd>Enter</ElmInlineText>
          <span>Show Answer</span>
        </ElmButton>
      ) : (
        <div class={styles["update-button-container"]}>
          {RATINGS.map(({ rating, label, key }) => (
            <ElmButton
              key={rating}
              block
              onClick$={() => onRate$(rating)}
              primary={rating >= 3}
            >
              <ElmInlineText kbd>{key.toUpperCase()}</ElmInlineText>
              <span>{label}</span>
            </ElmButton>
          ))}
        </div>
      )}
    </div>
  );
});
