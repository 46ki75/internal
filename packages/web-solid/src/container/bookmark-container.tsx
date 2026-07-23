import { createMemo, createSignal, Show } from "solid-js";
import { ElmButton, ElmInlineText, ElmTextField } from "@elmethis/solid";
import { useQueryClient } from "@tanstack/solid-query";

import styles from "./bookmark-container.module.css";
import {
  BookmarkList,
  type BookmarkListProps,
} from "~/components/bookmark/bookmark-list";
import { createClientQuery } from "~/client-query";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { queryKeys } from "~/query-client";
import { mapBookmarkResponse } from "./bookmark-model";

type Bookmark = BookmarkListProps["bookmarks"][number];
const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/\S*)?$/i;

export const BookmarkContainer = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = createSignal("");
  const [url, setUrl] = createSignal("");
  const [createBookmarkLoading, setCreateBookmarkLoading] = createSignal(false);
  const [createBookmarkError, setCreateBookmarkError] = createSignal<
    string | null
  >(null);

  const bookmarksQuery = createClientQuery({
    queryKey: queryKeys.bookmarks,
    enabled: () => Boolean(auth.accessToken()),
    queryFn: async ({ signal }) => {
      await auth.refresh();
      const accessToken = auth.accessToken();
      if (!accessToken) throw new Error("Access token is not available");

      const { data, error, response } = await openApiClient.GET(
        "/api/v1/bookmark",
        {
          params: { header: { Authorization: `Bearer ${accessToken}` } },
          signal,
        },
      );
      if (!data) {
        throw new Error(
          `Failed to fetch bookmarks (${response.status}): ${JSON.stringify(error)}`,
        );
      }
      return data.map(mapBookmarkResponse);
    },
  });

  const bookmarks = createMemo(() =>
    !auth.accessToken() || bookmarksQuery.isPending()
      ? []
      : (bookmarksQuery.data() ?? []),
  );

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

          queryClient.setQueryData<Bookmark[]>(
            queryKeys.bookmarks,
            (current = []) => [...current, mapBookmarkResponse(data)],
          );
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
      <BookmarkList
        bookmarks={bookmarks()}
        isRefreshing={bookmarksQuery.isFetching()}
        onRefresh={() => void bookmarksQuery.refetch()}
      />

      <Show when={bookmarksQuery.error()} keyed>
        {(error) => (
          <p role="alert">
            <ElmInlineText color="#c56565">{error.message}</ElmInlineText>
          </p>
        )}
      </Show>

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
