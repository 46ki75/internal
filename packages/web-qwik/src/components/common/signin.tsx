import { $, component$, useSignal, type CSSProperties } from "@builder.io/qwik";

import styles from "./signin.module.css";
import { ElmButton, ElmHeading, ElmTextField } from "@elmethis/qwik";

export interface SigninProps {
  class?: string;

  style?: CSSProperties;

  isLoading: boolean;
  isDisabled: boolean;
}

export const Signin = component$<SigninProps>(
  ({ class: className, style, isLoading, isDisabled }) => {
    const username = useSignal("");
    const password = useSignal("");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onInputUsername = $((event: InputEvent, _: HTMLInputElement) => {
      const target = event.target as HTMLInputElement;
      username.value = target.value;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onInputPassword = $((event: InputEvent, _: HTMLInputElement) => {
      const target = event.target as HTMLInputElement;
      password.value = target.value;
    });

    return (
      <div class={[styles["signin"], className]} style={style}>
        <ElmHeading level={1}>Sign In</ElmHeading>
        <ElmTextField
          label="username"
          icon="user"
          onInput$={onInputUsername}
          loading={isLoading}
          disabled={isDisabled}
        />
        <ElmTextField
          label="password"
          icon="lock"
          onInput$={onInputPassword}
          isPassword
          loading={isLoading}
          disabled={isDisabled}
        />
        <ElmButton block loading={isLoading} disabled={isDisabled}>
          Sign In
        </ElmButton>
      </div>
    );
  },
);
