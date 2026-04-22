import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Header, type HeaderProps } from "./header";

const meta: Meta<HeaderProps> = {
  title: "Components/Common/header",
  component: Header,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<HeaderProps>;

export const Primary: Story = {};
