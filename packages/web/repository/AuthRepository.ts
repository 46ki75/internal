import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from "aws-amplify/auth";

export interface AuthRepository {
  configure(): void;

  signIn({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<void>;

  signOut(): Promise<void>;

  refresh(): Promise<{
    accessToken: string;
    accessTokenExpiresAt: number;
    idToken: string;
    idTokenExpiresAt: number;
    userId: string;
    username: string;
  }>;
}

export class AuthRepositoryImpl implements AuthRepository {
  configure() {
    const config = useRuntimeConfig();

    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: config.public.USER_POOL_ID,
          userPoolClientId: config.public.USER_POOL_CLIENT_ID,
        },
      },
    });
  }
  async signIn({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<void> {
    this.configure();
    const _ = await signIn({ username, password });
  }

  async signOut(): Promise<void> {
    this.configure();
    await signOut();
  }

  async refresh(): Promise<{
    accessToken: string;
    accessTokenExpiresAt: number;
    idToken: string;
    idTokenExpiresAt: number;
    userId: string;
    username: string;
  }> {
    this.configure();

    const { tokens } = await fetchAuthSession({ forceRefresh: true });

    if (tokens == null) throw new Error("No tokens found");
    if (tokens.accessToken == null) throw new Error("No access token found");
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
  }
}
