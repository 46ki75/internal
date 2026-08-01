import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX, ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmButton: (
    props: ParentProps<
      JSX.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }
    >,
  ) => (
    <button
      type="button"
      aria-label={props["aria-label"]}
      disabled={props.disabled || props.isLoading}
      onClick={(event) => {
        if (typeof props.onClick === "function") {
          props.onClick(event);
        } else if (props.onClick) {
          props.onClick[0](props.onClick[1], event);
        }
      }}
    >
      {props.children}
    </button>
  ),
  ElmMdiIcon: () => <span aria-hidden="true" />,
}));

import { AnkiControls } from "./anki-controls";

it("forwards each available control action", async () => {
  const user = userEvent.setup();
  const handlers = {
    onEdit: vi.fn(),
    onCreate: vi.fn(),
    onReview: vi.fn(),
    onRefresh: vi.fn(),
  };
  const result = render(() => <AnkiControls hasCard {...handlers} />);

  await user.click(result.getByRole("button", { name: "Edit" }));
  await user.click(result.getByRole("button", { name: "New" }));
  await user.click(
    result.getByRole("button", { name: "Toggle review required" }),
  );
  await user.click(result.getByRole("button", { name: "Refresh card" }));

  expect(handlers.onEdit).toHaveBeenCalledOnce();
  expect(handlers.onCreate).toHaveBeenCalledOnce();
  expect(handlers.onReview).toHaveBeenCalledOnce();
  expect(handlers.onRefresh).toHaveBeenCalledOnce();
});

it("makes card actions unavailable when no card is loaded", () => {
  const result = render(() => (
    <AnkiControls
      hasCard={false}
      onEdit={vi.fn()}
      onCreate={vi.fn()}
      onReview={vi.fn()}
      onRefresh={vi.fn()}
    />
  ));

  expect(result.getByRole("button", { name: "Edit" })).toBeDisabled();
  expect(result.getByRole("button", { name: "New" })).toBeEnabled();
  expect(
    result.getByRole("button", { name: "Toggle review required" }),
  ).toBeDisabled();
  expect(result.getByRole("button", { name: "Refresh card" })).toBeDisabled();
});
