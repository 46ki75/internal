// @vitest-environment happy-dom

import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX, ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmButton: (
    props: ParentProps<{
      onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
      primary?: boolean;
      type?: "button" | "submit" | "reset";
    }>,
  ) => (
    <button type={props.type} onClick={(event) => props.onClick?.(event)}>
      {props.children}
    </button>
  ),
  ElmHeading: (props: ParentProps<{ id?: string; level: number }>) => (
    <h1 id={props.id}>{props.children}</h1>
  ),
  ElmInlineText: (
    props: ParentProps<{ class?: string; color?: string; size?: string }>,
  ) => <span class={props.class}>{props.children}</span>,
  ElmTextArea: (
    props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement> & {
      label: string;
      ref?: (element: HTMLTextAreaElement) => void;
    },
  ) => (
    <label>
      {props.label}
      <textarea
        ref={props.ref}
        id={props.id}
        rows={props.rows}
        aria-label={props["aria-label"]}
        aria-describedby={props["aria-describedby"]}
        autocomplete={props.autocomplete}
        autocapitalize={props.autocapitalize}
        spellcheck={props.spellcheck}
        onInput={(event) => {
          if (typeof props.onInput === "function") props.onInput(event);
          else if (props.onInput) props.onInput[0](props.onInput[1], event);
        }}
      />
    </label>
  ),
}));

import { Typing } from "./typing";

it("renders typing feedback and resets the exercise", async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  const result = render(() => (
    <Typing text="cat" description="Short words" onComplete={onComplete} />
  ));
  const input = result.getByRole("textbox", { name: "Your typing" });

  await user.type(input, "car");

  expect(input).toHaveValue("car");
  expect(
    result.container.querySelectorAll('[data-state="incorrect"]'),
  ).toHaveLength(1);
  expect(result.getByText("67%")).toBeInTheDocument();
  expect(result.queryByRole("status")).not.toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();

  await user.type(input, "{Backspace}t");

  expect(result.getByRole("status")).toHaveTextContent(
    "3 of 3 characters match",
  );
  expect(onComplete).toHaveBeenCalledOnce();
  expect(result.getByText("75%")).toBeInTheDocument();

  await user.click(result.getByRole("button", { name: "Reset line" }));

  expect(input).toHaveValue("");
  expect(input).toHaveFocus();
});

it("uses graphemes consistently without a UTF-16 input limit", async () => {
  const user = userEvent.setup();
  const result = render(() => <Typing text="👍a" description="Unicode" />);
  const input = result.getByRole("textbox", {
    name: "Your typing",
  });

  expect(result.getByText("2 glyphs")).toBeInTheDocument();
  expect(input).not.toHaveAttribute("maxlength");

  await user.type(input, "👍a");

  expect(input).toHaveValue("👍a");
  expect(result.getByRole("status")).toHaveTextContent(
    "2 of 2 characters match",
  );

  await user.type(input, "x");

  expect(input).toHaveValue("👍a");
});
