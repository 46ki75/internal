import { component$ } from "@builder.io/qwik";

import styles from "./swatch.module.css";
import { ElmColorTable } from "@elmethis/qwik";

export default component$(() => {
  return (
    <div class={[styles["swatch"]]}>
      <div class={[styles["swatch-inner"]]}>
        <div>
          <ElmColorTable
            colors={[
              { name: "crimson", code: "#c56565" },
              { name: "amber", code: "#d48b70" },
              { name: "gold", code: "#cdb57b" },
              { name: "emerald", code: "#59b57c" },
              { name: "blue", code: "#6987b8" },
              { name: "purple", code: "#9771bd" },
              { name: "pink", code: "#c9699e" },
              { name: "slate", code: "#868e9c" },
            ]}
          />
        </div>
      </div>
    </div>
  );
});
