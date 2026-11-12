import {
  createEffect,
  createSignal,
  createUniqueId,
  on,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from "solid-js";
import {
  ElmA2ui,
  ElmButton,
  ElmInlineText,
  ElmTextArea,
  notionBlockCatalog,
} from "@elmethis/solid";

import { surfaceToMessages } from "~/components/common/a2ui/surface-to-messages";
import {
  createTypingSession,
  splitTypingCharacters,
  type TypingResult,
} from "./create-typing-session";
import { TypingPrompt } from "./typing-prompt";
import { TypingStats } from "./typing-stats";
import styles from "./typing.module.css";

export interface TypingProps {
  audioSrc?: string | null;
  /** Supply with onAutoplayTtsChange to retain the preference across keyed exercises. */
  autoplayTts?: boolean;
  class?: string;
  description?: string;
  onAutoplayTtsChange?: (enabled: boolean) => void;
  onComplete?: (result: TypingResult) => void;
  onNext?: () => void;
  onTypingModeChange?: (enabled: boolean) => void;
  style?: JSX.CSSProperties;
  surface?: unknown;
  text: string;
  /** Supply with onTypingModeChange to retain the preference across keyed exercises. */
  typingMode?: boolean;
}

export const Typing = (props: TypingProps) => {
  const inputId = createUniqueId();
  const instructionsId = createUniqueId();
  const [localTypingMode, setLocalTypingMode] = createSignal(false);
  const typingMode = () => props.typingMode ?? localTypingMode();
  const [localAutoplayTts, setLocalAutoplayTts] = createSignal(false);
  const autoplayTts = () => props.autoplayTts ?? localAutoplayTts();
  let inputRef: HTMLTextAreaElement | undefined;
  let audio: HTMLAudioElement | undefined;

  // Native autoplay handles new clips; preference changes control the current clip.
  createEffect(
    on(
      autoplayTts,
      (enabled) => {
        if (enabled) {
          void audio?.play().catch(() => {
            // Browser policy or unavailable media can reject play; native controls remain usable.
          });
        } else {
          audio?.pause();
        }
      },
      { defer: true },
    ),
  );

  const session = createTypingSession({
    text: () => props.text,
    onComplete: (result) => props.onComplete?.(result),
  });

  // Returning to typing mode starts a fresh attempt instead of counting time spent reading.
  createEffect(on(typingMode, () => session.reset(), { defer: true }));

  const reset = () => {
    session.reset();
    inputRef?.focus();
  };

  return (
    <section
      class={`${styles.typing} ${props.class ?? ""}`}
      style={props.style}
      aria-labelledby={`${inputId}-title`}
    >
      <header class={styles.header}>
        <span id={`${inputId}-title`}>
          <ElmInlineText size="1.25rem">
            {props.description || "Typing practice"}
          </ElmInlineText>
        </span>
        <Show when={typingMode()}>
          <ElmInlineText
            class={styles.length}
            size="0.75rem"
            color="var(--elmethis-color-neutral-weak)"
          >
            {splitTypingCharacters(props.text).length} glyphs
          </ElmInlineText>
        </Show>
      </header>

      <div role="region" aria-label="Reference text">
        <Show when={props.surface} fallback={<p>{props.text}</p>}>
          <ElmA2ui
            catalog={notionBlockCatalog}
            messages={surfaceToMessages(props.surface, `${inputId}-reference`)}
          />
        </Show>
      </div>

      <Show when={typingMode()}>
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
          ref={(element) => {
            inputRef = element;
            onMount(() => element.focus());
            onCleanup(() => {
              inputRef = undefined;
            });
          }}
          id={inputId}
          label="Your typing"
          aria-label="Your typing"
          aria-describedby={instructionsId}
          rows={3}
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          value={session.value()}
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
      </Show>

      <div class={styles.preferences}>
        <label class={styles["preference-control"]}>
          <input
            class={styles["preference-switch"]}
            type="checkbox"
            role="switch"
            checked={typingMode()}
            onChange={(event) => {
              const enabled = event.currentTarget.checked;
              setLocalTypingMode(enabled);
              props.onTypingModeChange?.(enabled);
            }}
          />
          Typing mode
        </label>
        <label class={styles["preference-control"]}>
          <input
            class={styles["preference-switch"]}
            type="checkbox"
            role="switch"
            checked={autoplayTts()}
            onChange={(event) => {
              const enabled = event.currentTarget.checked;
              setLocalAutoplayTts(enabled);
              props.onAutoplayTtsChange?.(enabled);
            }}
          />
          Autoplay TTS
        </label>
        <Show when={props.audioSrc} keyed>
          {(src) => (
            <audio
              ref={(element) => {
                audio = element;
                onCleanup(() => {
                  element.pause();
                  if (audio === element) {
                    audio = undefined;
                  }
                });
              }}
              class={styles.audio}
              aria-label="Sentence audio"
              src={src}
              autoplay={autoplayTts()}
              preload="none"
              controls
            />
          )}
        </Show>
      </div>

      <div class={styles.controls}>
        <Show when={typingMode()}>
          <ElmButton type="button" onClick={reset}>
            Reset line
          </ElmButton>
        </Show>
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
