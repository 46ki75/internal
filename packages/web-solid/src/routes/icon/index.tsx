import { Meta, Title } from "@solidjs/meta";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from "solid-js";

import styles from "./icon.module.css";
import { ElmInlineText, ElmTextField } from "@elmethis/solid";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { IconCell } from "~/components/icon/icon-cell";

import Fuse from "fuse.js";
import type { paths } from "~/openapi/schema";

export interface IndexProps {
  class?: string;
  style?: JSX.CSSProperties;
}

type Icon =
  paths["/api/v1/icon"]["get"]["responses"]["200"]["content"]["application/json"][number];

export default function IconRoute(props: IndexProps) {
  const auth = useAuth();
  const [searchKeyword, setSearchKeyword] = createSignal("");
  const [fuse, setFuse] = createSignal<Fuse<Icon> | null>(null);
  const [groups, setGroups] = createSignal<Record<string, Icon[]>>({});
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        await auth.refresh();
        const { data } = await openApiClient.GET("/api/v1/icon", {
          params: {
            header: {
              Authorization: `Bearer ${auth.accessToken()}`,
            },
          },
          signal: controller.signal,
        });

        if (!data) throw new Error("No data returned from API");
        if (controller.signal.aborted) return;

        setFuse(new Fuse(data, { keys: ["name"] }));

        const nextGroups: Record<string, Icon[]> = { unknown: [] };
        for (const icon of data) {
          const contentType = icon.content_type ?? "unknown";
          (nextGroups[contentType] ??= []).push(icon);
        }
        setGroups(nextGroups);
      } catch (cause) {
        if (!(cause instanceof Error && cause.name === "AbortError")) {
          setError(
            `Failed to fetch icons. ${
              cause instanceof Error ? cause.message : String(cause)
            }`,
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    onCleanup(() => controller.abort());
  });

  const searchResults = createMemo(() => {
    const keyword = searchKeyword().trim();
    if (!keyword) return [];
    return (
      fuse()
        ?.search(keyword)
        .map((result) => result.item) ?? []
    );
  });

  return (
    <>
      <Title>Icons | Internal</Title>
      <Meta name="description" content="Search the internal icon library" />
      <div class={`${styles.icon} ${props.class ?? ""}`} style={props.style}>
        <ElmTextField
          label="Keyword"
          value={searchKeyword()}
          onInput={(event) => setSearchKeyword(event.currentTarget.value)}
        />

        <div class={styles["icon-content-type-group"]}>
          <div class={styles["icon-content-type-group-header"]}>
            <div class={styles.spacer} />
            <ElmInlineText code>Search Results</ElmInlineText>
            <div class={styles.spacer} />
          </div>
          <div class={styles["icon-group"]}>
            <For each={searchResults()}>
              {(icon) => (
                <IconCell
                  mimeType={icon.content_type ?? undefined}
                  src={icon.url}
                  name={icon.name}
                />
              )}
            </For>
          </div>
        </div>

        <Show when={loading()}>
          <ElmInlineText>Loading icons...</ElmInlineText>
        </Show>
        <Show when={error()} keyed>
          {(message) => (
            <div role="alert">
              <ElmInlineText>{message}</ElmInlineText>
            </div>
          )}
        </Show>

        <For each={Object.entries(groups())}>
          {([contentType, icons]) => (
            <div class={styles["icon-content-type-group"]}>
              <div class={styles["icon-content-type-group-header"]}>
                <div class={styles.spacer} />
                <ElmInlineText code>{contentType}</ElmInlineText>
                <div class={styles.spacer} />
              </div>
              <div class={styles["icon-group"]}>
                <For each={icons}>
                  {(icon) => (
                    <IconCell
                      mimeType={icon.content_type ?? undefined}
                      src={icon.url}
                      name={icon.name}
                    />
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </>
  );
}
