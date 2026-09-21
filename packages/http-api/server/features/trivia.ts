import type { PageObjectResponse } from "@notionhq/client";
import type { NotionRepository } from "../lib/notion.ts";
import { richText, unsigned } from "../lib/properties.ts";

export function triviaEntity(page: PageObjectResponse) {
  const title = Object.values(page.properties).find((p) => p.type === "title");
  const views = page.properties.view_count;
  return {
    page_id: page.id,
    title:
      title?.type === "title" ? richText(title.title).trim() || null : null,
    view_count: unsigned(views?.type === "number" ? (views.number ?? 0) : 0),
    created_at: page.created_time,
    updated_at: page.last_edited_time,
    url: page.url,
  };
}

export class TriviaService {
  constructor(readonly repository: NotionRepository) {}
  async list(pageSize: number) {
    const { pages } = await this.repository.query("trivia", {
      page_size: pageSize,
      sorts: [{ property: "view_count", direction: "ascending" }],
    });
    const rows = pages.map(triviaEntity);
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    return rows;
  }
  async blocks(id: string) {
    return {
      surface: (await this.repository.converter.convertBlock(id)).toJSON(),
    };
  }
  async incrementView(id: string) {
    // Matches the existing single-user read/modify/write behavior.
    const current = triviaEntity(await this.repository.getPage(id));
    return triviaEntity(
      await this.repository.updatePage(id, {
        properties: { view_count: { number: current.view_count + 1 } },
      }),
    );
  }
}
