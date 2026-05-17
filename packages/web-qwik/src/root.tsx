import { component$, isDev } from "@qwik.dev/core";
import { RouterOutlet, useQwikRouter } from "@qwik.dev/router";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";
import "@elmethis/qwik/style.css";

import { useAuthContextProvider } from "./context/auth-context";

export default component$(() => {
  /**
   * The root of a Qwik Router site calls `useQwikRouter()` once, immediately
   * followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   *
   * `useAuthContextProvider()` is split intentionally: the provider runs here
   * (the store needs to be serialized at the document root so every route
   * sees it), but the client bootstrap effect lives in
   * `useAuthEffect()` which is called from `routes/layout.tsx` — Qwik v2's
   * root component has no DOM host and its client-side tasks never fire.
   */

  useQwikRouter();
  useAuthContextProvider();

  return (
    <>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        <RouterHead />
      </head>
      <body lang="en">
        <RouterOutlet />
      </body>
    </>
  );
});
