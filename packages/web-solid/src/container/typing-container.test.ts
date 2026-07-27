import { describe, expect, it } from "vitest";

import {
  createTypingQueue,
  createTypingRepository,
  type TypingItem,
} from "./typing-model";

const typingItem = (id: string, completionCount: number): TypingItem => ({
  completion_count: completionCount,
  description: `${id} exercise`,
  id,
  text: id,
});

describe("typing repository and queue", () => {
  it("copies repository items into a queue ordered by completion count", () => {
    const repository = createTypingRepository();
    const queue = createTypingQueue(repository);
    const fetchedItems = [
      typingItem("third", 3),
      typingItem("first", 0),
      typingItem("second", 1),
    ];

    repository.replace(fetchedItems);
    queue.refillIfEmpty();
    fetchedItems[1].completion_count = 10;

    expect(repository.initialized()).toBe(true);
    expect(repository.items()[1].completion_count).toBe(0);
    expect(queue.items().map(({ id }) => id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("refills from updated repository items after consuming the queue", () => {
    const repository = createTypingRepository();
    const queue = createTypingQueue(repository);

    repository.replace([typingItem("second", 2), typingItem("first", 0)]);
    queue.refillIfEmpty();

    repository.update(typingItem("first", 1));
    queue.advance("first");
    expect(queue.current()?.id).toBe("second");

    repository.update(typingItem("second", 3));
    queue.advance("second");
    expect(queue.items().map(({ id }) => id)).toEqual(["first", "second"]);
  });

  it("does not advance twice when an expected item is no longer current", () => {
    const repository = createTypingRepository();
    const queue = createTypingQueue(repository);

    repository.replace([typingItem("first", 0), typingItem("second", 0)]);
    queue.refillIfEmpty();
    queue.advance();
    queue.advance("first");

    expect(queue.current()?.id).toBe("second");
  });

  it("ignores an older background completion response", () => {
    const repository = createTypingRepository();

    repository.replace([typingItem("first", 0)]);
    repository.update(typingItem("first", 2));
    repository.update(typingItem("first", 1));

    expect(repository.items()[0].completion_count).toBe(2);
  });
});
