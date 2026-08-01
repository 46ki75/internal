// @vitest-environment happy-dom

import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { Temporal } from "@js-temporal/polyfill";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineIcon: () => <span aria-hidden="true" />,
  ElmInlineText: (props: { children: JSX.Element }) => (
    <span>{props.children}</span>
  ),
  ElmMdiIcon: () => <span aria-hidden="true" />,
}));

import { Deadline, Todo } from "./todo";

it("requests the inverse completion state from its semantic control", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();

  const result = render(() => (
    <Todo
      id="todo-1"
      title="Review migration"
      url="https://www.notion.so/example"
      severity="INFO"
      is_recurring={false}
      is_done={false}
      onClick={onClick}
    />
  ));

  await user.click(
    result.getByRole("button", { name: "Mark Review migration complete" }),
  );

  expect(onClick).toHaveBeenCalledWith("todo-1", true);
});

it("requests reopening a completed todo and links to its source", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  const result = render(() => (
    <Todo
      id="todo-1"
      title="Review migration"
      url="https://www.notion.so/example"
      severity="INFO"
      is_recurring={false}
      is_done
      onClick={onClick}
    />
  ));
  const toggle = result.getByRole("button", {
    name: "Mark Review migration incomplete",
  });

  expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(
    result.getByRole("link", { name: "Review migration" }),
  ).toHaveAttribute("href", "https://www.notion.so/example");

  await user.click(toggle);

  expect(onClick).toHaveBeenCalledWith("todo-1", false);
});

describe("Deadline", () => {
  it.each([
    ["2026-07-30", "2 days ago"],
    ["2026-08-01", "Today"],
    ["2026-08-06", "5 days remaining"],
  ])("describes %s relative to today", (deadline, description) => {
    vi.spyOn(Temporal.Now, "plainDateISO").mockReturnValue(
      Temporal.PlainDate.from("2026-08-01"),
    );
    const result = render(() => <Deadline deadline={deadline} />);

    expect(result.getByText(deadline)).toBeVisible();
    expect(result.getByText(description)).toBeVisible();
  });

  it("renders a placeholder without a deadline", () => {
    const result = render(() => <Deadline />);

    expect(result.getByText("-")).toBeVisible();
  });
});
