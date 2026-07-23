import { describe, expect, it } from "vitest";
import { isServer } from "solid-js/web";

import {
  BOOKMARK_QUERY_CACHE_STORAGE_KEY,
  createQueryClient,
  LEGACY_QUERY_CACHE_STORAGE_KEY,
  migrateQueryCacheStorage,
  QUERY_CACHE_DURATION,
  queryKeys,
  shouldPersistBookmarkQuery,
  shouldPersistTodoQuery,
  TODO_QUERY_CACHE_STORAGE_KEY,
} from "./query-client";

describe("query client", () => {
  it("keeps cached data fresh for 30 minutes", () => {
    const options = createQueryClient().getDefaultOptions().queries;

    expect(QUERY_CACHE_DURATION).toBe(30 * 60 * 1000);
    expect(options?.staleTime).toBe(QUERY_CACHE_DURATION);
    expect(options?.gcTime).toBe(isServer ? Infinity : QUERY_CACHE_DURATION);
  });

  it("persists successful cache entries for the selected features only", () => {
    const client = createQueryClient();
    client.setQueryData(queryKeys.todos, []);
    client.setQueryData(queryKeys.bookmarks, []);
    client.setQueryData(queryKeys.anki, []);
    client.setQueryData(["icons"], []);

    const todos = client.getQueryCache().find({ queryKey: queryKeys.todos });
    const bookmarks = client
      .getQueryCache()
      .find({ queryKey: queryKeys.bookmarks });
    const anki = client.getQueryCache().find({ queryKey: queryKeys.anki });
    const icons = client.getQueryCache().find({ queryKey: ["icons"] });

    expect(todos && shouldPersistTodoQuery(todos)).toBe(true);
    expect(todos && shouldPersistBookmarkQuery(todos)).toBe(false);
    expect(bookmarks && shouldPersistBookmarkQuery(bookmarks)).toBe(true);
    expect(bookmarks && shouldPersistTodoQuery(bookmarks)).toBe(false);
    expect(anki && shouldPersistBookmarkQuery(anki)).toBe(false);
    expect(anki && shouldPersistTodoQuery(anki)).toBe(false);
    expect(icons && shouldPersistBookmarkQuery(icons)).toBe(false);
    expect(icons && shouldPersistTodoQuery(icons)).toBe(false);
  });

  it("splits the legacy persisted cache by feature", () => {
    localStorage.clear();
    const persistedClient = {
      timestamp: Date.now(),
      buster: "v2",
      clientState: {
        mutations: [],
        queries: [
          { queryKey: queryKeys.bookmarks },
          { queryKey: queryKeys.todos },
          { queryKey: queryKeys.anki },
        ],
      },
    };
    localStorage.setItem(
      LEGACY_QUERY_CACHE_STORAGE_KEY,
      JSON.stringify(persistedClient),
    );

    migrateQueryCacheStorage(localStorage);

    expect(localStorage.getItem(LEGACY_QUERY_CACHE_STORAGE_KEY)).toBeNull();
    expect(
      JSON.parse(localStorage.getItem(BOOKMARK_QUERY_CACHE_STORAGE_KEY) ?? "")
        .clientState.queries,
    ).toEqual([{ queryKey: queryKeys.bookmarks }]);
    expect(
      JSON.parse(localStorage.getItem(TODO_QUERY_CACHE_STORAGE_KEY) ?? "")
        .clientState.queries,
    ).toEqual([{ queryKey: queryKeys.todos }]);
  });
});
