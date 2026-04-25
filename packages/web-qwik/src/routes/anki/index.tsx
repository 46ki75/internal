import { component$, useContext, type CSSProperties } from "@builder.io/qwik";

import styles from "./anki.module.css";
import { AnkiContext } from "~/context/anki-context";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

export default component$<IndexProps>(({ class: className, style }) => {
  const ankiStore = useContext(AnkiContext);

  return (
    <div class={[styles["index"], className]} style={style}>
      {JSON.stringify(ankiStore.ankiList.data[ankiStore.ankiList.currentIndex])}
    </div>
  );
});
