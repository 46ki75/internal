import { randomBytes, randomUUID } from "node:crypto";
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getParameter } from "../server/lib/parameters.ts";

export async function liveAuthentication() {
  if (process.env.STAGE_NAME !== "dev")
    throw new Error("Live migration tests require STAGE_NAME=dev");
  const cognito = new CognitoIdentityProviderClient({
    region: "ap-northeast-1",
  });
  const prefix = "/dev/46ki75/internal/cognito/userpool";
  const [UserPoolId, ClientId] = await Promise.all([
    getParameter(`${prefix}/id`),
    getParameter(`${prefix}/client/id`),
  ]);
  const Username = `nitro-test-${randomUUID()}`;
  const Password = `Aa1!${randomBytes(24).toString("hex")}`;
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId,
      Username,
      MessageAction: "SUPPRESS",
    }),
  );
  const cleanup = () =>
    cognito.send(new AdminDeleteUserCommand({ UserPoolId, Username }));
  try {
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId,
        Username,
        Password,
        Permanent: true,
      }),
    );
    const initial = await cognito.send(
      new InitiateAuthCommand({
        ClientId,
        AuthFlow: "USER_AUTH",
        AuthParameters: {
          USERNAME: Username,
          PREFERRED_CHALLENGE: "PASSWORD",
          PASSWORD: Password,
        },
      }),
    );
    const response = initial.AuthenticationResult
      ? initial
      : await cognito.send(
          new RespondToAuthChallengeCommand({
            ClientId,
            Session: initial.Session,
            ChallengeName: "PASSWORD",
            ChallengeResponses: { USERNAME: Username, PASSWORD: Password },
          }),
        );
    const token = response.AuthenticationResult?.AccessToken;
    if (!token) throw new Error("Cognito did not return an access token");
    return { token, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
