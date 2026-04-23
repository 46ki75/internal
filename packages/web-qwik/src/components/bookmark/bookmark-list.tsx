import { component$, JSX } from "@builder.io/qwik";

import styles from "./bookmark-list.module.css";
import { Bookmark, BookmarkProps } from "./bookmark";
import { ElmHeading, ElmMdiIcon } from "@elmethis/qwik";
import { mdiTag } from "@mdi/js";

export interface BookmarkListProps {
  bookmarks: BookmarkProps[];
}

export const BookmarkList = component$<BookmarkListProps>(({ bookmarks }) => {
  const favorites: JSX.Element[] = [];
  const tags: Record<
    string,
    {
      tag: BookmarkProps["tag"];
      components: JSX.Element[];
    }
  > = {};

  for (const bookmark of bookmarks) {
    if (bookmark.favorite) {
      favorites.push(<Bookmark {...bookmark} />);
    }

    const tagId = bookmark.tag.id;
    const tagObjectRef = tags[tagId];
    if (tagObjectRef) {
      tagObjectRef.components.push(
        <Bookmark key={bookmark.id} {...bookmark} />,
      );
    } else {
      tags[tagId] = {
        tag: bookmark.tag,
        components: [<Bookmark key={bookmark.id} {...bookmark} />],
      };
    }
  }

  return (
    <div class={[styles["bookmark-list"]]}>
      <ElmHeading level={3}>Favorites</ElmHeading>
      <div class={styles["bookmark-container"]}>{favorites}</div>

      <div class={styles["tags-container"]}>
        {Object.keys(tags).map((tagId) => (
          <div key={tagId} class={styles["tag-section"]}>
            <div
              class={styles["tag"]}
              style={{ "--color": tags[tagId].tag.color }}
            >
              <ElmMdiIcon d={mdiTag} color="oklch(from white l c h / 0.75)" />
              {tags[tagId].tag.name}
            </div>
            <div class={styles["bookmark-container"]}>
              {tags[tagId].components}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
