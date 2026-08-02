import type { Meta, StoryObj } from "storybook-solidjs-vite";
import {
  LoadingIndicator,
  type LoadingIndicatorProps,
} from "./loading-indicator";

const meta: Meta<LoadingIndicatorProps> = {
  title: "Components/Common/loading-indicator",
  component: LoadingIndicator,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<LoadingIndicatorProps>;

export const Primary: Story = {};
