import {
  createContext,
  createSignal,
  onMount,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  getCurrentUser,
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
} from "aws-amplify/auth";
import { useQueryClient } from "@tanstack/solid-query";

import { QUERY_CACHE_STORAGE_KEYS } from "~/query-client";

export type SessionState = "pending" | "login" | "logout";

interface AuthContextValue {
  sessionState: Accessor<SessionState>;
  errors: Accessor<string[]>;
  signingInProgress: Accessor<boolean>;
  accessToken: Accessor<string | null>;
  refresh: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const authConfig = {
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
} as const;

const configure = () => {
  const stage = import.meta.env.VITE_STAGE_NAME ?? "dev";
  Amplify.configure({ Auth: { Cognito: authConfig[stage] } });
};

const AuthContext = createContext<AuthContextValue>();

export const AuthProvider = (props: ParentProps) => {
  const queryClient = useQueryClient();
  const [sessionState, setSessionState] = createSignal<SessionState>("pending");
  const [errors, setErrors] = createSignal<string[]>([]);
  const [signingInProgress, setSigningInProgress] = createSignal(false);
  const [accessToken, setAccessToken] = createSignal<string | null>(null);
  let refreshInFlight: Promise<void> | undefined;

  const clearQueryCache = () => {
    queryClient.clear();
    QUERY_CACHE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  };

  const refresh = async () => {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      setErrors([]);
      configure();
      try {
        const session = await fetchAuthSession({ forceRefresh: false });
        const token = session.tokens?.accessToken.toString() ?? null;
        setAccessToken(token);
        setSessionState(token ? "login" : "logout");
        if (!token) clearQueryCache();
      } catch (error) {
        clearQueryCache();
        setAccessToken(null);
        setSessionState("logout");
        setErrors([error instanceof Error ? error.message : String(error)]);
      }
    })();

    try {
      await refreshInFlight;
    } finally {
      refreshInFlight = undefined;
    }
  };

  const signIn = async (username: string, password: string) => {
    setSigningInProgress(true);
    setErrors([]);
    try {
      configure();
      const result = await cognitoSignIn({ username, password });
      if (result.isSignedIn) await refresh();
    } catch (error) {
      clearQueryCache();
      setAccessToken(null);
      setSessionState("logout");
      setErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      setSigningInProgress(false);
    }
  };

  const signOut = async () => {
    setSessionState("pending");
    try {
      await cognitoSignOut();
    } finally {
      clearQueryCache();
      setAccessToken(null);
      setSessionState("logout");
    }
  };

  onMount(async () => {
    configure();
    await refresh();
    try {
      const user = await getCurrentUser();
      setSessionState(user.username && user.userId ? "login" : "logout");
    } catch {
      setSessionState("logout");
    }
  });

  return (
    <AuthContext.Provider
      value={{
        sessionState,
        errors,
        signingInProgress,
        accessToken,
        refresh,
        signIn,
        signOut,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
