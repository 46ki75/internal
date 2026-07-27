// @vitest-environment happy-dom

import { render } from "@solidjs/testing-library";
import { createSignal, type ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmHeading: (props: ParentProps<{ id?: string; level: number }>) => (
    <h2 id={props.id}>{props.children}</h2>
  ),
  ElmInlineText: (
    props: ParentProps<{ class?: string; color?: string; size?: string }>,
  ) => <span class={props.class}>{props.children}</span>,
}));

import { TypingItemTable, type TypingItem } from "./typing-item-table";

const initialItems: TypingItem[] = [
  { id: "short-words", description: "Short words", text: "cat" },
  { id: "emoji", description: "Emoji", text: "👍a" },
];

it("renders typing items and reacts to data changes", async () => {
  const [items, setItems] = createSignal(initialItems);
  const result = render(() => <TypingItemTable items={items()} />);

  expect(
    result.getByRole("table", { name: "Saved typing exercises" }),
  ).toBeInTheDocument();
  expect(result.getAllByRole("columnheader")).toHaveLength(3);
  expect(result.getAllByRole("row")).toHaveLength(3);
  expect(result.getByText("short-words")).toBeInTheDocument();
  expect(result.getByText("Emoji").closest("tr")).toHaveTextContent("2");
  expect(result.getByText("2 items")).toBeInTheDocument();

  setItems([
    ...initialItems,
    { id: "sentence", description: "Sentence", text: "Type this." },
  ]);
  await Promise.resolve();

  expect(result.getAllByRole("row")).toHaveLength(4);
  expect(result.getByText("3 items")).toBeInTheDocument();

  setItems([]);
  await Promise.resolve();

  expect(result.getByText("No saved exercises.")).toBeInTheDocument();
  expect(result.getByText("0 items")).toBeInTheDocument();
});
