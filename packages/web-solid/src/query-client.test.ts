import { describe, expect, it } from "vitest";
import { isServer } from "solid-js/web";

import {
  createQueryClient,
  QUERY_CACHE_DURATION,
  queryKeys,
  shouldPersistQuery,
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

    expect(todos && shouldPersistQuery(todos)).toBe(true);
    expect(bookmarks && shouldPersistQuery(bookmarks)).toBe(true);
    expect(anki && shouldPersistQuery(anki)).toBe(false);
    expect(icons && shouldPersistQuery(icons)).toBe(false);
  });
});
