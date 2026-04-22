import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Header, type HeaderProps } from "./header";
import { $ } from "@builder.io/qwik";
import { mdiHome, mdiTag } from "@mdi/js";

const meta: Meta<HeaderProps> = {
  title: "Components/Common/header",
  component: Header,
  tags: ["autodocs"],
  args: {},
  argTypes: {
    state: {
      control: "radio",
      options: ["pending", "login", "logout"],
    },
  },
};

export default meta;
type Story = StoryObj<HeaderProps>;

export const Primary: Story = {
  args: {
    links: [
      { d: mdiHome, onClick$: $(() => console.log("Home clicked")) },
      { d: mdiTag, onClick$: $(() => console.log("Tag clicked")) },
    ],
    state: "pending",
  },
};
