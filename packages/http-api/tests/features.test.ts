import { describe, expect, it, vi } from "vitest";
import { Surface } from "n2a2ui";
import recordedBookmark from "./fixtures/bookmark.json";
import recordedToDo from "./fixtures/to-do.json";
import {
  AnkiService,
  ankiEntity,
  splitSections,
} from "../server/features/anki.ts";
import { TriviaService, triviaEntity } from "../server/features/trivia.ts";
import { BookmarkService, faviconUrl } from "../server/features/bookmark.ts";
import { ToDoService, toDoEntity } from "../server/features/to-do.ts";
import { ImageService } from "../server/features/image.ts";
import { IconService } from "../server/features/icon.ts";
import {
  ankiPage,
  triviaPage,
  todoPage,
  bookmarkPage,
  imagePage,
  imageTagPage,
  page,
  list,
  block,
  mockRepository,
} from "./fixtures.ts";

describe("Notion repositories and feature contracts", () => {
  it("maps the recorded Rust bookmark and To-do fixtures", async () => {
    expect(
      (
        await new BookmarkService(
          mockRepository(() => list([recordedBookmark])).repository,
        ).list()
      )[0],
    ).toMatchObject({
      name: "三菱UFJダイレクト",
      url: "https://direct.bk.mufg.jp/index.html",
    });
    expect(
      (
        await new ToDoService(
          mockRepository(() => list([recordedToDo])).repository,
        ).list()
      )[0],
    ).toMatchObject({
      title: "家族会議",
      severity: "UNKNOWN",
      deadline: null,
      is_done: false,
    });
  });
  it("paginates bookmarks through the official SDK", async () => {
    const { repository, transport } = mockRepository((_url, input) =>
      list([bookmarkPage()], input.start_cursor ? null : "cursor-2"),
    );
    expect(await new BookmarkService(repository).list()).toHaveLength(2);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(transport.mock.calls[1][1]?.body))).toMatchObject({
      start_cursor: "cursor-2",
    });
  });
  it("rejects partial pages instead of silently dropping records", async () => {
    const { repository } = mockRepository(() =>
      list([{ object: "page", id: "partial" }]),
    );
    await expect(repository.queryAll("bookmark")).rejects.toThrow(
      "partial page",
    );
  });
  it("requests the least-viewed trivia and persists an increment", async () => {
    const { repository, transport } = mockRepository((url, input) => {
      if (url.endsWith("/query")) return list([triviaPage()]);
      const result = triviaPage();
      if (input.properties)
        result.properties.view_count = {
          id: "view_count",
          type: "number",
          number: 4,
        };
      return result;
    });
    const service = new TriviaService(repository);
    expect((await service.list(10))[0].view_count).toBe(3);
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toMatchObject({
      page_size: 10,
      sorts: [{ property: "view_count", direction: "ascending" }],
    });
    expect((await service.incrementView("page-1")).view_count).toBe(4);
    expect(JSON.parse(String(transport.mock.calls[2][1]?.body))).toMatchObject({
      properties: { view_count: { number: 4 } },
    });
  });
  it("defaults missing trivia fields and clamps negative counts", () => {
    expect(triviaEntity(page({}))).toMatchObject({
      title: null,
      view_count: 0,
    });
    expect(
      triviaEntity(page({ view_count: { type: "number", number: -2 } }))
        .view_count,
    ).toBe(0);
  });
  it("preserves Anki fields, query cursors, false, zero, and omitted updates", async () => {
    const { repository, transport } = mockRepository((url) =>
      url.endsWith("/query") ? list([ankiPage()]) : ankiPage(),
    );
    const service = new AnkiService(repository);
    expect(ankiEntity(ankiPage())).toMatchObject({
      title: "Card",
      tags: [{ color: "#59b57c" }],
      next_review_at: "2026-09-22",
    });
    await service.list(5, "next");
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toMatchObject({
      page_size: 5,
      start_cursor: "next",
    });
    await service.update("page-1", {
      repetition_count: 0,
      is_review_required: false,
      in_trash: true,
    });
    expect(JSON.parse(String(transport.mock.calls[1][1]?.body))).toEqual({
      properties: {
        repetitionCount: { number: 0 },
        isReviewRequired: { checkbox: false },
      },
      in_trash: true,
    });
  });
  it("creates the Anki heading template and review defaults", async () => {
    const { repository, transport } = mockRepository(() => ankiPage());
    await new AnkiService(repository).create({});
    const input = JSON.parse(String(transport.mock.calls[0][1]?.body));
    expect(input).toMatchObject({
      parent: { data_source_id: "anki" },
      properties: {
        title: { title: [{ text: { content: "No Title" } }] },
        easeFactor: { number: 2.5 },
        repetitionCount: { number: 0 },
      },
    });
    expect(input.children).toHaveLength(6);
    expect(input.children[4].heading_1.rich_text[0].text.content).toBe(
      "explanation",
    );
  });
  it("preserves To-do dates, whitespace, and severity fallback", () => {
    expect(toDoEntity(todoPage())).toMatchObject({
      deadline: "2024-02-29",
      created_at: "2026-09-21",
      description: "  Description  ",
      severity: "WARN",
    });
    const row = todoPage();
    delete row.properties.Severity;
    expect(toDoEntity(row).severity).toBe("UNKNOWN");
    delete row.properties.IsDone;
    expect(() => toDoEntity(row)).toThrow("IsDone");
  });
  it("applies To-do filters and maps create/update payloads", async () => {
    const { repository, transport } = mockRepository((url) =>
      url.endsWith("/query") ? list([todoPage()]) : todoPage(),
    );
    const service = new ToDoService(repository);
    await service.list();
    expect(
      JSON.parse(String(transport.mock.calls[0][1]?.body)).filter.and,
    ).toEqual([
      { property: "IsArchived", checkbox: { equals: false } },
      { property: "Type", select: { equals: "To Do" } },
    ]);
    await service.create({ title: "Task", deadline: "2024-02-29" });
    expect(JSON.parse(String(transport.mock.calls[1][1]?.body))).toMatchObject({
      properties: {
        Severity: { select: { name: "UNKNOWN" } },
        Deadline: { date: { start: "2024-02-29" } },
      },
    });
    await service.update({ id: "page-1", is_done: false });
    expect(JSON.parse(String(transport.mock.calls[2][1]?.body))).toEqual({
      properties: { IsDone: { checkbox: false } },
    });
  });
  it("keeps image pagination and relation/media fields", async () => {
    const { repository } = mockRepository((url) =>
      url.includes("image_tag")
        ? list([imageTagPage()])
        : list([imagePage()], "next"),
    );
    const service = new ImageService(repository);
    expect(await service.list()).toMatchObject({
      next_cursor: "next",
      images: [
        {
          sources: [{ color: "blue" }],
          tags: ["tag"],
          images: ["https://example.com/image.png"],
        },
      ],
    });
    expect(await service.tags()).toEqual([
      {
        tag_name: "Artist",
        url: "https://example.com/artist",
        tag_type: "Artist",
      },
    ]);
  });
  it("paginates custom emoji and tolerates absent content types", async () => {
    const { repository } = mockRepository((url) =>
      list(
        [{ id: "icon", name: "Icon", url: "https://example.com/icon.png" }],
        url.includes("start_cursor") ? null : "next",
      ),
    );
    const type = vi
      .fn()
      .mockResolvedValueOnce("image/png")
      .mockResolvedValueOnce(null);
    expect(await new IconService(repository, type).list()).toMatchObject([
      { content_type: "image/png" },
      { content_type: null },
    ]);
  });
  it("creates bookmarks even when optional metadata fails", async () => {
    const { repository, transport } = mockRepository(() => bookmarkPage());
    const service = new BookmarkService(repository, () =>
      Promise.reject(new Error("offline")),
    );
    await service.create({ name: "Bookmark", url: "https://example.com" });
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual({
      parent: { type: "data_source_id", data_source_id: "bookmark" },
      properties: {
        Name: { title: [{ type: "text", text: { content: "Bookmark" } }] },
        URL: { url: "https://example.com" },
      },
    });
  });
  it.each([
    ["favicon.ico", "https://example.com/favicon.ico"],
    ["/static/icon.png", "https://example.com/static/icon.png"],
    ["https://cdn.example.com/icon.png", "https://cdn.example.com/icon.png"],
  ])("resolves favicon %s", (href, expected) => {
    expect(
      faviconUrl(
        `<link rel="icon" href="${href}">`,
        "https://example.com/path",
      ),
    ).toBe(expected);
  });
});

