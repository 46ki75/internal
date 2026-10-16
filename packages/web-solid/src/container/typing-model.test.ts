import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createTypingQueue,
  createTypingRepository,
  type TypingItem,
} from "./typing-model";

const typingItem = (id: string): TypingItem => ({
  id,
  text: id,
  url: `https://www.notion.so/${id}`,
});

afterEach(() => vi.restoreAllMocks());

describe("typing repository and shuffled queue", () => {
  it.each([
    ["It’s the dog’s toy.", "It's the dog's toy."],
    ["‘Hello,’ she said.", "'Hello,' she said."],
    ["  “Don't change this.”\n👍  ", "  “Don't change this.”\n👍  "],
    ["", ""],
  ])(
    "normalizes curly apostrophes in %j without changing the source",
    (text, expected) => {
      const repository = createTypingRepository();
      const queue = createTypingQueue(repository);
      const fetchedItem = { ...typingItem("sentence"), text };

      repository.replace([fetchedItem]);
      queue.refillIfEmpty();

      expect(repository.items()).toEqual([{ ...fetchedItem, text: expected }]);
      expect(queue.current()).toEqual({ ...fetchedItem, text: expected });
      expect(fetchedItem.text).toBe(text);
    },
  );

  it("shuffles a copy of all fetched exercises without changing the source", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const repository = createTypingRepository();
    const queue = createTypingQueue(repository);
    const fetchedItems = [
      typingItem("first"),
      typingItem("second"),
      typingItem("third"),
    ];

    repository.replace(fetchedItems);
    queue.refillIfEmpty();
    fetchedItems[0].text = "Changed outside the repository";

    expect(repository.initialized()).toBe(true);
    expect(repository.items().map(({ id }) => id)).toEqual([
      "first",
      "second",
      "third",
    ]);
    expect(repository.items()[0].text).toBe("first");
    expect(queue.items().map(({ id }) => id)).toEqual([
      "second",
      "third",
      "first",
    ]);
    expect(queue.items()[2]).not.toBe(repository.items()[0]);
  });

  it("consumes every exercise once before reshuffling the full list", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    const repository = createTypingRepository();
    const queue = createTypingQueue(repository);
    repository.replace([
      typingItem("first"),
      typingItem("second"),
      typingItem("third"),
    ]);
    queue.refillIfEmpty();
    random.mockReturnValue(0.99);

    queue.advance("second");
    expect(queue.current()?.id).toBe("third");
    queue.advance("third");
    expect(queue.current()?.id).toBe("first");
    queue.advance("first");
    expect(queue.items().map(({ id }) => id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("does not advance twice when an expected exercise is no longer current", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const repository = createTypingRepository();
    const queue = createTypingQueue(repository);
    repository.replace([typingItem("first"), typingItem("second")]);
    queue.refillIfEmpty();
    queue.advance();
    queue.advance("first");
    expect(queue.current()?.id).toBe("second");
  });

  it("leaves an active cycle intact and uses refreshed Notion entries next cycle", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const repository = createTypingRepository();
    const queue = createTypingQueue(repository);
    repository.replace([typingItem("first"), typingItem("second")]);
    queue.refillIfEmpty();
    repository.replace([typingItem("third")]);
    queue.refillIfEmpty();
    expect(queue.current()?.id).toBe("first");
    queue.advance();
    expect(queue.current()?.id).toBe("second");
    queue.advance();
    expect(queue.current()?.id).toBe("third");
  });

  it("handles empty and single-exercise data sources", () => {
    const repository = createTypingRepository();
    const queue = createTypingQueue(repository);
    repository.replace([]);
    queue.refillIfEmpty();
    queue.advance();
    expect(repository.initialized()).toBe(true);
    expect(queue.current()).toBeNull();

    repository.replace([typingItem("only")]);
    queue.refillIfEmpty();
    const previous = queue.current();
    queue.advance();
    expect(queue.current()).toEqual(typingItem("only"));
    expect(queue.current()).not.toBe(previous);
  });
});
