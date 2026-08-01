import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal, type JSX, type ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmButton: (
    props: ParentProps<
      JSX.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }
    >,
  ) => (
    <button
      type={props.type}
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
  ElmHeading: (props: ParentProps) => <h1>{props.children}</h1>,
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
  ElmMdiIcon: () => <span aria-hidden="true" />,
  ElmTextField: (
    props: JSX.InputHTMLAttributes<HTMLInputElement> & {
      isLoading?: boolean;
      isPassword?: boolean;
      label: string;
    },
  ) => (
    <label>
      {props.label}
      <input
        type={props.isPassword ? "password" : "text"}
        value={props.value}
        disabled={props.disabled || props.isLoading}
        autocomplete={props.autocomplete}
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

import { Signin } from "./signin";

it("submits the entered credentials", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const result = render(() => (
    <Signin isLoading={false} isDisabled={false} onSubmit={onSubmit} />
  ));

  await user.type(result.getByLabelText("username"), "reader@example.com");
  await user.type(result.getByLabelText("password"), "secret");
  await user.click(result.getByRole("button", { name: "Sign In" }));

  expect(onSubmit).toHaveBeenCalledWith("reader@example.com", "secret");
  expect(
    result.queryByText("Username and password are required."),
  ).not.toBeInTheDocument();
});

it("reports missing credentials without submitting", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const result = render(() => (
    <Signin isLoading={false} isDisabled={false} onSubmit={onSubmit} />
  ));

  await user.click(result.getByRole("button", { name: "Sign In" }));

  expect(result.getByText("Username and password are required.")).toBeVisible();
  expect(onSubmit).not.toHaveBeenCalled();
});

it("reacts to an error supplied by the authentication boundary", () => {
  const [error, setError] = createSignal<string | null>("Sign in failed");
  const result = render(() => (
    <Signin
      isLoading={false}
      isDisabled={false}
      error={error()}
      onSubmit={vi.fn()}
    />
  ));

  expect(result.getByText("Sign in failed")).toBeVisible();

  setError(null);

  expect(result.queryByText("Sign in failed")).not.toBeInTheDocument();
});

it("disables every form control while loading", () => {
  const result = render(() => (
    <Signin isLoading isDisabled={false} onSubmit={vi.fn()} />
  ));

  expect(result.getByLabelText("username")).toBeDisabled();
  expect(result.getByLabelText("password")).toBeDisabled();
  expect(result.getByRole("button", { name: "Sign In" })).toBeDisabled();
});
