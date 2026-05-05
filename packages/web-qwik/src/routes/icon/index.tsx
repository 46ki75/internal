import {
  $,
  component$,
  useContext,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./icon.module.css";
import { ElmInlineText, useAsyncState } from "@elmethis/qwik";
import { AuthContext } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { IconCell } from "~/components/icon/icon-cell";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

export default component$<IndexProps>(({ class: className, style }) => {
  const authStore = useContext(AuthContext);

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

  return (
    <div class={[styles["icon"], className]} style={style}>
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
