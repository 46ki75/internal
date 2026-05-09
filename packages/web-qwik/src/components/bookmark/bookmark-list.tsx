import {
  $,
  component$,
  JSX,
  noSerialize,
  NoSerialize,
  useSignal,
  useStore,
} from "@builder.io/qwik";

import styles from "./bookmark-list.module.css";
import { Bookmark, BookmarkProps } from "./bookmark";
import { ElmHeading, ElmMdiIcon, ElmTextField } from "@elmethis/qwik";
import { mdiTag } from "@mdi/js";
import Fuse from "fuse.js";

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

  const fuseInstance = useSignal<NoSerialize<Fuse<BookmarkProps>> | null>(null);
  const searchResults = useStore<{ results: BookmarkProps[] }>({ results: [] });

  const handleValueChange = $((value: string) => {
    if (value.trim() === "") {
      searchResults.results = [];
    } else {
      if (fuseInstance.value == null) {
        fuseInstance.value = noSerialize(
          new Fuse(bookmarks, {
            keys: [
              { name: "label", weight: 0.7 },
              { name: "url", weight: 0.3 },
            ],
            threshold: 0.3,
          }),
        );
      }

      if (fuseInstance.value) {
        const results = fuseInstance.value.search(value);
        searchResults.results = results.map((result) => result.item);
      }
    }
  });

  return (
    <div class={[styles["bookmark-list"]]}>
      <ElmHeading level={2}>Bookmark</ElmHeading>

      <ElmHeading level={3}>Search</ElmHeading>
      <ElmTextField label="Search" onValueChange$={handleValueChange} />

      <div class={styles["bookmark-container"]}>
        {searchResults.results.map((result) => (
          <Bookmark key={result.id} {...result} />
        ))}
      </div>

      <ElmHeading level={3}>Favorites</ElmHeading>
      <div
        class={[
          styles["bookmark-container"],
          styles["bookmark-container-favorite"],
        ]}
      >
        {favorites}
      </div>

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
