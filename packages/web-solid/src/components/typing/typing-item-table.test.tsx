// @vitest-environment happy-dom

import { render, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
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
  {
    id: "short-words",
    description: "Short words",
    text: "cat",
    completion_count: 3,
  },
  {
    id: "emoji",
    description: "Emoji",
    text: "👍a",
    completion_count: 7,
  },
];

it("renders typing items and reacts to data changes", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const [items, setItems] = createSignal(initialItems);
  const result = render(() => (
    <TypingItemTable items={items()} selectedId="emoji" onSelect={onSelect} />
  ));

  expect(
    result.getByRole("table", { name: "Saved typing exercises" }),
  ).toBeInTheDocument();
  expect(result.getAllByRole("columnheader")).toHaveLength(4);
  expect(result.getAllByRole("row")).toHaveLength(3);
  expect(result.getByText("short-words")).toBeInTheDocument();
  const emojiRow = result.getByText("Emoji").closest("tr");
  expect(emojiRow).not.toBeNull();
  expect(within(emojiRow!).getByText("2")).toBeInTheDocument();
  expect(within(emojiRow!).getByText("7")).toBeInTheDocument();
  expect(emojiRow).toHaveAttribute("aria-selected", "true");
  expect(result.getByText("2 items")).toBeInTheDocument();

  await user.click(emojiRow!);
  expect(onSelect).toHaveBeenLastCalledWith(initialItems[1]);

  emojiRow!.focus();
  await user.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledTimes(2);

  setItems([
    ...initialItems,
    {
      id: "sentence",
      description: "Sentence",
      text: "Type this.",
      completion_count: 0,
    },
  ]);
  await Promise.resolve();

  expect(result.getAllByRole("row")).toHaveLength(4);
  expect(result.getByText("3 items")).toBeInTheDocument();

  setItems([]);
  await Promise.resolve();

  expect(result.getByText("No saved exercises.")).toBeInTheDocument();
  expect(result.getByText("0 items")).toBeInTheDocument();
});
