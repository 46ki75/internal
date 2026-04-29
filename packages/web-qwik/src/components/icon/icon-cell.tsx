import { component$, type CSSProperties } from "@builder.io/qwik";

import styles from "./icon-cell.module.css";
import { ElmInlineText } from "@elmethis/qwik";

export interface IconCellProps {
  class?: string;

  style?: CSSProperties;

  src: string;
  name: string;
  mimeType: string;
}

export const IconCell = component$<IconCellProps>(
  ({ class: className, style, src, name, mimeType }) => {
    return (
      <div class={[styles["icon-cell"], className]} style={style}>
        <img
          class={styles["icon"]}
          src={src}
          alt="Icon"
          height={48}
          width={48}
        />
        <ElmInlineText class={styles["icon-name"]} size={".75rem"}>
          {name}
        </ElmInlineText>
        <ElmInlineText class={styles["icon-mime-type"]} code size={"0.75rem"}>
          {mimeType}
        </ElmInlineText>
      </div>
    );
  },
);
