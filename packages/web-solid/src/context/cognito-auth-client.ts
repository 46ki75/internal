import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
} from "aws-amplify/auth";

export interface AuthSession {
  accessToken: string | null;
  userId: string | null;
}

export type AuthSignInResult =
  | { status: "signed-in" }
  | { status: "challenge"; step: string };

export interface AuthClient {
  fetchSession: (options?: { forceRefresh?: boolean }) => Promise<AuthSession>;
  signIn: (username: string, password: string) => Promise<AuthSignInResult>;
  signOut: () => Promise<void>;
}

type Stage = NonNullable<ImportMetaEnv["VITE_STAGE_NAME"]>;

export const COGNITO_AUTH_CONFIG = {
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
} as const satisfies Record<
  Stage,
  { userPoolId: string; userPoolClientId: string }
>;

const isUnauthenticatedError = (error: unknown) =>
  error instanceof Error &&
  ["NotAuthorizedException", "UserUnAuthenticatedException"].includes(
    error.name,
  );

export const createCognitoAuthClient = (
  stage: Stage = import.meta.env.VITE_STAGE_NAME ?? "dev",
): AuthClient => {
  let configured = false;

  const configure = () => {
    if (configured) {
      return;
    }
    Amplify.configure({ Auth: { Cognito: COGNITO_AUTH_CONFIG[stage] } });
    configured = true;
  };

  return {
    async fetchSession(options) {
      configure();
      try {
        const session = await fetchAuthSession({
          forceRefresh: options?.forceRefresh ?? false,
        });
        return {
          accessToken: session.tokens?.accessToken.toString() ?? null,
          userId: session.userSub ?? null,
        };
      } catch (error) {
        if (isUnauthenticatedError(error)) {
          return { accessToken: null, userId: null };
        }
        throw error;
      }
    },
    async signIn(username, password) {
      configure();
      const result = await cognitoSignIn({ username, password });
      return result.isSignedIn
        ? { status: "signed-in" }
        : { status: "challenge", step: result.nextStep.signInStep };
    },
    async signOut() {
      configure();
      await cognitoSignOut();
    },
  };
};

export const cognitoAuthClient = createCognitoAuthClient();
