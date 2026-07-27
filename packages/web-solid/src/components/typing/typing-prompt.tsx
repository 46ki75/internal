import { For } from "solid-js";

import type { TypingCharacter } from "./create-typing-session";
import styles from "./typing.module.css";

export interface TypingPromptProps {
  characters: readonly TypingCharacter[];
}

export const TypingPrompt = (props: TypingPromptProps) => (
  <div class={styles["prompt-frame"]}>
    <p class={styles["screen-reader-text"]}>
      Text to type:{" "}
      {props.characters.map((character) => character.value).join("")}
    </p>
    <p class={styles.prompt} aria-hidden="true">
      <For each={props.characters}>
        {(character) => (
          <span
            class={`${styles.character} ${styles[character.state]}`}
            data-state={character.state}
          >
            {character.value}
          </span>
        )}
      </For>
    </p>
  </div>
);
