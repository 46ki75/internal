import {
  component$,
  useContext,
  useStore,
  useTask$,
  type CSSProperties,
} from "@qwik.dev/core";

import { ElmAgUiAgent, useAgent } from "@elmethis/qwik";

import styles from "./chat.module.css";
import { AuthContext } from "~/context/auth-context";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

export default component$<IndexProps>(({ class: className, style }) => {
  const authStore = useContext(AuthContext);

  const headers = useStore<{ Authorization: string }>({
    Authorization: "",
  });

  const agent = useAgent({
    url: "/invocations",
    headers: headers,
  });

  useTask$(async ({ track }) => {
    const accessToken = track(() => authStore.tokens.accessToken);
    headers.Authorization = `Bearer ${accessToken}`;

    await agent.setPromptTemplates$([
      {
        description: "Ask about AWS",
        content: "What is a new feature called Amazon S3 Files?",
      },
    ]);
  });

  return (
    <div class={[styles["chat"], className]} style={style}>
      <ElmAgUiAgent
        state={agent.state}
        send$={agent.send$}
        retry$={agent.retry$}
        abort$={agent.abort$}
        style={{ height: "100%" }}
      />
    </div>
  );
});
