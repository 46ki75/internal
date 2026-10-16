import type { PageObjectResponse } from "@notionhq/client";
import { convertRichTexts, Surface } from "n2a2ui";
import type { NotionRepository } from "../lib/notion.ts";
import { property, richText } from "../lib/properties.ts";

export function typingEntity(page: PageObjectResponse) {
  const description = richText(property(page, "Title", "title").title);
  const text = property(page, "Text", "rich_text");
  const converted = convertRichTexts(page.id, text.id, text.rich_text);
  const surface = new Surface("root");
  surface.insert({ id: "root", component: "Column", children: [page.id] });
  surface.insert({
    id: page.id,
    component: "Paragraph",
    children: converted.ids,
  });
  for (const component of converted.components) surface.insert(component);

  return {
    id: page.id,
    description,
    text: richText(text.rich_text),
    surface: surface.toJSON(),
    url: page.url,
  };
}

export class TypingService {
  constructor(readonly repository: NotionRepository) {}

  async list() {
    return (await this.repository.queryAll("typing")).map(typingEntity);
  }
}
