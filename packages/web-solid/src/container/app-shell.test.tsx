import { render, within } from "@solidjs/testing-library";
import { MemoryRouter, Route } from "@solidjs/router";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/core/tokens.css", () => ({}));
vi.mock("~/context/auth-context", () => ({
  useAuth: () => ({
    sessionState: () => "logout",
    signingInProgress: () => false,
    errors: () => [],
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { AppShell } from "./app-shell";

it("lists the remaining features without an icon library link", async () => {
  const result = render(() => (
    <MemoryRouter root={AppShell}>
      <Route path="/" component={() => <>Page content</>} />
    </MemoryRouter>
  ));
  const navigation = within(
    await result.findByRole("navigation", { name: "Main navigation" }),
  );

  expect(
    navigation.getAllByRole("link").map((link) => link.getAttribute("href")),
  ).toEqual([
    "/",
    "/anki",
    "/trivia",
    "/typing",
    "/swatch",
    "/writing-assessments",
    "/practical_test_en.html",
  ]);
  expect(
    navigation.queryByRole("link", { name: "Icons" }),
  ).not.toBeInTheDocument();
  expect(result.getByRole("main")).toHaveTextContent("Page content");
});