describe("real n2a2ui conversion and Anki sections", () => {
  it("paginates nested blocks and preserves section semantics with numeric heading levels", async () => {
    const { repository } = mockRepository((url) => {
      if (url.includes("/nested/"))
        return list([block("inside", "paragraph", "Nested")]);
      if (url.includes("start_cursor"))
        return list([
          block("explain", "heading_1", "explanation"),
          block("answer", "paragraph", "Because"),
        ]);
      return list(
        [
          block("intro", "paragraph", "Before markers"),
          block("front", "heading_1", " FRONT "),
          block("question", "paragraph", "Question"),
          block("back", "heading_1", "back"),
          block("nested", "toggle", "Nested", true),
          block("h2", "heading_2", "front"),
          block("unknown", "heading_1", "Notes"),
        ],
        "next",
      );
    });
    const result = await new AnkiService(repository).blocks("page-1");
    expect(result.front.components.root).toMatchObject({
      component: "Column",
      children: ["intro", "question"],
    });
    expect(result.back.components.root).toMatchObject({
      children: ["nested", "h2", "unknown"],
    });
    expect(result.explanation.components.root).toMatchObject({
      children: ["answer"],
    });
    expect(result.back.components.inside).toMatchObject({
      component: "Paragraph",
    });
    for (const surface of Object.values(result))
      expect(surface.root).toBe("root");
  });
  it("handles empty and non-column roots", () => {
    const source = new Surface("old", [
      ["old", { id: "old", component: "RichText", text: "text" }],
    ]);
    const result = splitSections(source);
    expect(result.front.components.root).toEqual({
      id: "root",
      component: "Column",
      children: [],
    });
    expect(source.components.has("old")).toBe(true);
  });
});
