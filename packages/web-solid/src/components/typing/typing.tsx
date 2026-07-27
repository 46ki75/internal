import { createUniqueId, Show, type JSX } from "solid-js";

import {
  createTypingSession,
  splitTypingCharacters,
  type TypingResult,
} from "./create-typing-session";
import { TypingPrompt } from "./typing-prompt";
import { TypingStats } from "./typing-stats";
import styles from "./typing.module.css";

export interface TypingProps {
  class?: string;
  description?: string;
  onComplete?: (result: TypingResult) => void;
  onNext?: () => void;
  style?: JSX.CSSProperties;
  text: string;
}

export const Typing = (props: TypingProps) => {
  const inputId = createUniqueId();
  const instructionsId = createUniqueId();
  let inputRef!: HTMLTextAreaElement;

  const session = createTypingSession({
    text: () => props.text,
    onComplete: (result) => props.onComplete?.(result),
  });

  const reset = () => {
    session.reset();
    inputRef.focus();
  };

  return (
    <section
      class={`${styles.typing} ${props.class ?? ""}`}
      style={props.style}
      aria-labelledby={`${inputId}-title`}
    >
      <header class={styles.header}>
        <div>
          <p class={styles.eyebrow}>Typing desk</p>
          <h1 id={`${inputId}-title`}>
            {props.description || "Untitled exercise"}
          </h1>
        </div>
        <span class={styles.length}>
          {splitTypingCharacters(props.text).length} glyphs
        </span>
      </header>

      <TypingPrompt characters={session.characters()} />

      <TypingStats
        accuracy={session.accuracy()}
        progress={session.progress()}
        wordsPerMinute={session.wordsPerMinute()}
      />

      <div class={styles.entry}>
        <label for={inputId}>Your typing</label>
        <p id={instructionsId}>
          Mistakes stay visible. Finish the line, then reset or move on.
        </p>
        <textarea
          ref={inputRef}
          id={inputId}
          rows={3}
          value={session.value()}
          aria-describedby={instructionsId}
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          onInput={(event) => {
            session.setValue(event.currentTarget.value);
            event.currentTarget.value = session.value();
          }}
        />
      </div>

      <Show when={session.status() === "complete"}>
        <p class={styles.complete} role="status">
          Line complete. {session.result().correctCharacters} of{" "}
          {session.result().totalCharacters} characters match.
        </p>
      </Show>

      <div class={styles.controls}>
        <button type="button" class={styles.secondary} onClick={reset}>
          Reset line
        </button>
        <Show when={props.onNext} keyed>
          {(onNext) => (
            <button type="button" class={styles.primary} onClick={onNext}>
              Next exercise
            </button>
          )}
        </Show>
      </div>
    </section>
  );
};
