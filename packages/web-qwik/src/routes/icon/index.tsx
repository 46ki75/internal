import {
  $,
  component$,
  NoSerialize,
  noSerialize,
  useComputed$,
  useContext,
  useSignal,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./icon.module.css";
import { ElmInlineText, ElmTextField, useAsyncState } from "@elmethis/qwik";
import { AuthContext } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { IconCell } from "~/components/icon/icon-cell";

import Fuse from "fuse.js";
import { paths } from "~/openapi/schema";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

type Icon =
  paths["/api/v1/icon"]["get"]["responses"]["200"]["content"]["application/json"][number];

export default component$<IndexProps>(({ class: className, style }) => {
  const authStore = useContext(AuthContext);
  const searchKeyword = useSignal<string>("");
  const fuseInstance = useSignal<NoSerialize<Fuse<Icon>> | null>(null);

  const { state } = useAsyncState(
    $(async () => {
      await authStore.tokens.refresh(authStore);

      const res = await openApiClient.GET("/api/v1/icon", {
        params: {
          header: {
            Authorization: `Bearer ${authStore.tokens.accessToken}`,
          },
        },
      });

      if (!res.data) {
        throw new Error("No data");
      }

      fuseInstance.value = noSerialize(new Fuse(res.data, { keys: ["name"] }));

      const results: Record<string, typeof res.data> = {
        unknown: [],
      };

      for (const icon of res.data) {
        if (icon.content_type == null) {
          results.unknown.push(icon);
        } else if (icon.content_type in results) {
          results[icon.content_type].push(icon);
        } else {
          results[icon.content_type] = [icon];
        }
      }

      return results;
    }),
    {},
    { immediate: true },
  );

  const searchResults = useComputed$(() => {
    if (searchKeyword.value.trim() === "") return [];
    if (!fuseInstance.value) return [];
    return fuseInstance.value
      .search(searchKeyword.value)
      .map((result) => result.item);
  });

  return (
    <div class={[styles["icon"], className]} style={style}>
      <ElmTextField
        label="Keyword"
        onInput$={(event, element) => {
          searchKeyword.value = element.value;
        }}
      />

      <div class={styles["icon-content-type-group"]}>
        <div class={styles["icon-content-type-group-header"]}>
          <div class={styles["spacer"]}></div>
          <ElmInlineText code>Search Results</ElmInlineText>
          <div class={styles["spacer"]}></div>
        </div>
        <div class={styles["icon-group"]}>
          {searchResults.value.map((icon) => (
            <IconCell
              key={icon.id}
              mimeType={icon.content_type ?? undefined}
              src={icon.url}
              name={icon.name}
            />
          ))}
        </div>
      </div>

      {Object.entries(state.value).map(([contentType, icons]) => (
        <div key={contentType} class={styles["icon-content-type-group"]}>
          <div class={styles["icon-content-type-group-header"]}>
            <div class={styles["spacer"]}></div>
            <ElmInlineText code>{contentType}</ElmInlineText>
            <div class={styles["spacer"]}></div>
          </div>
          <div class={styles["icon-group"]}>
            {icons.map((icon) => (
              <IconCell
                key={icon.id}
                mimeType={icon.content_type ?? undefined}
                src={icon.url}
                name={icon.name}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
