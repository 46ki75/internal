import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { fn } from "storybook/test";
import { AnkiControls, type AnkiControlsProps } from "./anki-controls";

const meta: Meta<AnkiControlsProps> = {
  title: "Components/Anki/anki-controls",
  component: AnkiControls,
  tags: ["autodocs"],
  args: {
    hasCard: true,
    cardLoading: false,
    isReviewRequired: false,
    createLoading: false,
    reviewLoading: false,
    onEdit: fn(),
    onCreate: fn(),
    onReview: fn(),
    onRefresh: fn(),
  },
  argTypes: {
    hasCard: { control: "boolean" },
    cardLoading: { control: "boolean" },
    isReviewRequired: { control: "boolean" },
    createLoading: { control: "boolean" },
    reviewLoading: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<AnkiControlsProps>;

export const Primary: Story = {};

export const ReviewRequired: Story = {
  args: { isReviewRequired: true },
};

export const NoCard: Story = {
  args: { hasCard: false },
};
