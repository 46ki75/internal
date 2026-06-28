import type { Meta, StoryObj } from "storybook-framework-qwik";
import { AnkiHeader, type AnkiHeaderProps } from "./anki-header";

const meta: Meta<AnkiHeaderProps> = {
  title: "Components/Anki/anki-header",
  component: AnkiHeader,
  tags: ["autodocs"],
  args: {
    shouldLearnCount: 3,
    queueCount: 12,
  },
  argTypes: {
    shouldLearnCount: { control: "number" },
    queueCount: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<AnkiHeaderProps>;

export const Primary: Story = {};
