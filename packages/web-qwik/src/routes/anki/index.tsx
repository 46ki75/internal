import {
  $,
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
  mdiAlertDecagram,
  mdiBookEdit,
  mdiCircleSmall,
  mdiCreation,
  mdiMessageAlertOutline,
  mdiMessageCheckOutline,
  mdiMessageQuestionOutline,
  mdiRefresh,
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

  const handleUpdate = $((pageId?: string, performanceRating?: number) => {
    if (!ankiStore.updateAnkiByPerformanceRating) return;
    if (!pageId || !performanceRating) return;

    ankiStore.updateAnkiByPerformanceRating(
      ankiStore,
      pageId,
      performanceRating,
    );

    if (currentAnki.value?.metadata.page_id === pageId) {
      isShowingAnswer.value = false;
    }
  });

  const open = $(() => {
    const a = document.createElement("a");
    if (!currentAnki.value?.metadata.url) return;
    a.href = currentAnki.value?.metadata.url.replace(
      /https?:\/\//,
      "notion://",
    );
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  });

  return (
    <div
      class={[styles["anki"], className]}
      style={style}
      key={String(currentAnki?.value?.loading)}
    >
      <div class={styles["button-control"]}>
        <ElmButton block onClick$={open} loading={currentAnki.value == null}>
          <ElmMdiIcon d={mdiBookEdit} />
          <span>Edit</span>
        </ElmButton>
        <ElmButton
          block
          loading={ankiStore.create.loading}
          onClick$={() => ankiStore.create.execute(ankiStore)}
        >
          <ElmMdiIcon d={mdiCreation} />
          <span>New</span>
        </ElmButton>
        <ElmButton
          block
          loading={currentAnki.value == null || ankiStore.review.loading}
          onClick$={() => ankiStore.review.execute(ankiStore)}
        >
          <ElmMdiIcon
            d={
              currentAnki.value?.metadata.is_review_required
                ? mdiAlertDecagram
                : mdiCircleSmall
            }
          />
        </ElmButton>

        <ElmButton
          block
          loading={currentAnki.value == null || currentAnki.value.loading}
          onClick$={() =>
            ankiStore.fetchAnkiBlock(
              ankiStore,
              currentAnki.value?.metadata.page_id,
            )
          }
        >
          <ElmMdiIcon d={mdiRefresh} />
        </ElmButton>
      </div>

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

      <div class={styles["button-container"]}>
        {!isShowingAnswer.value ? (
          <ElmButton
            block
            onClick$={() => (isShowingAnswer.value = !isShowingAnswer.value)}
          >
            {isShowingAnswer.value ? "Hide Answer" : "Show Answer"}
          </ElmButton>
        ) : (
          <div class={styles["update-button-container"]}>
            {[
              "FORGETFUL",
              "INCORRECT",
              "ALMOST",
              "LUCKY",
              "CORRECT",
              "CONFIDENT",
            ].map((rating, index) => (
              <ElmButton
                key={index}
                block
                onClick$={() =>
                  handleUpdate(currentAnki.value?.metadata.page_id, index)
                }
                primary={index >= 3}
              >
                {rating}
              </ElmButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
