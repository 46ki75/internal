import {
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from "solid-js";

import styles from "./anki-reviewer.module.css";
import { ElmBlockFallback } from "@elmethis/solid";
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
  style?: JSX.CSSProperties;

  /** Current card, or `null` while the queue is (re)loading. */
  card: AnkiCard | null;

  /** Total number of cards in the queue. */
  queueCount: number;
  /** Number of cards whose `next_review_at` is due. */
  shouldLearnCount: number;

  createLoading?: boolean;
  reviewLoading?: boolean;

  /** Open the current card in the Notion editor. */
  onEdit: () => void | Promise<void>;
  /** Create a new card. */
  onCreate: () => void | Promise<void>;
  /** Toggle the review-required flag on the current card. */
  onReview: () => void | Promise<void>;
  /** Re-fetch the current card's block. */
  onRefresh: () => void | Promise<void>;
  /** Grade the current card (SM-2 rating, 0..5). */
  onRate: (rating: number) => void | Promise<void>;
}

/**
 * Composes the Anki review screen from presentational children. The only state
 * it owns is the ephemeral "is the answer revealed" toggle and its keyboard
 * shortcuts; all data and mutations are delegated to callback props.
 */
export const AnkiReviewer = (props: AnkiReviewerProps) => {
  const [isShowingAnswer, setIsShowingAnswer] = createSignal(false);

  const reveal = () => setIsShowingAnswer(true);

  const rate = (rating: number) => {
    void props.onRate(rating);
    setIsShowingAnswer(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  createEffect((previousPageId) => {
    const pageId = props.card?.pageId;
    if (pageId !== previousPageId) setIsShowingAnswer(false);
    return pageId;
  });

  onMount(() => {
    const handler = (event: KeyboardEvent) => {
      if (["Enter", " "].includes(event.key) && !isShowingAnswer()) {
        event.preventDefault();
        setIsShowingAnswer(true);
        return;
      }

      if (!isShowingAnswer()) return;
      const match = RATINGS.find((rating) => rating.key === event.key);
      if (match) rate(match.rating);
    };

    document.addEventListener("keydown", handler);
    onCleanup(() => document.removeEventListener("keydown", handler));
  });

  return (
    <div class={`${styles.anki} ${props.class ?? ""}`} style={props.style}>
      <AnkiControls
        hasCard={props.card != null}
        cardLoading={props.card?.loading}
        isReviewRequired={props.card?.isReviewRequired}
        createLoading={props.createLoading}
        reviewLoading={props.reviewLoading}
        onEdit={() => props.onEdit()}
        onCreate={() => props.onCreate()}
        onReview={() => props.onReview()}
        onRefresh={() => props.onRefresh()}
      />

      <AnkiHeader
        shouldLearnCount={props.shouldLearnCount}
        queueCount={props.queueCount}
      />

      <Show when={props.card} fallback={<ElmBlockFallback />}>
        {(card) => (
          <Show when={card().block} fallback={<ElmBlockFallback />}>
            {(block) => (
              <>
                <AnkiBlock
                  icon={mdiMessageQuestionOutline}
                  label="Front"
                  surface={block().front}
                  surfaceId={`${card().pageId}-front`}
                />

                <Show when={isShowingAnswer()}>
                  <AnkiBlock
                    icon={mdiMessageAlertOutline}
                    label="Back"
                    surface={block().back}
                    surfaceId={`${card().pageId}-back`}
                  />
                  <AnkiBlock
                    icon={mdiMessageCheckOutline}
                    label="Explanation"
                    surface={block().explanation}
                    surfaceId={`${card().pageId}-explanation`}
                  />
                </Show>
              </>
            )}
          </Show>
        )}
      </Show>

      <AnkiGradeBar
        isShowingAnswer={isShowingAnswer()}
        onShowAnswer={reveal}
        onRate={rate}
      />
    </div>
  );
};
