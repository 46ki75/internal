// @vitest-environment happy-dom

import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal, Show, type JSX, type ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmA2ui: (props: { messages: object[] }) => (
    <pre aria-label="Rendered A2UI">{JSON.stringify(props.messages)}</pre>
  ),
  notionBlockCatalog: {},
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

it("displays the rich reference while using only plaintext for typing", async () => {
  const user = userEvent.setup();
  const surface = {
    root: "root",
    components: {
      root: { id: "root", component: "Column", children: ["reference"] },
      reference: {
        id: "reference",
        component: "Paragraph",
        children: ["word"],
      },
      word: {
        id: "word",
        component: "RichText",
        text: "cat",
        decoration: ["bold"],
      },
    },
  };
  const result = render(() => (
    <Typing text="cat" description="Short words" surface={surface} />
  ));

  expect(
    result.getByRole("region", { name: "Short words" }),
  ).toBeInTheDocument();
  expect(
    result.getByRole("region", { name: "Reference text" }),
  ).toBeInTheDocument();
  const surfaceId = `${result.getByRole("textbox", { name: "Your typing" }).id}-reference`;
  const messages: unknown = JSON.parse(
    result.getByLabelText("Rendered A2UI").textContent,
  );
  expect(messages).toEqual([
    expect.objectContaining({
      createSurface: expect.objectContaining({ surfaceId }),
    }),
    {
      version: "v0.9",
      updateComponents: {
        surfaceId,
        components: Object.values(surface.components),
      },
    },
  ]);
  expect(result.getByText("3 glyphs")).toBeInTheDocument();

  await user.type(result.getByRole("textbox", { name: "Your typing" }), "cat");
  expect(result.getByRole("status")).toHaveTextContent(
    "3 of 3 characters match",
  );
});

it("updates the description and formatted reference when props change", () => {
  const [word, setWord] = createSignal("cat");
  const result = render(() => (
    <Typing
      text={word()}
      description={`Practice ${word()}`}
      surface={{
        root: "root",
        components: {
          root: { id: "root", component: "RichText", text: word() },
        },
      }}
    />
  ));
  expect(result.getByLabelText("Rendered A2UI")).toHaveTextContent(
    '"text":"cat"',
  );

  setWord("dog");

  expect(
    result.getByRole("region", { name: "Practice dog" }),
  ).toBeInTheDocument();
  expect(result.getByLabelText("Rendered A2UI")).toHaveTextContent(
    '"text":"dog"',
  );
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveValue("");
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

it("supports uninterrupted automatic advancement", async () => {
  const user = userEvent.setup();
  const exercises = [
    { description: "First exercise", text: "cat" },
    { description: "Second exercise", text: "dog" },
  ];

  const Sequence = () => {
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const currentExercise = () => exercises[currentIndex()];

    return (
      <Show when={currentExercise()} keyed>
        {(exercise) => (
          <Typing
            text={exercise.text}
            description={exercise.description}
            onComplete={() => setCurrentIndex((index) => index + 1)}
          />
        )}
      </Show>
    );
  };

  const result = render(() => <Sequence />);

  await user.type(result.getByRole("textbox", { name: "Your typing" }), "cat");

  expect(
    result.getByRole("region", { name: "Second exercise" }),
  ).toBeInTheDocument();
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveValue("");
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveFocus();
});
