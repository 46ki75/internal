import {
  component$,
  useContext,
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

  const { AgentUI, setPromptTemplates } = useAgent({
    url: "http://localhost:8080/copilotkit/builtin/agent/minimax-m2.5/run",
    headers: {
      Authorization: `Bearer ${authStore.tokens.accessToken}`,
    },
  });

  useTask$(() => {
    setPromptTemplates([
      {
        description: "Ask about AWS",
        value: "What is a new feature called Amazon S3 Files?",
      },
    ]);
  });

  return (
    <div class={[styles["chat"], className]} style={style}>
      <AgentUI style={{ height: "100%" }} />
    </div>
  );
});
