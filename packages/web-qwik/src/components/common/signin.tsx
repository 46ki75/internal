import { component$, type CSSProperties } from "@builder.io/qwik";

import styles from "./signin.module.css";
import { ElmTextField } from "@elmethis/qwik";

export interface SigninProps {
  class?: string;

  style?: CSSProperties;
}

export const Signin = component$<SigninProps>(({ class: className, style }) => {
  return (
    <div class={[styles["signin"], className]} style={style}>
      <ElmTextField label="username" icon="user" />
    </div>
  );
});
