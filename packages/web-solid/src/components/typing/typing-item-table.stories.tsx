import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { TypingItemTable } from "./typing-item-table";

const meta = {
  title: "Components/Typing/TypingItemTable",
  component: TypingItemTable,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    items: [
      {
        id: "warm-up",
        description: "Warm-up: home row",
        text: "Small steps make reliable systems.",
      },
      {
        id: "unicode",
        description: "Unicode and punctuation",
        text: "Ship thoughtfully — then iterate. 👍",
      },
      {
        id: "multiline",
        description: "Two-line practice",
        text: "Measure twice.\nDeploy once.",
      },
    ],
  },
} satisfies Meta<typeof TypingItemTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
