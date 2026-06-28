import {
  $,
  component$,
  useOnDocument,
  useSignal,
  useVisibleTask$,
  type CSSProperties,
  type QRL,
} from "@qwik.dev/core";

import styles from "./anki-reviewer.module.css";
import { ElmBlockFallback } from "@elmethis/qwik";
import {
  mdiMessageAlertOutline,
  mdiMessageCheckOutline,
  mdiMessageQuestionOutline,
} from "@mdi/js";

import { AnkiBlock } from "./anki-block";
import { AnkiControls } from "./anki-controls";
import { AnkiHeader } from "./anki-header";
import { AnkiGradeBar, RATINGS } from "./anki-grade-bar";
import type { AnkiCard } from "./types";

export type { AnkiCard, AnkiBlockData } from "./types";

export interface AnkiReviewerProps {
  class?: string;
  style?: CSSProperties;

  /** Current card, or `null` while the queue is (re)loading. */
  card: AnkiCard | null;

  /** Total number of cards in the queue. */
  queueCount: number;
  /** Number of cards whose `next_review_at` is due. */
  shouldLearnCount: number;

  createLoading?: boolean;
  reviewLoading?: boolean;

  /** Open the current card in the Notion editor. */
  onEdit$: QRL<() => void>;
  /** Create a new card. */
  onCreate$: QRL<() => void>;
  /** Toggle the review-required flag on the current card. */
  onReview$: QRL<() => void>;
  /** Re-fetch the current card's block. */
  onRefresh$: QRL<() => void>;
  /** Grade the current card (SM-2 rating, 0..5). */
  onRate$: QRL<(rating: number) => void>;
}

/**
 * Composes the Anki review screen from presentational children. The only state
 * it owns is the ephemeral "is the answer revealed" toggle and its keyboard
 * shortcuts; all data and mutations are delegated to the `on*$` callbacks.
 */
export const AnkiReviewer = component$<AnkiReviewerProps>((props) => {
  const {
    class: className,
    style,
    card,
    queueCount,
    shouldLearnCount,
    createLoading,
    reviewLoading,
    onEdit$,
    onCreate$,
    onReview$,
    onRefresh$,
    onRate$,
  } = props;

  const isShowingAnswer = useSignal(false);

  const reveal = $(() => {
    isShowingAnswer.value = true;
  });

  const rate = $((rating: number) => {
    onRate$(rating);
    isShowingAnswer.value = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Enter / Space reveals the answer.
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

  // q/w/e/a/s/d grade the card once the answer is visible.
  useOnDocument(
    "keydown",
    $((event) => {
      if (!isShowingAnswer.value) return;
      const match = RATINGS.find((r) => r.key === event.key);
      if (match) rate(match.rating);
    }),
  );

  return (
    <div
      class={[styles["anki"], className]}
      style={style}
      key={card?.pageId ?? "none"}
    >
      <AnkiControls
        hasCard={card != null}
        cardLoading={card?.loading}
        isReviewRequired={card?.isReviewRequired}
        createLoading={createLoading}
        reviewLoading={reviewLoading}
        onEdit$={onEdit$}
        onCreate$={onCreate$}
        onReview$={onReview$}
        onRefresh$={onRefresh$}
      />

      <AnkiHeader shouldLearnCount={shouldLearnCount} queueCount={queueCount} />

      {!card?.block ? (
        <ElmBlockFallback />
      ) : (
        <>
          <AnkiBlock
            icon={mdiMessageQuestionOutline}
            label="Front"
            surface={card.block.front}
            surfaceId={`${card.pageId}-front`}
          />

          {isShowingAnswer.value && (
            <>
              <AnkiBlock
                icon={mdiMessageAlertOutline}
                label="Back"
                surface={card.block.back}
                surfaceId={`${card.pageId}-back`}
              />
              <AnkiBlock
                icon={mdiMessageCheckOutline}
                label="Explanation"
                surface={card.block.explanation}
                surfaceId={`${card.pageId}-explanation`}
              />
            </>
          )}
        </>
      )}

      <AnkiGradeBar
        isShowingAnswer={isShowingAnswer.value}
        onShowAnswer$={reveal}
        onRate$={rate}
      />
    </div>
  );
});
