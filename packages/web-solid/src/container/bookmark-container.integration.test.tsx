import { render, screen, waitFor } from "@solidjs/testing-library";
import { QueryClientProvider } from "@tanstack/solid-query";
import { http, HttpResponse } from "msw";
import { type JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmButton: (props: {
    children: JSX.Element;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button
      type="button"
      disabled={props.disabled}
      onClick={() => props.onClick?.()}
    >
      {props.children}
    </button>
  ),
  ElmHeading: (props: { children: JSX.Element }) => <h2>{props.children}</h2>,
  ElmInlineText: (props: { children: JSX.Element }) => (
    <span>{props.children}</span>
  ),
  ElmMdiIcon: () => <span aria-hidden="true" />,
  ElmTextField: (props: {
    label: string;
    value: string;
    onInput?: JSX.EventHandler<HTMLInputElement, InputEvent>;
    onKeyDown?: JSX.EventHandler<HTMLInputElement, KeyboardEvent>;
  }) => (
    <input
      aria-label={props.label}
      value={props.value}
      onInput={(event) => props.onInput?.(event)}
      onKeyDown={(event) => props.onKeyDown?.(event)}
    />
  ),
}));

vi.mock("@formkit/auto-animate", () => ({
  default: () => ({ destroy: vi.fn() }),
}));

import { AuthProvider } from "~/context/auth-context";
import { createQueryClient } from "~/query-client";
import { createAuthClientDouble } from "~/test/auth-client-double";
import { server } from "~/test/server";
import { BookmarkContainer } from "./bookmark-container";

const renderContainer = () => {
  const client = createAuthClientDouble({
    fetchSession: () =>
      Promise.resolve({
        accessToken: "test-token",
        userId: "user-1",
      }),
  });
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });

  return render(() => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider client={client}>
        <BookmarkContainer />
      </AuthProvider>
    </QueryClientProvider>
  ));
};

describe("BookmarkContainer HTTP integration", () => {
  it("loads bookmarks through the authenticated OpenAPI client", async () => {
    server.use(
      http.get("*/api/v1/bookmark", ({ request }) => {
        if (request.headers.get("authorization") !== "Bearer test-token") {
          return HttpResponse.text("Invalid token.", { status: 401 });
        }
        return HttpResponse.json([
          {
            favorite: false,
            id: "bookmark-1",
            name: "Hermetic testing",
            notion_url: "https://notion.example/bookmark-1",
            nsfw: false,
            tag: null,
            url: "https://example.com/testing",
          },
        ]);
      }),
    );

    renderContainer();

    await waitFor(() =>
      expect(screen.getAllByText("Hermetic testing").length).toBeGreaterThan(0),
    );
    expect(
      screen.getAllByRole("link", { name: "Open Hermetic testing" }).length,
    ).toBeGreaterThan(0);
  });

  it("renders an API failure returned by the mock server", async () => {
    server.use(
      http.get("*/api/v1/bookmark", () =>
        HttpResponse.json(
          { error: "Bookmark service unavailable" },
          { status: 503 },
        ),
      ),
    );

    renderContainer();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Failed to fetch bookmarks (503)");
    expect(alert).toHaveTextContent("Bookmark service unavailable");
  });
});
