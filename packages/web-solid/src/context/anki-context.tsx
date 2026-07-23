import {
  createContext,
  createEffect,
  untrack,
  useContext,
  type ParentProps,
} from "solid-js";
import { createStore } from "solid-js/store";
import { createQuery, useQueryClient } from "@tanstack/solid-query";

import { openApiClient } from "~/openapi/client";
import type { paths } from "~/openapi/schema";
import { QUERY_CACHE_DURATION, queryKeys } from "~/query-client";
import { useAuth } from "./auth-context";

type AnkiMeta =
  paths["/api/v1/anki/{page_id}"]["get"]["responses"]["200"]["content"]["application/json"];

interface AnkiBlock {
  back: unknown;
  explanation: unknown;
  front: unknown;
}

interface AnkiItem {
  metadata: AnkiMeta;
  block: AnkiBlock | null;
  loading: boolean;
}

interface AnkiState {
  error: string | null;
  ankiList: {
    data: AnkiItem[];
    currentIndex: number | null;
    loading: boolean;
  };
  create: { loading: boolean };
  review: { loading: boolean };
}

interface AnkiContextValue {
  state: AnkiState;
  fetchList: () => Promise<void>;
  fetchBlock: (pageId?: string, force?: boolean) => Promise<void>;
  updateByRating: (pageId: string, rating: number) => Promise<void>;
  create: () => Promise<void>;
  review: () => Promise<void>;
}

const AnkiContext = createContext<AnkiContextValue>();

