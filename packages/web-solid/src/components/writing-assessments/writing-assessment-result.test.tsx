import { render } from "@solidjs/testing-library";
import type { ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineText: (
    props: ParentProps<{ color?: string; underline?: boolean }>,
  ) => (
    <span data-color={props.color} data-underline={props.underline}>
      {props.children}
    </span>
  ),
}));

import { WritingAssessmentResult } from "./writing-assessment-result";

it("renders an underlined heading and result by default", () => {
  const result = render(() => (
    <WritingAssessmentResult heading="Original" color="#ae6e6e">
      Original sentence
    </WritingAssessmentResult>
  ));

  expect(result.getByText("Original")).toHaveAttribute(
    "data-underline",
    "true",
  );
  expect(result.getByText("Original sentence")).toHaveAttribute(
    "data-color",
    "#ae6e6e",
  );
});

it("allows a plain heading", () => {
  const result = render(() => (
    <WritingAssessmentResult heading="Context" underline={false}>
      Supporting context
    </WritingAssessmentResult>
  ));

  expect(result.getByText("Context")).toHaveAttribute(
    "data-underline",
    "false",
  );
});
