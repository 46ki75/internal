import type { Meta, StoryObj } from "storybook-solidjs-vite";
import {
  WritingAssesments,
  type WritingAssesmentsProps,
} from "./writing-assesments";

const meta: Meta<WritingAssesmentsProps> = {
  title: "Components/Components/writing-assesments",
  component: WritingAssesments,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<WritingAssesmentsProps>;

export const Primary: Story = {
  args: {
    id: "019f84ad-f330-7c12-bbb5-a46b97308b69",
    original_text:
      "I understand UUID v4 is enough here, but why not aligning with them?",
    japanese_context: null,
    score: 5,
    justification:
      "This is clear, grammatical conversational technical writing with one low-severity idiomatic improvement.",

    revised_text:
      "I understand UUID v4 is enough here, but why not align with them?",
    register: "Conversational technical",
  },
};
