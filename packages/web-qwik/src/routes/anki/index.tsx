import {
  component$,
  useComputed$,
  useContext,
  useSignal,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./anki.module.css";
import { AnkiContext } from "~/context/anki-context";
import {
  ElmBlockFallback,
  ElmButton,
  ElmInlineText,
  ElmJarkup,
  ElmMdiIcon,
} from "@elmethis/qwik";
import {
  mdiMessageAlertOutline,
  mdiMessageCheckOutline,
  mdiMessageQuestionOutline,
} from "@mdi/js";

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

  const isShowingAnswer = useSignal(false);

  return (
    <div class={[styles["anki"], className]} style={style}>
      {!currentAnki.value?.block ? (
        <ElmBlockFallback />
      ) : (
        <>
          <div class={styles["anki-jarkup-container"]}>
            <div class={styles["jarkup-header"]}>
              <ElmMdiIcon d={mdiMessageQuestionOutline} />
              <ElmInlineText>Front</ElmInlineText>
            </div>
            <div class={styles["jarkup-renderer"]}>
              <ElmJarkup jsonComponents={currentAnki.value.block.front} />
            </div>
          </div>

          {isShowingAnswer.value && (
            <>
              <div class={styles["anki-jarkup-container"]}>
                <div class={styles["jarkup-header"]}>
                  <ElmMdiIcon d={mdiMessageAlertOutline} />
                  <ElmInlineText>Back</ElmInlineText>
                </div>
                <div class={styles["jarkup-renderer"]}>
                  <ElmJarkup jsonComponents={currentAnki.value.block.back} />
                </div>
              </div>

              <div class={styles["anki-jarkup-container"]}>
                <div class={styles["jarkup-header"]}>
                  <ElmMdiIcon d={mdiMessageCheckOutline} />
                  <ElmInlineText>Explanation</ElmInlineText>
                </div>
                <div class={styles["jarkup-renderer"]}>
                  <ElmJarkup
                    jsonComponents={currentAnki.value.block.explanation}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div class={styles["button"]}>
        <ElmButton
          block
          onClick$={() => (isShowingAnswer.value = !isShowingAnswer.value)}
        >
          {isShowingAnswer.value ? "Hide Answer" : "Show Answer"}
        </ElmButton>
      </div>
    </div>
  );
});
