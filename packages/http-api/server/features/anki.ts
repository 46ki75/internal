import type {
  BlockObjectRequest,
  PageObjectResponse,
  UpdatePageParameters,
} from "@notionhq/client";
import { Surface } from "n2a2ui";
import type { z } from "zod";
import type { schemas } from "../contracts.ts";
import type { NotionRepository } from "../lib/notion.ts";
import {
  property,
  required,
  richText,
  tagColors,
  text,
  unsigned,
} from "../lib/properties.ts";

export function ankiEntity(page: PageObjectResponse) {
  return {
    page_id: page.id,
    title: richText(property(page, "title", "title").title).trim() || null,
    description:
      richText(property(page, "description", "rich_text").rich_text).trim() ||
      null,
    ease_factor: required(
      property(page, "easeFactor", "number").number,
      "easeFactor",
    ),
    repetition_count: unsigned(
      required(
        property(page, "repetitionCount", "number").number,
        "repetitionCount",
      ),
    ),
    next_review_at: required(
      property(page, "nextReviewAt", "date").date,
      "nextReviewAt",
    ).start,
    created_at: page.created_time,
    updated_at: page.last_edited_time,
    tags: property(page, "tags", "multi_select").multi_select.map((tag) => ({
      ...tag,
      color: tagColors[tag.color],
    })),
    url: page.url,
    is_review_required: property(page, "isReviewRequired", "checkbox").checkbox,
  };
}

export function splitSections(surface: Surface) {
  const sections: Record<"front" | "back" | "explanation", string[]> = {
    front: [],
    back: [],
    explanation: [],
  };
  let section: keyof typeof sections = "front";
  const root = surface.components.get(surface.root);
  const children =
    root?.component === "Column" && Array.isArray(root.children)
      ? root.children
      : [];
  for (const id of children) {
    const component = surface.components.get(id);
    if (
      component?.component === "Heading" &&
      component.level === 1 &&
      Array.isArray(component.children)
    ) {
      const marker = component.children
        .map((childId) => {
          const child = surface.components.get(childId);
          return child?.component === "RichText" &&
            typeof child.text === "string"
            ? child.text
            : "";
        })
        .join("")
        .trim()
        .toLowerCase();
      if (marker === "front" || marker === "back" || marker === "explanation") {
        section = marker;
        continue;
      }
    }
    sections[section].push(id);
  }
  const build = (ids: string[]) => {
    const result = new Surface("root", surface.components);
    result.components.delete(surface.root);
    result.insert({ id: "root", component: "Column", children: ids });
    return result.toJSON();
  };
  return {
    front: build(sections.front),
    back: build(sections.back),
    explanation: build(sections.explanation),
  };
}

export class AnkiService {
  constructor(readonly repository: NotionRepository) {}
  async list(pageSize: number, cursor?: string) {
    const { pages } = await this.repository.query("anki", {
      page_size: pageSize,
      start_cursor: cursor,
      sorts: [{ property: "nextReviewAt", direction: "ascending" }],
    });
    return pages.map(ankiEntity);
  }
  async get(id: string) {
    return ankiEntity(await this.repository.getPage(id));
  }
  async blocks(id: string) {
    return splitSections(await this.repository.converter.convertBlock(id));
  }
  async create(input: z.infer<typeof schemas.CreateAnkiRequest>) {
    const children: BlockObjectRequest[] = [
      "front",
      "back",
      "explanation",
    ].flatMap((section) => [
      {
        object: "block" as const,
        type: "heading_1" as const,
        heading_1: {
          rich_text: [
            { ...text(section)[0], annotations: { color: "brown" as const } },
          ],
        },
      },
      {
        object: "block" as const,
        type: "paragraph" as const,
        paragraph: { rich_text: [] },
      },
    ]);
    return ankiEntity(
      await this.repository.createPage("anki", {
        properties: {
          title: { title: text(input.title ?? "No Title") },
          easeFactor: { number: 2.5 },
          repetitionCount: { number: 0 },
          nextReviewAt: { date: { start: new Date().toISOString() } },
        },
        children,
      }),
    );
  }
  async update(id: string, input: z.infer<typeof schemas.UpdateAnkiRequest>) {
    const properties: NonNullable<UpdatePageParameters["properties"]> = {};
    if (input.ease_factor != null)
      properties.easeFactor = { number: input.ease_factor };
    if (input.repetition_count != null)
      properties.repetitionCount = { number: input.repetition_count };
    if (input.next_review_at != null)
      properties.nextReviewAt = { date: { start: input.next_review_at } };
    if (input.is_review_required != null)
      properties.isReviewRequired = { checkbox: input.is_review_required };
    return ankiEntity(
      await this.repository.updatePage(id, {
        properties,
        in_trash: input.in_trash ?? undefined,
      }),
    );
  }
}
