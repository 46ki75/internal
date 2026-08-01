import { render, within } from "@solidjs/testing-library";
import type { ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmHeading: (props: ParentProps) => <h3>{props.children}</h3>,
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
  ElmMdiIcon: () => <span aria-hidden="true" />,
}));

import { WritingAssessmentsFeedbackContainer } from "./writing-assessments-feedback-container";
import type { WritingAssessmentsFeedbackProps } from "./writing-assessments-feedback";

const feedback = (
  id: string,
  type: WritingAssessmentsFeedbackProps["type"],
): WritingAssessmentsFeedbackProps => ({
  id,
  type,
  severity: "low",
  original: `${id} original`,
  revised: `${id} revised`,
  reason: `${id} reason`,
});

it("groups feedback under each stable section", () => {
  const result = render(() => (
    <WritingAssessmentsFeedbackContainer
      feedbacks={[
        feedback("observation-1", "observation"),
        feedback("error-1", "error"),
        feedback("intent-1", "intent_check"),
        feedback("error-2", "error"),
      ]}
    />
  ));
  const headings = result.getAllByRole("heading", { level: 3 });

  expect(headings.map((heading) => heading.textContent)).toEqual([
    "Error",
    "Intent Check",
    "Observation",
  ]);

  const errorSection = result
    .getByRole("heading", { name: "Error" })
    .closest("section");
  expect(errorSection).not.toBeNull();
  expect(within(errorSection!).getByText("error-1")).toBeVisible();
  expect(within(errorSection!).getByText("error-2")).toBeVisible();
  expect(within(errorSection!).queryByText("intent-1")).not.toBeInTheDocument();
});

it("renders a fallback for every empty group", () => {
  const result = render(() => (
    <WritingAssessmentsFeedbackContainer feedbacks={[]} />
  ));

  expect(result.getAllByText("No Feedback")).toHaveLength(3);
});
