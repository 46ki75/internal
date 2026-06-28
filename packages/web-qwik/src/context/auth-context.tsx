import {
  $,
  createContextId,
  noSerialize,
  NoSerialize,
  useContext,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@qwik.dev/core";
import { signOut as cognitoSignOut } from "aws-amplify/auth";

// AWS Amplify
import { Amplify } from "aws-amplify";
import {
  getCurrentUser,
  signIn as cognitoSignIn,
} from "aws-amplify/auth/cognito";
import { fetchAuthSession } from "aws-amplify/auth";

const AuthConfigMap: Record<
  string,
  { userPoolId: string; userPoolClientId: string }
> = {
  dev: {
    userPoolId: "ap-northeast-1_BmZKeZeKX",
    userPoolClientId: "4n5l6d5oekst6hrmvt1chndghd",
  },
  stg: {
    userPoolId: "ap-northeast-1_pRexgIEB0",
    userPoolClientId: "14i0sqq5f8qq45o64srm2ntmq1",
  },
  prod: {
    userPoolId: "ap-northeast-1_Ym1wYWXw7",
    userPoolClientId: "t9ccj3ic4tapjdsrqjo8ledk",
  },
};

const configure = () => {
  Amplify.configure({
    Auth: {
      Cognito: AuthConfigMap[import.meta.env.VITE_STAGE_NAME ?? "dev"],
    },
  });
};

/**
 * Serializable auth state. Behavior lives in `useAuthActions()`; this store
 * holds data only so it stays cheap to serialize at the document root.
 */
export interface AuthState {
  sessionState: "pending" | "login" | "logout";
  errors: string[];
  signingInProgress: boolean;

  tokens: {
    accessToken: string | null;
    // In-flight refresh shared across callers (single-flight). `noSerialize`
    // because a Promise never crosses the resume boundary.
    refreshInFlight?: NoSerialize<Promise<void>>;
  };
}

export const AuthContext = createContextId<AuthState>("auth");

export const useAuthContextProvider = () => {
  useContextProvider(
    AuthContext,
    useStore<AuthState>({
      sessionState: "pending",
      errors: [],
      signingInProgress: false,
      tokens: {
        accessToken: null,
      },
    }),
  );
};

/**
 * Auth actions. Each reads the provided store from context, so callers never
 * pass the store in. Safe to call from any `component$` under the provider
 * (mounted in `root.tsx`).
 */
export const useAuthActions = () => {
  const store = useContext(AuthContext);

  const refresh = $(async () => {
    // Single-flight: if a refresh is already running, await it instead of
    // firing a second `fetchAuthSession`. Replaces the former busy-wait on a
    // `tokens.loading` flag.
    if (store.tokens.refreshInFlight) {
      await store.tokens.refreshInFlight;
      return;
    }

    const run = async () => {
      store.errors = [];
      configure();

      try {
        const session = await fetchAuthSession({ forceRefresh: false });
        const accessToken = session.tokens?.accessToken.toString();
        store.tokens.accessToken = accessToken ?? null;
        store.sessionState = store.tokens.accessToken ? "login" : "logout";
      } catch (e: unknown) {
        store.tokens.accessToken = null;
        store.sessionState = "logout";
        store.errors.push(e instanceof Error ? e.message : String(e));
      }
    };

    const inflight = run();
    store.tokens.refreshInFlight = noSerialize(inflight);
    try {
      await inflight;
    } finally {
      store.tokens.refreshInFlight = undefined;
    }
  });

  const signIn = $(async (username: string, password: string) => {
    store.signingInProgress = true;

    try {
      configure();

      const result = await cognitoSignIn({ username, password });

      if (result.isSignedIn) {
        await refresh();
      }
    } catch {
      store.sessionState = "logout";
    } finally {
      store.signingInProgress = false;
    }
  });

  const signOut = $(async () => {
    store.sessionState = "pending";
    await cognitoSignOut();
    store.sessionState = "logout";
  });

  return { refresh, signIn, signOut };
};

/**
 * Client-side bootstrap for the auth store. Must be called from a normal
 * `component$` (NOT `root.tsx`) so the `useVisibleTask$` actually fires —
 * Qwik v2's root component has no ordinary DOM host and its client-side
 * hooks never run. Pair with `useAuthContextProvider()` in `root.tsx`.
 */
export const useAuthEffect = () => {
  const store = useContext(AuthContext);
  const { refresh } = useAuthActions();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    async () => {
      configure();

      try {
        await refresh();
        const { username, userId } = await getCurrentUser();
        store.sessionState = username && userId ? "login" : "logout";
      } catch {
        console.error(
          "Failed to fetch auth session. User might not be authenticated.",
        );
        store.sessionState = "logout";
      }
    },
    { strategy: "document-ready" },
  );
};
