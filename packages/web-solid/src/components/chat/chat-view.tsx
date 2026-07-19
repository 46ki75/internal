import { For, Index, Show, createMemo, createSignal, type JSX } from "solid-js";
import type { Message } from "@ag-ui/client";

import styles from "./chat-view.module.css";

export interface ChatPromptTemplate {
  description: string;
  content: string;
}

export interface QueuedChatMessage {
  id: string;
  text: string;
}

export type ChatStatus = "idle" | "running" | "success" | "error" | "aborted";

export interface ChatViewProps {
  class?: string;
  style?: JSX.CSSProperties;
  messages: Message[];
  queue: QueuedChatMessage[];
  promptTemplates: ChatPromptTemplate[];
  isReady: boolean;
  isRunning: boolean;
  status: ChatStatus;
  error: string | null;
  onSend: (text: string) => void | Promise<void>;
  onAbort: () => void;
  onRetry: () => void | Promise<void>;
  onRemoveQueued: (id: string) => void;
}

const messageText = (message: Message): string => {
  if (!("content" in message)) return "";

  const content: unknown = message.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((item: unknown) => {
      if (typeof item === "string") return item;
      if (
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof item.text === "string"
      ) {
        return item.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
};

const statusText = (status: ChatStatus, isRunning: boolean): string => {
  if (isRunning) return "Assistant is writing";
  if (status === "aborted") return "Run stopped";
  return "";
};

export const ChatView = (props: ChatViewProps) => {
  const [draft, setDraft] = createSignal("");
  const renderedMessages = createMemo(() =>
    props.messages
      .filter(
        (message) => message.role === "user" || message.role === "assistant",
      )
      .map((message) => ({
        id: message.id,
        role: message.role as "user" | "assistant",
        text: messageText(message),
      })),
  );

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !props.isReady) return;
    void props.onSend(trimmed);
    setDraft("");
  };

  const submit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    send(draft());
  };

  return (
    <section
      class={`${styles.chat} ${props.class ?? ""}`}
      style={props.style}
      aria-label="AWS chat"
    >
      <div class={styles.messages} aria-live="polite">
        <Show when={renderedMessages().length === 0}>
          <div class={styles.empty}>
            <span class={styles.eyebrow}>AWS KNOWLEDGE</span>
            <h1>What would you like to explore?</h1>
            <p>Ask a question and follow the response as it streams in.</p>
          </div>
        </Show>

        <Index each={renderedMessages()}>
          {(message) => (
            <Show when={message().text}>
              <article
                class={styles.message}
                classList={{
                  [styles.user]: message().role === "user",
                  [styles.assistant]: message().role === "assistant",
                }}
              >
                <span class={styles.messageLabel}>
                  {message().role === "user" ? "You" : "Assistant"}
                </span>
                <div class={styles.messageBody}>{message().text}</div>
                <Show when={message().role === "assistant" && !props.isRunning}>
                  <button
                    type="button"
                    class={styles.retry}
                    onClick={() => void props.onRetry()}
                    aria-label="Retry response"
                  >
                    Retry
                  </button>
                </Show>
              </article>
            </Show>
          )}
        </Index>

        <Show when={props.isRunning}>
          <div class={styles.streaming} role="status">
            <span />
            <span />
            <span />
            Streaming response
          </div>
        </Show>

        <Show when={props.error} keyed>
          {(error) => (
            <div class={styles.error} role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => void props.onRetry()}>
                Retry
              </button>
            </div>
          )}
        </Show>
      </div>

      <div class={styles.composerDock}>
        <Show when={props.queue.length > 0}>
          <div class={styles.queue} aria-label="Queued messages">
            <For each={props.queue}>
              {(queued) => (
                <div class={styles.queueItem}>
                  <span class={styles.queueMarker}>Queued</span>
                  <span class={styles.queueText}>{queued.text}</span>
                  <button
                    type="button"
                    onClick={() => props.onRemoveQueued(queued.id)}
                    aria-label={`Remove ${queued.text} from queue`}
                  >
                    Remove
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={!props.isRunning}>
          <div class={styles.templates}>
            <For each={props.promptTemplates}>
              {(template) => (
                <button
                  type="button"
                  onClick={() => send(template.content)}
                  disabled={!props.isReady}
                >
                  <span>{template.description}</span>
                  <small>{template.content}</small>
                </button>
              )}
            </For>
          </div>
        </Show>

        <form class={styles.composer} onSubmit={submit}>
          <label for="chat-prompt">Message</label>
          <textarea
            id="chat-prompt"
            name="prompt"
            rows={2}
            value={draft()}
            onInput={(event) => setDraft(event.currentTarget.value)}
            placeholder="Ask about AWS"
            disabled={!props.isReady}
          />
          <div class={styles.composerActions}>
            <span class={styles.status} aria-live="polite">
              {statusText(props.status, props.isRunning)}
            </span>
            <Show when={props.isRunning}>
              <button
                type="button"
                class={styles.abort}
                onClick={() => props.onAbort()}
                aria-label="Stop"
              >
                Stop
              </button>
            </Show>
            <button
              type="submit"
              class={styles.send}
              disabled={!props.isReady || draft().trim() === ""}
              aria-label="Send"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
