import { describe, expect, it, vi } from "vitest";
import { TypingService, typingEntity } from "../server/features/typing.ts";
import { getRepository } from "../server/lib/notion.ts";
import * as parameters from "../server/lib/parameters.ts";
import { list, mockRepository, page, rich } from "./fixtures.ts";

const typingPage = (id: string, text: string) =>
  page({ Text: { type: "title", title: rich(text) } }, id);

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
    expect(items[100]).toEqual({ id: "page-100", text: "Last exercise" });
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

  it("concatenates Text title fragments without trimming practice text", () => {
    expect(
      typingEntity(
        page({
          Text: {
            type: "title",
            title: [...rich("  Type "), ...rich("👍.\n")],
          },
        }),
      ),
    ).toEqual({ id: "page-1", text: "  Type 👍.\n" });
  });

  it("supports empty data sources and titles", async () => {
    const { repository } = mockRepository(() => list([]));
    expect(await new TypingService(repository).list()).toEqual([]);
    expect(typingEntity(typingPage("empty", ""))).toEqual({
      id: "empty",
      text: "",
    });
  });

  it("rejects missing or incorrectly typed Text columns", () => {
    expect(() => typingEntity(page({}))).toThrow("Text");
    expect(() =>
      typingEntity(
        page({ Text: { type: "rich_text", rich_text: rich("Wrong type") } }),
      ),
    ).toThrow("Text");
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
