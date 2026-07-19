import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { fn } from "storybook/test";
import { TodoForm, type TodoFormProps } from "./todo-form";

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
    submit: fn(async () => undefined),
  },
};
