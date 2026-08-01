import { render } from "@solidjs/testing-library";
import type { ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
}));

import { WritingAssessmentsScore } from "./writing-assessments-score";

it.each([
  [1, "Hard to Follow"],
  [2, "Awkward"],
  [3, "Clear but non Native"],
  [4, "Near Native"],
  [5, "Native Like"],
] as const)("renders score %s as %s", (score, label) => {
  const result = render(() => (
    <WritingAssessmentsScore score={score} label data-testid="score" />
  ));

  expect(result.getByText(label)).toBeVisible();
  expect(result.container.querySelector("[data-score]")).toHaveAttribute(
    "data-score",
    String(score),
  );
  expect(result.getByTestId("score")).toBeInTheDocument();
});

it("can render the score indicator without a text label", () => {
  const result = render(() => (
    <WritingAssessmentsScore score={3} label={false} />
  ));

  expect(
    result.container.querySelector("[data-score='3']"),
  ).toBeInTheDocument();
  expect(result.queryByText("Clear but non Native")).not.toBeInTheDocument();
});
