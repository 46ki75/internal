import {
  ElmButton,
  ElmHeading,
  ElmInlineText,
  ElmMdiIcon,
  ElmTextField,
} from "@elmethis/solid";
import { mdiSend } from "@mdi/js";
import { createEffect, createSignal, Show, type JSX } from "solid-js";

import styles from "./signin.module.css";

export interface SigninProps {
  class?: string;
  style?: JSX.CSSProperties;
  isLoading: boolean;
  isDisabled: boolean;
  error?: string | null;
  onSubmit: (username: string, password: string) => void | Promise<void>;
}

export const Signin = (props: SigninProps) => {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [innerError, setInnerError] = createSignal<string | null>(null);

  createEffect(() => setInnerError(props.error ?? null));

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (
    event,
  ) => {
    event.preventDefault();
    if (!username() || !password()) {
      setInnerError("Username and password are required.");
      return;
    }
    setInnerError(null);
    void props.onSubmit(username(), password());
  };

  return (
    <form
      class={`${styles.signin}${props.class ? ` ${props.class}` : ""}`}
      style={props.style}
      onSubmit={handleSubmit}
    >
      <ElmHeading level={1}>Sign In</ElmHeading>
      <ElmTextField
        label="username"
        value={username()}
        autocomplete="username"
        isLoading={props.isLoading}
        disabled={props.isDisabled}
        onInput={(event) => setUsername(event.currentTarget.value)}
      />
      <ElmTextField
        label="password"
        value={password()}
        autocomplete="current-password"
        isPassword
        isLoading={props.isLoading}
        disabled={props.isDisabled}
        onInput={(event) => setPassword(event.currentTarget.value)}
      />
      <ElmButton
        type="submit"
        block
        isLoading={props.isLoading}
        disabled={props.isDisabled}
      >
        <ElmMdiIcon d={mdiSend} />
        Sign In
      </ElmButton>
      <Show when={innerError()}>
        {(error) => (
          <ElmInlineText class={styles.error} color="#c56565">
            {error()}
          </ElmInlineText>
        )}
      </Show>
    </form>
  );
};
