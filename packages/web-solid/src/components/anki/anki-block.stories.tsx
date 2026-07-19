import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { mdiMessageQuestionOutline } from "@mdi/js";
import { AnkiBlock, type AnkiBlockProps } from "./anki-block";

const meta: Meta<AnkiBlockProps> = {
  title: "Components/Anki/anki-block",
  component: AnkiBlock,
  tags: ["autodocs"],
  args: {
    icon: mdiMessageQuestionOutline,
    label: "Front",
    surface: { root: "root", components: {} },
    surfaceId: "demo-front",
  },
};

export default meta;
type Story = StoryObj<AnkiBlockProps>;

export const Primary: Story = {};
