import type { Message } from "@ag-ui/client";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { fn } from "storybook/test";

import { ChatView, type ChatViewProps } from "./chat-view";

const messages: Message[] = [
  {
    id: "user-1",
    role: "user",
    content: [{ type: "text", text: "What is Amazon S3 Files?" }],
  },
  {
    id: "assistant-1",
    role: "assistant",
    content:
      "Amazon S3 Files is a new experience for working with files stored in S3.",
  },
];

const meta: Meta<ChatViewProps> = {
  title: "Components/Chat/ChatView",
  component: ChatView,
  tags: ["autodocs"],
  args: {
    messages,
    queue: [],
    promptTemplates: [
      {
        description: "Ask about AWS",
        content: "What is a new feature called Amazon S3 Files?",
      },
    ],
    isReady: true,
    isRunning: false,
    status: "success",
    error: null,
    onSend: fn(),
    onAbort: fn(),
    onRetry: fn(),
    onRemoveQueued: fn(),
    style: { height: "42rem", "max-width": "600px" },
  },
};

export default meta;
type Story = StoryObj<ChatViewProps>;

export const Conversation: Story = {};

export const StreamingWithQueue: Story = {
  args: {
    isRunning: true,
    status: "running",
    queue: [
      { id: "queue-1", text: "How does pricing work?" },
      { id: "queue-2", text: "Which regions support it?" },
    ],
  },
};
