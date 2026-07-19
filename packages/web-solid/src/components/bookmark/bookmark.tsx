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
  const handleOpen = () => {
    if (props.onOpen) props.onOpen(props.url);
    else window.open(props.url, "_blank", "noopener,noreferrer");
  };

  const handleEdit = () => {
    if (props.onEdit) props.onEdit(props.editUrl);
    else window.open(props.editUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      class={styles.bookmark}
      classList={{ [styles["bookmark-focus"]]: Boolean(props.focus) }}
      style={props.style}
    >
      <button
        type="button"
        class={styles["edit-icon"]}
        aria-label={`Edit ${props.label}`}
        style={{ border: "0", background: "none", cursor: "pointer" }}
        onClick={handleEdit}
      >
        <ElmMdiIcon d={mdiTagEdit} />
      </button>
      <button
        type="button"
        aria-label={`Open ${props.label}`}
        style={{ display: "contents" }}
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
      </button>
    </div>
  );
};
