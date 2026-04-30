import {
  $,
  component$,
  useSignal,
  useTask$,
  type CSSProperties,
  type QRL,
} from "@builder.io/qwik";

import styles from "./signin.module.css";
import {
  ElmButton,
  ElmHeading,
  ElmInlineText,
  ElmMdiIcon,
  ElmTextField,
} from "@elmethis/qwik";
import { mdiSend } from "@mdi/js";

export interface SigninProps {
  class?: string;

  style?: CSSProperties;

  isLoading: boolean;
  isDisabled: boolean;

  error?: string | null;

  onSubmit$: QRL<(username: string, password: string) => void>;
}

export const Signin = component$<SigninProps>(
  (props) => {
    const { class: className, style, isLoading, isDisabled, onSubmit$ } = props;
    const username = useSignal("");
    const password = useSignal("");
    const innerError = useSignal<string | null>(null);

    useTask$(({ track }) => {
      const e = track(() => props.error);
      innerError.value = e ? e : null;
    });

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

    const handleClick = $(() => {
      if (!username.value || !password.value) {
        innerError.value = "Username and password are required.";
        return;
      } else {
        innerError.value = null;
      }

      onSubmit$(username.value, password.value);
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
        <ElmButton
          block
          loading={isLoading}
          disabled={isDisabled}
          onClick$={handleClick}
        >
          <ElmMdiIcon d={mdiSend} />
          Sign In
        </ElmButton>

        <ElmInlineText class={styles["error"]} color="#c56565">
          {innerError.value}
        </ElmInlineText>
      </div>
    );
  },
);
