import {
  component$,
  QRL,
  QRLEventHandlerMulti,
  type CSSProperties,
} from "@builder.io/qwik";

import styles from "./header.module.css";
import {
  ElmMdiIcon,
  ElmSquareLoadingIcon,
  ElmToggleTheme,
} from "@elmethis/qwik";
import { mdiLogin, mdiLogout } from "@mdi/js";

export interface HeaderProps {
  class?: string;

  style?: CSSProperties;

  links: Array<{
    d: string;
    onClick$: QRLEventHandlerMulti<PointerEvent, Element>;
  }>;

  state: "pending" | "login" | "logout";

  handleSignInClick$: QRL<(...args: any[]) => Promise<void>>;
  handleSignOutClick$: QRL<(...args: any[]) => Promise<void>>;
}

export const Header = component$<HeaderProps>(
  ({
    class: className,
    style,
    links,
    state,
    handleSignInClick$,
    handleSignOutClick$,
  }) => {
    return (
      <header class={[styles["header"], className]} style={style}>
        <div class={styles["link-container"]}>
          {links.map((link, index) => (
            <div class={styles["link"]} key={index} onClick$={link.onClick$}>
              <ElmMdiIcon d={link.d} size="1.75rem" />
            </div>
          ))}
        </div>

        <div class={styles["link-container"]}>
          <div
            class={styles["link"]}
            onClick$={
              state === "login" ? handleSignOutClick$ : handleSignInClick$
            }
          >
            {state === "pending" ? (
              <ElmSquareLoadingIcon size="1.75rem" />
            ) : state === "login" ? (
              <ElmMdiIcon d={mdiLogout} size="1.75rem" color="#be5252" />
            ) : (
              <ElmMdiIcon d={mdiLogin} size="1.75rem" color="#6987b8" />
            )}
          </div>
          <ElmToggleTheme />
        </div>
      </header>
    );
  },
);
