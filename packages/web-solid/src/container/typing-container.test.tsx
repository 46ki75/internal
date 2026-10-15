import { render, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Show, type ParentProps } from "solid-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TypingProps } from "~/components/typing/typing";

const api = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
const auth = vi.hoisted(() => ({ accessToken: vi.fn(), refresh: vi.fn() }));
vi.mock("~/openapi/client", () => ({ openApiClient: api }));
vi.mock("~/context/auth-context", () => ({ useAuth: () => auth }));
vi.mock("@elmethis/solid", () => ({
  ElmDotLoadingIcon: () => <span role="progressbar">Loading</span>,
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
}));
vi.mock("~/components/typing/typing", () => ({
  Typing: (props: TypingProps) => (
    <section aria-label="Typing practice">
      <output aria-label="Current exercise">{props.text}</output>
      <button
        onClick={() =>
          props.onComplete?.({
            accuracy: 100,
            correctCharacters: props.text.length,
            durationMs: 1000,
            totalCharacters: props.text.length,
            wordsPerMinute: 36,
          })
        }
      >
        Complete exercise
      </button>
      <Show when={props.onNext}>
        <button onClick={() => props.onNext?.()}>Next exercise</button>
      </Show>
    </section>
  ),
}));

import { TypingContainer } from "./typing-container";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.99);
  auth.accessToken.mockReturnValue("access-token");
  auth.refresh.mockResolvedValue(undefined);
  api.GET.mockResolvedValue({
    data: [
      { id: "first", text: "cat" },
      { id: "second", text: "dog" },
    ],
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

function renderContainer() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(() => (
    <QueryClientProvider client={client}>
      <TypingContainer />
    </QueryClientProvider>
  ));
}

it("fetches once and advances or reshuffles locally without mutation requests", async () => {
  const user = userEvent.setup();
  const result = renderContainer();
  await waitFor(() =>
    expect(result.getByLabelText("Current exercise")).toHaveTextContent("cat"),
  );
  expect(result.queryByRole("textbox")).not.toBeInTheDocument();
  expect(result.queryByText("Completions")).not.toBeInTheDocument();

  await user.click(result.getByRole("button", { name: "Complete exercise" }));
  expect(result.getByLabelText("Current exercise")).toHaveTextContent("dog");
  await user.click(result.getByRole("button", { name: "Next exercise" }));
  expect(result.getByLabelText("Current exercise")).toHaveTextContent("cat");
  expect(api.GET).toHaveBeenCalledExactlyOnceWith(
    "/api/v1/typing",
    expect.objectContaining({
      params: { header: { Authorization: "Bearer access-token" } },
    }),
  );
  expect(auth.refresh).toHaveBeenCalledOnce();
  expect(api.POST).not.toHaveBeenCalled();
});

it("does not fetch exercises when signed out", () => {
  auth.accessToken.mockReturnValue(undefined);
  const result = renderContainer();
  expect(
    result.getByText("Sign in to load typing exercises."),
  ).toBeInTheDocument();
  expect(api.GET).not.toHaveBeenCalled();
});

it("renders the empty Notion data source state", async () => {
  api.GET.mockResolvedValue({ data: [] });
  const result = renderContainer();
  expect(
    await result.findByText("No typing exercises are available."),
  ).toBeInTheDocument();
  expect(result.queryByRole("button")).not.toBeInTheDocument();
});

it("renders fetch failures", async () => {
  api.GET.mockRejectedValue(new Error("Notion is unavailable"));
  const result = renderContainer();
  expect(await result.findByRole("alert")).toHaveTextContent(
    "Notion is unavailable",
  );
});
