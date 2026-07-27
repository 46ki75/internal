import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { createSignal, Show } from "solid-js";

import { Typing, type TypingProps } from "./typing";

const sampleText = "Small steps make reliable systems.";
const autoAdvanceExercises = [
  { description: "First exercise", text: "cat" },
  { description: "Second exercise", text: "dog" },
];

const AutoAdvanceSequence = (props: TypingProps) => {
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const currentExercise = () => autoAdvanceExercises[currentIndex()];
  const next = () =>
    setCurrentIndex((index) => (index + 1) % autoAdvanceExercises.length);

  return (
    <Show when={currentExercise()} keyed>
      {(exercise) => (
        <Typing
          {...props}
          text={exercise.text}
          description={exercise.description}
          onComplete={(result) => {
            props.onComplete?.(result);
            next();
          }}
          onNext={next}
        />
      )}
    </Show>
  );
};

const meta = {
  title: "Components/Typing/Typing",
  component: Typing,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    text: sampleText,
    description: "Practice line 07: Systems thinking",
    onComplete: fn(),
    onNext: fn(),
    style: {
      margin: "clamp(0.5rem, 4vw, 2.5rem) auto",
    },
  },
  argTypes: {
    text: { control: "text" },
    description: { control: "text" },
    onComplete: { control: false },
    onNext: { control: false },
  },
} satisfies Meta<TypingProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const WithMistake: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Your typing" }),
      "Small steps make reliablf",
    );
    await expect(canvas.getByText("96%")).toBeInTheDocument();
  },
};

export const Complete: Story = {
  args: {
    onComplete: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Your typing" }),
      sampleText,
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "34 of 34 characters match",
    );
    await expect(args.onComplete).toHaveBeenCalledOnce();
  },
};

export const AutoAdvance: Story = {
  args: {
    onComplete: fn(),
  },
  render: (args) => <AutoAdvanceSequence {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Your typing" }),
      "cat",
    );

    await expect(
      canvas.getByRole("heading", { name: "Second exercise" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("textbox", { name: "Your typing" }),
    ).toHaveValue("");
    await expect(
      canvas.getByRole("textbox", { name: "Your typing" }),
    ).toHaveFocus();
    await expect(args.onComplete).toHaveBeenCalledOnce();
  },
};
