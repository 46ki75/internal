import type { PageObjectResponse } from "@notionhq/client";
import type { NotionRepository } from "../lib/notion.ts";
import { property, richText } from "../lib/properties.ts";

export function typingEntity(page: PageObjectResponse) {
  return {
    id: page.id,
    text: richText(property(page, "Text", "title").title),
    url: page.url,
  };
}

export class TypingService {
  constructor(readonly repository: NotionRepository) {}

  async list() {
    return (await this.repository.queryAll("typing")).map(typingEntity);
  }
}
