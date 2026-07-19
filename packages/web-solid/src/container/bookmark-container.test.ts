import { describe, expect, it } from "vitest";

import { mapBookmarkResponse } from "./bookmark-model";

describe("mapBookmarkResponse", () => {
  it("maps API fallbacks and the untagged group", () => {
    expect(
      mapBookmarkResponse({
        id: "bookmark-1",
        favorite: false,
        notion_url: "https://www.notion.so/bookmark-1",
        nsfw: false,
      }),
    ).toEqual({
      id: "bookmark-1",
      icon: undefined,
      label: "No Title",
      favorite: false,
      url: "https://example.com",
      editUrl: "https://www.notion.so/bookmark-1",
      tag: { id: "__untagged__", name: "Untagged", color: "gray" },
    });
  });
});
