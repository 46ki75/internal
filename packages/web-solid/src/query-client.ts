import { QueryClient, type Query } from "@tanstack/solid-query";
import { isServer } from "solid-js/web";

export const QUERY_CACHE_DURATION = 30 * 60 * 1000;

const stage = import.meta.env.VITE_STAGE_NAME ?? "dev";
export const LEGACY_QUERY_CACHE_STORAGE_KEY = `${stage}-46ki75-internal-query-cache`;
export const BOOKMARK_QUERY_CACHE_STORAGE_KEY = `${LEGACY_QUERY_CACHE_STORAGE_KEY}-bookmarks`;
export const TODO_QUERY_CACHE_STORAGE_KEY = `${LEGACY_QUERY_CACHE_STORAGE_KEY}-todos`;
export const QUERY_CACHE_STORAGE_KEYS = [
  LEGACY_QUERY_CACHE_STORAGE_KEY,
  BOOKMARK_QUERY_CACHE_STORAGE_KEY,
  TODO_QUERY_CACHE_STORAGE_KEY,
] as const;

export const queryKeys = {
  bookmarks: ["bookmarks"] as const,
  todos: ["todos"] as const,
  anki: ["anki"] as const,
  ankiBlock: (pageId: string) => ["anki", "block", pageId] as const,
};

const shouldPersistQueryRoot = (root: string) => (query: Query) =>
  query.state.status === "success" && query.queryKey[0] === root;

export const shouldPersistBookmarkQuery = shouldPersistQueryRoot("bookmarks");
export const shouldPersistTodoQuery = shouldPersistQueryRoot("todos");

export const migrateQueryCacheStorage = (storage: Storage) => {
  const serializedCache = storage.getItem(LEGACY_QUERY_CACHE_STORAGE_KEY);
  if (!serializedCache) return;

  try {
    const persistedClient = JSON.parse(serializedCache) as {
      clientState?: {
        queries?: Array<{ queryKey?: unknown[] }>;
      };
    };
    const queries = persistedClient.clientState?.queries;
    if (!Array.isArray(queries)) return;

    for (const [root, key] of [
      ["bookmarks", BOOKMARK_QUERY_CACHE_STORAGE_KEY],
      ["todos", TODO_QUERY_CACHE_STORAGE_KEY],
    ] as const) {
      if (storage.getItem(key)) continue;
      storage.setItem(
        key,
        JSON.stringify({
          ...persistedClient,
          clientState: {
            ...persistedClient.clientState,
            queries: queries.filter((query) => query.queryKey?.[0] === root),
          },
        }),
      );
    }
  } catch {
    // Invalid legacy cache data should not prevent the application from loading.
  } finally {
    storage.removeItem(LEGACY_QUERY_CACHE_STORAGE_KEY);
  }
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_CACHE_DURATION,
        gcTime: isServer ? Infinity : QUERY_CACHE_DURATION,
        retry: 1,
      },
    },
  });
