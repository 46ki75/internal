import { render, waitFor } from "@solidjs/testing-library";
import { QueryClientProvider } from "@tanstack/solid-query";
import { describe, expect, it } from "vitest";

import { createQueryClient, QUERY_CACHE_STORAGE_KEYS } from "~/query-client";
import {
  createAuthClientDouble,
  createDeferred,
} from "~/test/auth-client-double";
import { AuthProvider, type AuthContextValue, useAuth } from "./auth-context";
import { type AuthSession } from "./cognito-auth-client";

const authenticatedSession: AuthSession = {
  accessToken: "test-token",
  userId: "user-1",
};

const renderAuth = (
  client: ReturnType<typeof createAuthClientDouble>,
  queryClient = createQueryClient(),
) => {
  let auth!: AuthContextValue;

  const Observer = () => {
    auth = useAuth();
    return (
      <dl>
        <dt>state</dt>
        <dd>{auth.sessionState()}</dd>
        <dt>token</dt>
        <dd>{auth.accessToken() ?? "none"}</dd>
        <dt>user</dt>
        <dd>{auth.userId() ?? "none"}</dd>
        <dt>error</dt>
        <dd>{auth.errors()[0] ?? "none"}</dd>
      </dl>
    );
  };

  const result = render(() => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider client={client}>
        <Observer />
      </AuthProvider>
    </QueryClientProvider>
  ));

  return { ...result, auth: () => auth, queryClient };
};

describe("AuthProvider", () => {
  it("establishes one coherent authenticated session on mount", async () => {
    const client = createAuthClientDouble({
      fetchSession: () => Promise.resolve(authenticatedSession),
    });
    const result = renderAuth(client);

    await waitFor(() => expect(result.getByText("login")).toBeInTheDocument());

    expect(result.getByText("test-token")).toBeInTheDocument();
    expect(result.getByText("user-1")).toBeInTheDocument();
    expect(client.fetchSession).toHaveBeenCalledExactlyOnceWith({
      forceRefresh: false,
    });
  });

  it("clears protected caches when Cognito confirms there is no session", async () => {
    const client = createAuthClientDouble();
    const queryClient = createQueryClient();
    queryClient.setQueryData(["protected"], { secret: true });
    QUERY_CACHE_STORAGE_KEYS.forEach((key) =>
      localStorage.setItem(key, "data"),
    );
    const result = renderAuth(client, queryClient);

    await waitFor(() => expect(result.getByText("logout")).toBeInTheDocument());

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    QUERY_CACHE_STORAGE_KEYS.forEach((key) =>
      expect(localStorage.getItem(key)).toBeNull(),
    );
  });

  it("clears unscoped protected caches when the initial session check fails", async () => {
    const client = createAuthClientDouble({
      fetchSession: () => Promise.reject(new Error("Network unavailable")),
    });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["protected"], { secret: true });
    QUERY_CACHE_STORAGE_KEYS.forEach((key) =>
      localStorage.setItem(key, "data"),
    );
    const result = renderAuth(client, queryClient);

    await waitFor(() =>
      expect(result.getByText("Network unavailable")).toBeInTheDocument(),
    );

    expect(result.getByText("logout")).toBeInTheDocument();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    QUERY_CACHE_STORAGE_KEYS.forEach((key) =>
      expect(localStorage.getItem(key)).toBeNull(),
    );
  });

  it("deduplicates concurrent session refreshes", async () => {
    const client = createAuthClientDouble({
      fetchSession: () => Promise.resolve(authenticatedSession),
    });
    const result = renderAuth(client);
    await waitFor(() => expect(result.getByText("login")).toBeInTheDocument());
    const deferred = createDeferred<AuthSession>();
    client.fetchSession.mockImplementation(() => deferred.promise);

    const first = result.auth().refresh();
    const second = result.auth().refresh();

    expect(client.fetchSession).toHaveBeenCalledTimes(2);
    deferred.resolve(authenticatedSession);
    await Promise.all([first, second]);
  });

  it("does not let an older refresh restore a signed-out session", async () => {
    const client = createAuthClientDouble({
      fetchSession: () => Promise.resolve(authenticatedSession),
    });
    const result = renderAuth(client);
    await waitFor(() => expect(result.getByText("login")).toBeInTheDocument());
    const deferred = createDeferred<AuthSession>();
    client.fetchSession.mockImplementation(() => deferred.promise);

    const refresh = result.auth().refresh();
    await result.auth().signOut();
    deferred.resolve({ accessToken: "stale-token", userId: "user-1" });
    await refresh;

    expect(result.getByText("logout")).toBeInTheDocument();
    expect(result.getAllByText("none")).toHaveLength(3);
  });

  it("does not start a new refresh while sign-out is in progress", async () => {
    const signOut = createDeferred<void>();
    const client = createAuthClientDouble({
      fetchSession: () => Promise.resolve(authenticatedSession),
      signOut: () => signOut.promise,
    });
    const result = renderAuth(client);
    await waitFor(() => expect(result.getByText("login")).toBeInTheDocument());

    const signingOut = result.auth().signOut();
    await result.auth().refresh();

    expect(client.fetchSession).toHaveBeenCalledOnce();
    signOut.resolve();
    await signingOut;
    expect(result.getByText("logout")).toBeInTheDocument();
  });

  it("preserves an established session after a transient refresh failure", async () => {
    const client = createAuthClientDouble({
      fetchSession: () => Promise.resolve(authenticatedSession),
    });
    const result = renderAuth(client);
    await waitFor(() => expect(result.getByText("login")).toBeInTheDocument());
    result.queryClient.setQueryData(["protected"], { secret: true });
    client.fetchSession.mockRejectedValueOnce(new Error("Network unavailable"));

    await result.auth().refresh();

    expect(result.getByText("login")).toBeInTheDocument();
    expect(result.getByText("test-token")).toBeInTheDocument();
    expect(result.getByText("Network unavailable")).toBeInTheDocument();
    expect(result.queryClient.getQueryData(["protected"])).toEqual({
      secret: true,
    });
  });

  it("reports unsupported Cognito challenges explicitly", async () => {
    const client = createAuthClientDouble({
      signIn: () =>
        Promise.resolve({ status: "challenge", step: "CONFIRM_SIGN_IN" }),
    });
    const result = renderAuth(client);
    await waitFor(() => expect(result.getByText("logout")).toBeInTheDocument());

    await result.auth().signIn("user", "password");

    expect(
      result.getByText("Unsupported sign-in challenge: CONFIRM_SIGN_IN"),
    ).toBeInTheDocument();
    expect(result.getByText("logout")).toBeInTheDocument();
  });

  it("ignores a mount refresh that resolves after disposal", async () => {
    const deferred = createDeferred<AuthSession>();
    const client = createAuthClientDouble({
      fetchSession: () => deferred.promise,
    });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["protected"], { secret: true });
    QUERY_CACHE_STORAGE_KEYS.forEach((key) =>
      localStorage.setItem(key, "data"),
    );
    const result = renderAuth(client, queryClient);

    result.unmount();
    deferred.resolve({ accessToken: null, userId: null });
    await deferred.promise;
    await Promise.resolve();

    expect(queryClient.getQueryData(["protected"])).toEqual({ secret: true });
    QUERY_CACHE_STORAGE_KEYS.forEach((key) =>
      expect(localStorage.getItem(key)).toBe("data"),
    );
  });
});
