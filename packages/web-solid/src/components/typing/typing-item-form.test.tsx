// @vitest-environment happy-dom

import { render, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal, type JSX, type ParentProps } from "solid-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmButton: (
    props: ParentProps<
      JSX.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }
    >,
  ) => (
    <button
      type={props.type}
      disabled={props.disabled}
      onClick={(event) => {
        if (typeof props.onClick === "function") props.onClick(event);
        else if (props.onClick) props.onClick[0](props.onClick[1], event);
      }}
    >
      {props.children}
    </button>
  ),
  ElmHeading: (props: ParentProps<{ id?: string; level: number }>) => (
    <h2 id={props.id}>{props.children}</h2>
  ),
  ElmTextArea: (
    props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string },
  ) => (
    <label>
      {props.label}
      <textarea
        name={props.name}
        value={props.value}
        rows={props.rows}
        required={props.required}
        aria-invalid={props["aria-invalid"]}
        onBlur={(event) => {
          if (typeof props.onBlur === "function") props.onBlur(event);
          else if (props.onBlur) props.onBlur[0](props.onBlur[1], event);
        }}
        onInput={(event) => {
          if (typeof props.onInput === "function") props.onInput(event);
          else if (props.onInput) props.onInput[0](props.onInput[1], event);
        }}
      />
    </label>
  ),
  ElmTextField: (
    props: JSX.InputHTMLAttributes<HTMLInputElement> & { label: string },
  ) => (
    <label>
      {props.label}
      <input
        name={props.name}
        value={props.value}
        required={props.required}
        placeholder={props.placeholder}
        aria-invalid={props["aria-invalid"]}
        onBlur={(event) => {
          if (typeof props.onBlur === "function") props.onBlur(event);
          else if (props.onBlur) props.onBlur[0](props.onBlur[1], event);
        }}
        onInput={(event) => {
          if (typeof props.onInput === "function") props.onInput(event);
          else if (props.onInput) props.onInput[0](props.onInput[1], event);
        }}
      />
    </label>
  ),
}));

import { TypingItemForm } from "./typing-item-form";

describe("TypingItemForm", () => {
  it("submits a new exercise and resets after success", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    const result = render(() => <TypingItemForm submit={submit} />);
    const saveButton = result.getByRole("button", { name: "Save exercise" });

    expect(saveButton).toBeDisabled();

    await user.type(
      result.getByRole("textbox", { name: "Description" }),
      "  Home row  ",
    );
    await user.type(
      result.getByRole("textbox", { name: "Practice text" }),
      "asdf jkl;",
    );
    await user.click(saveButton);

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        id: undefined,
        description: "Home row",
        text: "asdf jkl;",
      }),
    );
    await waitFor(() =>
      expect(result.getByRole("textbox", { name: "Description" })).toHaveValue(
        "",
      ),
    );
    expect(result.getByRole("textbox", { name: "Practice text" })).toHaveValue(
      "",
    );
  });

  it("keeps values and reports a submission failure", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockRejectedValue(new Error("Unable to save"));
    const result = render(() => <TypingItemForm submit={submit} />);

    await user.type(
      result.getByRole("textbox", { name: "ID (optional)" }),
      "custom-id",
    );
    await user.type(
      result.getByRole("textbox", { name: "Description" }),
      "Custom",
    );
    await user.type(
      result.getByRole("textbox", { name: "Practice text" }),
      "Keep this",
    );
    await user.click(result.getByRole("button", { name: "Save exercise" }));

    expect(await result.findByRole("alert")).toHaveTextContent(
      "Unable to save",
    );
    expect(result.getByRole("textbox", { name: "Practice text" })).toHaveValue(
      "Keep this",
    );
  });

  it("loads a selected item and clears it when editing is cancelled", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    const [item, setItem] = createSignal<
      { id: string; description: string; text: string } | undefined
    >();
    const result = render(() => (
      <TypingItemForm
        item={item()}
        onCancel={() => setItem(undefined)}
        submit={submit}
      />
    ));

    setItem({
      id: "short-words",
      description: "Short words",
      text: "cat dog",
    });

    await waitFor(() =>
      expect(
        result.getByRole("textbox", { name: "ID (optional)" }),
      ).toHaveValue("short-words"),
    );
    expect(result.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Short words",
    );
    expect(result.getByRole("textbox", { name: "Practice text" })).toHaveValue(
      "cat dog",
    );
    expect(result.getByRole("button", { name: "Save changes" })).toBeEnabled();

    await user.click(result.getByRole("button", { name: "Cancel edit" }));

    expect(result.getByRole("textbox", { name: "ID (optional)" })).toHaveValue(
      "",
    );
    expect(
      result.getByRole("button", { name: "Save exercise" }),
    ).toBeDisabled();
  });
});
