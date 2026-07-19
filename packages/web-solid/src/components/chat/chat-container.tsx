import { createEffect, onCleanup, onMount, type JSX } from "solid-js";
import { createStore } from "solid-js/store";
import {
  HttpAgent,
  randomUUID,
  type AgentSubscriber,
  type Message,
  type UserMessage,
} from "@ag-ui/client";

import { useAuth } from "~/context/auth-context";

import {
  ChatView,
  type ChatPromptTemplate,
  type ChatStatus,
  type QueuedChatMessage,
} from "./chat-view";

export interface ChatContainerProps {
  class?: string;
  style?: JSX.CSSProperties;
}

interface ChatState {
  messages: Message[];
  queue: QueuedChatMessage[];
  isReady: boolean;
  isRunning: boolean;
  status: ChatStatus;
  error: string | null;
}

const promptTemplates: ChatPromptTemplate[] = [
  {
    description: "Ask about AWS",
    content: "What is a new feature called Amazon S3 Files?",
  },
];

const bearerHeaders = (accessToken: string | null): Record<string, string> =>
  accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

export const ChatContainer = (props: ChatContainerProps) => {
  const auth = useAuth();
  const [state, setState] = createStore<ChatState>({
    messages: [],
    queue: [],
    isReady: false,
    isRunning: false,
    status: "idle",
    error: null,
  });

  let agent: HttpAgent | undefined;
  let disposed = false;

  const syncMessages = (messages: readonly Readonly<Message>[]) => {
    if (disposed) return;
    setState("messages", Array.from(messages) as Message[]);
  };

  const executeRun = async () => {
    if (!agent || disposed) return;

    setState({ isRunning: true, status: "running", error: null });
    try {
      await auth.refresh();
      if (!auth.accessToken()) {
        throw new Error("Access token is not available");
      }
      agent.headers = bearerHeaders(auth.accessToken());
      await agent.runAgent();
    } catch (error) {
      if (disposed) return;
      setState("isRunning", false);
      if (error instanceof Error && error.name === "AbortError") {
        setState("status", "aborted");
      } else if (state.status === "running") {
        setState({
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  const startMessage = async (text: string) => {
    if (!agent || disposed) return;

    const userMessage: UserMessage = {
      id: randomUUID(),
      role: "user",
      content: [{ type: "text", text }],
    };
    agent.addMessage(userMessage);
    syncMessages(agent.messages);
    await executeRun();
  };

  const drainQueue = async () => {
    if (disposed || state.status !== "success") return;
    const next = state.queue[0];
    if (!next) return;

    setState("queue", (queue) => queue.slice(1));
    await startMessage(next.text);
  };

  const subscriber: AgentSubscriber = {
    onRunInitialized() {
      if (disposed) return;
      setState({ isRunning: true, status: "running", error: null });
    },
    onMessagesChanged({ messages }) {
      syncMessages(messages);
    },
    onRunFinishedEvent({ outcome }) {
      if (disposed) return;
      setState("status", outcome === "success" ? "success" : "idle");
    },
    async onRunFinalized() {
      if (disposed) return;
      setState("isRunning", false);
      await drainQueue();
    },
    onRunFailed({ error }) {
      if (disposed) return;
      setState("isRunning", false);
      if (error.name === "AbortError") {
        setState("status", "aborted");
        return;
      }
      setState({ status: "error", error: error.message });
    },
    onRunErrorEvent({ event }) {
      if (disposed) return;
      if (event.code === "abort") {
        setState({ status: "aborted", error: null });
        return;
      }
      setState({
        isRunning: false,
        status: "error",
        error: event.message,
      });
    },
  };

  onMount(() => {
    agent = new HttpAgent({
      url: "/invocations",
      headers: bearerHeaders(auth.accessToken()),
    });
    const subscription = agent.subscribe(subscriber);
    setState("isReady", true);

    createEffect(() => {
      if (agent) agent.headers = bearerHeaders(auth.accessToken());
    });

    onCleanup(() => {
      disposed = true;
      subscription.unsubscribe();
      if (agent && (state.isRunning || agent.isRunning)) agent.abortRun();
      agent = undefined;
    });
  });

  const send = async (text: string) => {
    if (!agent || disposed) return;
    if (state.isRunning || state.queue.length > 0) {
      setState("queue", (queue) => [...queue, { id: randomUUID(), text }]);
      return;
    }
    await startMessage(text);
  };

  const retry = async () => {
    if (!agent || disposed || state.isRunning) return;

    let lastUserMessageIndex = -1;
    for (let index = agent.messages.length - 1; index >= 0; index -= 1) {
      if (agent.messages[index].role === "user") {
        lastUserMessageIndex = index;
        break;
      }
    }
    if (lastUserMessageIndex === -1) return;

    agent.setMessages(agent.messages.slice(0, lastUserMessageIndex + 1));
    syncMessages(agent.messages);
    await executeRun();
  };

  const abort = () => {
    if (!agent || disposed) return;
    agent.abortRun();
    setState({ status: "aborted", error: null });
  };

  const removeQueued = (id: string) => {
    setState("queue", (queue) => queue.filter((item) => item.id !== id));
  };

  return (
    <ChatView
      class={props.class}
      style={props.style}
      messages={state.messages}
      queue={state.queue}
      promptTemplates={promptTemplates}
      isReady={state.isReady}
      isRunning={state.isRunning}
      status={state.status}
      error={state.error}
      onSend={send}
      onAbort={abort}
      onRetry={retry}
      onRemoveQueued={removeQueued}
    />
  );
};
