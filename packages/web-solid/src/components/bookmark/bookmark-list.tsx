import { createMemo, createSignal, For, onCleanup, onMount } from "solid-js";

import styles from "./bookmark-list.module.css";
import { Bookmark, type BookmarkProps } from "./bookmark";
import { ElmHeading, ElmMdiIcon, ElmTextField } from "@elmethis/solid";
import autoAnimate from "@formkit/auto-animate";
import { mdiTag } from "@mdi/js";
import Fuse from "fuse.js";

export interface BookmarkListProps {
  bookmarks: BookmarkProps[];
}

export const BookmarkList = (props: BookmarkListProps) => {
  let bookmarkListContainer!: HTMLDivElement;
  let bookmarkContainer!: HTMLDivElement;
  const [searchKeyword, setSearchKeyword] = createSignal("");

  onMount(() => {
    const controllers = [
      autoAnimate(bookmarkListContainer),
      autoAnimate(bookmarkContainer),
    ];
    onCleanup(() =>
      controllers.forEach((controller) => {
        if (controller.destroy) controller.destroy();
        else controller.disable();
      }),
    );
  });

  const grouped = createMemo(() => {
    const favorites: BookmarkProps[] = [];
    const tags = new Map<
      string,
      { tag: BookmarkProps["tag"]; bookmarks: BookmarkProps[] }
    >();

    for (const bookmark of props.bookmarks) {
      if (bookmark.favorite) favorites.push(bookmark);
      const group = tags.get(bookmark.tag.id);
      if (group) group.bookmarks.push(bookmark);
      else
        tags.set(bookmark.tag.id, { tag: bookmark.tag, bookmarks: [bookmark] });
    }

    return { favorites, tags: [...tags.values()] };
  });

  const fuse = createMemo(
    () =>
      new Fuse(props.bookmarks, {
        keys: [
          { name: "label", weight: 0.7 },
          { name: "url", weight: 0.3 },
        ],
        threshold: 0.3,
      }),
  );

  const searchResults = createMemo(() => {
    const keyword = searchKeyword().trim();
    if (keyword === "") return props.bookmarks.slice(0, 5);
    return fuse()
      .search(keyword, { limit: 5 })
      .map((result) => result.item);
  });

  const openBookmark = (bookmark: BookmarkProps) => {
    if (bookmark.onOpen) bookmark.onOpen(bookmark.url);
    else window.open(bookmark.url, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      const first = searchResults()[0];
      if (first) openBookmark(first);
      setSearchKeyword("");
    }
  };

  return (
    <div class={styles["bookmark-list"]}>
      <ElmHeading level={2}>Bookmark</ElmHeading>

      <ElmHeading level={3}>Search</ElmHeading>
      <ElmTextField
        label="Search"
        value={searchKeyword()}
        onInput={(event) => setSearchKeyword(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />

      <div
        ref={bookmarkContainer}
        class={`${styles["bookmark-container"]} ${styles["bookmark-container-search-results"]}`}
      >
        <For each={searchResults()}>
          {(result, index) => (
            <Bookmark
              {...result}
              focus={index() === 0}
              style={{ "view-transition-name": `bookmark-search-${result.id}` }}
            />
          )}
        </For>
      </div>

      <ElmHeading level={3}>Favorites</ElmHeading>
      <div
        class={`${styles["bookmark-container"]} ${styles["bookmark-container-favorite"]}`}
      >
        <For each={grouped().favorites}>
          {(bookmark) => <Bookmark {...bookmark} />}
        </For>
      </div>

      <div ref={bookmarkListContainer} class={styles["tags-container"]}>
        <For each={grouped().tags}>
          {(group) => (
            <div class={styles["tag-section"]}>
              <div class={styles["tag"]} style={{ "--color": group.tag.color }}>
                <ElmMdiIcon d={mdiTag} color="oklch(from white l c h / 0.75)" />
                {group.tag.name}
              </div>
              <div class={styles["bookmark-container"]}>
                <For each={group.bookmarks}>
                  {(bookmark) => <Bookmark {...bookmark} />}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
