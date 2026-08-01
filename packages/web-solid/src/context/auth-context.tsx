import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  untrack,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import { useQueryClient } from "@tanstack/solid-query";

import { QUERY_CACHE_STORAGE_KEYS } from "~/query-client";
import { cognitoAuthClient, type AuthClient } from "./cognito-auth-client";

export type SessionState = "pending" | "login" | "logout";

export interface AuthContextValue {
  sessionState: Accessor<SessionState>;
  errors: Accessor<string[]>;
  signingInProgress: Accessor<boolean>;
  accessToken: Accessor<string | null>;
  userId: Accessor<string | null>;
  refresh: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>();

export type AuthProviderProps = ParentProps<{ client?: AuthClient }>;

export const AuthProvider = (props: AuthProviderProps) => {
  const client = untrack(() => props.client) ?? cognitoAuthClient;
  const queryClient = useQueryClient();
  const [sessionState, setSessionState] = createSignal<SessionState>("pending");
  const [errors, setErrors] = createSignal<string[]>([]);
  const [signingInProgress, setSigningInProgress] = createSignal(false);
  const [accessToken, setAccessToken] = createSignal<string | null>(null);
  const [userId, setUserId] = createSignal<string | null>(null);
  let generation = 0;
  let refreshInFlight:
    | { generation: number; promise: Promise<void> }
    | undefined;
  let signingOut = false;

  const clearQueryCache = () => {
    queryClient.clear();
    QUERY_CACHE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  };

  const applyLoggedOut = () => {
    clearQueryCache();
    setAccessToken(null);
    setUserId(null);
    setSessionState("logout");
  };

  const fetchSession = async (operationGeneration: number) => {
    setErrors([]);
    try {
      const session = await client.fetchSession({ forceRefresh: false });
      if (operationGeneration !== generation) {
        return;
      }
      setAccessToken(session.accessToken);
      setUserId(session.userId);
      setSessionState(session.accessToken ? "login" : "logout");
      if (!session.accessToken) {
        clearQueryCache();
      }
    } catch (error) {
      if (operationGeneration !== generation) {
        return;
      }
      if (!accessToken()) {
        clearQueryCache();
        setUserId(null);
        setSessionState("logout");
      }
      setErrors([error instanceof Error ? error.message : String(error)]);
    }
  };

  const refresh = async () => {
    if (signingOut) {
      return;
    }
    const operationGeneration = generation;
    if (refreshInFlight?.generation === operationGeneration) {
      await refreshInFlight.promise;
      return;
    }

    const promise = fetchSession(operationGeneration);
    const operation = { generation: operationGeneration, promise };
    refreshInFlight = operation;

    try {
      await promise;
    } finally {
      if (refreshInFlight === operation) {
        refreshInFlight = undefined;
      }
    }
  };

  const signIn = async (username: string, password: string) => {
    const operationGeneration = ++generation;
    refreshInFlight = undefined;
    if (!accessToken()) {
      clearQueryCache();
    }
    setSigningInProgress(true);
    setErrors([]);
    try {
      const result = await client.signIn(username, password);
      if (operationGeneration !== generation) {
        return;
      }
      if (result.status === "signed-in") {
        await fetchSession(operationGeneration);
      } else {
        applyLoggedOut();
        setErrors([`Unsupported sign-in challenge: ${result.step}`]);
      }
    } catch (error) {
      if (operationGeneration !== generation) {
        return;
      }
      applyLoggedOut();
      setErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      if (operationGeneration === generation) {
        setSigningInProgress(false);
      }
    }
  };

  const signOut = async () => {
    const operationGeneration = ++generation;
    refreshInFlight = undefined;
    signingOut = true;
    setSigningInProgress(false);
    clearQueryCache();
    setAccessToken(null);
    setUserId(null);
    setSessionState("pending");
    try {
      await client.signOut();
    } catch (error) {
      if (operationGeneration === generation) {
        setErrors([error instanceof Error ? error.message : String(error)]);
      }
    } finally {
      if (operationGeneration === generation) {
        applyLoggedOut();
      }
      signingOut = false;
    }
  };

  onMount(() => {
    void refresh();
  });

  onCleanup(() => {
    generation += 1;
    refreshInFlight = undefined;
  });

  return (
    <AuthContext.Provider
      value={{
        sessionState,
        errors,
        signingInProgress,
        accessToken,
        userId,
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
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
