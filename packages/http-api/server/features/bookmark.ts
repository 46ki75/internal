import type { PageObjectResponse } from "@notionhq/client";
import { load } from "cheerio";
import type { z } from "zod";
import type { schemas } from "../contracts.ts";
import type { NotionRepository } from "../lib/notion.ts";
import {
  pageIcon,
  property,
  required,
  richText,
  tagColors,
  text,
} from "../lib/properties.ts";

export function bookmarkEntity(page: PageObjectResponse) {
  const tagProperty = required(page.properties.Tag, "Tag");
  const tag = tagProperty.type === "select" ? tagProperty.select : null;
  const nsfw = required(page.properties.NSFW, "NSFW");
  const favorite = required(page.properties.Favorite, "Favorite");
  return {
    id: page.id,
    name: richText(property(page, "Name", "title").title),
    url: property(page, "URL", "url").url ?? "",
    favicon: pageIcon(page.icon),
    tag: tag ? { ...tag, color: tagColors[tag.color] } : null,
    nsfw: nsfw.type === "checkbox" ? nsfw.checkbox : true,
    favorite: favorite.type === "checkbox" ? favorite.checkbox : false,
    notion_url: page.url,
  };
}

export function faviconUrl(html: string, pageUrl: string) {
  const href = load(html)('link[rel~="icon"]').first().attr("href");
  if (!href) return undefined;
  try {
    const page = new URL(pageUrl);
    const icon = new URL(href, `${page.origin}/`);
    return ["https:", "http:"].includes(icon.protocol) ? icon.href : undefined;
  } catch {
    return undefined;
  }
}

export class BookmarkService {
  constructor(
    readonly repository: NotionRepository,
    readonly fetchHtml = async (url: string) => {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok)
        throw new Error(`Bookmark metadata HTTP ${response.status}`);
      return response.text();
    },
  ) {}
  async list() {
    return (await this.repository.queryAll("bookmark")).map(bookmarkEntity);
  }
  async create(input: z.infer<typeof schemas.CreateBookmarkRequestBody>) {
    let favicon: string | undefined;
    try {
      favicon = faviconUrl(await this.fetchHtml(input.url), input.url);
    } catch {
      /* Metadata is optional. */
    }
    return bookmarkEntity(
      await this.repository.createPage("bookmark", {
        properties: {
          Name: { title: text(input.name) },
          URL: { url: input.url },
        },
        ...(favicon
          ? { icon: { type: "external" as const, external: { url: favicon } } }
          : {}),
      }),
    );
  }
}
