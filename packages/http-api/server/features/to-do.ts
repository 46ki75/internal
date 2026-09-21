import type {
  CreatePageParameters,
  PageObjectResponse,
} from "@notionhq/client";
import type { z } from "zod";
import { schemas } from "../contracts.ts";
import type { NotionRepository } from "../lib/notion.ts";
import { property, richText, text } from "../lib/properties.ts";

export function toDoEntity(page: PageObjectResponse) {
  const description = page.properties.Description;
  const descriptionText =
    description?.type === "rich_text" ? richText(description.rich_text) : "";
  const deadline = page.properties.Deadline;
  const severity = page.properties.Severity;
  const severityValue = schemas.ToDoSeverityResponse.safeParse(
    severity?.type === "select" ? severity.select?.name : undefined,
  );
  return {
    id: page.id,
    url: page.url,
    source: "Notion:todo",
    title: richText(property(page, "Title", "title").title),
    description: descriptionText.trim() ? descriptionText : null,
    is_done: property(page, "IsDone", "checkbox").checkbox,
    is_archived: property(page, "IsArchived", "checkbox").checkbox,
    is_recurring: property(page, "IsRecurring", "checkbox").checkbox,
    deadline:
      deadline?.type === "date"
        ? (deadline.date?.start.slice(0, 10) ?? null)
        : null,
    severity: severityValue.success ? severityValue.data : ("UNKNOWN" as const),
    created_at: page.created_time.slice(0, 10),
    updated_at: page.last_edited_time.slice(0, 10),
  };
}

export class ToDoService {
  constructor(readonly repository: NotionRepository) {}
  async list() {
    return (
      await this.repository.queryAll("todo", {
        filter: {
          and: [
            { property: "IsArchived", checkbox: { equals: false } },
            { property: "Type", select: { equals: "To Do" } },
          ],
        },
      })
    ).map(toDoEntity);
  }
  async create(input: z.infer<typeof schemas.CreateToDoRequest>) {
    const properties: CreatePageParameters["properties"] = {
      Title: { title: text(input.title) },
      Type: { select: { name: "To Do" } },
      Severity: { select: { name: input.severity ?? "UNKNOWN" } },
    };
    if (input.description != null)
      properties.Description = { rich_text: text(input.description) };
    if (input.deadline != null)
      properties.Deadline = { date: { start: input.deadline } };
    return toDoEntity(await this.repository.createPage("todo", { properties }));
  }
  async update(input: z.infer<typeof schemas.UpdateToDoInput>) {
    return toDoEntity(
      await this.repository.updatePage(input.id, {
        properties: { IsDone: { checkbox: input.is_done } },
      }),
    );
  }
}
