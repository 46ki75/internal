import { component$, type CSSProperties } from "@builder.io/qwik";

import styles from "./icon.module.css";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

export const Index = component$<IndexProps>(({ class: className, style }) => {
  return <div class={[styles["index"], className]} style={style}></div>;
});
