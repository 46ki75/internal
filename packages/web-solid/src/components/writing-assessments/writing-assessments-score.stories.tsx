import type { Meta, StoryObj } from "storybook-solidjs-vite";
import {
  WritingAssessmentsScore,
  type WritingAssessmentsScoreProps,
} from "./writing-assessments-score";

const meta: Meta<WritingAssessmentsScoreProps> = {
  title: "Components/Components/writing-assessments-score",
  component: WritingAssessmentsScore,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<WritingAssessmentsScoreProps>;

export const Primary: Story = {
  args: { score: 3, label: true },
};
