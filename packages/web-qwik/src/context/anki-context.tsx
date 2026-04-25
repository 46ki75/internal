import {
  $,
  createContextId,
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
  ankiList: {
    data: Array<{
      metadata: AnkiMeta;
      block: AnkiBlock | null;
      loading: boolean;
      error: string | null;
    }>;
    currentIndex: number | null;
    loading: boolean;
    error: string | null;
  };
}

export const AnkiContext = createContextId<AnkiStore>("anki");

export const useAnkiContextProvider = () => {
  const ankiStore = useStore<AnkiStore>({
    ankiList: {
      data: [],
      currentIndex: null,
      loading: false,
      error: null,
    },
  });

  useContextProvider(AnkiContext, ankiStore);

  const authStore = useContext(AuthContext);

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
      ankiStore.ankiList.error =
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
        ankiRef.error =
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
