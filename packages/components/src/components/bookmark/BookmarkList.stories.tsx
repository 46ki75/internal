import type { Meta, StoryObj } from "@storybook/vue3-vite";
import BookmarkList from "./BookmarkList.vue";

const meta: Meta<typeof BookmarkList> = {
  title: "Components/Bookmark/BookmarkList",
  component: BookmarkList,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    bookmarks: new Array(20).fill({
      favicon: "https://github.githubassets.com/favicons/favicon.svg",
      href: "https://github.com/",
      notionUrl: "https://notion.so",
      nsfw: false,
    }),
  },
};
