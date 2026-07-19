import type { BookmarkProps } from "~/components/bookmark/bookmark";
import type { components } from "~/openapi/schema";

type BookmarkResponse = components["schemas"]["BookmarkResponse"];

export const mapBookmarkResponse = (
  bookmark: BookmarkResponse,
): BookmarkProps => ({
  id: bookmark.id,
  icon: bookmark.favicon ?? undefined,
  label: bookmark.name || bookmark.url || "No Title",
  favorite: bookmark.favorite,
  url: bookmark.url || "https://example.com",
  editUrl: bookmark.notion_url,
  tag: bookmark.tag
    ? {
        id: bookmark.tag.id,
        name: bookmark.tag.name,
        color: bookmark.tag.color,
      }
    : {
        id: "__untagged__",
        name: "Untagged",
        color: "gray",
      },
});
