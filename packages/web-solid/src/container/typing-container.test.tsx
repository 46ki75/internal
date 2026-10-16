import { render, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Show } from "solid-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TypingProps } from "~/components/typing/typing";

const api = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
const auth = vi.hoisted(() => ({ accessToken: vi.fn(), refresh: vi.fn() }));
const exercises = [
  { id: "first", text: "cat", url: "https://app.notion.com/p/first-sentence" },
  {
    id: "second",
    text: "dog",
    url: "https://app.notion.com/p/second-sentence",
  },
];
vi.mock("~/openapi/client", () => ({ openApiClient: api }));
vi.mock("~/context/auth-context", () => ({ useAuth: () => auth }));
vi.mock("@elmethis/solid", () => ({
  ElmDotLoadingIcon: () => <span role="progressbar">Loading</span>,
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
  api.GET.mockResolvedValue({ data: exercises });
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

it("links to the current sentence's Notion page and updates the link when advancing", async () => {
  const user = userEvent.setup();
  const result = renderContainer();
  await waitFor(() =>
    expect(result.getByLabelText("Current exercise")).toHaveTextContent("cat"),
  );
  expect(result.queryByRole("table")).not.toBeInTheDocument();
  expect(result.queryByText("Saved exercises")).not.toBeInTheDocument();
  const link = () =>
    result.getByRole("link", { name: "Open sentence in Notion" });
  expect(link()).toHaveAttribute("href", exercises[0].url);
  expect(link()).toHaveAttribute("target", "_blank");
  expect(link()).toHaveAttribute("rel", "noopener noreferrer");

  await user.click(result.getByRole("button", { name: "Complete exercise" }));
  expect(result.getByLabelText("Current exercise")).toHaveTextContent("dog");
  expect(link()).toHaveAttribute("href", exercises[1].url);
  await user.click(result.getByRole("button", { name: "Next exercise" }));
  expect(result.getByLabelText("Current exercise")).toHaveTextContent("cat");
  expect(link()).toHaveAttribute("href", exercises[0].url);
  expect(api.GET).toHaveBeenCalledExactlyOnceWith(
    "/api/v1/typing",
    expect.objectContaining({
      params: { header: { Authorization: "Bearer access-token" } },
    }),
  );
  expect(auth.refresh).toHaveBeenCalledOnce();
  expect(api.POST).not.toHaveBeenCalled();
});

it("passes straight apostrophes to typing practice without changing API data", async () => {
  const sentence = { ...exercises[0], text: "It’s the dog’s toy." };
  api.GET.mockResolvedValue({ data: [sentence] });
  const result = renderContainer();

  await waitFor(() =>
    expect(result.getByLabelText("Current exercise")).toHaveTextContent(
      "It's the dog's toy.",
    ),
  );
  expect(sentence.text).toBe("It’s the dog’s toy.");
  expect(
    result.getByRole("link", { name: "Open sentence in Notion" }),
  ).toHaveAttribute("href", sentence.url);
});

it.each([undefined, ""])(
  "keeps the link clickable when an older response has url=%s",
  async (url) => {
    api.GET.mockResolvedValue({
      data: [{ id: "680008c4-d898-4202-8102-137cd9256595", text: "cat", url }],
    });
    const result = renderContainer();
    const link = await result.findByRole("link", {
      name: "Open sentence in Notion",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://www.notion.so/680008c4d89842028102137cd9256595",
    );
    expect(link).toHaveAttribute("target", "_blank");
  },
);

it("does not fetch exercises or show a page link when signed out", () => {
  auth.accessToken.mockReturnValue(undefined);
  const result = renderContainer();
  expect(
    result.getByText("Sign in to load typing exercises."),
  ).toBeInTheDocument();
  expect(result.queryByRole("link")).not.toBeInTheDocument();
  expect(api.GET).not.toHaveBeenCalled();
});

it("does not show a page link when there is no current sentence", async () => {
  api.GET.mockResolvedValue({ data: [] });
  const result = renderContainer();
  expect(
    await result.findByText("No typing exercises are available."),
  ).toBeInTheDocument();
  expect(result.queryByRole("button")).not.toBeInTheDocument();
  expect(result.queryByRole("link")).not.toBeInTheDocument();
});

it("renders fetch failures without a page link", async () => {
  api.GET.mockRejectedValue(new Error("Notion is unavailable"));
  const result = renderContainer();
  expect(await result.findByRole("alert")).toHaveTextContent(
    "Notion is unavailable",
  );
  expect(result.queryByRole("link")).not.toBeInTheDocument();
});
