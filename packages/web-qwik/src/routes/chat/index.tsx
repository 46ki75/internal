import {
  component$,
  useContext,
  useStore,
  useTask$,
  type CSSProperties,
} from "@builder.io/qwik";

import { useAgent } from "@elmethis/qwik";

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

  const { AgentUI, setPromptTemplates } = useAgent({
    url: "/invocations",
    headers: headers,
  });

  useTask$(async ({ track }) => {
    const accessToken = track(() => authStore.tokens.accessToken);
    headers.Authorization = `Bearer ${accessToken}`;

    setPromptTemplates([
      {
        description: "Ask about AWS",
        content: "What is a new feature called Amazon S3 Files?",
      },
    ]);
  });

  return (
    <div class={[styles["chat"], className]} style={style}>
      <AgentUI style={{ height: "100%" }} />
    </div>
  );
});
