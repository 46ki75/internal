import {
  component$,
  useContext,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";

import styles from "./bookmark-container.module.css";
import {
  BookmarkList,
  BookmarkListProps,
} from "~/components/bookmark/bookmark-list";
import { AuthContext } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";

export const BookmarkContainer = component$(() => {
  const authStore = useContext(AuthContext);
  const bookmarkStore = useStore<BookmarkListProps>({ bookmarks: [] });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const accessToken = track(() => authStore.tokens.accessToken);

    if (accessToken) {
      const { data } = await openApiClient.GET("/api/v1/bookmark", {
        params: { header: { Authorization: `Bearer ${accessToken}` } },
      });

      if (data) {
        const bookmarks: BookmarkListProps["bookmarks"] = data.map(
          (bookmark) => {
            return {
              id: bookmark.id,
              icon: bookmark.favicon ?? undefined,
              label: bookmark.name || bookmark.url || "No Title",
              favorite: bookmark.favorite,
              url: bookmark.url || "https://example.com",
              editUrl: bookmark.notion_url,
              tag: bookmark.tag
                ? {
                    id: bookmark.tag.id,
                    name: bookmark.tag.name,
                    color: bookmark.tag.color,
                  }
                : {
                    id: "__untagged__",
                    name: "Untagged",
                    color: "gray",
                  },
            } satisfies BookmarkListProps["bookmarks"][number];
          },
        );

        bookmarkStore.bookmarks = bookmarks;
      }
    }
  });

  return (
    <div class={styles["bookmark-container"]}>
      <BookmarkList {...bookmarkStore} />
    </div>
  );
});
