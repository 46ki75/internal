import type { Meta, StoryObj } from "storybook-solidjs-vite";
import {
  WritingAssessmentsFeedback,
  type WritingAssessmentsFeedbackProps,
} from "./writing-assessments-feedback";

const meta: Meta<WritingAssessmentsFeedbackProps> = {
  title: "Components/Components/writing-assessments-feedback",
  component: WritingAssessmentsFeedback,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<WritingAssessmentsFeedbackProps>;

export const Primary: Story = {
  args: {
    id: "7ae4003e-b469-4138-b4a6-9f7494d61135",
    type: "observation",
    layer: "idiom",
    severity: "low",
    pattern: "mindset for + gerund",
    original: "mindset to learn English",
    revised: "mindset for learning English",
    reason:
      "“Mindset for learning English” is the more natural collocation when describing an attitude toward an activity.",
  },
};
