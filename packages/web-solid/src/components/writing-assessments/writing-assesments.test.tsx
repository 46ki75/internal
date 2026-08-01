import { render } from "@solidjs/testing-library";
import type { ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineText: (
    props: ParentProps<{ color?: string; underline?: boolean }>,
  ) => <span>{props.children}</span>,
}));

import { WritingAssesments } from "./writing-assesments";

const assessment = {
  original_text: "why not aligning with them?",
  revised_text: "why not align with them?",
  justification: "Use the base form after why not.",
  register: "Conversational technical",
  score: 5 as const,
};

it("renders an assessment and forwards root attributes", () => {
  const result = render(() => (
    <WritingAssesments
      {...assessment}
      id="assessment-1"
      japanese_context="自然な技術英語"
    />
  ));

  for (const text of [
    "Native Like",
    "Japanese Context",
    "自然な技術英語",
    "Original Sentence",
    assessment.original_text,
    "Revised Sentence",
    assessment.revised_text,
    "Justification",
    assessment.justification,
    "Register",
    assessment.register,
  ]) {
    expect(result.getByText(text)).toBeVisible();
  }
  expect(result.container.firstElementChild).toHaveAttribute(
    "id",
    "assessment-1",
  );
});

it.each([null, undefined, ""])(
  "omits an empty Japanese context",
  (japaneseContext) => {
    const result = render(() => (
      <WritingAssesments {...assessment} japanese_context={japaneseContext} />
    ));

    expect(result.queryByText("Japanese Context")).not.toBeInTheDocument();
  },
);
