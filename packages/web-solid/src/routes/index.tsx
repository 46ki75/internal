import { Meta, Title } from "@solidjs/meta";

import { BookmarkContainer } from "~/container/bookmark-container";
import { TodoContainer } from "~/container/todo-container";

import styles from "./index.module.css";

export default function HomeRoute() {
  return (
    <>
      <Title>Internal</Title>
      <Meta name="description" content="46ki75 internal tools" />
      <div class={styles.container}>
        <BookmarkContainer />
        <TodoContainer />
      </div>
    </>
  );
}
