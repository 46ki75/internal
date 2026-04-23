import { $, component$ } from "@builder.io/qwik";

import styles from "./bookmark.module.css";
import { ElmInlineText, ElmMdiIcon } from "@elmethis/qwik";
import { mdiStar, mdiTagEdit } from "@mdi/js";

export interface BookmarkProps {
  icon: string;
  label: string;
  favorite: boolean;
  url: string;
  editUrl: string;
}

export const Bookmark = component$<BookmarkProps>(
  ({ icon, label, favorite, url, editUrl }) => {
    const handleClick = $((event: MouseEvent) => {
      event.stopPropagation();
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.click();
    });

    const handleEdit$ = $((event: MouseEvent) => {
      event.stopPropagation();
      const a = document.createElement("a");
      a.href = editUrl;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.click();
    });

    return (
      <div class={[styles["bookmark"]]} onClick$={handleClick}>
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
