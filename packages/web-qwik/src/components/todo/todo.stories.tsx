import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Todo, type TodoProps } from "./todo";

const meta: Meta<TodoProps> = {
  title: "Components/ToDo/todo",
  component: Todo,
  tags: ["autodocs"],
  args: {},
  argTypes: {
    isLoading: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<TodoProps>;

export const Primary: Story = {
  args: {
    id: "1",
    title: "Example ToDo Item",
    url: "https://www.notion.so/Example-ToDo-Item-1234567890abcdef1234567890abcdef",
    deadline: "2024-12-31",
    severity: "Error",
    is_recurring: true,
    isLoading: false,
  },
};
