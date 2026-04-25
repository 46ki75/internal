import {
  component$,
  useComputed$,
  useContext,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./anki.module.css";
import { AnkiContext } from "~/context/anki-context";
import { ElmBlockFallback, ElmJarkup } from "@elmethis/qwik";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

export default component$<IndexProps>(({ class: className, style }) => {
  const ankiStore = useContext(AnkiContext);

  const currentAnki = useComputed$(() =>
    ankiStore.ankiList.currentIndex != null
      ? ankiStore.ankiList.data[ankiStore.ankiList.currentIndex]
      : null,
  );

  return (
    <div class={[styles["index"], className]} style={style}>
      {JSON.stringify(ankiStore.ankiList.data[0], null, 2)}

      {!currentAnki.value?.block ? (
        <ElmBlockFallback />
      ) : (
        <>
          <div class={styles["anki-jarkup-container"]}>
            <div class={styles["jarkup-header"]}></div>
            <div class={styles["jarkup-renderer"]}>
              <ElmJarkup jsonComponents={currentAnki.value.block.front} />
            </div>
          </div>

          <div class={styles["anki-jarkup-container"]}>
            <div class={styles["jarkup-header"]}></div>
            <div class={styles["jarkup-renderer"]}>
              <ElmJarkup jsonComponents={currentAnki.value.block.back} />
            </div>
          </div>
        </>
      )}
    </div>
  );
});
