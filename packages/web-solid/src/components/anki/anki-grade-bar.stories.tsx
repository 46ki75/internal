import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { fn } from "storybook/test";
import { AnkiGradeBar, type AnkiGradeBarProps } from "./anki-grade-bar";

const meta: Meta<AnkiGradeBarProps> = {
  title: "Components/Anki/anki-grade-bar",
  component: AnkiGradeBar,
  tags: ["autodocs"],
  args: {
    isShowingAnswer: false,
    onShowAnswer: fn(),
    onRate: fn(),
  },
  argTypes: {
    isShowingAnswer: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<AnkiGradeBarProps>;

/** Answer hidden — the single "Show Answer" button. */
export const Hidden: Story = {};

/** Answer revealed — the six grading buttons (q/w/e/a/s/d). */
export const Grading: Story = {
  args: { isShowingAnswer: true },
};
