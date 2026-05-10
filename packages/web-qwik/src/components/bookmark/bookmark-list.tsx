import {
  $,
  component$,
  JSX,
  noSerialize,
  NoSerialize,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";

import styles from "./bookmark-list.module.css";
import { Bookmark, BookmarkProps } from "./bookmark";
import { ElmHeading, ElmMdiIcon, ElmTextField } from "@elmethis/qwik";
import { mdiTag } from "@mdi/js";
import Fuse from "fuse.js";

import autoAnimate from "@formkit/auto-animate";

export interface BookmarkListProps {
  bookmarks: BookmarkProps[];
}

export const BookmarkList = component$<BookmarkListProps>(({ bookmarks }) => {
  const bookmarkContainerRef = useSignal<HTMLElement>();
  const bookmarkContainerAnimationController =
    useSignal<NoSerialize<ReturnType<typeof autoAnimate>>>();
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (bookmarkContainerRef.value) {
      bookmarkContainerAnimationController.value = noSerialize(
        autoAnimate(bookmarkContainerRef.value),
      );
    }
    cleanup(() => {
      if (bookmarkContainerAnimationController.value) {
        bookmarkContainerAnimationController.value?.disable();
      }
    });
  });

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
      favorites.push(<Bookmark key={bookmark.id} {...bookmark} />);
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
  const searchKeyword = useSignal("");

  const handleValueChange = $((value: string) => {
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

    searchKeyword.value = value;
  });

  const searchResults = useComputed$(() => {
    if (fuseInstance.value) {
      const results = fuseInstance.value.search(searchKeyword.value, {
        limit: 5,
      });
      return results.map((result) => result.item);
    }

    return [];
  });

  const handleKeyDown = $((event: KeyboardEvent) => {
    if (event.key === "Enter") {
      const a = document.createElement("a");
      a.href = searchResults.value[0]?.url || "#";
      a.rel = "noreferrer";
      a.click();
      searchKeyword.value = "";
    }
  });

  return (
    <div class={[styles["bookmark-list"]]}>
      <ElmHeading level={2}>Bookmark</ElmHeading>

      <ElmHeading level={3}>Search</ElmHeading>
      <ElmTextField
        label="Search"
        value={searchKeyword.value}
        onValueChange$={handleValueChange}
        onKeyDown$={handleKeyDown}
      />

      <div
        ref={bookmarkContainerRef}
        class={[
          styles["bookmark-container"],
          styles["bookmark-container-search-results"],
        ]}
      >
        {searchResults.value.map((result, index) => (
          <Bookmark
            key={result.id}
            {...result}
            focus={index === 0}
            style={{ viewTransitionName: `bookmark-search-${result.id}` }}
          />
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
