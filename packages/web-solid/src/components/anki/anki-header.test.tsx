import { render } from "@solidjs/testing-library";
import { createSignal, type ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
  ElmMdiIcon: () => <span aria-hidden="true" />,
}));

import { AnkiHeader } from "./anki-header";

it("renders reactive queue counts", () => {
  const [counts, setCounts] = createSignal({ shouldLearn: 3, queue: 12 });
  const result = render(() => (
    <AnkiHeader
      shouldLearnCount={counts().shouldLearn}
      queueCount={counts().queue}
    />
  ));

  expect(result.getByText("Should Learn: 3")).toBeInTheDocument();
  expect(result.getByText("Queue: 12")).toBeInTheDocument();

  setCounts({ shouldLearn: 0, queue: 8 });

  expect(result.getByText("Should Learn: 0")).toBeInTheDocument();
  expect(result.getByText("Queue: 8")).toBeInTheDocument();
});
