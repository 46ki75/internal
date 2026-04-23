import type { Meta, StoryObj } from "storybook-framework-qwik";
import { Signin, type SigninProps } from "./signin";
import { $, component$, useSignal } from "@builder.io/qwik";

import { Amplify } from "aws-amplify";
import { signIn } from "aws-amplify/auth";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { KeyValueStorageInterface } from "aws-amplify/utils";

class InMemoryStorage implements KeyValueStorageInterface {
  private store: Record<string, string> = {};
  async setItem(key: string, value: string) {
    this.store[key] = value;
  }
  async getItem(key: string) {
    return this.store[key] ?? null;
  }
  async removeItem(key: string) {
    delete this.store[key];
  }
  async clear() {
    this.store = {};
  }
}

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

      const onSubmit$ = $(async (username: string, password: string) => {
        isLoading.value = true;

        try {
          Amplify.configure({
            Auth: {
              Cognito: {
                userPoolId: "ap-northeast-1_BmZKeZeKX",
                userPoolClientId: "4n5l6d5oekst6hrmvt1chndghd",
              },
            },
          });

          const inMemoryStorage = new InMemoryStorage();

          cognitoUserPoolsTokenProvider.setKeyValueStorage(inMemoryStorage);

          const result = await signIn({
            username: username,
            password: password,
          });

          console.log(result);

          const tokens = await cognitoUserPoolsTokenProvider.getTokens();

          console.log(tokens);
        } finally {
          isLoading.value = false;
        }
      });

      return (
        <Signin {...args} isLoading={isLoading.value} onSubmit$={onSubmit$} />
      );
    });

    return <Render {...args} />;
  },
};
