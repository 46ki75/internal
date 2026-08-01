import { vi } from "vitest";

import {
  type AuthClient,
  type AuthSession,
} from "~/context/cognito-auth-client";

const anonymousSession: AuthSession = { accessToken: null, userId: null };

export const createAuthClientDouble = (overrides: Partial<AuthClient> = {}) =>
  ({
    fetchSession: vi.fn(
      overrides.fetchSession ?? (() => Promise.resolve(anonymousSession)),
    ),
    signIn: vi.fn(
      overrides.signIn ??
        (() => Promise.resolve({ status: "signed-in" as const })),
    ),
    signOut: vi.fn(overrides.signOut ?? (() => Promise.resolve())),
  }) satisfies AuthClient;

export const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};
