import { createContextId } from "@builder.io/qwik";

export interface AuthStore {
  sessionState: "pending" | "login" | "logout";
  accessToken: string | null;
  signingInProgress: boolean;
}

export const AuthContext = createContextId<AuthStore>("auth");
