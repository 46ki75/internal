import { readFile, writeFile } from "node:fs/promises";
import { zodToJsonSchema } from "zod-to-json-schema";
import { operations, schemas, imagePage } from "../server/contracts.ts";
import type { z } from "zod";

const schema = (value: z.ZodTypeAny) => {
  // Utoipa emits OpenAPI 3.1: use JSON Schema unions for nullability, not 3.0's nullable.
  const result = zodToJsonSchema(value, {
    target: "jsonSchema7",
    $refStrategy: "none",
  });
  delete result.$schema;
  return result;
};
const paths: Record<string, Record<string, unknown>> = {};
for (const [name, operation] of Object.entries(operations)) {
  const parameters: unknown[] = [...operation.path.matchAll(/\{(\w+)\}/g)].map(
    ([, name]) => ({
      name,
      in: "path",
      required: true,
      schema: { type: "string" },
    }),
  );
  // Existing openapi-fetch consumers pass this through params.header.
  parameters.push({
    name: "Authorization",
    in: "header",
    required: true,
    schema: { type: "string" },
  });
  if ("query" in operation) {
    for (const [name, value] of Object.entries(operation.query.shape)) {
      parameters.push({
        name,
        in: "query",
        required: false,
        schema: schema(value),
      });
    }
  }
  paths[operation.path] ??= {};
  paths[operation.path][operation.method] = {
    operationId: name,
    parameters,
    security: [{ bearerAuth: [] }],
    ...("body" in operation
      ? {
          requestBody: {
            required: true,
            content: { "application/json": { schema: schema(operation.body) } },
          },
        }
      : {}),
    responses: {
      ["status" in operation ? operation.status : 200]: {
        description: "Success",
        content: { "application/json": { schema: schema(operation.response) } },
      },
      default: {
        description: "Error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["error"],
              properties: { error: { type: "string" } },
            },
          },
        },
      },
    },
  };
}
const document = {
  openapi: "3.1.0",
  info: { title: "Notion HTTP API", version: "1.0.0" },
  paths,
  components: {
    schemas: Object.fromEntries(
      Object.entries({ ...schemas, FetchImagesResponse: imagePage }).map(
        ([name, value]) => [name, schema(value)],
      ),
    ),
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
};
const output = JSON.stringify(document, null, 2) + "\n";
const file = new URL("../openapi.json", import.meta.url);
if (process.argv.includes("--check")) {
  if ((await readFile(file, "utf8")) !== output)
    throw new Error("Run mise run nitro-api:generate-openapi");
} else {
  await writeFile(file, output);
}
