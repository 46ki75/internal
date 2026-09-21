import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { isFullDataSource } from "@notionhq/client";
import { getRepository } from "../server/lib/notion.ts";
import { schemas, imagePage } from "../server/contracts.ts";
import { text } from "../server/lib/properties.ts";
import { liveAuthentication } from "./live-auth.ts";

const api = "https://api.dev-internal.46ki75.com";
const web = "https://dev-internal.46ki75.com";
let auth: Awaited<ReturnType<typeof liveAuthentication>> | undefined;
const pages = new Set<string>();

beforeAll(async () => {
  auth = await liveAuthentication();
});
afterAll(async () => {
  const cleanup: Promise<unknown>[] = [...pages].map(async (page_id) =>
    (await getRepository()).client.pages.update({ page_id, in_trash: true }),
  );
  if (auth) cleanup.push(auth.cleanup());
  const results = await Promise.allSettled(cleanup);
  const errors = results.filter((result) => result.status === "rejected");
  if (errors.length)
    throw new AggregateError(
      errors.map((result) => result.reason),
      "Live test cleanup failed",
    );
});

async function call(
  path: string,
  method = "GET",
  body?: unknown,
  origin = api,
) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${auth!.token}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(35000),
  });
  const result = await response.json();
  expect(response.status, `${method} ${path}: ${JSON.stringify(result)}`).toBe(
    method === "POST" &&
      ["/api/v1/anki", "/api/v1/bookmark", "/api/v1/to-do"].includes(path)
      ? 201
      : 200,
  );
  return result;
}

describe("dev migration", () => {
  it("rejects requests without a Cognito JWT", async () => {
    const response = await fetch(`${api}/api/v1/trivia`);
    expect(response.status).toBe(401);
  });
  it("reaches Nitro through API Gateway and CloudFront", async () => {
    for (const origin of [api, web])
      expect(await call("/api/health/nitro", "GET", undefined, origin)).toEqual(
        { status: "ok", service: "nitro-api" },
      );
  });
  it.each([
    ["/api/v1/anki?page_size=2", schemas.AnkiResponse.array()],
    ["/api/v1/trivia?page_size=2", schemas.TriviaResponse.array()],
    ["/api/v1/bookmark", schemas.BookmarkResponse.array()],
    ["/api/v1/to-do", schemas.ToDoResponse.array()],
    ["/api/v1/icon", schemas.IconResponse.array()],
    ["/api/v1/image", imagePage],
    ["/api/v1/image/tag", schemas.ImageTagResponse.array()],
  ] as const)("reads %s with the documented contract", async (path, schema) => {
    schema.parse(await call(path));
  });
  it("creates, renders, updates, and archives a dedicated Anki card", async () => {
    const created = await call("/api/v1/anki", "POST", {
      title: `Nitro migration test ${randomUUID()}`,
    });
    pages.add(created.page_id);
    schemas.AnkiResponse.parse(created);
    const repository = await getRepository();
    await repository.client.blocks.children.append({
      block_id: created.page_id,
      children: [
        { heading_1: { rich_text: text("front") } },
        { paragraph: { rich_text: text("Question") } },
        { heading_1: { rich_text: text("back") } },
        { paragraph: { rich_text: text("Answer") } },
      ],
    });
    const blocks = schemas.AnkiBlockResponse.parse(
      await call(`/api/v1/anki/block/${created.page_id}`),
    );
    expect(blocks.front.root).toBe("root");
    expect(JSON.stringify(blocks.front.components)).toContain("Question");
    const updated = schemas.AnkiResponse.parse(
      await call(`/api/v1/anki/${created.page_id}`, "PUT", {
        ease_factor: 2.3,
        repetition_count: 1,
        next_review_at: "2026-09-22T00:00:00Z",
        is_review_required: true,
      }),
    );
    expect(updated).toMatchObject({
      repetition_count: 1,
      ease_factor: 2.3,
      is_review_required: true,
    });
    await call(`/api/v1/anki/${created.page_id}`, "PUT", { in_trash: true });
    // Notion rejects a second archive operation on an already trashed page.
    pages.delete(created.page_id);
  });
  it("converts Trivia and increments a dedicated page's view count", async () => {
    const repository = await getRepository();
    const dataSource = await repository.client.dataSources.retrieve({
      data_source_id: await repository.dataSourceId("trivia"),
    });
    if (!isFullDataSource(dataSource))
      throw new Error("Partial trivia data source");
    const titleName = Object.entries(dataSource.properties).find(
      ([, property]) => property.type === "title",
    )?.[0];
    if (!titleName) throw new Error("Trivia title property not found");
    const created = await repository.createPage("trivia", {
      properties: {
        [titleName]: { title: text(`Nitro migration test ${randomUUID()}`) },
        view_count: { number: 0 },
      },
      children: [{ paragraph: { rich_text: text("Trivia conversion test") } }],
    });
    pages.add(created.id);
    const blocks = schemas.TriviaBlockResponse.parse(
      await call(`/api/v1/trivia/block/${created.id}`),
    );
    expect(blocks.surface.root).toBe("root");
    expect(JSON.stringify(blocks.surface.components)).toContain(
      "Trivia conversion test",
    );
    expect(
      await call(`/api/v1/trivia/${created.id}/view`, "POST"),
    ).toMatchObject({ view_count: 1 });
  });
  it("creates and updates a dedicated To-do", async () => {
    const created = await call("/api/v1/to-do", "POST", {
      title: `Nitro migration test ${randomUUID()}`,
      severity: "INFO",
      deadline: "2026-09-22",
    });
    pages.add(created.id);
    schemas.ToDoResponse.parse(created);
    expect(
      await call("/api/v1/to-do", "PUT", { id: created.id, is_done: true }),
    ).toMatchObject({ is_done: true });
  });
  it("creates a dedicated Bookmark", async () => {
    const created = await call("/api/v1/bookmark", "POST", {
      name: `Nitro migration test ${randomUUID()}`,
      url: "https://example.com",
    });
    pages.add(created.id);
    schemas.BookmarkResponse.parse(created);
  });
});
