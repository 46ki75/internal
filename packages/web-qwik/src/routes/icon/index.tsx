import {
  $,
  component$,
  useContext,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./icon.module.css";
import { useAsyncState } from "@elmethis/qwik";
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

      return res.data;
    }),
    [],
    { immediate: true },
  );

  return (
    <div class={[styles["icon"], className]} style={style}>
      {state.value.map((icon) => (
        <>
          <IconCell
            mimeType={icon.content_type ?? undefined}
            src={icon.url}
            name={icon.name}
          />
        </>
      ))}
    </div>
  );
});
