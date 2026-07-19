import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { ElmButton, ElmInlineText, ElmTextField } from "@elmethis/solid";

import styles from "./bookmark-container.module.css";
import {
  BookmarkList,
  type BookmarkListProps,
} from "~/components/bookmark/bookmark-list";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { mapBookmarkResponse } from "./bookmark-model";

type Bookmark = BookmarkListProps["bookmarks"][number];
const BOOKMARKS_STORAGE_KEY = "bookmarks";
const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/\S*)?$/i;

export const BookmarkContainer = () => {
  const auth = useAuth();
  const [bookmarks, setBookmarks] = createSignal<Bookmark[]>([]);
  const [name, setName] = createSignal("");
  const [url, setUrl] = createSignal("");
  const [createBookmarkLoading, setCreateBookmarkLoading] = createSignal(false);
  const [createBookmarkError, setCreateBookmarkError] = createSignal<
    string | null
  >(null);

  onMount(() => {
    const cached = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (cached) {
      try {
        const value: unknown = JSON.parse(cached);
        if (
          typeof value === "object" &&
          value !== null &&
          "bookmarks" in value &&
          Array.isArray(value.bookmarks)
        ) {
          setBookmarks(value.bookmarks as Bookmark[]);
        }
      } catch {
        // Ignore invalid cache data and replace it with the next valid state.
      }
    }

    createEffect(() => {
      localStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify({ bookmarks: bookmarks() }),
      );
    });

    createEffect(() => {
      const accessToken = auth.accessToken();
      if (!accessToken) return;

      const controller = new AbortController();
      void (async () => {
        try {
          const { data } = await openApiClient.GET("/api/v1/bookmark", {
            params: { header: { Authorization: `Bearer ${accessToken}` } },
            signal: controller.signal,
          });

          if (data && !controller.signal.aborted) {
            setBookmarks(data.map(mapBookmarkResponse));
          }
        } catch (error) {
          if (!(error instanceof Error && error.name === "AbortError")) {
            console.error("Failed to fetch bookmarks", error);
          }
        }
      })();

      onCleanup(() => controller.abort());
    });
  });

  const handleCreateBookmark = async () => {
    setCreateBookmarkError(null);

    if (!name() || !url()) {
      setCreateBookmarkError("Name and URL are required");
      return;
    }

    if (!URL_PATTERN.test(url())) {
      setCreateBookmarkError("Invalid URL format");
      return;
    }

    setCreateBookmarkLoading(true);
    try {
      for (let retryCount = 0; retryCount < 3; retryCount += 1) {
        try {
          const accessToken = auth.accessToken();
          if (!accessToken) {
            throw new Error("Access token is not available");
          }

          const { data } = await openApiClient.POST("/api/v1/bookmark", {
            params: { header: { Authorization: `Bearer ${accessToken}` } },
            body: { name: name(), url: url() },
          });

          if (!data) throw new Error("No data returned from API");

          setBookmarks((current) => [...current, mapBookmarkResponse(data)]);
          return;
        } catch (error) {
          setCreateBookmarkError(
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    } finally {
      setCreateBookmarkLoading(false);
    }
  };

  return (
    <div class={styles["bookmark-container"]}>
      <BookmarkList bookmarks={bookmarks()} />

      <ElmTextField
        label="Name"
        value={name()}
        onInput={(event) => setName(event.currentTarget.value)}
      />
      <ElmTextField
        label="URL"
        value={url()}
        onInput={(event) => setUrl(event.currentTarget.value)}
      />

      <ElmButton
        block
        onClick={handleCreateBookmark}
        isLoading={createBookmarkLoading()}
      >
        <span>Create Bookmark</span>
      </ElmButton>

      <Show when={createBookmarkError()} keyed>
        {(error) => (
          <p>
            <ElmInlineText color="#c56565">{error}</ElmInlineText>
          </p>
        )}
      </Show>
    </div>
  );
};
