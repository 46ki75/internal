import type { JSX } from "solid-js";

import styles from "./anki-controls.module.css";
import { ElmButton, ElmMdiIcon } from "@elmethis/solid";
import {
  mdiAlertDecagram,
  mdiBookEdit,
  mdiCircleSmall,
  mdiCreation,
  mdiRefresh,
} from "@mdi/js";

export interface AnkiControlsProps {
  class?: string;
  style?: JSX.CSSProperties;

  /** A card is currently loaded. */
  hasCard: boolean;
  /** The current card's block is being (re)fetched. */
  cardLoading?: boolean;
  isReviewRequired?: boolean;
  createLoading?: boolean;
  reviewLoading?: boolean;

  /** Open the current card in the Notion editor. */
  onEdit: () => void;
  /** Create a new card. */
  onCreate: () => void;
  /** Toggle the review-required flag on the current card. */
  onReview: () => void;
  /** Re-fetch the current card's block. */
  onRefresh: () => void;
}

/** Edit / New / Review / Refresh control bar. */
export const AnkiControls = (props: AnkiControlsProps) => {
  return (
    <div
      class={`${styles["button-control"]} ${props.class ?? ""}`}
      style={props.style}
    >
      <ElmButton
        block
        isLoading={!props.hasCard}
        onClick={() => props.onEdit()}
      >
        <ElmMdiIcon d={mdiBookEdit} />
        <span>Edit</span>
      </ElmButton>
      <ElmButton
        block
        isLoading={props.createLoading}
        onClick={() => props.onCreate()}
      >
        <ElmMdiIcon d={mdiCreation} />
        <span>New</span>
      </ElmButton>
      <ElmButton
        block
        aria-label="Toggle review required"
        isLoading={!props.hasCard || props.reviewLoading}
        onClick={() => props.onReview()}
      >
        <ElmMdiIcon
          d={props.isReviewRequired ? mdiAlertDecagram : mdiCircleSmall}
        />
      </ElmButton>
      <ElmButton
        block
        aria-label="Refresh card"
        isLoading={!props.hasCard || props.cardLoading}
        onClick={() => props.onRefresh()}
      >
        <ElmMdiIcon d={mdiRefresh} />
      </ElmButton>
    </div>
  );
};
