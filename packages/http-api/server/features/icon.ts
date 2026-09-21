import { collectPaginatedAPI } from "@notionhq/client";
import type { NotionRepository } from "../lib/notion.ts";

export class IconService {
  constructor(
    readonly repository: NotionRepository,
    readonly contentType = async (url: string) => {
      try {
        return (
          await fetch(url, {
            method: "HEAD",
            signal: AbortSignal.timeout(5000),
          })
        ).headers.get("content-type");
      } catch {
        return null;
      }
    },
  ) {}
  async list() {
    const icons = await collectPaginatedAPI(
      this.repository.client.customEmojis.list,
      {},
    );
    // Bound metadata concurrency while preserving the order returned by Notion.
    const rows: {
      id: string;
      name: string;
      url: string;
      content_type: string | null;
    }[] = [];
    for (let index = 0; index < icons.length; index += 20) {
      rows.push(
        ...(await Promise.all(
          icons.slice(index, index + 20).map(async (icon) => ({
            id: icon.id,
            name: icon.name,
            url: icon.url,
            content_type: await this.contentType(icon.url),
          })),
        )),
      );
    }
    return rows;
  }
}
