// @vitest-environment happy-dom

import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineIcon: () => <span aria-hidden="true" />,
  ElmInlineText: (props: { children: JSX.Element }) => (
    <span>{props.children}</span>
  ),
  ElmMdiIcon: () => <span aria-hidden="true" />,
}));

import { Todo } from "./todo";

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
