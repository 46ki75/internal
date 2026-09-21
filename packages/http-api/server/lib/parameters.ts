import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

export function stageName() {
  const stage = process.env.STAGE_NAME;
  if (stage !== "dev" && stage !== "stg" && stage !== "prod") {
    throw new Error("STAGE_NAME must be dev, stg, or prod");
  }
  return stage;
}

export function parameterReader(
  client = new SSMClient({ region: "ap-northeast-1" }),
) {
  const cache = new Map<string, Promise<string>>();
  return function getParameter(name: string): Promise<string> {
    let pending = cache.get(name);
    if (!pending) {
      pending = client
        .send(new GetParameterCommand({ Name: name, WithDecryption: true }))
        .then(({ Parameter }) => {
          if (!Parameter?.Value)
            throw new Error(`Missing SSM parameter: ${name}`);
          return Parameter.Value;
        })
        .catch((error: unknown) => {
          // A failed initialization must be retryable on the next warm invocation.
          cache.delete(name);
          throw error;
        });
      cache.set(name, pending);
    }
    return pending;
  };
}

export const getParameter = parameterReader();
