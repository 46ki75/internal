import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { BookmarkContainer } from "~/container/bookmark-container";
import { TodoContainer } from "~/container/todo-container";

import styles from "./index.module.css";

export default component$(() => {
  return (
    <div class={styles.container}>
      <BookmarkContainer />
      <TodoContainer />
    </div>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
