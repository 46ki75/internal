import { render, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { For, type JSX, type ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmButton: (
    props: ParentProps<
      JSX.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }
    >,
  ) => (
    <button
      type={props.type}
      aria-label={props["aria-label"]}
      disabled={props.disabled || props.isLoading}
    >
      {props.children}
    </button>
  ),
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
  ElmMdiIcon: () => <span aria-hidden="true" />,
  ElmSelect: (props: {
    isLoading?: boolean;
    label: string;
    onSelectedOptionIdChange: (value: string) => void;
    options: Array<{ id: string; label: string }>;
    selectedOptionId: string;
  }) => (
    <label>
      {props.label}
      <select
        value={props.selectedOptionId}
        disabled={props.isLoading}
        onChange={(event) =>
          props.onSelectedOptionIdChange(event.currentTarget.value)
        }
      >
        <For each={props.options}>
          {(option) => <option value={option.id}>{option.label}</option>}
        </For>
      </select>
    </label>
  ),
  ElmTextField: (
    props: JSX.InputHTMLAttributes<HTMLInputElement> & {
      isLoading?: boolean;
      label: string;
    },
  ) => (
    <label>
      {props.label}
      <input
        value={props.value}
        disabled={props.isLoading}
        onInput={(event) => {
          if (typeof props.onInput === "function") {
            props.onInput(event);
          } else if (props.onInput) {
            props.onInput[0](props.onInput[1], event);
          }
        }}
      />
    </label>
  ),
}));

import { TodoForm } from "./todo-form";

it("submits a todo and resets the form after success", async () => {
  const user = userEvent.setup();
  const submit = vi.fn().mockResolvedValue(undefined);
  const result = render(() => <TodoForm submit={submit} />);
  const createButton = result.getByRole("button", { name: "Create todo" });

  expect(createButton).toBeDisabled();

  await user.type(result.getByRole("textbox", { name: "Title" }), "Ship tests");
  await user.selectOptions(
    result.getByRole("combobox", { name: "Severity" }),
    "ERROR",
  );
  await user.type(result.getByLabelText("Deadline"), "2026-08-10");
  await user.click(createButton);

  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith({
      title: "Ship tests",
      severity: "ERROR",
      deadline: "2026-08-10",
    }),
  );
  await waitFor(() => expect(createButton).toBeDisabled());
  expect(result.getByRole("textbox", { name: "Title" })).toHaveValue("");
  expect(result.getByRole("combobox", { name: "Severity" })).toHaveValue(
    "INFO",
  );
  expect(result.getByLabelText("Deadline")).toHaveValue("");
});

it("retains input and reports submission failures", async () => {
  const user = userEvent.setup();
  const submit = vi.fn().mockRejectedValue(new Error("Unable to create"));
  const result = render(() => <TodoForm submit={submit} />);
  const title = result.getByRole("textbox", { name: "Title" });

  await user.type(title, "Keep this todo");
  await user.click(result.getByRole("button", { name: "Create todo" }));

  expect(await result.findByText("Error: Unable to create")).toBeVisible();
  expect(title).toHaveValue("Keep this todo");
});
