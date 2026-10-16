import { createSignal, type Accessor } from "solid-js";
import { shuffle } from "es-toolkit";

import type { components } from "~/openapi/schema";

export type TypingItem = components["schemas"]["TypingResponse"];

export interface TypingRepository {
  copy: () => TypingItem[];
  initialized: Accessor<boolean>;
  items: Accessor<TypingItem[]>;
  replace: (items: TypingItem[]) => void;
}

export const createTypingRepository = (): TypingRepository => {
  const [items, setItems] = createSignal<TypingItem[]>([]);
  const [initialized, setInitialized] = createSignal(false);

  return {
    copy: () => items().map((item) => ({ ...item })),
    initialized,
    items,
    replace: (nextItems) => {
      setItems(
        nextItems.map((item) => ({
          ...item,
          text: item.text.replace(/[‘’]/g, "'"),
        })),
      );
      setInitialized(true);
    },
  };
};

export const createTypingQueue = (repository: TypingRepository) => {
  const [items, setItems] = createSignal<TypingItem[]>([]);
  const shuffledCopy = () => shuffle(repository.copy());

  const refillIfEmpty = () => {
    setItems((current) => (current.length === 0 ? shuffledCopy() : current));
  };

  const advance = (expectedId?: string) => {
    setItems((current) => {
      if (current.length === 0) {
        return shuffledCopy();
      }
      if (expectedId && current[0].id !== expectedId) {
        return current;
      }

      const remaining = current.slice(1);
      return remaining.length === 0 ? shuffledCopy() : remaining;
    });
  };

  return {
    advance,
    current: () => items()[0] ?? null,
    items,
    refillIfEmpty,
  };
};
