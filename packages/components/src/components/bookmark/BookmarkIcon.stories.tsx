import type { Meta, StoryObj } from "@storybook/vue3-vite";
import BookmarkIcon from "./BookmarkIcon.vue";

const meta: Meta<typeof BookmarkIcon> = {
  title: "Components/Components/BookmarkIcon",
  component: BookmarkIcon,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    favicon: "https://github.githubassets.com/favicons/favicon.svg",
    href: "https://github.com/",
    notionUrl: "https://notion.so",
    nsfw: false,
  },
};
