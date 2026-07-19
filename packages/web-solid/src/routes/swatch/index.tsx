import { Meta, Title } from "@solidjs/meta";

import styles from "./swatch.module.css";
import {
  ElmColorSemanticSample,
  ElmColorPrimitiveSample,
} from "@elmethis/solid";

export default function SwatchRoute() {
  return (
    <>
      <Title>Swatches | Internal</Title>
      <Meta name="description" content="Elmethis color token samples" />
      <div class={styles.swatch}>
        <ElmColorSemanticSample />
        <ElmColorPrimitiveSample />
      </div>
    </>
  );
}
