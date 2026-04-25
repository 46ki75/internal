import {
  $,
  createContextId,
  QRL,
  useContext,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import { openApiClient } from "~/openapi/client";
import { paths } from "~/openapi/schema";
import { AuthContext } from "./auth-context";
import { ElmJarkupProps } from "@elmethis/qwik";

type AnkiMeta =
  paths["/api/v1/anki/{page_id}"]["get"]["responses"]["200"]["content"]["application/json"][number];

type AnkiBlock = {
  back: ElmJarkupProps["jsonComponents"];
  explanation: ElmJarkupProps["jsonComponents"];
  front: ElmJarkupProps["jsonComponents"];
};

export interface AnkiStore {
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

  updateAnkiByPerformanceRating?: QRL<
    (
      ankiStore: AnkiStore,
      pageId: string,
      performanceRating: number,
    ) => Promise<void>
  >;

  create: {
    execute: QRL<(store: AnkiStore) => Promise<void>>;
    loading: boolean;
  };
}

export const AnkiContext = createContextId<AnkiStore>("anki");

export const useAnkiContextProvider = () => {
  const authStore = useContext(AuthContext);

  const ankiStore = useStore<AnkiStore>({
    error: null,

    ankiList: {
      data: [],
      currentIndex: null,
      loading: false,
    },

    updateAnkiByPerformanceRating: $(
      async (store: AnkiStore, pageId: string, performanceRating: number) => {
        const ankiRef = store.ankiList.data.find(
          (anki) => anki.metadata.page_id === pageId,
        );

        try {
          if (!ankiRef)
            throw new Error(
              `Anki with page_id ${pageId} not found in the list.`,
            );

          await authStore.tokens.refresh(authStore);

          const maxInterval = 365 / 4;
          const minInterval = 0.5;

          if (performanceRating < 3) {
            ankiRef.metadata.ease_factor = Math.max(
              1.3,
              ankiRef.metadata.ease_factor * 0.85,
            );
            ankiRef.metadata.repetition_count = 0;
          } else {
            ankiRef.metadata.ease_factor +=
              0.1 -
              (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02);
            ankiRef.metadata.repetition_count += 1;
          }

          let newInterval;
          if (performanceRating === 0) {
            newInterval = minInterval;
          } else if (performanceRating === 1) {
            newInterval = minInterval;
          } else if (performanceRating === 2) {
            newInterval = Math.max(
              minInterval,
              ankiRef.metadata.repetition_count,
            );
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
              Math.pow(
                ankiRef.metadata.ease_factor,
                ankiRef.metadata.repetition_count,
              ) * multiplier,
            );
          }

          ankiRef.metadata.next_review_at = new Date(
            Date.now() + newInterval * 24 * 60 * 60 * 1000,
          ).toISOString();

          const payload = {
            pageId: ankiRef.metadata.page_id,
            body: {
              ease_factor: ankiRef.metadata.ease_factor,
              repetition_count: ankiRef.metadata.repetition_count,
              next_review_at: ankiRef.metadata.next_review_at,
            },
          };

          (async () => {
            await openApiClient.PUT(`/api/v1/anki/{page_id}`, {
              params: {
                header: {
                  Authorization: `Bearer ${authStore.tokens.accessToken}`,
                },
                path: { page_id: ankiRef.metadata.page_id },
              },
              body: payload,
            });
          })();

          if (store.ankiList.currentIndex) {
            store.ankiList.currentIndex += 1;
          } else {
            store.ankiList.currentIndex = 0;
          }
        } catch (error) {
          if (ankiRef)
            store.error =
              "Failed to fetch Anki block. " +
              (error instanceof Error ? error.message : String(error));
        }
      },
    ),

    create: {
      execute: $(async (store: AnkiStore) => {
        store.create.loading = true;

        try {
          await authStore.tokens.refresh(authStore);

          const { data } = await openApiClient.POST("/api/v1/anki", {
            params: {
              header: {
                Authorization: `Bearer ${authStore.tokens.accessToken}`,
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
          store.error =
            "Failed to create new Anki. " +
            (error instanceof Error ? error.message : String(error));
        } finally {
          store.create.loading = false;
        }
      }),
      loading: false,
    },
  });

  useContextProvider(AnkiContext, ankiStore);

  const fetchAnkiList = $(async () => {
    ankiStore.ankiList.loading = true;

    try {
      await authStore.tokens.refresh(authStore);

      const { data: ankiListData } = await openApiClient.GET("/api/v1/anki", {
        params: {
          header: {
            Authorization: `Bearer ${authStore.tokens.accessToken}`,
          },
        },
      });

      if (ankiListData)
        ankiStore.ankiList.data = ankiListData.map((anki) => ({
          metadata: anki,
          block: null,
          loading: false,
          error: null,
        }));

      if (ankiListData && ankiListData.length > 0)
        ankiStore.ankiList.currentIndex = 0;
    } catch (error) {
      ankiStore.error =
        "Failed to fetch Anki list. " +
        (error instanceof Error ? error.message : String(error));
    } finally {
      ankiStore.ankiList.loading = false;
    }
  });

  const fetchAnkiBlock = $(async (pageId: string) => {
    const ankiRef = ankiStore.ankiList.data.find(
      (anki) => anki.metadata.page_id === pageId,
    );

    try {
      if (!ankiRef)
        throw new Error(`Anki with page_id ${pageId} not found in the list.`);

      // If the block is already fetched, do not fetch again
      if (ankiRef.block) return;

      // Prevent multiple fetches for the same block
      if (ankiRef.loading) return;

      ankiRef.loading = true;

      await authStore.tokens.refresh(authStore);

      const { data: ankiBlockData } = await openApiClient.GET(
        `/api/v1/anki/block/{page_id}`,
        {
          params: {
            header: { Authorization: `Bearer ${authStore.tokens.accessToken}` },
            path: { page_id: pageId },
          },
        },
      );

      if (ankiBlockData) ankiRef.block = ankiBlockData as AnkiBlock;
    } catch (error) {
      if (ankiRef)
        ankiStore.error =
          "Failed to fetch Anki block. " +
          (error instanceof Error ? error.message : String(error));
    } finally {
      if (ankiRef) ankiRef.loading = false;
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    fetchAnkiList();
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const currentIndex = track(() => ankiStore.ankiList.currentIndex);

    if (currentIndex === null) return;

    const currentAnkiRef = ankiStore.ankiList.data[currentIndex];
    if (currentAnkiRef) fetchAnkiBlock(currentAnkiRef.metadata.page_id);

    const nextAnkiRef = ankiStore.ankiList.data[currentIndex + 1];
    if (nextAnkiRef) fetchAnkiBlock(nextAnkiRef.metadata.page_id);

    const nextNextAnkiRef = ankiStore.ankiList.data[currentIndex + 2];
    if (nextNextAnkiRef) fetchAnkiBlock(nextNextAnkiRef.metadata.page_id);
  });
};
