import type { Meta, StoryObj } from "storybook-framework-qwik";
import { BookmarkList, type BookmarkListProps } from "./bookmark-list";

import icon from "../../../public/favicon.svg?url";

const meta: Meta<BookmarkListProps> = {
  title: "Components/Bookmark/bookmark-list",
  component: BookmarkList,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<BookmarkListProps>;

export const Primary: Story = {
  args: {
    bookmarks: [
      {
        id: "338f8817-9da1-47c8-b459-5a41ee853090",
        icon: icon,
        label: "Example Bookmark",
        favorite: true,
        url: "https://qwik.dev/",
        editUrl: "https://github.com/QwikDev/qwik",
        tag: {
          id: "925b3496-680f-4c6d-8b01-04a6367d0f71",
          name: "Example Tag",
          color: "#c56565",
        },
      },
    ],
  },
};
