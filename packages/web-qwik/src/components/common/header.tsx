import {
  component$,
  QRLEventHandlerMulti,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./header.module.css";
import { ElmMdiIcon, ElmToggleTheme } from "@elmethis/qwik";

export interface HeaderProps {
  class?: string;

  style?: CSSProperties;

  links: Array<{
    d: string;
    onClick$: QRLEventHandlerMulti<PointerEvent, Element>;
  }>;
}

export const Header = component$<HeaderProps>(
  ({ class: className, style, links }) => {
    return (
      <header class={[styles["header"], className]} style={style}>
        <div class={styles["link-container"]}>
          {links.map((link, index) => (
            <div class={styles["link"]} key={index} onClick$={link.onClick$}>
              <ElmMdiIcon d={link.d} size="1.75rem" />
            </div>
          ))}
        </div>
        <ElmToggleTheme />
      </header>
    );
  },
);
