import { Show, type JSX } from "solid-js";

import styles from "./bookmark.module.css";
import { ElmInlineText, ElmMdiIcon } from "@elmethis/solid";
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
  style?: JSX.CSSProperties;
  onOpen?: (url: string) => void;
  onEdit?: (editUrl: string) => void;
}

export const Bookmark = (props: BookmarkProps) => {
  const handleOpen = () => props.onOpen?.(props.url);

  const handleEdit = () => props.onEdit?.(props.editUrl);

  return (
    <div
      class={styles.bookmark}
      classList={{ [styles["bookmark-focus"]]: Boolean(props.focus) }}
      style={props.style}
    >
      <a
        class={styles["edit-icon"]}
        href={props.editUrl}
        rel="noreferrer"
        aria-label={`Edit ${props.label}`}
        onClick={handleEdit}
      >
        <ElmMdiIcon d={mdiTagEdit} />
      </a>
      <a
        class={styles["bookmark-link"]}
        href={props.url}
        rel="noreferrer"
        aria-label={`Open ${props.label}`}
        onClick={handleOpen}
      >
        <span class={styles["favorite-icon"]}>
          <ElmMdiIcon
            d={mdiStar}
            color={props.favorite ? "#d4bf8d" : "transparent"}
          />
        </span>
        <Show
          when={props.icon}
          keyed
          fallback={
            <ElmMdiIcon class={styles.favicon} size="32px" d={mdiEarth} />
          }
        >
          {(icon) => (
            <img
              src={icon}
              alt=""
              class={styles.favicon}
              width={32}
              height={32}
            />
          )}
        </Show>
        <ElmInlineText class={styles["bookmark-name"]} size="0.5rem">
          {props.label}
        </ElmInlineText>
      </a>
    </div>
  );
};
