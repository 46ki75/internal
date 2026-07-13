import {
  $,
  component$,
  useComputed$,
  useContext,
  useSignal,
  useStore,
  useVisibleTask$,
  type CSSProperties,
} from "@qwik.dev/core";

import styles from "./trivia.module.css";
import {
  ElmA2ui,
  ElmBlockFallback,
  ElmButton,
  ElmInlineText,
  ElmMdiIcon,
  notionBlockCatalog,
} from "@elmethis/qwik";
import { surfaceToMessages } from "~/components/anki/surface-to-messages";
import { mdiArrowRightThick, mdiEye, mdiLightbulbOnOutline } from "@mdi/js";

import { openApiClient } from "~/openapi/client";
import { paths } from "~/openapi/schema";
import { AuthContext, useAuthActions } from "~/context/auth-context";

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
  const { refresh } = useAuthActions();

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

  // Derive the leaf values that mutate after the initial render (block loads
  // async; view_count bumps on dwell). Reading them inside their own computed
  // subscribes to the nested store property, so a later mutation re-renders —
  // reading `current.value.block` does not, because `current` only tracks the
  // index/array, not the item's properties.
  const currentBlock = useComputed$(() => {
    const i = store.currentIndex;
    return i != null ? (store.data[i]?.block ?? null) : null;
  });

  const currentViewCount = useComputed$(() => {
    const i = store.currentIndex;
    return i != null ? (store.data[i]?.metadata.view_count ?? 0) : 0;
  });

  const fetchList = $(async (append: boolean, signal?: AbortSignal) => {
    store.loading = true;
    try {
      await refresh();

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

  // Write-backs go through `store.data[index] = {...}` (replacing the element),
  // not by mutating an object returned from `.find()`. A `.find()` result is
  // not a tracked store proxy, so mutating its properties never notifies
  // subscribers — the async block would land in the store but never render.
  const patchItem = $((pageId: string, patch: Partial<TriviaItem>) => {
    const index = store.data.findIndex((t) => t.metadata.page_id === pageId);
    if (index < 0) return;
    store.data[index] = { ...store.data[index], ...patch };
  });

  const fetchBlock = $(async (pageId?: string, signal?: AbortSignal) => {
    const item = store.data.find((t) => t.metadata.page_id === pageId);
    try {
      if (!pageId || !item) return;
      if (item.loading || item.block) return;

      await patchItem(pageId, { loading: true });
      await refresh();

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

      if (data) await patchItem(pageId, { block: data, loading: false });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        store.error =
          "Failed to fetch trivia block. " +
          (error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (!signal?.aborted) await patchItem(pageId ?? "", { loading: false });
    }
  });

  const incrementView = $(async (pageId: string) => {
    const item = store.data.find((t) => t.metadata.page_id === pageId);
    if (!item || store.viewed.includes(pageId)) return;
    store.viewed.push(pageId);

    try {
      await refresh();
      const { data } = await openApiClient.POST(
        "/api/v1/trivia/{page_id}/view",
        {
          params: {
            header: { Authorization: `Bearer ${authStore.tokens.accessToken}` },
            path: { page_id: pageId },
          },
        },
      );
      if (data)
        await patchItem(pageId, {
          metadata: { ...item.metadata, view_count: data.view_count },
        });
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

  // Initial load. The `initialized` guard is required: this visible task can
  // fire more than once, and a second `fetchList(false)` would replace
  // `store.data` with fresh (block-less) items — clobbering an already-loaded
  // block and reverting the page to the loading state.
  const initialized = useSignal(false);
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    ({ cleanup }) => {
      if (initialized.value) return;
      initialized.value = true;
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

      {!currentBlock.value ? (
        <ElmBlockFallback />
      ) : (
        <div class={styles["trivia-block-container"]}>
          <div class={styles["block-header"]}>
            <div class={styles["block-header-left"]}>
              <ElmMdiIcon d={mdiLightbulbOnOutline} />
              <ElmInlineText>
                {current.value?.metadata.title ?? "Untitled"}
              </ElmInlineText>
            </div>
            <div class={styles["block-header-left"]}>
              <ElmMdiIcon d={mdiEye} color="#868e9c" />
              <ElmInlineText>{currentViewCount.value}</ElmInlineText>
            </div>
          </div>
          <div class={styles["block-renderer"]}>
            <ElmA2ui
              catalog={notionBlockCatalog}
              messages={surfaceToMessages(
                currentBlock.value.surface,
                current.value?.metadata.page_id ?? "",
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
