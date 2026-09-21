import {
  createError,
  defineEventHandler,
  getHeader,
  getQuery,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import type { H3Event } from "h3";
import { z } from "zod";
import { getRepository } from "./notion.ts";
import { operations } from "../contracts.ts";

export function pageId(event: H3Event) {
  const id = getRouterParam(event, "page_id");
  if (!id)
    throw createError({ statusCode: 400, message: "page_id is required" });
  return id;
}
export function query<T extends z.ZodTypeAny>(
  event: H3Event,
  schema: T,
): z.output<T> {
  const result = schema.safeParse(getQuery(event));
  if (!result.success)
    throw createError({ statusCode: 400, message: result.error.message });
  return result.data;
}
export async function body<T extends z.ZodTypeAny>(
  event: H3Event,
  schema: T,
): Promise<z.output<T>> {
  if (
    !getHeader(event, "content-type")
      ?.split(";")[0]
      .trim()
      .match(/^application\/(?:[\w.-]+\+)?json$/i)
  ) {
    throw createError({
      statusCode: 415,
      message: "Content-Type must be application/json",
    });
  }
  let value: unknown;
  try {
    value = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, message: "Invalid JSON" });
  }
  const result = schema.safeParse(value);
  if (!result.success)
    throw createError({ statusCode: 422, message: result.error.message });
  return result.data;
}

export function endpoint<K extends keyof typeof operations>(
  name: K,
  handler: (
    event: H3Event,
  ) => Promise<z.output<(typeof operations)[K]["response"]>>,
) {
  return defineEventHandler(async (event) => {
    try {
      const operation = operations[name];
      if (event.method.toLowerCase() !== operation.method)
        throw createError({ statusCode: 405, message: "Method not allowed" });
      const result = await handler(event);
      setResponseStatus(event, "status" in operation ? operation.status : 200);
      return result;
    } catch (error) {
      const status =
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
          ? error.statusCode
          : 500;
      setResponseStatus(event, status);
      if (status >= 500)
        console.error({
          message: "request failed",
          error: error instanceof Error ? error.message : String(error),
        });
      return {
        error:
          status >= 500
            ? "Internal Server Error"
            : error instanceof Error
              ? error.message
              : "Invalid request",
      };
    }
  });
}

export { getRepository };
