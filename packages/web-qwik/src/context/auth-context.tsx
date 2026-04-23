import {
  $,
  component$,
  createContextId,
  QRL,
  Slot,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import { signOut } from "aws-amplify/auth";

// AWS Amplify
import { Amplify } from "aws-amplify";
import { getCurrentUser, signIn } from "aws-amplify/auth/cognito";
import { fetchAuthSession } from "aws-amplify/auth";

const configure = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: "ap-northeast-1_BmZKeZeKX",
        userPoolClientId: "4n5l6d5oekst6hrmvt1chndghd",
      },
    },
  });
};

export interface AuthStore {
  sessionState: "pending" | "login" | "logout";
  accessToken: string | null;
  signingInProgress: boolean;

  isSignInModalOpen: boolean;
  showSignInModal: QRL<(store: AuthStore) => void>;

  signOut: QRL<(store: AuthStore) => Promise<void>>;
  signIn: QRL<
    (store: AuthStore, username: string, password: string) => Promise<void>
  >;
}

export const AuthContext = createContextId<AuthStore>("auth");

export const AuthContextProvider = component$(() => {
  const authStore = useStore<AuthStore>({
    sessionState: "pending",
    accessToken: null,
    signingInProgress: false,

    isSignInModalOpen: false,
    showSignInModal: $(async (store: AuthStore) => {
      store.isSignInModalOpen = true;
    }),

    signOut: $(async (store: AuthStore) => {
      await signOut();
      store.sessionState = "logout";
    }),

    signIn: $(async (store: AuthStore, username: string, password: string) => {
      store.signingInProgress = true;

      try {
        configure();

        const result = await signIn({
          username: username,
          password: password,
        });

        if (result.isSignedIn) {
          store.sessionState = "login";

          const session = await fetchAuthSession({ forceRefresh: true });
          const accessToken = session.tokens?.accessToken.toString();
          store.accessToken = accessToken ?? null;
        }
      } catch {
        store.sessionState = "logout";
      } finally {
        store.signingInProgress = false;
      }
    }),
  });

  useContextProvider(AuthContext, authStore);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const sessionState = track(() => authStore.sessionState);

    if (sessionState === "logout") {
      authStore.accessToken = null;
      authStore.isSignInModalOpen = true;
    } else if (sessionState === "login") {
      authStore.isSignInModalOpen = false;
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    configure();

    try {
      const { username, userId } = await getCurrentUser();
      if (username && userId) {
        authStore.sessionState = "login";
      } else {
        authStore.sessionState = "logout";
      }
    } catch {
      authStore.sessionState = "logout";
    }
  });

  return (
    <>
      <Slot />
    </>
  );
});
