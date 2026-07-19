import { describe, expect, it } from "vitest";

import { surfaceToMessages } from "./surface-to-messages";

describe("surfaceToMessages", () => {
  it("converts a surface component map into ordered A2UI messages", () => {
    const first = { id: "first", component: "Text" };
    const second = { id: "second", component: "Image" };

    expect(
      surfaceToMessages(
        {
          root: "first",
          components: { first, second },
        },
        "card-front",
      ),
    ).toEqual([
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "card-front",
          catalogId:
            "https://46ki75.github.io/elmethis/a2ui/v0_9/block_catalog.json",
        },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "card-front",
          components: [first, second],
        },
      },
    ]);
  });

  it.each([null, undefined, "surface", 1])(
    "returns no messages for invalid input %s",
    (raw) => {
      expect(surfaceToMessages(raw, "surface-id")).toEqual([]);
    },
  );
});
