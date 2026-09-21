import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client";

type Property = PageObjectResponse["properties"][string];
export function property<T extends Property["type"]>(
  page: PageObjectResponse,
  name: string,
  type: T,
): Extract<Property, { type: T }> {
  const value = page.properties[name];
  if (!value || value.type !== type)
    throw new Error(`Notion property not found: ${name}`);
  return value as Extract<Property, { type: T }>;
}
export function richText(items: RichTextItemResponse[]) {
  return items.map((item) => item.plain_text).join("");
}
export function required<T>(value: T | null | undefined, name: string): T {
  if (value == null) throw new Error(`Notion property not found: ${name}`);
  return value;
}
export function unsigned(value: number) {
  return Math.min(4294967295, Math.max(0, Math.trunc(value)));
}
export function text(content: string) {
  return [{ type: "text" as const, text: { content } }];
}

// Preserve the application's existing palette, including its gray/green mapping.
export const tagColors = {
  default: "#868e9c",
  blue: "#6987b8",
  brown: "#a17c5b",
  gray: "#59b57c",
  green: "#59b57c",
  orange: "#d48b70",
  pink: "#c9699e",
  purple: "#9771bd",
  red: "#c56565",
  yellow: "#cdb57b",
} as const;

export function pageIcon(icon: PageObjectResponse["icon"]): string | null {
  switch (icon?.type) {
    case "emoji":
      return icon.emoji;
    case "external":
      return icon.external.url;
    case "file":
      return icon.file.url;
    case "custom_emoji":
      return icon.custom_emoji.url ?? null;
    case "icon":
      return icon.icon.name;
    default:
      return null;
  }
}
