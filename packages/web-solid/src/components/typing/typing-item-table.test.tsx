// @vitest-environment happy-dom

import { render, within } from "@solidjs/testing-library";
import { createSignal, type ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineText: (
    props: ParentProps<{ class?: string; color?: string; size?: string }>,
  ) => <span class={props.class}>{props.children}</span>,
}));

import { TypingItemTable, type TypingItem } from "./typing-item-table";

const initialItems: TypingItem[] = [
  { id: "short-words", text: "cat" },
  { id: "emoji", text: "👍a" },
];

it("renders a read-only exercise list and reacts to data changes", async () => {
  const [items, setItems] = createSignal(initialItems);
  const result = render(() => <TypingItemTable items={items()} />);

  expect(
    result.getByRole("table", { name: "Saved typing exercises" }),
  ).toBeInTheDocument();
  expect(
    result.getAllByRole("columnheader").map((header) => header.textContent),
  ).toEqual(["Practice text", "Glyphs"]);
  expect(result.getAllByRole("row")).toHaveLength(3);
  const emojiRow = result.getByText("👍a").closest("tr");
  expect(emojiRow).not.toBeNull();
  expect(within(emojiRow!).getByText("2")).toBeInTheDocument();
  expect(emojiRow).not.toHaveAttribute("tabindex");
  expect(emojiRow).not.toHaveAttribute("aria-selected");
  expect(result.getByText("2 items")).toBeInTheDocument();

  setItems([...initialItems, { id: "sentence", text: "Type this." }]);
  await Promise.resolve();

  expect(result.getAllByRole("row")).toHaveLength(4);
  expect(result.getByText("3 items")).toBeInTheDocument();

  setItems([]);
  await Promise.resolve();

  expect(result.getByText("No saved exercises.")).toBeInTheDocument();
  expect(result.getByText("0 items")).toBeInTheDocument();
});
