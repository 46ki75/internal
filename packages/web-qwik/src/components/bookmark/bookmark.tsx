import { $, component$, QRL } from "@builder.io/qwik";

import styles from "./bookmark.module.css";
import { ElmInlineText, ElmMdiIcon } from "@elmethis/qwik";
import { mdiStar, mdiTagEdit } from "@mdi/js";

export interface BookmarkProps {
  icon: string;
  label: string;
  favorite?: boolean;
  onEdit$: QRL<(event: MouseEvent) => void>;
  onClick$?: QRL<(event: MouseEvent) => void>;
}

export const Bookmark = component$<BookmarkProps>(
  ({ icon, label, favorite, onEdit$, onClick$ }) => {
    const handleEdit$ = $((event: MouseEvent) => {
      event.stopPropagation();
      if (onEdit$) {
        onEdit$(event);
      }
    });

    return (
      <div class={[styles["bookmark"]]} onClick$={onClick$}>
        <span class={styles["edit-icon"]} onClick$={handleEdit$}>
          <ElmMdiIcon d={mdiTagEdit} />
        </span>
        <span class={styles["favorite-icon"]}>
          <ElmMdiIcon
            d={mdiStar}
            color={favorite ? "#d4bf8d" : "transparent"}
          />
        </span>
        <img src={icon} class={styles["favicon"]} width={32} height={32} />
        <ElmInlineText class={styles["bookmark-name"]} size="0.5rem">
          {label}
        </ElmInlineText>
      </div>
    );
  },
);
