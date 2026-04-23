import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Signin, type SigninProps } from "./signin";
import { $, component$, useSignal } from "@builder.io/qwik";

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
    error: null,
    onSubmit$: $(async (username: string, password: string) => {
      alert(`username: ${username}, password: ${password}`);
    }),
  },

  render: (args) => {
    const Render = component$((args: SigninProps) => {
      const isLoading = useSignal(args.isLoading);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const onSubmit$ = $((_username: string, _password: string) => {
        isLoading.value = true;

        setTimeout(() => {
          isLoading.value = false;
        }, 1500);
      });

      return (
        <Signin {...args} isLoading={isLoading.value} onSubmit$={onSubmit$} />
      );
    });

    return <Render {...args} />;
  },
};
