import type { JSX } from "solid-js";
import { HttpAgent, type HttpAgentFetchFn } from "@ag-ui/client";
import { ElmAgUiAgent, useAgent } from "@elmethis/solid";

import { useAuth } from "~/context/auth-context";

export interface ChatContainerProps {
  class?: string;
  style?: JSX.CSSProperties;
}

const promptTemplates = [
  {
    description: "Ask about AWS",
    content: "What is a new feature called Amazon S3 Files?",
  },
];

export const ChatContainer = (props: ChatContainerProps) => {
  const auth = useAuth();
  const authenticatedFetch: HttpAgentFetchFn = async (url, requestInit) => {
    await auth.refresh();
    const accessToken = auth.accessToken();
    if (!accessToken) throw new Error("Access token is not available");

    const headers = new Headers(requestInit.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(url, { ...requestInit, headers });
  };
  const agent = useAgent({
    url: "/invocations",
    agentFactory: (options) =>
      new HttpAgent({ ...options, fetch: authenticatedFetch }),
  });
  agent.setPromptTemplates(promptTemplates);

  return (
    <ElmAgUiAgent
      class={props.class}
      style={props.style}
      aria-label="AWS chat"
      state={agent.state}
      send={agent.send}
      retry={agent.retry}
      abort={agent.abort}
      dequeue={agent.dequeue}
      enableAutoScroll
    />
  );
};
