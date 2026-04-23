import { createContextId } from "@builder.io/qwik";

export interface AuthStore {
  state: "pending" | "login" | "logout";
}

export const AuthContext = createContextId<AuthStore>("auth");
