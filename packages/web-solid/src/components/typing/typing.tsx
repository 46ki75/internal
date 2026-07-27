import { createEffect, createUniqueId, on, Show, type JSX } from "solid-js";
import {
  ElmButton,
  ElmHeading,
  ElmInlineText,
  ElmTextArea,
} from "@elmethis/solid";

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
    inputRef.value = "";
    inputRef.focus();
  };

  createEffect(
    on(
      () => props.text,
      () => {
        inputRef.value = "";
      },
      { defer: true },
    ),
  );

  return (
    <section
      class={`${styles.typing} ${props.class ?? ""}`}
      style={props.style}
      aria-labelledby={`${inputId}-title`}
    >
      <header class={styles.header}>
        <ElmHeading level={1} id={`${inputId}-title`}>
          {props.description || "Untitled exercise"}
        </ElmHeading>
        <ElmInlineText
          class={styles.length}
          size="0.75rem"
          color="var(--elmethis-color-neutral-weak)"
        >
          {splitTypingCharacters(props.text).length} glyphs
        </ElmInlineText>
      </header>

      <TypingPrompt characters={session.characters()} />

      <TypingStats
        accuracy={session.accuracy()}
        progress={session.progress()}
        wordsPerMinute={session.wordsPerMinute()}
      />

      <p id={instructionsId} class={styles.instructions}>
        Correct each mistake to finish the exercise.
      </p>
      <ElmTextArea
        ref={(element) => (inputRef = element)}
        id={inputId}
        label="Your typing"
        aria-label="Your typing"
        aria-describedby={instructionsId}
        rows={3}
        autocomplete="off"
        autocapitalize="off"
        spellcheck={false}
        onInput={(event) => {
          session.setValue(event.currentTarget.value);
          event.currentTarget.value = session.value();
        }}
      />

      <Show when={session.status() === "complete"}>
        <p class={styles.complete} role="status">
          Line complete. {session.result().correctCharacters} of{" "}
          {session.result().totalCharacters} characters match.
        </p>
      </Show>

      <div class={styles.controls}>
        <ElmButton type="button" onClick={reset}>
          Reset line
        </ElmButton>
        <Show when={props.onNext} keyed>
          {(onNext) => (
            <ElmButton type="button" primary onClick={onNext}>
              Next exercise
            </ElmButton>
          )}
        </Show>
      </div>
    </section>
  );
};
