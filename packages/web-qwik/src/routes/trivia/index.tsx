import {
  $,
  component$,
  useComputed$,
  useContext,
  useStore,
  useVisibleTask$,
  type CSSProperties,
} from "@qwik.dev/core";

import styles from "./trivia.module.css";
import {
  blockCatalog,
  ElmA2ui,
  ElmBlockFallback,
  ElmButton,
  ElmInlineText,
  ElmMdiIcon,
} from "@elmethis/qwik";
import { surfaceToMessages } from "../anki/surface-to-messages";
import { mdiArrowRightThick, mdiEye, mdiLightbulbOnOutline } from "@mdi/js";

import { openApiClient } from "~/openapi/client";
import { paths } from "~/openapi/schema";
import { AuthContext } from "~/context/auth-context";

type TriviaMeta =
  paths["/api/v1/trivia"]["get"]["responses"]["200"]["content"]["application/json"][number];

type TriviaBlock =
  paths["/api/v1/trivia/block/{page_id}"]["get"]["responses"]["200"]["content"]["application/json"];

interface TriviaItem {
  metadata: TriviaMeta;
  block: TriviaBlock | null;
  loading: boolean;
}

interface TriviaStore {
  data: TriviaItem[];
  currentIndex: number | null;
  viewed: string[];
  loading: boolean;
  error: string | null;
}

// Count a view only after the page has been on screen for this long, so a quick
// "Next" tap does not inflate the count.
const DWELL_MS = 1500;

export interface IndexProps {
  class?: string;
  style?: CSSProperties;
}

export default component$<IndexProps>(({ class: className, style }) => {
  const authStore = useContext(AuthContext);

  const store = useStore<TriviaStore>({
    data: [],
    currentIndex: null,
    viewed: [],
    loading: false,
    error: null,
  });

  const current = useComputed$(() =>
    store.currentIndex != null ? store.data[store.currentIndex] : null,
  );

  const fetchList = $(async (append: boolean, signal?: AbortSignal) => {
    store.loading = true;
    try {
      await authStore.tokens.refresh(authStore);

      const { data } = await openApiClient.GET("/api/v1/trivia", {
        params: {
          header: { Authorization: `Bearer ${authStore.tokens.accessToken}` },
        },
        signal,
      });

      if (data) {
        const items = data.map((metadata) => ({
          metadata,
          block: null,
          loading: false,
        }));

        if (append) {
          store.data = [...store.data, ...items];
        } else {
          store.data = items;
          if (items.length > 0) store.currentIndex = 0;
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        store.error =
          "Failed to fetch trivia. " +
          (error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (!signal?.aborted) store.loading = false;
    }
  });

  const fetchBlock = $(async (pageId?: string, signal?: AbortSignal) => {
    const item = store.data.find((t) => t.metadata.page_id === pageId);
    try {
      if (!pageId || !item) return;
      if (item.loading || item.block) return;

      item.loading = true;
      await authStore.tokens.refresh(authStore);

      const { data } = await openApiClient.GET(
        "/api/v1/trivia/block/{page_id}",
        {
          params: {
            header: { Authorization: `Bearer ${authStore.tokens.accessToken}` },
            path: { page_id: pageId },
          },
          signal,
        },
      );

      if (data) item.block = data;
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        store.error =
          "Failed to fetch trivia block. " +
          (error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (item && !signal?.aborted) item.loading = false;
    }
  });

  const incrementView = $(async (pageId: string) => {
    const item = store.data.find((t) => t.metadata.page_id === pageId);
    if (!item || store.viewed.includes(pageId)) return;
    store.viewed.push(pageId);

    try {
      await authStore.tokens.refresh(authStore);
      const { data } = await openApiClient.POST(
        "/api/v1/trivia/{page_id}/view",
        {
          params: {
            header: { Authorization: `Bearer ${authStore.tokens.accessToken}` },
            path: { page_id: pageId },
          },
        },
      );
      if (data) item.metadata.view_count = data.view_count;
    } catch {
      // A failed view increment should not interrupt browsing.
    }
  });

  const next = $(async () => {
    if (store.currentIndex == null) return;
    if (store.currentIndex >= store.data.length - 1) {
      await fetchList(true);
    }
    store.currentIndex += 1;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Initial load.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    ({ cleanup }) => {
      const controller = new AbortController();
      cleanup(() => controller.abort());
      fetchList(false, controller.signal);
    },
    { strategy: "document-ready" },
  );

  // Prefetch the current + next block, and count a view after the dwell window.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup, track }) => {
    const controller = new AbortController();
    cleanup(() => controller.abort());

    const currentIndex = track(() => store.currentIndex);
    if (currentIndex == null) return;

    const currentRef = store.data[currentIndex];
    if (currentRef) fetchBlock(currentRef.metadata.page_id, controller.signal);

    const nextRef = store.data[currentIndex + 1];
    if (nextRef) fetchBlock(nextRef.metadata.page_id, controller.signal);

    if (currentRef) {
      const timer = setTimeout(() => {
        incrementView(currentRef.metadata.page_id);
      }, DWELL_MS);
      cleanup(() => clearTimeout(timer));
    }
  });

  return (
    <div
      class={[styles["trivia"], className]}
      style={style}
      key={current.value?.metadata.page_id ?? "none"}
    >
      <div class={styles["trivia-header"]}>
        <ElmMdiIcon d={mdiLightbulbOnOutline} color="#cdb57b" />
        <ElmInlineText>
          {current.value?.metadata.title ?? "Trivia"}
        </ElmInlineText>
      </div>

      {!current.value?.block ? (
        <ElmBlockFallback />
      ) : (
        <div class={styles["trivia-block-container"]}>
          <div class={styles["block-header"]}>
            <div class={styles["block-header-left"]}>
              <ElmMdiIcon d={mdiLightbulbOnOutline} />
              <ElmInlineText>
                {current.value.metadata.title ?? "Untitled"}
              </ElmInlineText>
            </div>
            <div class={styles["block-header-left"]}>
              <ElmMdiIcon d={mdiEye} color="#868e9c" />
              <ElmInlineText>{current.value.metadata.view_count}</ElmInlineText>
            </div>
          </div>
          <div class={styles["block-renderer"]}>
            <ElmA2ui
              catalog={blockCatalog}
              messages={surfaceToMessages(
                current.value.block.surface,
                current.value.metadata.page_id,
              )}
            />
          </div>
        </div>
      )}

      <div class={styles["button-container"]}>
        <ElmButton block isLoading={store.loading} onClick$={next}>
          <ElmMdiIcon d={mdiArrowRightThick} />
          <span>Next</span>
        </ElmButton>
      </div>
    </div>
  );
});
