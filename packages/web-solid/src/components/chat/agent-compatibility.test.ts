import {
  HttpAgent,
  RunAgentInputSchema,
  type HttpAgentFetchFn,
} from "@ag-ui/client";
import { useAgent } from "@elmethis/solid";
import { renderHook } from "@solidjs/testing-library";
import { expect, it, vi } from "vitest";

// The hook does not need the token CSS imported by Elmethis's public entry point.
vi.mock("@elmethis/core/tokens.css", () => ({}));

// Elmethis and the app must share AG-UI's class identity and streaming contract.
it("streams an HttpAgent response through the Elmethis agent hook", async () => {
  const fetch = vi.fn<HttpAgentFetchFn>((_url, requestInit) => {
    if (typeof requestInit.body !== "string") {
      throw new Error("Expected a JSON request body");
    }
    const input = RunAgentInputSchema.parse(JSON.parse(requestInit.body));
    expect(input.messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      }),
    ]);

    const events = [
      {
        type: "RUN_STARTED",
        threadId: input.threadId,
        runId: input.runId,
      },
      {
        type: "TEXT_MESSAGE_START",
        messageId: "reply",
        role: "assistant",
      },
      {
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "reply",
        delta: "Hello back",
      },
      { type: "TEXT_MESSAGE_END", messageId: "reply" },
      {
        type: "RUN_FINISHED",
        threadId: input.threadId,
        runId: input.runId,
      },
    ];
    return Promise.resolve(
      new Response(
        events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
        { headers: { "Content-Type": "text/event-stream" } },
      ),
    );
  });
  const { result } = renderHook(() =>
    useAgent({
      url: "/invocations",
      agentFactory: (options) => new HttpAgent({ ...options, fetch }),
    }),
  );

  await result.send([{ type: "text", text: "Hello" }]);

  expect(fetch).toHaveBeenCalledExactlyOnceWith(
    "/invocations",
    expect.objectContaining({ method: "POST" }),
  );
  expect(result.state.error).toBeNull();
  expect(result.state.status).toBe("success");
  expect(result.state.isRunning).toBe(false);
  expect(result.state.messages).toEqual([
    expect.objectContaining({ role: "user" }),
    expect.objectContaining({
      id: "reply",
      role: "assistant",
      content: "Hello back",
    }),
  ]);
});
