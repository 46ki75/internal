import { describe, expect, it } from "vitest";

import { sortTodos } from "./todo-sort";

const todo = (
  id: string,
  deadline: string | null,
  severity: "UNKNOWN" | "DEBUG" | "INFO" | "WARN" | "ERROR",
  isDone = false,
) => ({
  id,
  title: id,
  url: `https://www.notion.so/${id}`,
  deadline,
  severity,
  is_done: isDone,
  is_archived: false,
  is_recurring: false,
  source: "test",
});

describe("sortTodos", () => {
  it("keeps completed todos last and applies deadline priorities", () => {
    const input = [
      todo("done", "2026-01-01", "ERROR", true),
      todo("later", "2026-02-01", "ERROR"),
      todo("none", null, "ERROR"),
      todo("first", "2026-01-01", "INFO"),
    ];

    expect(sortTodos(input, "deadline").map(({ id }) => id)).toEqual([
      "first",
      "later",
      "none",
      "done",
    ]);
    expect(input.map(({ id }) => id)).toEqual([
      "done",
      "later",
      "none",
      "first",
    ]);
  });

  it("uses severity before deadline when requested", () => {
    const input = [
      todo("info", "2026-01-01", "INFO"),
      todo("error-later", "2026-03-01", "ERROR"),
      todo("error-first", "2026-02-01", "ERROR"),
    ];

    expect(sortTodos(input, "severity").map(({ id }) => id)).toEqual([
      "error-first",
      "error-later",
      "info",
    ]);
  });
});
