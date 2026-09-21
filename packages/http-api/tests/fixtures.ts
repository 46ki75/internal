import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client";
import { Client } from "@notionhq/client";
import { vi } from "vitest";
import { NotionRepository } from "../server/lib/notion.ts";

export function rich(content: string): RichTextItemResponse[] {
  return [
    {
      type: "text",
      text: { content, link: null },
      plain_text: content,
      href: null,
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: "default",
      },
    },
  ];
}
export function page(
  properties: Record<string, unknown>,
  id = "page-1",
): PageObjectResponse {
  return {
    object: "page",
    id,
    created_time: "2026-09-21T00:00:00.000Z",
    last_edited_time: "2026-09-21T01:00:00.000Z",
    url: `https://www.notion.so/${id}`,
    icon: null,
    cover: null,
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, value]) => [
        name,
        { id: name, ...(value as object) },
      ]),
    ),
  } as PageObjectResponse;
}
export const ankiPage = () =>
  page({
    title: { type: "title", title: rich("  Card  ") },
    description: { type: "rich_text", rich_text: rich("Description") },
    easeFactor: { type: "number", number: 2.5 },
    repetitionCount: { type: "number", number: 0 },
    nextReviewAt: { type: "date", date: { start: "2026-09-22" } },
    tags: {
      type: "multi_select",
      multi_select: [{ id: "tag-1", name: "Tag", color: "gray" }],
    },
    isReviewRequired: { type: "checkbox", checkbox: false },
  });
export const triviaPage = () =>
  page({
    Name: { type: "title", title: rich("Trivia") },
    view_count: { type: "number", number: 3 },
  });
export const bookmarkPage = () =>
  page({
    Name: { type: "title", title: rich("Bookmark") },
    URL: { type: "url", url: "https://example.com" },
    Tag: { type: "select", select: null },
    NSFW: { type: "checkbox", checkbox: false },
    Favorite: { type: "checkbox", checkbox: true },
  });
export const todoPage = () =>
  page({
    Title: { type: "title", title: rich("Task") },
    Description: { type: "rich_text", rich_text: rich("  Description  ") },
    IsDone: { type: "checkbox", checkbox: false },
    IsArchived: { type: "checkbox", checkbox: false },
    IsRecurring: { type: "checkbox", checkbox: true },
    Deadline: { type: "date", date: { start: "2024-02-29T23:00:00+09:00" } },
    Severity: { type: "select", select: { name: "WARN" } },
  });
export const imagePage = () =>
  page({
    Title: { type: "title", title: rich("Image") },
    Name: { type: "rich_text", rich_text: rich("Name") },
    Sources: {
      type: "multi_select",
      multi_select: [{ id: "source", name: "Source", color: "blue" }],
    },
    URL: { type: "url", url: null },
    Tags: { type: "relation", relation: [{ id: "tag" }] },
    "Notable Tags": { type: "relation", relation: [] },
    "Uploaded At": { type: "date", date: null },
    Images: {
      type: "files",
      files: [
        {
          type: "external",
          external: { url: "https://example.com/image.png" },
          name: "image",
        },
      ],
    },
  });
export const imageTagPage = () =>
  page({
    "Tag Name": { type: "title", title: rich("Artist") },
    URL: { type: "url", url: "https://example.com/artist" },
    "Tag Type": { type: "select", select: { name: "Artist" } },
  });
export function list(results: unknown[], nextCursor: string | null = null) {
  return {
    object: "list",
    results,
    next_cursor: nextCursor,
    has_more: nextCursor !== null,
    type: "page_or_data_source",
    page_or_data_source: {},
  };
}
export function mockRepository(
  responder: (
    url: string,
    input: Record<string, unknown>,
    method: string,
  ) => unknown,
) {
  const transport = vi.fn<typeof fetch>(async (url, init) =>
    Response.json(
      responder(
        String(url),
        typeof init?.body === "string"
          ? (JSON.parse(init.body) as Record<string, unknown>)
          : {},
        init?.method ?? "GET",
      ),
    ),
  );
  const client = new Client({
    auth: "test",
    notionVersion: "2026-03-11",
    fetch: transport,
    retry: false,
  });
  const repository = new NotionRepository(client, (feature) =>
    Promise.resolve(feature),
  );
  return { repository, transport };
}
export function block(
  id: string,
  type: string,
  content: string,
  hasChildren = false,
) {
  return {
    object: "block",
    id,
    type,
    has_children: hasChildren,
    [type]: { rich_text: rich(content), color: "default" },
  };
}
