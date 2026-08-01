import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX, ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@solidjs/router", () => ({
  A: (props: ParentProps<JSX.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={props.href} aria-label={props["aria-label"]}>
      {props.children}
    </a>
  ),
}));

vi.mock("@elmethis/solid", () => ({
  ElmMdiIcon: () => <span aria-hidden="true" />,
  ElmSquareLoadingIcon: () => <span aria-hidden="true" />,
  ElmToggleTheme: () => <button type="button">Toggle theme</button>,
}));

import { Header } from "./header";

const links = [
  { d: "home-icon", href: "/", label: "Home" },
  {
    d: "docs-icon",
    href: "https://example.com/docs",
    label: "Docs",
    native: true,
  },
];

it("renders internal and native navigation links", () => {
  const result = render(() => (
    <Header
      links={links}
      state="logout"
      onSignIn={vi.fn()}
      onSignOut={vi.fn()}
    />
  ));

  expect(
    result.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  expect(result.getByRole("link", { name: "Home" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(result.getByRole("link", { name: "Docs" })).toHaveAttribute(
    "href",
    "https://example.com/docs",
  );
});

it("dispatches the action for the current session", async () => {
  const user = userEvent.setup();
  const onSignIn = vi.fn();
  const onSignOut = vi.fn();
  const result = render(() => (
    <Header
      links={[]}
      state="login"
      onSignIn={onSignIn}
      onSignOut={onSignOut}
    />
  ));

  await user.click(result.getByRole("button", { name: "Sign out" }));

  expect(onSignOut).toHaveBeenCalledOnce();
  expect(onSignIn).not.toHaveBeenCalled();
});

it("disables authentication controls while the session is pending", () => {
  const result = render(() => (
    <Header links={[]} state="pending" onSignIn={vi.fn()} onSignOut={vi.fn()} />
  ));

  expect(result.getByRole("button", { name: "Sign in" })).toBeDisabled();
});
