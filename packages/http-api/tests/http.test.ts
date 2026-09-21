import { existsSync } from "node:fs";
import { createApp, createRouter, toWebHandler } from "h3";
import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import { operations } from "../server/contracts.ts";
import * as notion from "../server/lib/notion.ts";
import {
  ankiPage,
  triviaPage,
  bookmarkPage,
  todoPage,
  imagePage,
  imageTagPage,
  list,
  mockRepository,
} from "./fixtures.ts";

const app = createApp();
const router = createRouter();
const request = toWebHandler(app);
beforeAll(async () => {
  for (const operation of Object.values(operations)) {
    const path = operation.path.replace(/\{(\w+)\}/g, "[$1]");
    const base = new URL(`../server${path}`, import.meta.url).pathname;
    const file = existsSync(`${base}.${operation.method}.ts`)
      ? `${base}.${operation.method}.ts`
      : `${base}/index.${operation.method}.ts`;
    const { default: handler } = await import(file);
    router[operation.method](
      operation.path.replace(/\{(\w+)\}/g, ":$1"),
      handler,
    );
  }
  app.use(router);
});
afterEach(() => vi.unstubAllGlobals());

const payloads: Partial<Record<keyof typeof operations, unknown>> = {
  createAnki: {},
  updateAnki: { is_review_required: false },
  createBookmark: { name: "Test", url: "https://example.com" },
  createToDo: { title: "Test" },
  updateToDo: { id: "page-1", is_done: true },
};

describe("HTTP contracts", () => {
  it.each(Object.entries(operations))(
    "%s satisfies its documented contract",
    async (name, operation) => {
      const feature = operation.path.split("/")[3];
      const fixtures = {
        anki: ankiPage,
        trivia: triviaPage,
        bookmark: bookmarkPage,
        "to-do": todoPage,
        image: imagePage,
      };
      const fixture = fixtures[feature as keyof typeof fixtures] ?? triviaPage;
      const { repository } = mockRepository((url) => {
        if (url.includes("/blocks/")) return list([]);
        if (url.includes("custom_emojis"))
          return list([
            { id: "icon", name: "Icon", url: "https://example.com/icon.png" },
          ]);
        if (url.includes("image_tag")) return list([imageTagPage()]);
        if (url.endsWith("/query")) return list([fixture()]);
        return fixture();
      });
      vi.spyOn(notion, "getRepository").mockResolvedValue(repository);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response("<html></html>", {
            headers: { "content-type": "image/png" },
          }),
        ),
      );
      const payload = payloads[name as keyof typeof operations];
      const response = await request(
        new Request(
          `http://localhost${operation.path.replace("{page_id}", "page-1")}`,
          {
            method: operation.method.toUpperCase(),
            headers: { "content-type": "application/json" },
            ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
          },
        ),
      );
      expect(response.status).toBe(
        "status" in operation ? operation.status : 200,
      );
      expect(operation.response.safeParse(await response.json()).success).toBe(
        true,
      );
    },
  );

  it.each([
    ["GET", "/api/v1/anki?page_size=no", undefined, "application/json", 400],
    ["POST", "/api/v1/to-do", "{}", "application/json", 422],
    [
      "POST",
      "/api/v1/to-do",
      '{"title":"Task","deadline":"2024-02-30"}',
      "application/json",
      422,
    ],
    [
      "PUT",
      "/api/v1/anki/page",
      '{"repetition_count":-1}',
      "application/json",
      422,
    ],
    ["POST", "/api/v1/bookmark", "{}", "text/plain", 415],
  ])(
    "validates %s %s before dependency initialization",
    async (method, path, payload, contentType, status) => {
      const initialize = vi.spyOn(notion, "getRepository");
      const response = await request(
        new Request(`http://localhost${path}`, {
          method,
          headers: { "content-type": contentType },
          body: payload,
        }),
      );
      expect(response.status).toBe(status);
      expect(await response.json()).toHaveProperty("error");
      expect(initialize).not.toHaveBeenCalled();
    },
  );
  it("maps upstream failures to the API error envelope", async () => {
    vi.spyOn(notion, "getRepository").mockRejectedValue(
      new Error("upstream failed"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(
      new Request("http://localhost/api/v1/trivia"),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
