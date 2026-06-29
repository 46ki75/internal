import { $, component$, sync$, type CSSProperties } from "@qwik.dev/core";

import styles from "./bookmark.module.css";
import { ElmInlineText, ElmMdiIcon } from "@elmethis/qwik";
import { mdiEarth, mdiStar, mdiTagEdit } from "@mdi/js";

export interface BookmarkProps {
  id: string;
  icon?: string;
  label: string;
  favorite: boolean;
  url: string;
  editUrl: string;
  tag: { id: string; name: string; color: string };
  focus?: boolean;
  style?: CSSProperties;
}

export const Bookmark = component$<BookmarkProps>(
  ({ icon, label, favorite, url, editUrl, focus, style }) => {
    const handleClick = $(() => {
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noreferrer";
      a.click();
    });

    const handleEdit$ = $(() => {
      const a = document.createElement("a");
      a.href = editUrl;
      a.rel = "noreferrer";
      a.click();
    });

    return (
      <div
        class={[
          styles["bookmark"],
          {
            [styles["bookmark-focus"]]: focus,
          },
        ]}
        style={style}
        onClick$={handleClick}
      >
        <ElmMdiIcon
          d={mdiTagEdit}
          class={styles["edit-icon"]}
          onClick$={[
            // sync$ runs during the path-walk so stopPropagation() actually
            // stops the parent card's onClick$ (a plain $() handler can't).
            sync$((event: MouseEvent) => event.stopPropagation()),
            handleEdit$,
          ]}
        />
        <span class={styles["favorite-icon"]}>
          <ElmMdiIcon
            d={mdiStar}
            color={favorite ? "#d4bf8d" : "transparent"}
          />
        </span>
        {icon ? (
          <img src={icon} class={styles["favicon"]} width={32} height={32} />
        ) : (
          <ElmMdiIcon class={styles["favicon"]} size={"32px"} d={mdiEarth} />
        )}
        <ElmInlineText class={styles["bookmark-name"]} size="0.5rem">
          {label}
        </ElmInlineText>
      </div>
    );
  },
);
