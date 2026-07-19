import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Signin, type SigninProps } from "./signin";

const meta = {
  title: "Components/Common/Signin",
  component: Signin,
  tags: ["autodocs"],
  args: {
    isLoading: false,
    isDisabled: false,
    error: null,
    onSubmit: fn(),
  },
  argTypes: {
    isLoading: { control: "boolean" },
    isDisabled: { control: "boolean" },
  },
} satisfies Meta<SigninProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("username"), "storybook-user");
    await userEvent.type(canvas.getByLabelText("password"), "secret");
    await userEvent.click(canvas.getByRole("button", { name: "Sign In" }));
    await expect(args.onSubmit).toHaveBeenCalledWith(
      "storybook-user",
      "secret",
    );
  },
};

export const Loading: Story = { args: { isLoading: true } };
export const Disabled: Story = { args: { isDisabled: true } };
export const Error: Story = { args: { error: "Unable to sign in" } };
