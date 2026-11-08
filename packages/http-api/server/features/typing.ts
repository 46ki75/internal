import type { PageObjectResponse } from "@notionhq/client";
import { convertRichTexts, Surface } from "n2a2ui";
import type { NotionRepository } from "../lib/notion.ts";
import { property, richText } from "../lib/properties.ts";

function ttsUrl(page: PageObjectResponse): string | null {
  const tts = page.properties.TTS;
  if (!tts) return null;
  if (tts.type === "url") return tts.url;

  for (const file of property(page, "TTS", "files").files) {
    if (file.type === "file") return file.file.url;
    if (file.type === "external") return file.external.url;
  }
  return null;
}

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
    tts: ttsUrl(page),
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
