import {
  $,
  createContextId,
  QRL,
  useContext,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@qwik.dev/core";
import { openApiClient } from "~/openapi/client";
import { paths } from "~/openapi/schema";
import { AuthContext, AuthState, useAuthActions } from "./auth-context";

type AnkiMeta =
  paths["/api/v1/anki/{page_id}"]["get"]["responses"]["200"]["content"]["application/json"];

type AnkiBlock = {
  back: unknown;
  explanation: unknown;
  front: unknown;
};

/**
 * Serializable anki state. Behavior lives in `useAnkiActions()`.
 */
export interface AnkiState {
  error: string | null;

  ankiList: {
    data: Array<{
      metadata: AnkiMeta;
      block: AnkiBlock | null;
      loading: boolean;
    }>;
    currentIndex: number | null;
    loading: boolean;
  };

  create: { loading: boolean };
  review: { loading: boolean };
}

export const AnkiContext = createContextId<AnkiState>("anki");

type Refresh = QRL<() => Promise<void>>;

// Shared fetch logic with explicit dependencies, so both the provider's
// bootstrap tasks and `useAnkiActions()` drive it without either having to
// consume a context the other provides.
const fetchAnkiList = async (
  anki: AnkiState,
  auth: AuthState,
  refresh: Refresh,
  signal?: AbortSignal,
) => {
  anki.ankiList.loading = true;

  try {
    await refresh();

    const { data: ankiListData } = await openApiClient.GET("/api/v1/anki", {
      params: {
        header: { Authorization: `Bearer ${auth.tokens.accessToken}` },
      },
      signal,
    });

    if (ankiListData)
      anki.ankiList.data = ankiListData.map((item) => ({
        metadata: item,
        block: null,
        loading: false,
      }));

    if (ankiListData && ankiListData.length > 0) anki.ankiList.currentIndex = 0;
  } catch (error) {
    if (!(error instanceof Error && error.name === "AbortError")) {
      anki.error =
        "Failed to fetch Anki list. " +
        (error instanceof Error ? error.message : String(error));
    }
  } finally {
    if (!signal?.aborted) anki.ankiList.loading = false;
  }
};

const fetchAnkiBlock = async (
  anki: AnkiState,
  auth: AuthState,
  refresh: Refresh,
  pageId?: string,
  signal?: AbortSignal,
) => {
  const ankiRef = anki.ankiList.data.find(
    (item) => item.metadata.page_id === pageId,
  );

  try {
    if (!pageId) throw new Error("Page ID is required to fetch Anki block.");
    if (!ankiRef)
      throw new Error(`Anki with page_id ${pageId} not found in the list.`);

    // Prevent multiple fetches for the same block
    if (ankiRef.loading) return;

    ankiRef.loading = true;

    await refresh();

    const { data: ankiBlockData } = await openApiClient.GET(
      "/api/v1/anki/block/{page_id}",
      {
        params: {
          header: { Authorization: `Bearer ${auth.tokens.accessToken}` },
          path: { page_id: pageId },
        },
        signal,
      },
    );

    if (ankiBlockData) ankiRef.block = ankiBlockData as AnkiBlock;
  } catch (error) {
    if (!(error instanceof Error && error.name === "AbortError")) {
      anki.error =
        "Failed to fetch Anki block. " +
        (error instanceof Error ? error.message : String(error));
    }
  } finally {
    if (ankiRef && !signal?.aborted) ankiRef.loading = false;
  }
};

export const useAnkiActions = () => {
  const auth = useContext(AuthContext);
  const anki = useContext(AnkiContext);
  const { refresh } = useAuthActions();

  const fetchList = $((signal?: AbortSignal) =>
    fetchAnkiList(anki, auth, refresh, signal),
  );

  const fetchBlock = $((pageId?: string, signal?: AbortSignal) =>
    fetchAnkiBlock(anki, auth, refresh, pageId, signal),
  );

  const updateByRating = $(
    async (pageId: string, performanceRating: number) => {
      const ankiRef = anki.ankiList.data.find(
        (item) => item.metadata.page_id === pageId,
      );

      try {
        if (!ankiRef)
          throw new Error(`Anki with page_id ${pageId} not found in the list.`);

        await refresh();

        const maxInterval = 365 / 4;
        const minInterval = 0.5;

        let newEaseFactor: number;
        let newRepetitionCount: number;

        if (performanceRating < 3) {
          newEaseFactor = Math.max(1.3, ankiRef.metadata.ease_factor * 0.85);
          newRepetitionCount = 0;
        } else {
          newEaseFactor =
            ankiRef.metadata.ease_factor +
            0.1 -
            (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02);
          newRepetitionCount = ankiRef.metadata.repetition_count + 1;
        }

        let newInterval;
        if (performanceRating === 0) {
          newInterval = minInterval;
        } else if (performanceRating === 1) {
          newInterval = minInterval;
        } else if (performanceRating === 2) {
          newInterval = Math.max(minInterval, newRepetitionCount);
        } else {
          let multiplier = 1;
          if (performanceRating === 3) {
            multiplier = 1;
          } else if (performanceRating === 4) {
            multiplier = 1.5;
          } else if (performanceRating === 5) {
            multiplier = 2;
          }
          newInterval = Math.min(
            maxInterval,
            Math.pow(newEaseFactor, newRepetitionCount) * multiplier,
          );
        }

        const newNextReviewAt = new Date(
          Date.now() + newInterval * 24 * 60 * 60 * 1000,
        ).toISOString();

        ankiRef.metadata.ease_factor = newEaseFactor;
        ankiRef.metadata.repetition_count = newRepetitionCount;
        ankiRef.metadata.next_review_at = newNextReviewAt;

        const payload = {
          ease_factor: newEaseFactor,
          repetition_count: newRepetitionCount,
          next_review_at: newNextReviewAt,
        };

        // Fire-and-forget: the UI advances immediately; the write lands in the
        // background.
        void openApiClient.PUT(`/api/v1/anki/{page_id}`, {
          params: {
            header: {
              Authorization: `Bearer ${auth.tokens.accessToken}`,
            },
            path: { page_id: ankiRef.metadata.page_id },
          },
          body: payload,
        });

        if (anki.ankiList.currentIndex != null) {
          anki.ankiList.currentIndex = anki.ankiList.currentIndex + 1;
        } else {
          anki.ankiList.currentIndex = 0;
        }
      } catch (error) {
        if (ankiRef)
          anki.error =
            "Failed to fetch Anki block. " +
            (error instanceof Error ? error.message : String(error));
      }
    },
  );

  const create = $(async () => {
    anki.create.loading = true;

    try {
      await refresh();

      const { data } = await openApiClient.POST("/api/v1/anki", {
        params: {
          header: {
            Authorization: `Bearer ${auth.tokens.accessToken}`,
          },
        },
        body: {},
      });

      if (data == null) {
        throw new Error("No data returned from API");
      } else {
        const a = document.createElement("a");
        a.href = data.url.replace(/https?\/\//, "notionrs://");
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
      }
    } catch (error) {
      anki.error =
        "Failed to create new Anki. " +
        (error instanceof Error ? error.message : String(error));
    } finally {
      anki.create.loading = false;
    }
  });

  const review = $(async () => {
    anki.review.loading = true;
    try {
      if (anki.ankiList.currentIndex == null) {
        throw new Error("No current Anki to review");
      }

      const currentAnki = anki.ankiList.data[anki.ankiList.currentIndex];

      await refresh();

      const res = await openApiClient.PUT(`/api/v1/anki/{page_id}`, {
        params: {
          header: {
            Authorization: `Bearer ${auth.tokens.accessToken}`,
          },
          path: {
            page_id: currentAnki.metadata.page_id,
          },
        },
        body: {
          is_review_required: !currentAnki.metadata.is_review_required,
        },
      });

      if (!res.data) {
        throw new Error("No data returned from API");
      }

      currentAnki.metadata.is_review_required = res.data.is_review_required;
    } catch (error) {
      anki.error =
        "Failed to review Anki. " +
        (error instanceof Error ? error.message : String(error));
    } finally {
      anki.review.loading = false;
    }
  });

  return { fetchList, fetchBlock, updateByRating, create, review };
};

export const useAnkiContextProvider = () => {
  const auth = useContext(AuthContext);
  const { refresh } = useAuthActions();

  const ankiStore = useStore<AnkiState>({
    error: null,
    ankiList: {
      data: [],
      currentIndex: null,
      loading: false,
    },
    create: { loading: false },
    review: { loading: false },
  });

  useContextProvider(AnkiContext, ankiStore);

  // `document-ready`: called from a layout that returns a Fragment, so the
  // default intersection-observer has no host element to attach to.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    ({ cleanup }) => {
      const controller = new AbortController();
      cleanup(() => controller.abort());

      fetchAnkiList(ankiStore, auth, refresh, controller.signal);
    },
    { strategy: "document-ready" },
  );

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    ({ cleanup, track }) => {
      const controller = new AbortController();
      cleanup(() => controller.abort());

      const currentIndex = track(() => ankiStore.ankiList.currentIndex);

      if (currentIndex === null) return;

      // Prefetch the current block plus the next two, so navigating forward
      // lands on already-loaded content.
      [currentIndex, currentIndex + 1, currentIndex + 2].forEach((index) => {
        const ref = ankiStore.ankiList.data[index];
        if (ref)
          fetchAnkiBlock(
            ankiStore,
            auth,
            refresh,
            ref.metadata.page_id,
            controller.signal,
          );
      });
    },
    { strategy: "document-ready" },
  );
};
