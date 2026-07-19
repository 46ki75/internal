import {
  ElmMdiIcon,
  ElmSquareLoadingIcon,
  ElmToggleTheme,
} from "@elmethis/solid";
import { mdiLogin, mdiLogout } from "@mdi/js";
import { A } from "@solidjs/router";
import { For, Match, Show, Switch, type JSX } from "solid-js";

import type { SessionState } from "~/context/auth-context";
import styles from "./header.module.css";

export interface HeaderProps {
  class?: string;
  style?: JSX.CSSProperties;
  links: Array<{ d: string; href: string; label: string; native?: boolean }>;
  state: SessionState;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Header = (props: HeaderProps) => (
  <header
    class={`${styles.header}${props.class ? ` ${props.class}` : ""}`}
    style={props.style}
  >
    <nav class={styles["link-container"]} aria-label="Main navigation">
      <For each={props.links}>
        {(link) => (
          <Show
            when={link.native}
            fallback={
              <A class={styles.link} href={link.href} aria-label={link.label}>
                <ElmMdiIcon d={link.d} size="1.75rem" color="#937f69" />
              </A>
            }
          >
            <a class={styles.link} href={link.href} aria-label={link.label}>
              <ElmMdiIcon d={link.d} size="1.75rem" color="#937f69" />
            </a>
          </Show>
        )}
      </For>
    </nav>

    <div class={styles["link-container"]}>
      <button
        type="button"
        class={styles.link}
        aria-label={props.state === "login" ? "Sign out" : "Sign in"}
        disabled={props.state === "pending"}
        onClick={() =>
          props.state === "login" ? props.onSignOut() : props.onSignIn()
        }
      >
        <Switch>
          <Match when={props.state === "pending"}>
            <ElmSquareLoadingIcon size="1.75rem" />
          </Match>
          <Match when={props.state === "login"}>
            <ElmMdiIcon d={mdiLogout} size="1.75rem" color="#be5252" />
          </Match>
          <Match when={props.state === "logout"}>
            <ElmMdiIcon d={mdiLogin} size="1.75rem" color="#6987b8" />
          </Match>
        </Switch>
      </button>
      <ElmToggleTheme />
    </div>
  </header>
);
