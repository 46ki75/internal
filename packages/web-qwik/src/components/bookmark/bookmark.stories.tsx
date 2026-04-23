import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Bookmark, type BookmarkProps } from "./bookmark";

import icon from "../../../public/favicon.svg?url";
import { $ } from "@builder.io/qwik";

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
    icon: icon,
    label: "Example Bookmark",
    onEdit$: $(() => {
      alert("Edit bookmark");
    }),
  },
};
