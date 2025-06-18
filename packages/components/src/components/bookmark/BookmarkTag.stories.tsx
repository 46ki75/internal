import type { Meta, StoryObj } from "@storybook/vue3-vite";
import BookmarkTag from "./BookmarkTag.vue";

const meta: Meta<typeof BookmarkTag> = {
  title: "Components/Bookmark/BookmarkTag",
  component: BookmarkTag,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: "My Label",
    color: "#6987b8",
  },
};
