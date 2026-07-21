import type { Meta, StoryObj } from "storybook-solidjs-vite";
import {
  WritingAssessmentsFeedbackContainer,
  type WritingAssessmentsFeedbackContainerProps,
} from "./writing-assessments-feedback-container";

const meta: Meta<WritingAssessmentsFeedbackContainerProps> = {
  title: "Components/Components/writing-assessments-feedback-container",
  component: WritingAssessmentsFeedbackContainer,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<WritingAssessmentsFeedbackContainerProps>;

export const AllTypes: Story = {
  args: {
    feedbacks: [
      {
        id: "feedback-1",
        type: "error",
        layer: "idiom",
        severity: "high",
        original: "I look forward to meet you.",
        revised: "I look forward to meeting you.",
        pattern: "look forward to + gerund",
        reason:
          'The "to" in "look forward to" is a preposition, so it is followed by a gerund.',
      },
      {
        id: "feedback-2",
        type: "intent_check",
        layer: null,
        severity: "medium",
        original: "I could finish the report tomorrow.",
        revised: "I can finish the report tomorrow.",
        pattern: null,
        reason:
          'Use "can" if you mean that finishing tomorrow is currently possible. "Could" makes the commitment less certain.',
      },
      {
        id: "feedback-3",
        type: "observation",
        layer: "style",
        severity: "low",
        original: "The meeting was very, very long.",
        revised: "The meeting was excessively long.",
        pattern: "Use a precise intensifier",
        reason:
          "A more precise intensifier makes the sentence more concise in formal writing.",
      },
      {
        id: "feedback-4",
        type: "error",
        layer: "idiom",
        severity: "medium",
        original: "She explained me the process.",
        revised: "She explained the process to me.",
        pattern: "explain something to someone",
        reason:
          'The verb "explain" takes the subject matter as its direct object and the listener after "to".',
      },
    ],
  },
};

export const SingleGroup: Story = {
  args: {
    feedbacks: [
      {
        id: "feedback-1",
        type: "observation",
        layer: undefined,
        severity: "low",
        original: "We had a discussion about the issue.",
        revised: "We discussed the issue.",
        pattern: null,
        reason: "The direct verb form is shorter and clearer.",
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    feedbacks: [],
  },
};
