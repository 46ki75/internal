import { render } from "@solidjs/testing-library";
import type { ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineText: (
    props: ParentProps<{ color?: string; underline?: boolean }>,
  ) => <span data-underline={props.underline}>{props.children}</span>,
  ElmMdiIcon: () => <span aria-hidden="true" />,
}));

import { WritingAssessmentsFeedback } from "./writing-assessments-feedback";

it("renders required and optional feedback details", () => {
  const result = render(() => (
    <WritingAssessmentsFeedback
      id="feedback-1"
      type="error"
      layer="idiom"
      severity="high"
      original="mindset to learn"
      revised="mindset for learning"
      pattern="mindset for + gerund"
      reason="This is the natural collocation."
    />
  ));

  for (const text of [
    "high",
    "idiom",
    "feedback-1",
    "Original",
    "mindset to learn",
    "Revised",
    "mindset for learning",
    "Reason",
    "This is the natural collocation.",
    "Pattern",
    "mindset for + gerund",
  ]) {
    expect(result.getByText(text)).toBeVisible();
  }
});

it("omits optional layer and pattern details", () => {
  const result = render(() => (
    <WritingAssessmentsFeedback
      id="feedback-2"
      type="observation"
      severity="low"
      original="Original"
      revised="Revised"
      reason="Reason"
    />
  ));

  expect(result.queryByText("idiom")).not.toBeInTheDocument();
  expect(result.queryByText("style")).not.toBeInTheDocument();
  expect(result.queryByText("Pattern")).not.toBeInTheDocument();
});
