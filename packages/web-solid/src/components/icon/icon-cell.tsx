import type { JSX } from "solid-js";

import styles from "./icon-cell.module.css";
import { ElmInlineText } from "@elmethis/solid";

export interface IconCellProps {
  class?: string;

  style?: JSX.CSSProperties;

  src: string;
  name: string;
  mimeType?: string;
}

export const IconCell = (props: IconCellProps) => {
  return (
    <div
      class={`${styles["icon-cell"]} ${props.class ?? ""}`}
      style={props.style}
    >
      <img
        class={styles["icon"]}
        src={props.src}
        alt={props.name}
        height={48}
        width={48}
      />
      <ElmInlineText class={styles["icon-name"]} size={".75rem"}>
        {props.name}
      </ElmInlineText>
      <ElmInlineText class={styles["icon-mime-type"]} code size={"0.75rem"}>
        {props.mimeType}
      </ElmInlineText>
    </div>
  );
};
