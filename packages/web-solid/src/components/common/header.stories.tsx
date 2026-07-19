import { mdiHome, mdiTag } from "@mdi/js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { fn } from "storybook/test";

import { Header, type HeaderProps } from "./header";

const meta = {
  title: "Components/Common/Header",
  component: Header,
  tags: ["autodocs"],
  args: {
    links: [
      { d: mdiHome, href: "/", label: "Home" },
      { d: mdiTag, href: "/anki", label: "Anki" },
    ],
    state: "logout",
    onSignIn: fn(),
    onSignOut: fn(),
  },
  argTypes: {
    state: { control: "radio", options: ["pending", "login", "logout"] },
  },
} satisfies Meta<HeaderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {};
export const Pending: Story = { args: { state: "pending" } };
export const LoggedIn: Story = { args: { state: "login" } };
