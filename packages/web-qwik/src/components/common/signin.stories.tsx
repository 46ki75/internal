import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Signin, type SigninProps } from "./signin";

const meta: Meta<SigninProps> = {
  title: "Components/Common/signin",
  component: Signin,
  tags: ["autodocs"],
  args: {},
  argTypes: {
    isLoading: {
      control: "boolean",
    },
    isDisabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<SigninProps>;

export const Primary: Story = {
  args: {
    isLoading: false,
    isDisabled: false,
  },
};
