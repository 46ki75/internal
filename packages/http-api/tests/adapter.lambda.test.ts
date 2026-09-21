import { beforeAll, describe, expect, it } from "vitest";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";

let handler: (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;
beforeAll(async () => {
  // A dynamic URL imports the emitted artifact, including traced production dependencies.
  ({ handler } = await import(
    new URL("../.output/server/index.mjs", import.meta.url).href
  ));
});
function event(
  path: string,
  method = "GET",
  body?: string,
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "ANY /api/{proxy+}",
    rawPath: `/api-gateway${path}`,
    rawQueryString: "",
    headers: { "content-type": "application/json" },
    isBase64Encoded: !!body,
    body,
    requestContext: {
      accountId: "test",
      apiId: "test",
      domainName: "api.dev-internal.46ki75.com",
      domainPrefix: "api",
      requestId: "test",
      routeKey: "ANY /api/{proxy+}",
      stage: "api-gateway",
      time: "",
      timeEpoch: 0,
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "Vitest",
      },
    },
  };
}
describe("built Lambda adapter", () => {
  it("strips the named stage prefix observed in dev Lambda events", async () => {
    const response = await handler(event("/api/health/nitro"), {} as Context);
    expect(response).toMatchObject({ statusCode: 200 });
    expect(typeof response === "object" && JSON.parse(response.body!)).toEqual({
      status: "ok",
      service: "nitro-api",
    });
  });
  it("rejects invalid query parameters before contacting AWS", async () => {
    const request = event("/api/v1/trivia");
    request.queryStringParameters = { page_size: "101" };
    expect(await handler(request, {} as Context)).toMatchObject({
      statusCode: 400,
    });
  });
  it("decodes base64 bodies and validates JSON payloads", async () => {
    const request = event(
      "/api/v1/to-do",
      "POST",
      Buffer.from(
        JSON.stringify({ title: "日本語", deadline: "2024-02-30" }),
      ).toString("base64"),
    );
    expect(await handler(request, {} as Context)).toMatchObject({
      statusCode: 422,
    });
  });
  it("returns 404 for unknown paths", async () => {
    expect(
      await handler(event("/api/v1/trivia/missing/path"), {} as Context),
    ).toMatchObject({ statusCode: 404 });
  });
});
