import { component$ } from "@qwik.dev/core";

import styles from "./swatch.module.css";
import {
  ElmColorSemanticSample,
  ElmColorPrimitiveSample,
} from "@elmethis/qwik";

export default component$(() => {
  return (
    <div class={styles.swatch}>
      <ElmColorSemanticSample />
      <ElmColorPrimitiveSample />
    </div>
  );
});
