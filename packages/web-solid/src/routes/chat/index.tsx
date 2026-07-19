import { Meta, Title } from "@solidjs/meta";
import type { JSX } from "solid-js";

import { ChatContainer } from "~/components/chat/chat-container";

import styles from "./chat.module.css";

export interface IndexProps {
  class?: string;
  style?: JSX.CSSProperties;
}

export default function ChatRoute(props: IndexProps) {
  return (
    <>
      <Title>Chat | Internal</Title>
      <Meta name="description" content="Chat with the AWS knowledge agent" />
      <ChatContainer
        class={`${styles.chat} ${props.class ?? ""}`}
        style={props.style}
      />
    </>
  );
}
