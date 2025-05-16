import { Amplify } from "aws-amplify";
import {
  associateWebAuthnCredential,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from "aws-amplify/auth";
import { defineStore } from "pinia";

interface AuthState {
  session: {
    useId?: string;
    username?: string;

    accessToken?: string;
    accessTokenExpiresAt?: number;

    idToken?: string;
    idTokenExpiresAt?: number;
  };

  signInState: {
    loading: boolean;
    error: boolean;
  };

  signOut: {
    loadingState: boolean;
    error: boolean;
  };

  refreshState: {
    loading: boolean;
    error: boolean;
  };
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => {
    const config = useRuntimeConfig();

    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: config.public.USER_POOL_ID,
          userPoolClientId: config.public.USER_POOL_CLIENT_ID,
        },
      },
    });

    return {
      session: {
        useId: undefined,
        username: undefined,

        accessToken: undefined,
        accessTokenExpiresAt: undefined,

        idToken: undefined,
        idTokenExpiresAt: undefined,
      },

      signInState: {
        loading: false,
        error: false,
      },

      signOut: {
        loadingState: false,
        error: false,
      },

      refreshState: {
        loading: false,
        error: false,
      },
    };
  },
  actions: {
    async signIn({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) {
      this.signInState.loading = true;
      this.signInState.error = false;
      try {
        const _ = await signIn({
          username,
          password,
        });
      } catch (e: any) {
        this.signInState.error = true;
        throw new Error(e);
      } finally {
        this.signInState.loading = false;
      }
      await this.refresh();
    },

    async signOut() {
      this.signOut.loadingState = true;
      this.signOut.error = false;
      try {
        await signOut();
      } catch {
        this.signOut.error = true;
      } finally {
        this.signOut.loadingState = false;
      }
      await this.refresh();
    },

    async registerPasskey() {
      await associateWebAuthnCredential();
    },

    async signInWithPasskey({ username }: { username: string }) {
      this.signInState.loading = true;
      this.signInState.error = false;
      try {
        const _ = await signIn({
          username,
          options: {
            authFlowType: "USER_AUTH",
            preferredChallenge: "WEB_AUTHN",
          },
        });
      } catch (e: any) {
        this.signInState.error = true;
        throw new Error(e);
      } finally {
        this.signInState.loading = false;
      }
      await this.refresh();
    },

    /**
     * Refresh the session
     * @returns boolean
     * - true: refresh success
     * - false: need to sign in
     */
    async refresh(): Promise<boolean> {
      this.refreshState.loading = true;
      this.refreshState.error = false;

      try {
        const {
          accessToken,
          accessTokenExpiresAt,
          idToken,
          idTokenExpiresAt,
          userId,
          username,
        } = await (async () => {
          const { tokens } = await fetchAuthSession({ forceRefresh: true });

          if (tokens == null) throw new Error("No tokens found");
          if (tokens.accessToken == null)
            throw new Error("No access token found");
          if (tokens.accessToken.payload.exp == null)
            throw new Error("No access token expiration found");
          if (tokens.idToken == null)
            throw new Error("No access token expiration found");
          if (tokens.idToken.payload.exp == null)
            throw new Error("No id token expiration found");

          const { userId, username } = await getCurrentUser();

          return {
            accessToken: tokens.accessToken.toString(),
            accessTokenExpiresAt: tokens.accessToken.payload.exp,
            idToken: tokens.idToken.toString(),
            idTokenExpiresAt: tokens.idToken.payload.exp,
            userId,
            username,
          };
        })();

        this.session.accessToken = accessToken;
        this.session.accessTokenExpiresAt = accessTokenExpiresAt;
        this.session.idToken = idToken;
        this.session.idTokenExpiresAt = idTokenExpiresAt;
        this.session.useId = userId;
        this.session.username = username;
      } catch {
        this.session.useId = undefined;
        this.session.username = undefined;
        this.refreshState.error = true;
        this.refreshState.loading = false;
        return false;
      }

      this.refreshState.loading = false;
      return true;
    },

    /**
     * Refresh the session if the token is about to expire
     * @param thresholdSecond - the threshold to refresh the token
     * @returns boolean
     * - true: refresh success
     * - false: need to sign in
     */
    async refreshIfNeed(thresholdSecond: number = 60 * 10): Promise<boolean> {
      const INTERVAL = 50; // [ms]
      const TIMEOUT = 3000; // [ms]
      const ITERATION_COUNT = TIMEOUT / INTERVAL;

      for (let i = 0; i < ITERATION_COUNT; i++) {
        if (
          this.accessTokenRemainSeconds < thresholdSecond ||
          this.idTokenRemainSeconds < thresholdSecond
        ) {
          if (this.refreshState.loading) {
            await new Promise((resolve) => setTimeout(resolve, INTERVAL));
            continue;
          } else {
            return await this.refresh();
          }
        }
        return true;
      }
      return false;
    },
  },
  getters: {
    accessTokenRemainSeconds(): number {
      const expireAt: number | undefined = this.session?.accessTokenExpiresAt; // [s]
      if (!expireAt) return 0;
      const remainSeconds = expireAt - Date.now() / 1000; // [s]
      return remainSeconds;
    },
    idTokenRemainSeconds(): number {
      const expireAt: number | undefined = this.session?.idTokenExpiresAt;
      if (!expireAt) return 0;
      const remainSeconds = expireAt - Date.now() / 1000; // [s]
      return remainSeconds;
    },
    inSession(): boolean {
      const expireAt: number | undefined = this.session.accessTokenExpiresAt;
      if (!expireAt) return false;
      return new Date(expireAt * 1000).getTime() > new Date().getTime();
    },
  },
});
