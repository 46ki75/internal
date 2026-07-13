import { component$ } from "@qwik.dev/core";

import styles from "./anki-block.module.css";
import {
  ElmA2ui,
  ElmInlineText,
  ElmMdiIcon,
  notionBlockCatalog,
} from "@elmethis/qwik";
import { surfaceToMessages } from "./surface-to-messages";

export interface AnkiBlockProps {
  /** mdi path for the header icon. */
  icon: string;
  /** Header label, e.g. "Front". */
  label: string;
  /** Raw A2UI surface (JSON). */
  surface: unknown;
  /** Stable id for the A2UI surface. */
  surfaceId: string;
}

/** One titled A2UI surface — a card's Front, Back or Explanation. */
export const AnkiBlock = component$<AnkiBlockProps>(
  ({ icon, label, surface, surfaceId }) => (
    <div class={styles["anki-block-container"]}>
      <div class={styles["block-header"]}>
        <ElmMdiIcon d={icon} />
        <ElmInlineText>{label}</ElmInlineText>
      </div>
      <div class={styles["block-renderer"]}>
        <ElmA2ui
          catalog={notionBlockCatalog}
          messages={surfaceToMessages(surface, surfaceId)}
        />
      </div>
    </div>
  ),
);
