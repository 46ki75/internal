import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  abort: vi.fn(),
  accessToken: vi.fn((): string | null => "access-token"),
  authenticatedFetch: undefined as
    | ((url: RequestInfo | URL, init: RequestInit) => Promise<Response>)
    | undefined,
  dequeue: vi.fn(),
  refresh: vi.fn(async () => {}),
  retry: vi.fn(),
  send: vi.fn(),
  setPromptTemplates: vi.fn(),
}));

vi.mock("~/context/auth-context", () => ({
  useAuth: () => ({
    accessToken: mocks.accessToken,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@ag-ui/client", () => ({
  HttpAgent: class {
    constructor(options: {
      fetch: (url: RequestInfo | URL, init: RequestInit) => Promise<Response>;
    }) {
      mocks.authenticatedFetch = options.fetch;
    }
  },
}));

vi.mock("@elmethis/solid", () => ({
  ElmAgUiAgent: (props: {
    "aria-label": string;
    class?: string;
    enableAutoScroll?: boolean;
    style?: JSX.CSSProperties;
  }) => (
    <section
      aria-label={props["aria-label"]}
      class={props.class}
      style={props.style}
      data-auto-scroll={props.enableAutoScroll}
    />
  ),
  useAgent: (options: {
    agentFactory: (options: Record<string, unknown>) => unknown;
    url: string;
  }) => {
    options.agentFactory({ url: options.url });
    return {
      state: {},
      send: mocks.send,
      retry: mocks.retry,
      abort: mocks.abort,
      dequeue: mocks.dequeue,
      setPromptTemplates: mocks.setPromptTemplates,
    };
  },
}));

import { ChatContainer } from "./chat-container";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.accessToken.mockReturnValue("access-token");
  mocks.refresh.mockResolvedValue(undefined);
  mocks.authenticatedFetch = undefined;
});

it("configures the AWS chat surface", () => {
  const result = render(() => (
    <ChatContainer class="chat" style={{ width: "20rem" }} />
  ));
  const chat = result.getByRole("region", { name: "AWS chat" });

  expect(chat).toHaveClass("chat");
  expect(chat.style.width).toBe("20rem");
  expect(chat).toHaveAttribute("data-auto-scroll", "true");
  expect(mocks.setPromptTemplates).toHaveBeenCalledWith([
    {
      description: "Ask about AWS",
      content: "What is a new feature called Amazon S3 Files?",
    },
  ]);
});

it("refreshes authentication and adds the current token to requests", async () => {
  mocks.accessToken.mockReturnValue(null);
  mocks.refresh.mockImplementation(() => {
    mocks.accessToken.mockReturnValue("refreshed-token");
    return Promise.resolve();
  });
  const fetchMock = vi.mocked(globalThis.fetch);
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  render(() => <ChatContainer />);

  expect(mocks.authenticatedFetch).toBeDefined();
  await mocks.authenticatedFetch!("https://example.com/invocations", {
    method: "POST",
    headers: { "X-Request-ID": "request-1" },
    body: "request body",
  });

  expect(mocks.refresh).toHaveBeenCalledOnce();
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url, init] = fetchMock.mock.calls[0];
  const headers = new Headers(init?.headers);
  expect(url).toBe("https://example.com/invocations");
  expect(init?.method).toBe("POST");
  expect(init?.body).toBe("request body");
  expect(headers.get("X-Request-ID")).toBe("request-1");
  expect(headers.get("Authorization")).toBe("Bearer refreshed-token");
});

it("rejects the request when refresh produces no access token", async () => {
  mocks.accessToken.mockReturnValue(null);
  const fetchMock = vi.mocked(globalThis.fetch);
  render(() => <ChatContainer />);

  await expect(
    mocks.authenticatedFetch!("https://example.com/invocations", {}),
  ).rejects.toThrow("Access token is not available");
  expect(fetchMock).not.toHaveBeenCalled();
});
