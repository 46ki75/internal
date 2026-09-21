import type { PageObjectResponse } from "@notionhq/client";
import type { NotionRepository } from "../lib/notion.ts";
import { property, richText } from "../lib/properties.ts";

export function imageEntity(page: PageObjectResponse) {
  return {
    title: richText(property(page, "Title", "title").title),
    name: richText(property(page, "Name", "rich_text").rich_text),
    sources: property(page, "Sources", "multi_select").multi_select,
    url: property(page, "URL", "url").url,
    tags: property(page, "Tags", "relation").relation.map((r) => r.id),
    notable_tags: property(page, "Notable Tags", "relation").relation.map(
      (r) => r.id,
    ),
    uploaded_at: property(page, "Uploaded At", "date").date?.start ?? null,
    images: property(page, "Images", "files").files.flatMap((file) => {
      if (file.type === "file") return [file.file.url];
      if (file.type === "external") return [file.external.url];
      return [];
    }),
  };
}
export class ImageService {
  constructor(readonly repository: NotionRepository) {}
  async list() {
    const { pages, next_cursor } = await this.repository.query("image");
    return { images: pages.map(imageEntity), next_cursor };
  }
  async tags() {
    return (await this.repository.queryAll("image_tag")).map((page) => ({
      tag_name: richText(property(page, "Tag Name", "title").title),
      url: property(page, "URL", "url").url ?? "",
      tag_type: property(page, "Tag Type", "select").select?.name ?? "",
    }));
  }
}
