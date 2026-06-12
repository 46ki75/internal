import {
  $,
  component$,
  useComputed$,
  useContext,
  useOnDocument,
  useSignal,
  useVisibleTask$,
  type CSSProperties,
} from "@qwik.dev/core";

import styles from "./anki.module.css";
import { AnkiContext } from "~/context/anki-context";
import {
  blockCatalog,
  ElmA2ui,
  ElmBlockFallback,
  ElmButton,
  ElmInlineText,
  ElmMdiIcon,
} from "@elmethis/qwik";
import { surfaceToMessages } from "./surface-to-messages";
import {
  mdiAlertDecagram,
  mdiBookEdit,
  mdiCircleSmall,
  mdiCreation,
  mdiMessageAlertOutline,
  mdiMessageCheckOutline,
  mdiMessageQuestionOutline,
  mdiRefresh,
  mdiSchool,
  mdiTrayFull,
} from "@mdi/js";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

const KEYMAP = { q: 0, w: 1, e: 2, a: 3, s: 4, d: 5 };

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
    if (!pageId || performanceRating == null) return;

    ankiStore.updateAnkiByPerformanceRating(
      ankiStore,
      pageId,
      performanceRating,
    );

    if (currentAnki.value?.metadata.page_id === pageId) {
      isShowingAnswer.value = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  const count = useComputed$(() => ankiStore.ankiList.data.length);

  const shouldLearnCount = useComputed$(() => {
    const now = new Date();
    const count = ankiStore.ankiList.data.reduce((acc, { metadata }) => {
      if (new Date(metadata.next_review_at) <= now) {
        return acc + 1;
      }
      return acc;
    }, 0);
    return count;
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

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const handler = (event: KeyboardEvent) => {
      if (["Enter", " "].includes(event.key) && !isShowingAnswer.value) {
        event.preventDefault();
        isShowingAnswer.value = true;
      }
    };
    document.addEventListener("keydown", handler);
    cleanup(() => document.removeEventListener("keydown", handler));
  });

  useOnDocument(
    "keydown",
    $((event) => {
      if (isShowingAnswer.value && Object.keys(KEYMAP).includes(event.key)) {
        const rating = KEYMAP[event.key as keyof typeof KEYMAP];
        handleUpdate(currentAnki.value?.metadata.page_id, rating);
      }
    }),
  );

  return (
    <div
      class={[styles["anki"], className]}
      style={style}
      key={currentAnki.value?.metadata.page_id ?? "none"}
    >
      <div class={styles["button-control"]}>
        <ElmButton block onClick$={open} isLoading={currentAnki.value == null}>
          <ElmMdiIcon d={mdiBookEdit} />
          <span>Edit</span>
        </ElmButton>
        <ElmButton
          block
          isLoading={ankiStore.create.loading}
          onClick$={() => ankiStore.create.execute(ankiStore)}
        >
          <ElmMdiIcon d={mdiCreation} />
          <span>New</span>
        </ElmButton>
        <ElmButton
          block
          isLoading={currentAnki.value == null || ankiStore.review.loading}
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
          isLoading={currentAnki.value == null || currentAnki.value.loading}
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

      <div class={styles["anki-header"]}>
        <ElmMdiIcon d={mdiSchool} color="#6987b8" />
        <ElmInlineText>Should Learn: {shouldLearnCount.value}</ElmInlineText>
        <ElmMdiIcon d={mdiTrayFull} color="#6987b8" />
        <ElmInlineText>Queue: {count.value}</ElmInlineText>
      </div>

      {!currentAnki.value?.block ? (
        <ElmBlockFallback />
      ) : (
        <>
          <div class={styles["anki-block-container"]}>
            <div class={styles["block-header"]}>
              <ElmMdiIcon d={mdiMessageQuestionOutline} />
              <ElmInlineText>Front</ElmInlineText>
            </div>
            <div class={styles["block-renderer"]}>
              <ElmA2ui
                catalog={blockCatalog}
                messages={surfaceToMessages(
                  currentAnki.value.block.front,
                  `${currentAnki.value.metadata.page_id}-front`,
                )}
              />
            </div>
          </div>

          {isShowingAnswer.value && (
            <>
              <div class={styles["anki-block-container"]}>
                <div class={styles["block-header"]}>
                  <ElmMdiIcon d={mdiMessageAlertOutline} />
                  <ElmInlineText>Back</ElmInlineText>
                </div>
                <div class={styles["block-renderer"]}>
                  <ElmA2ui
                    catalog={blockCatalog}
                    messages={surfaceToMessages(
                      currentAnki.value.block.back,
                      `${currentAnki.value.metadata.page_id}-back`,
                    )}
                  />
                </div>
              </div>

              <div class={styles["anki-block-container"]}>
                <div class={styles["block-header"]}>
                  <ElmMdiIcon d={mdiMessageCheckOutline} />
                  <ElmInlineText>Explanation</ElmInlineText>
                </div>
                <div class={styles["block-renderer"]}>
                  <ElmA2ui
                    catalog={blockCatalog}
                    messages={surfaceToMessages(
                      currentAnki.value.block.explanation,
                      `${currentAnki.value.metadata.page_id}-explanation`,
                    )}
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
            <ElmInlineText kbd>Enter</ElmInlineText>
            <span>{isShowingAnswer.value ? "Hide Answer" : "Show Answer"}</span>
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
                <ElmInlineText kbd>
                  {Object.keys(KEYMAP)
                    .find((key) => KEYMAP[key as keyof typeof KEYMAP] === index)
                    ?.toUpperCase()}
                </ElmInlineText>
                <span>{rating}</span>
              </ElmButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
