import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Signin, type SigninProps } from "./signin";

const meta: Meta<SigninProps> = {
  title: "Components/Common/signin",
  component: Signin,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<SigninProps>;

export const Primary: Story = {};
