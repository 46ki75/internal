import type { Meta, StoryObj } from "storybook-framework-qwik";
import { TodoSeverity, type TodoSeverityProps } from "./todo-severity";

const meta: Meta<TodoSeverityProps> = {
  title: "Components/ToDo/todo-severity",
  component: TodoSeverity,
  tags: ["autodocs"],
  args: {
    severity: "INFO",
  },
  argTypes: {
    severity: {
      control: "radio",
      options: ["ERROR", "WARN", "INFO", "DEBUG", "UNKNOWN"],
    },
  },
};

export default meta;
type Story = StoryObj<TodoSeverityProps>;

export const Primary: Story = {
  args: {
    severity: "INFO",
  },
};
