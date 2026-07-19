import {
  createEffect,
  createMemo,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
  type JSX,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Meta, Title } from "@solidjs/meta";

import styles from "./trivia.module.css";
import {
  ElmA2ui,
  ElmBlockFallback,
  ElmButton,
  ElmInlineText,
  ElmMdiIcon,
  notionBlockCatalog,
} from "@elmethis/solid";
import { surfaceToMessages } from "~/components/anki/surface-to-messages";
import { mdiArrowRightThick, mdiEye, mdiLightbulbOnOutline } from "@mdi/js";

import { openApiClient } from "~/openapi/client";
import { paths } from "~/openapi/schema";
import { useAuth } from "~/context/auth-context";

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
  style?: JSX.CSSProperties;
}

export default function Index(props: IndexProps) {
  const auth = useAuth();
  const [store, setStore] = createStore<TriviaStore>({
    data: [],
    currentIndex: null,
    viewed: [],
    loading: false,
    error: null,
  });
  const blockRequests = new Map<string, AbortSignal>();

  const current = createMemo(() => {
    const index = store.currentIndex;
    return index == null ? null : (store.data[index] ?? null);
  });
  const currentItems = createMemo(() => {
    const item = current();
    return item == null ? [] : [item];
  });

  const accessToken = async () => {
    await auth.refresh();
    const token = auth.accessToken();
    if (!token) throw new Error("Access token is not available");
    return token;
  };

  const fetchList = async (append: boolean, signal?: AbortSignal) => {
    setStore("loading", true);
    try {
      const token = await accessToken();
      const { data } = await openApiClient.GET("/api/v1/trivia", {
        params: {
          header: { Authorization: `Bearer ${token}` },
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
          setStore("data", (existing) => [...existing, ...items]);
        } else {
          setStore("data", items);
          if (items.length > 0) setStore("currentIndex", 0);
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setStore(
          "error",
          "Failed to fetch trivia. " +
            (error instanceof Error ? error.message : String(error)),
        );
      }
    } finally {
      if (!signal?.aborted) setStore("loading", false);
    }
  };

  const fetchBlock = async (pageId: string, signal: AbortSignal) => {
    const index = store.data.findIndex(
      (item) => item.metadata.page_id === pageId,
    );
    if (index < 0 || store.data[index].block) return;

    const existingRequest = blockRequests.get(pageId);
    if (
      store.data[index].loading &&
      existingRequest &&
      !existingRequest.aborted
    )
      return;

    blockRequests.set(pageId, signal);
    setStore("data", index, "loading", true);
    try {
      const token = await accessToken();
      const { data } = await openApiClient.GET(
        "/api/v1/trivia/block/{page_id}",
        {
          params: {
            header: { Authorization: `Bearer ${token}` },
            path: { page_id: pageId },
          },
          signal,
        },
      );

      if (data) setStore("data", index, "block", data);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setStore(
          "error",
          "Failed to fetch trivia block. " +
            (error instanceof Error ? error.message : String(error)),
        );
      }
    } finally {
      if (blockRequests.get(pageId) === signal) {
        blockRequests.delete(pageId);
        setStore("data", index, "loading", false);
      }
    }
  };

  const incrementView = async (pageId: string) => {
    const index = store.data.findIndex(
      (item) => item.metadata.page_id === pageId,
    );
    if (index < 0 || store.viewed.includes(pageId)) return;
    setStore("viewed", (viewed) => [...viewed, pageId]);

    try {
      const token = await accessToken();
      const { data } = await openApiClient.POST(
        "/api/v1/trivia/{page_id}/view",
        {
          params: {
            header: { Authorization: `Bearer ${token}` },
            path: { page_id: pageId },
          },
        },
      );
      if (data) {
        setStore("data", index, "metadata", "view_count", data.view_count);
      }
    } catch {
      // A failed view increment should not interrupt browsing.
    }
  };

  const next = async () => {
    const index = store.currentIndex;
    if (index == null) return;
    if (index >= store.data.length - 1) await fetchList(true);
    setStore("currentIndex", index + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  onMount(() => {
    const controller = new AbortController();
    void fetchList(false, controller.signal);
    onCleanup(() => controller.abort());
  });

  // Prefetch the current and next blocks, and count the current view after the
  // dwell window. `untrack` keeps the request's loading writes out of this
  // effect's dependencies.
  createEffect(() => {
    const index = store.currentIndex;
    if (index == null) return;

    const currentPageId = store.data[index]?.metadata.page_id;
    const nextPageId = store.data[index + 1]?.metadata.page_id;
    const controller = new AbortController();

    untrack(() => {
      if (currentPageId) void fetchBlock(currentPageId, controller.signal);
      if (nextPageId) void fetchBlock(nextPageId, controller.signal);
    });

    const timer = currentPageId
      ? setTimeout(() => void incrementView(currentPageId), DWELL_MS)
      : undefined;

    onCleanup(() => {
      controller.abort();
      if (timer !== undefined) clearTimeout(timer);
    });
  });

  return (
    <>
      <Title>Trivia | Internal</Title>
      <Meta name="description" content="Browse internal trivia" />
      <div class={`${styles.trivia} ${props.class ?? ""}`} style={props.style}>
        <div class={styles["trivia-header"]}>
          <ElmMdiIcon d={mdiLightbulbOnOutline} color="#cdb57b" />
          <ElmInlineText>{current()?.metadata.title ?? "Trivia"}</ElmInlineText>
        </div>

        <For each={currentItems()} fallback={<ElmBlockFallback />}>
          {(item) => (
            <Show when={item.block} keyed fallback={<ElmBlockFallback />}>
              {(block) => (
                <div class={styles["trivia-block-container"]}>
                  <div class={styles["block-header"]}>
                    <div class={styles["block-header-left"]}>
                      <ElmMdiIcon d={mdiLightbulbOnOutline} />
                      <ElmInlineText>
                        {item.metadata.title ?? "Untitled"}
                      </ElmInlineText>
                    </div>
                    <div class={styles["block-header-left"]}>
                      <ElmMdiIcon d={mdiEye} color="#868e9c" />
                      <ElmInlineText>{item.metadata.view_count}</ElmInlineText>
                    </div>
                  </div>
                  <div class={styles["block-renderer"]}>
                    <ElmA2ui
                      catalog={notionBlockCatalog}
                      messages={surfaceToMessages(
                        block.surface,
                        item.metadata.page_id,
                      )}
                    />
                  </div>
                </div>
              )}
            </Show>
          )}
        </For>

        <Show when={store.error} keyed>
          {(error) => (
            <p role="alert">
              <ElmInlineText color="#c56565">{error}</ElmInlineText>
            </p>
          )}
        </Show>

        <div class={styles["button-container"]}>
          <ElmButton
            block
            isLoading={store.loading}
            onClick={() => void next()}
          >
            <ElmMdiIcon d={mdiArrowRightThick} />
            <span>Next</span>
          </ElmButton>
        </div>
      </div>
    </>
  );
}
