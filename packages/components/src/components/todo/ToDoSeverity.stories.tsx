import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ToDoSeverity from "./ToDoSeverity.vue";

const meta: Meta<typeof ToDoSeverity> = {
  title: "Components/ToDo/ToDoSeverity",
  component: ToDoSeverity,
  tags: ["autodocs"],
  args: {},
  argTypes: {
    level: {
      control: "radio",
      options: ["UNKNOWN", "INFO", "WARN", "ERROR"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    level: "INFO",
  },
};
