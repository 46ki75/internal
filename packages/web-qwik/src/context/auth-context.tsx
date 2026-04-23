import {
  $,
  component$,
  createContextId,
  QRL,
  Slot,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";
import { signOut } from "aws-amplify/auth";

export interface AuthStore {
  sessionState: "pending" | "login" | "logout";
  accessToken: string | null;
  signingInProgress: boolean;

  signOut: QRL<(store: AuthStore) => Promise<void>>;
}

export const AuthContext = createContextId<AuthStore>("auth");

export const AuthContextProvider = component$(() => {
  const authStore = useStore<AuthStore>({
    sessionState: "pending",
    accessToken: null,
    signingInProgress: false,

    signOut: $(async (store: AuthStore) => {
      await signOut();
      store.sessionState = "logout";
    }),
  });

  useContextProvider(AuthContext, authStore);

  return (
    <>
      <Slot />
    </>
  );
});
