import { QueryClient, type Query } from "@tanstack/solid-query";
import { isServer } from "solid-js/web";

export const QUERY_CACHE_DURATION = 30 * 60 * 1000;

const stage = import.meta.env.VITE_STAGE_NAME ?? "dev";
export const QUERY_CACHE_STORAGE_KEY = `${stage}-46ki75-internal-query-cache`;

export const queryKeys = {
  bookmarks: ["bookmarks"] as const,
  todos: ["todos"] as const,
  anki: ["anki"] as const,
  ankiBlock: (pageId: string) => ["anki", "block", pageId] as const,
};

const persistedQueryRoots = new Set(["bookmarks", "todos"]);

export const shouldPersistQuery = (query: Query) =>
  query.state.status === "success" &&
  persistedQueryRoots.has(String(query.queryKey[0]));

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
