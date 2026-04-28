import {
  $,
  createContextId,
  QRL,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import { signOut } from "aws-amplify/auth";

// AWS Amplify
import { Amplify } from "aws-amplify";
import { getCurrentUser, signIn } from "aws-amplify/auth/cognito";
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

export interface AuthStore {
  sessionState: "pending" | "login" | "logout";
  errors: string[];
  signingInProgress: boolean;

  isSignInModalOpen: boolean;
  showSignInModal: QRL<(store: AuthStore) => void>;

  signOut: QRL<(store: AuthStore) => Promise<void>>;
  signIn: QRL<
    (store: AuthStore, username: string, password: string) => Promise<void>
  >;

  tokens: {
    refresh: QRL<(store: AuthStore) => Promise<void>>;
    accessToken: string | null;
  };
}

export const AuthContext = createContextId<AuthStore>("auth");

export const useAuthContextProvider = () => {
  const authStore = useStore<AuthStore>({
    sessionState: "pending",
    errors: [],
    signingInProgress: false,

    isSignInModalOpen: false,
    showSignInModal: $(async (store: AuthStore) => {
      store.isSignInModalOpen = false;
      store.isSignInModalOpen = true;
    }),

    signOut: $(async (store: AuthStore) => {
      store.sessionState = "pending";
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
          store.tokens.refresh(store);
        }
      } catch {
        store.sessionState = "logout";
      } finally {
        store.signingInProgress = false;
      }
    }),

    tokens: {
      accessToken: null,
      refresh: $(async (store: AuthStore) => {
        store.errors = [];
        configure();

        try {
          const session = await fetchAuthSession({ forceRefresh: false });
          const accessToken = session.tokens?.accessToken.toString();
          store.tokens.accessToken = accessToken ?? null;
          store.sessionState = "login";
        } catch (e: unknown) {
          store.tokens.accessToken = null;
          store.sessionState = "logout";
          store.errors.push(e instanceof Error ? e.message : String(e));
        }
      }),
    },
  });

  useContextProvider(AuthContext, authStore);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    const sessionState = track(() => authStore.sessionState);

    if (sessionState === "logout") {
      authStore.tokens.accessToken = null;
      authStore.isSignInModalOpen = false;
      authStore.isSignInModalOpen = true;
    } else if (sessionState === "login") {
      authStore.isSignInModalOpen = true;
      authStore.isSignInModalOpen = false;
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    configure();

    try {
      await authStore.tokens.refresh(authStore);
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
};
