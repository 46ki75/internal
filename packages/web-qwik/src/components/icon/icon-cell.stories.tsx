import type { Meta, StoryObj } from "storybook-framework-qwik";
import { IconCell, type IconCellProps } from "./icon-cell";

import icon from "../../../public/favicon.svg?url";

const meta: Meta<IconCellProps> = {
  title: "Components/Components/icon-cell",
  component: IconCell,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<IconCellProps>;

export const Primary: Story = {
  args: {
    src: icon,
    name: "Favicon",
    mimeType: "image/svg+xml",
  },
};
