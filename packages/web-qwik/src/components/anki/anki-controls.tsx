import { component$, type CSSProperties, type QRL } from "@qwik.dev/core";

import styles from "./anki-controls.module.css";
import { ElmButton, ElmMdiIcon } from "@elmethis/qwik";
import {
  mdiAlertDecagram,
  mdiBookEdit,
  mdiCircleSmall,
  mdiCreation,
  mdiRefresh,
} from "@mdi/js";

export interface AnkiControlsProps {
  class?: string;
  style?: CSSProperties;

  /** A card is currently loaded. */
  hasCard: boolean;
  /** The current card's block is being (re)fetched. */
  cardLoading?: boolean;
  isReviewRequired?: boolean;
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
}

/** Edit / New / Review / Refresh control bar. */
export const AnkiControls = component$<AnkiControlsProps>((props) => {
  const {
    class: className,
    style,
    hasCard,
    cardLoading,
    isReviewRequired,
    createLoading,
    reviewLoading,
    onEdit$,
    onCreate$,
    onReview$,
    onRefresh$,
  } = props;

  return (
    <div class={[styles["button-control"], className]} style={style}>
      <ElmButton block isLoading={!hasCard} onClick$={() => onEdit$()}>
        <ElmMdiIcon d={mdiBookEdit} />
        <span>Edit</span>
      </ElmButton>
      <ElmButton block isLoading={createLoading} onClick$={() => onCreate$()}>
        <ElmMdiIcon d={mdiCreation} />
        <span>New</span>
      </ElmButton>
      <ElmButton
        block
        isLoading={!hasCard || reviewLoading}
        onClick$={() => onReview$()}
      >
        <ElmMdiIcon d={isReviewRequired ? mdiAlertDecagram : mdiCircleSmall} />
      </ElmButton>
      <ElmButton
        block
        isLoading={!hasCard || cardLoading}
        onClick$={() => onRefresh$()}
      >
        <ElmMdiIcon d={mdiRefresh} />
      </ElmButton>
    </div>
  );
});
