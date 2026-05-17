import type { Meta, StoryObj } from "storybook-framework-qwik";
import { TodoForm, type TodoFormProps } from "./todo-form";
import { $ } from "@qwik.dev/core";

const meta: Meta<TodoFormProps> = {
  title: "Components/ToDo/todo-form",
  component: TodoForm,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<TodoFormProps>;

export const Primary: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    submit$: $(async ({ title, severity }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (Math.random() < 0.5) {
        throw new Error("Random error occurred");
      }
    }),
  },
};
