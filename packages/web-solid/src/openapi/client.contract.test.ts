import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "~/test/server";
import { openApiClient } from "./client";
import { type components } from "./schema";

const bookmark = {
  favorite: false,
  id: "bookmark-1",
  name: "Example",
  notion_url: "https://notion.example/bookmark-1",
  nsfw: false,
  tag: null,
  url: "https://example.com",
} satisfies components["schemas"]["BookmarkResponse"];

describe("OpenAPI client transport", () => {
  it("uses the real client to serialize authorization and parse JSON", async () => {
    server.use(
      http.get("*/api/v1/bookmark", ({ request }) => {
        if (request.headers.get("authorization") !== "Bearer test-token") {
          return HttpResponse.text("Invalid token.", { status: 401 });
        }
        return HttpResponse.json([bookmark]);
      }),
    );

    const result = await openApiClient.GET("/api/v1/bookmark", {
      params: { header: { Authorization: "Bearer test-token" } },
    });

    expect(result.data).toEqual([bookmark]);
    expect(result.error).toBeUndefined();
    expect(result.response.status).toBe(200);
  });

  it("returns the response and parsed body for an HTTP error", async () => {
    server.use(
      http.get("*/api/v1/bookmark", () =>
        HttpResponse.text("Invalid token.", { status: 401 }),
      ),
    );

    const result = await openApiClient.GET("/api/v1/bookmark", {
      params: { header: { Authorization: "Bearer expired-token" } },
    });

    expect(result.data).toBeUndefined();
    expect(result.error).toBe("Invalid token.");
    expect(result.response.status).toBe(401);
  });

  it("rejects when the network fails", async () => {
    server.use(http.get("*/api/v1/bookmark", () => HttpResponse.error()));

    await expect(
      openApiClient.GET("/api/v1/bookmark", {
        params: { header: { Authorization: "Bearer test-token" } },
      }),
    ).rejects.toThrow();
  });

  it("rejects malformed JSON from a successful response", async () => {
    server.use(
      http.get(
        "*/api/v1/bookmark",
        () =>
          new HttpResponse("{", {
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(
      openApiClient.GET("/api/v1/bookmark", {
        params: { header: { Authorization: "Bearer test-token" } },
      }),
    ).rejects.toThrow(SyntaxError);
  });
});
