import { component$, type CSSProperties } from "@builder.io/qwik";

import styles from "./header.module.css";
import { ElmToggleTheme } from "@elmethis/qwik";

export interface HeaderProps {
  class?: string;

  style?: CSSProperties;
}

export const Header = component$<HeaderProps>(({ class: className, style }) => {
  return (
    <header class={[styles["header"], className]} style={style}>
      <div></div>
      <ElmToggleTheme />
    </header>
  );
});
