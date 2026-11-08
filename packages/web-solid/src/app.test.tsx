// @vitest-environment-options {"settings":{"handleDisabledFileLoadingAsSuccess":true}}
import { cleanup, render, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { A, Route } from "@solidjs/router";
import type { ParentProps } from "solid-js";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@elmethis/core/tokens.css", () => ({}));
vi.mock("@solidjs/start/router", () => ({
  FileRoutes: () => (
    <Route path="*path" component={() => <A href="/anki">Open Anki</A>} />
  ),
}));
vi.mock("~/context/auth-context", () => ({
  AuthProvider: (props: ParentProps) => props.children,
}));
vi.mock("~/context/anki-context", () => ({
  AnkiProvider: (props: ParentProps) => props.children,
}));
vi.mock("~/container/app-shell", () => ({
  AppShell: (props: ParentProps) => props.children,
}));

import App from "./app";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  window.history.replaceState(null, "", "/");
});

it.each([
  [undefined, "dev-internal.ikuma.cloud"],
  ["dev", "dev-internal.ikuma.cloud"],
  ["stg", "stg-internal.ikuma.cloud"],
  ["prod", "internal.ikuma.cloud"],
])("uses the migrated canonical domain for stage %s", async (stage, domain) => {
  vi.stubEnv("VITE_STAGE_NAME", stage);
  window.history.replaceState(null, "", "/typing?practice=true#sentence");
  const user = userEvent.setup();
  const result = render(() => <App />);
  const canonical = () => document.head.querySelector('link[rel="canonical"]');

  await waitFor(() =>
    expect(canonical()).toHaveAttribute("href", `https://${domain}/typing`),
  );
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(
    1,
  );

  await user.click(await result.findByRole("link", { name: "Open Anki" }));
  await waitFor(() =>
    expect(canonical()).toHaveAttribute("href", `https://${domain}/anki`),
  );
});
