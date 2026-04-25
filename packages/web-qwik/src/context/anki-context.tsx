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

export interface AnkiStore {
  ankiList: {
    data: paths["/api/v1/anki"]["get"]["responses"]["200"]["content"]["application/json"];
    currentIndex: number;
    loading: boolean;
    error: string | null;
  };

  currentAnki: {
    data:
      | paths["/api/v1/anki/block/{page_id}"]["get"]["responses"]["200"]["content"]["application/json"]
      | null;
    loading: boolean;
    error: string | null;
  };

  nextAnki: {
    data:
      | paths["/api/v1/anki/block/{page_id}"]["get"]["responses"]["200"]["content"]["application/json"]
      | null;
    loading: boolean;
    error: string | null;
  };
}

export const AnkiContext = createContextId<AnkiStore>("anki");

export const useAnkiContextProvider = () => {
  const ankiStore = useStore<AnkiStore>({
    ankiList: {
      data: [],
      currentIndex: 0,
      loading: false,
      error: null,
    },
    currentAnki: {
      data: null,
      loading: false,
      error: null,
    },
    nextAnki: {
      data: null,
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

      if (ankiListData) ankiStore.ankiList.data = ankiListData;
    } catch (error) {
      ankiStore.ankiList.error =
        "Failed to fetch Anki list. " +
        (error instanceof Error ? error.message : String(error));
    } finally {
      ankiStore.ankiList.loading = false;
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    fetchAnkiList();
  });
};
