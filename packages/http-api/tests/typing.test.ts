import type { RichTextItemResponse } from "@notionhq/client";
import { describe, expect, it, vi } from "vitest";
import { schemas } from "../server/contracts.ts";
import { TypingService, typingEntity } from "../server/features/typing.ts";
import { getRepository } from "../server/lib/notion.ts";
import * as parameters from "../server/lib/parameters.ts";
import { list, mockRepository, page, rich } from "./fixtures.ts";

const typingPage = (
  id: string,
  text: string,
  description = `Description ${id}`,
) =>
  page(
    {
      Title: { type: "title", title: description ? rich(description) : [] },
      Text: { type: "rich_text", rich_text: text ? rich(text) : [] },
    },
    id,
  );

describe("read-only Notion typing", () => {
  it("fetches every page without count-based sorting or filtering", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      typingPage(`page-${index}`, `Exercise ${index}`),
    );
    const { repository, transport } = mockRepository((_url, input) =>
      input.start_cursor
        ? list([typingPage("page-100", "Last exercise")])
        : list(firstPage, "next-page"),
    );

    const items = await new TypingService(repository).list();

    expect(items).toHaveLength(101);
    expect(items[100]).toMatchObject({
      id: "page-100",
      description: "Description page-100",
      text: "Last exercise",
      url: "https://www.notion.so/page-100",
    });
    expect(
      items.every((item) => schemas.TypingResponse.safeParse(item).success),
    ).toBe(true);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(
      String(transport.mock.calls[0][0]).endsWith("/data_sources/typing/query"),
    ).toBe(true);
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual({});
    expect(JSON.parse(String(transport.mock.calls[1][1]?.body))).toEqual({
      start_cursor: "next-page",
    });
    expect(
      transport.mock.calls.every(([, init]) => init?.method === "POST"),
    ).toBe(true);
  });

  it("uses Title as the description and concatenates Text fragments without trimming", () => {
    const row = typingPage("sentence", "");
    row.properties.Title = {
      id: "title",
      type: "title",
      title: [...rich("  Short "), ...rich("exercise  ")],
    };
    row.properties.Text = {
      id: "text-property",
      type: "rich_text",
      rich_text: [...rich("  Type "), ...rich("👍.\n")],
    };
    const entity = typingEntity(row);

    expect(entity).toMatchObject({
      id: "sentence",
      description: "  Short exercise  ",
      text: "  Type 👍.\n",
      url: "https://www.notion.so/sentence",
    });
    expect(entity.surface).toEqual({
      root: "root",
      components: {
        root: { id: "root", component: "Column", children: ["sentence"] },
        sentence: {
          id: "sentence",
          component: "Paragraph",
          children: ["sentence::text-property/0", "sentence::text-property/1"],
        },
        "sentence::text-property/0": {
          id: "sentence::text-property/0",
          component: "RichText",
          text: "  Type ",
        },
        "sentence::text-property/1": {
          id: "sentence::text-property/1",
          component: "RichText",
          text: "👍.\n",
        },
      },
    });
  });

  it("converts rich Text to A2UI while deriving typing text from plain_text", () => {
    const styled = rich("It’s ")[0];
    styled.annotations = {
      ...styled.annotations,
      bold: true,
      code: true,
      color: "blue",
    };
    const linked = rich("linked")[0];
    linked.href = "https://example.com";
    const equation: RichTextItemResponse = {
      type: "equation",
      equation: { expression: "x^2" },
      plain_text: "x²",
      href: null,
      annotations: rich("")[0].annotations,
    };
    const row = typingPage("formatted", "");
    row.properties.Text = {
      id: "Text",
      type: "rich_text",
      rich_text: [styled, linked, ...rich("\n"), equation],
    };
    const original = structuredClone(row);
    const entity = typingEntity(row);

    expect(entity.text).toBe("It’s linked\nx²");
    expect(entity.surface.components["formatted::Text/0"]).toMatchObject({
      component: "RichText",
      text: "It’s ",
      decoration: ["bold", "code"],
      color: "#6987b8",
    });
    expect(entity.surface.components["formatted::Text/1"]).toMatchObject({
      component: "LinkText",
      text: "linked",
      href: "https://example.com",
    });
    expect(entity.surface.components["formatted::Text/3"]).toMatchObject({
      component: "RichText",
      text: "x^2",
      decoration: ["katex"],
    });
    expect(typingEntity(row)).toEqual(entity);
    expect(row).toEqual(original);
  });

  it("supports empty data sources, descriptions, and rich text", async () => {
    const { repository } = mockRepository(() => list([]));
    expect(await new TypingService(repository).list()).toEqual([]);
    const entity = typingEntity(typingPage("empty", "", ""));
    expect(entity).toMatchObject({
      id: "empty",
      description: "",
      text: "",
      url: "https://www.notion.so/empty",
    });
    expect(entity.surface.components.empty).toEqual({
      id: "empty",
      component: "Paragraph",
      children: [],
    });
    expect(schemas.TypingResponse.safeParse(entity).success).toBe(true);
  });

  it.each([
    ["Title", undefined],
    ["Title", { type: "rich_text", rich_text: rich("Wrong type") }],
    ["Text", undefined],
    ["Text", { type: "title", title: rich("Old schema") }],
  ])("rejects a missing or incorrectly typed %s column", (name, value) => {
    const row = typingPage("invalid", "Practice");
    const properties: Record<string, unknown> = { ...row.properties };
    if (value === undefined) delete properties[name];
    else properties[name] = value;
    expect(() => typingEntity(page(properties))).toThrow(name);
  });

  it("preserves the sentence page URL supplied by Notion", () => {
    const row = typingPage("sentence", "Practice this sentence.");
    row.url = "https://app.notion.com/p/original-sentence-url";
    expect(typingEntity(row)).toMatchObject({
      id: "sentence",
      description: "Description sentence",
      text: "Practice this sentence.",
      url: row.url,
    });
  });

  it("resolves the stage-scoped typing data source parameter", async () => {
    vi.spyOn(parameters, "stageName").mockReturnValue("stg");
    const getParameter = vi
      .spyOn(parameters, "getParameter")
      .mockImplementation(async (name) =>
        name.endsWith("/secret") ? "integration-secret" : "typing-source-id",
      );
    const repository = await getRepository();

    expect(await repository.dataSourceId("typing")).toBe("typing-source-id");
    expect(getParameter.mock.calls.map(([name]) => name)).toEqual([
      "/stg/46ki75/internal/notion/secret",
      "/stg/46ki75/internal/notion/typing/data_source/id",
    ]);
  });
});
