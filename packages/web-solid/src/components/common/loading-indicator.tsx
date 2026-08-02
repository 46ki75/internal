import { useIsRouting } from "@solidjs/router";
import { clsx } from "clsx";
import {
  createSignal,
  onCleanup,
  onMount,
  splitProps,
  type JSX,
} from "solid-js";

import styles from "./loading-indicator.module.css";

export type LoadingIndicatorProps = JSX.HTMLAttributes<HTMLDivElement>;

export const LoadingIndicator = (props: LoadingIndicatorProps) => {
  const [local, others] = splitProps(props, ["class"]);
  const isRouting = useIsRouting();
  const [isExternalNavigationActive, setIsExternalNavigationActive] =
    createSignal(false);

  onMount(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target !== "" && anchor.target.toLowerCase() !== "_self")
      ) {
        return;
      }

      const url = new URL(anchor.href);
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.origin !== window.location.origin
      ) {
        setIsExternalNavigationActive(true);
      }
    };
    const handlePageShow = () => setIsExternalNavigationActive(false);

    window.addEventListener("click", handleClick);
    window.addEventListener("pageshow", handlePageShow);

    onCleanup(() => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("pageshow", handlePageShow);
    });
  });

  return (
    <div
      class={clsx(styles["loading-indicator"], local.class, {
        [styles.active]: isRouting() || isExternalNavigationActive(),
      })}
      {...others}
    />
  );
};
