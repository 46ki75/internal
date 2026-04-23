import {
  $,
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";

import styles from "./bookmark-container.module.css";
import {
  BookmarkList,
  BookmarkListProps,
} from "~/components/bookmark/bookmark-list";
import { AuthContext } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import {
  ElmButton,
  ElmInlineText,
  ElmTextField,
  useLocalStorage,
} from "@elmethis/qwik";

export const BookmarkContainer = component$(() => {
  const authStore = useContext(AuthContext);

  const { state: bookmarkStore } = useLocalStorage<{
    bookmarks: BookmarkListProps["bookmarks"];
  }>({
    key: "bookmarks",
    initialValue: { bookmarks: [] },
  });

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

        bookmarkStore.value = { bookmarks };
      }
    }
  });

  const name = useSignal<string | null>(null);
  const url = useSignal<string | null>(null);
  const createBookmarkError = useSignal<string | null>(null);

  const handleCreateBookmark = $(async () => {
    createBookmarkError.value = null;

    if (!name.value || !url.value) {
      createBookmarkError.value = "Name and URL are required";
      return;
    }

    const urlPattern = new RegExp(
      "^(https?:\\/\\/)?([\\w-]+\\.)+[\\w-]+(\\/\\S*)?$",
      "i",
    );
    if (!urlPattern.test(url.value)) {
      createBookmarkError.value = "Invalid URL format";
      return;
    }

    let retryCount = 0;

    while (retryCount < 3) {
      const accessToken = authStore.tokens.accessToken;

      try {
        if (!accessToken) {
          throw new Error("Access token is not available");
        }

        const { data } = await openApiClient.POST("/api/v1/bookmark", {
          params: { header: { Authorization: `Bearer ${accessToken}` } },
          body: { name: name.value, url: url.value },
        });

        if (!data) throw new Error("No data returned from API");

        const newBookmark: BookmarkListProps["bookmarks"][number] = {
          id: data.id,
          icon: data.favicon ?? undefined,
          label: data.name || data.url || "No Title",
          favorite: data.favorite,
          url: data.url || "https://example.com",
          editUrl: data.notion_url,
          tag: data.tag
            ? {
                id: data.tag.id,
                name: data.tag.name,
                color: data.tag.color,
              }
            : {
                id: "__untagged__",
                name: "Untagged",
                color: "gray",
              },
        };

        bookmarkStore.value = {
          bookmarks: [...bookmarkStore.value.bookmarks, newBookmark],
        };

        break;
      } catch (error) {
        retryCount++;
        createBookmarkError.value =
          error instanceof Error ? error.message : String(error);
      }
    }
  });

  return (
    <div class={styles["bookmark-container"]}>
      <BookmarkList {...bookmarkStore.value} />

      <ElmTextField
        label="Name"
        icon="pen"
        onInput$={(_, input) => {
          name.value = input.value;
        }}
      />
      <ElmTextField
        label="URL"
        icon="earth"
        onInput$={(_, input) => {
          url.value = input.value;
        }}
      />

      <ElmButton block onClick$={handleCreateBookmark}>
        Create Bookmark
      </ElmButton>

      {createBookmarkError.value && (
        <p>
          <ElmInlineText text={createBookmarkError.value} color="#c56565" />
        </p>
      )}
    </div>
  );
});
