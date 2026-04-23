import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Bookmark, type BookmarkProps } from "./bookmark";

import icon from "../../../public/favicon.svg?url";

const meta: Meta<BookmarkProps> = {
  title: "Components/Bookmark/bookmark",
  component: Bookmark,
  tags: ["autodocs"],
  args: {},
  argTypes: {
    favorite: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<BookmarkProps>;

export const Primary: Story = {
  args: {
    id: "338f8817-9da1-47c8-b459-5a41ee853090",
    icon: icon,
    label: "Example Bookmark",
    favorite: false,
    url: "https://qwik.dev/",
    editUrl: "https://github.com/QwikDev/qwik",
    tag: {
      id: "925b3496-680f-4c6d-8b01-04a6367d0f71",
      name: "Example Tag",
      color: "#ff0000",
    },
  },
};
