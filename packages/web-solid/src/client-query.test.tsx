import { render, screen, waitFor } from "@solidjs/testing-library";
import {
  IsRestoringProvider,
  QueryClientProvider,
} from "@tanstack/solid-query";
import { createSignal, type ParentProps } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import { createClientQuery } from "./client-query";
import { createQueryClient } from "./query-client";

const TestProvider = (props: ParentProps) => {
  const queryClient = createQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={() => false}>
        {props.children}
      </IsRestoringProvider>
    </QueryClientProvider>
  );
};

describe("createClientQuery", () => {
  it("fetches after a query becomes enabled", async () => {
    const queryFn = vi.fn().mockResolvedValue("loaded");

    const Harness = () => {
      const [enabled, setEnabled] = createSignal(false);
      const query = createClientQuery({
        queryKey: ["test", "enabled"] as const,
        enabled,
        queryFn,
      });

      queueMicrotask(() => setEnabled(true));
      return <div>{query.data() ?? "waiting"}</div>;
    };

    render(() => (
      <TestProvider>
        <Harness />
      </TestProvider>
    ));

    await screen.findByText("loaded");
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it("waits for cache restoration before fetching", async () => {
    const queryFn = vi.fn().mockResolvedValue("loaded");
    const [restoring, setRestoring] = createSignal(true);

    const Harness = () => {
      const query = createClientQuery({
        queryKey: ["test", "restore"] as const,
        enabled: () => true,
        queryFn,
      });
      return <div>{query.data() ?? "waiting"}</div>;
    };

    const queryClient = createQueryClient();
    render(() => (
      <QueryClientProvider client={queryClient}>
        <IsRestoringProvider value={restoring}>
          <Harness />
        </IsRestoringProvider>
      </QueryClientProvider>
    ));

    expect(screen.getByText("waiting")).toBeInTheDocument();
    expect(queryFn).not.toHaveBeenCalled();

    setRestoring(false);
    await waitFor(() => expect(queryFn).toHaveBeenCalledOnce());
    await screen.findByText("loaded");
  });
});