export const AnkiProvider = (props: ParentProps) => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = createStore<AnkiState>({
    error: null,
    ankiList: { data: [], currentIndex: null, loading: false },
    create: { loading: false },
    review: { loading: false },
  });

  const setError = (prefix: string, error: unknown) => {
    if (error instanceof Error && error.name === "AbortError") return;
    setState(
      "error",
      `${prefix}${error instanceof Error ? error.message : String(error)}`,
    );
  };

  const ankiListQuery = createQuery(() => ({
    queryKey: queryKeys.anki,
    enabled: Boolean(auth.accessToken()),
    queryFn: async ({ signal }) => {
      await auth.refresh();
      const { data, error, response } = await openApiClient.GET(
        "/api/v1/anki",
        {
          params: {
            header: { Authorization: `Bearer ${auth.accessToken()}` },
          },
          signal,
        },
      );
      if (!data) {
        throw new Error(
          `Failed to fetch Anki list (${response.status}): ${JSON.stringify(error)}`,
        );
      }
      return data;
    },
  }));

  const fetchList = async () => {
    await ankiListQuery.refetch();
  };

  const fetchBlock = async (pageId?: string, force = false) => {
    const index = state.ankiList.data.findIndex(
      (item) => item.metadata.page_id === pageId,
    );
    if (!pageId || index < 0) return;
    if (state.ankiList.data[index].loading) return;
    if (state.ankiList.data[index].block && !force) return;

    setState("ankiList", "data", index, "loading", true);
    try {
      const data = await queryClient.fetchQuery({
        queryKey: queryKeys.ankiBlock(pageId),
        staleTime: force ? 0 : QUERY_CACHE_DURATION,
        queryFn: async ({ signal }) => {
          await auth.refresh();
          const { data, error, response } = await openApiClient.GET(
            "/api/v1/anki/block/{page_id}",
            {
              params: {
                header: { Authorization: `Bearer ${auth.accessToken()}` },
                path: { page_id: pageId },
              },
              signal,
            },
          );
          if (!data) {
            throw new Error(
              `Failed to fetch Anki block (${response.status}): ${JSON.stringify(error)}`,
            );
          }
          return data as AnkiBlock;
        },
      });
      setState("ankiList", "data", index, "block", data);
    } catch (error) {
      setError("Failed to fetch Anki block. ", error);
    } finally {
      setState("ankiList", "data", index, "loading", false);
    }
  };

  const updateByRating = async (pageId: string, rating: number) => {
    const index = state.ankiList.data.findIndex(
      (item) => item.metadata.page_id === pageId,
    );
    if (index < 0) return;

    try {
      await auth.refresh();
      const current = state.ankiList.data[index].metadata;
      const repetitionCount = rating < 3 ? 0 : current.repetition_count + 1;
      const easeFactor =
        rating < 3
          ? Math.max(1.3, current.ease_factor * 0.85)
          : current.ease_factor +
            0.1 -
            (5 - rating) * (0.08 + (5 - rating) * 0.02);
      const multiplier = rating === 4 ? 1.5 : rating === 5 ? 2 : 1;
      const interval =
        rating <= 1
          ? 0.5
          : rating === 2
            ? Math.max(0.5, repetitionCount)
            : Math.min(
                91.25,
                Math.pow(easeFactor, repetitionCount) * multiplier,
              );
      const nextReviewAt = new Date(
        Date.now() + interval * 24 * 60 * 60 * 1000,
      ).toISOString();

      setState(
        "ankiList",
        "data",
        index,
        "metadata",
        "ease_factor",
        easeFactor,
      );
      setState(
        "ankiList",
        "data",
        index,
        "metadata",
        "repetition_count",
        repetitionCount,
      );
      setState(
        "ankiList",
        "data",
        index,
        "metadata",
        "next_review_at",
        nextReviewAt,
      );
      queryClient.setQueryData<AnkiMeta[]>(queryKeys.anki, (items = []) =>
        items.map((item) =>
          item.page_id === pageId
            ? {
                ...item,
                ease_factor: easeFactor,
                repetition_count: repetitionCount,
                next_review_at: nextReviewAt,
              }
            : item,
        ),
      );

      void openApiClient
        .PUT("/api/v1/anki/{page_id}", {
          params: {
            header: { Authorization: `Bearer ${auth.accessToken()}` },
            path: { page_id: pageId },
          },
          body: {
            ease_factor: easeFactor,
            repetition_count: repetitionCount,
            next_review_at: nextReviewAt,
          },
        })
        .then(({ error }) => {
          if (error) setError("Failed to persist Anki update. ", error);
        })
        .catch((error) => setError("Failed to persist Anki update. ", error));
      setState(
        "ankiList",
        "currentIndex",
        (state.ankiList.currentIndex ?? -1) + 1,
      );
    } catch (error) {
      setError("Failed to update Anki. ", error);
    }
  };

  const create = async () => {
    setState("create", "loading", true);
    try {
      await auth.refresh();
      const { data } = await openApiClient.POST("/api/v1/anki", {
        params: {
          header: { Authorization: `Bearer ${auth.accessToken()}` },
        },
        body: {},
      });
      if (!data) throw new Error("No data returned from API");
      window.open(
        data.url.replace(/^https?:\/\//, "notionrs://"),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      setError("Failed to create new Anki. ", error);
    } finally {
      setState("create", "loading", false);
    }
  };

  const review = async () => {
    const index = state.ankiList.currentIndex;
    if (index == null || !state.ankiList.data[index]) return;
    setState("review", "loading", true);
    try {
      await auth.refresh();
      const current = state.ankiList.data[index];
      const { data } = await openApiClient.PUT("/api/v1/anki/{page_id}", {
        params: {
          header: { Authorization: `Bearer ${auth.accessToken()}` },
          path: { page_id: current.metadata.page_id },
        },
        body: { is_review_required: !current.metadata.is_review_required },
      });
      if (!data) throw new Error("No data returned from API");
      setState(
        "ankiList",
        "data",
        index,
        "metadata",
        "is_review_required",
        data.is_review_required,
      );
      queryClient.setQueryData<AnkiMeta[]>(queryKeys.anki, (items = []) =>
        items.map((item) =>
          item.page_id === current.metadata.page_id
            ? { ...item, is_review_required: data.is_review_required }
            : item,
        ),
      );
    } catch (error) {
      setError("Failed to review Anki. ", error);
    } finally {
      setState("review", "loading", false);
    }
  };

  createEffect(() => {
    setState("ankiList", "loading", ankiListQuery.isFetching);
    if (!auth.accessToken()) return;
    const queryError = ankiListQuery.error;
    if (queryError) {
      setError("Failed to fetch Anki list. ", queryError);
      return;
    }
    const data = ankiListQuery.data;
    if (!data) return;

    const previousItems = untrack(() => state.ankiList.data);
    const previousByPageId = new Map(
      previousItems.map((item) => [item.metadata.page_id, item]),
    );
    setState(
      "ankiList",
      "data",
      data.map((metadata) => {
        const previous = previousByPageId.get(metadata.page_id);
        return {
          metadata,
          block: previous?.block ?? null,
          loading: previous?.loading ?? false,
        };
      }),
    );
    if (previousItems.length === 0) {
      setState("ankiList", "currentIndex", data.length > 0 ? 0 : null);
    }
  });

  createEffect(() => {
    const currentIndex = state.ankiList.currentIndex;
    if (typeof window === "undefined" || currentIndex == null) return;
    const pageIds = [currentIndex, currentIndex + 1, currentIndex + 2]
      .map((index) => state.ankiList.data[index]?.metadata.page_id)
      .filter((pageId): pageId is string => pageId != null);
    untrack(() => {
      for (const pageId of pageIds) void fetchBlock(pageId);
    });
  });

  return (
    <AnkiContext.Provider
      value={{ state, fetchList, fetchBlock, updateByRating, create, review }}
    >
      {props.children}
    </AnkiContext.Provider>
  );
};

export const useAnki = () => {
  const context = useContext(AnkiContext);
  if (!context) throw new Error("useAnki must be used within AnkiProvider");
  return context;
};
