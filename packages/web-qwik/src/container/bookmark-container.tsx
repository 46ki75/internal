import { component$ } from "@builder.io/qwik";

import styles from "./bookmark-container.module.css";

export const BookmarkContainer = component$(() => {
  return <div class={styles["bookmark-container"]}></div>;
});
