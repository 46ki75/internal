import { createSignal, type Accessor } from "solid-js";

import type { components } from "~/openapi/schema";

export type TypingItem = components["schemas"]["TypingResponse"];

export interface TypingRepository {
  copy: () => TypingItem[];
  initialized: Accessor<boolean>;
  items: Accessor<TypingItem[]>;
  replace: (items: TypingItem[]) => void;
  upsert: (item: TypingItem) => void;
  update: (item: TypingItem) => void;
}

export const upsertTypingItem = (
  items: TypingItem[],
  updatedItem: TypingItem,
): TypingItem[] => {
  const existingItem = items.find((item) => item.id === updatedItem.id);
  if (!existingItem) {
    return [...items, { ...updatedItem }];
  }

  return items.map((item) =>
    item.id === updatedItem.id
      ? {
          ...updatedItem,
          completion_count: Math.max(
            item.completion_count,
            updatedItem.completion_count,
          ),
        }
      : item,
  );
};

export const createTypingRepository = (): TypingRepository => {
  const [items, setItems] = createSignal<TypingItem[]>([]);
  const [initialized, setInitialized] = createSignal(false);
  const copy = () => items().map((item) => ({ ...item }));

  return {
    copy,
    initialized,
    items,
    replace: (nextItems) => {
      setItems(nextItems.map((item) => ({ ...item })));
      setInitialized(true);
    },
    upsert: (updatedItem) => {
      setItems((current) => upsertTypingItem(current, updatedItem));
    },
    update: (updatedItem) => {
      setItems((current) =>
        current.map((item) =>
          item.id === updatedItem.id &&
          item.completion_count < updatedItem.completion_count
            ? { ...updatedItem }
            : item,
        ),
      );
    },
  };
};

export const createTypingQueue = (repository: TypingRepository) => {
  const [items, setItems] = createSignal<TypingItem[]>([]);
  const orderedCopy = () =>
    repository
      .copy()
      .sort((left, right) => left.completion_count - right.completion_count);

  const refillIfEmpty = () => {
    setItems((current) => (current.length === 0 ? orderedCopy() : current));
  };

  const advance = (expectedId?: string) => {
    setItems((current) => {
      if (current.length === 0) {
        return orderedCopy();
      }
      if (expectedId && current[0].id !== expectedId) {
        return current;
      }

      const remaining = current.slice(1);
      return remaining.length === 0 ? orderedCopy() : remaining;
    });
  };

  const reconcile = (updatedItem: TypingItem) => {
    setItems((current) =>
      current.some((item) => item.id === updatedItem.id)
        ? upsertTypingItem(current, updatedItem)
        : current,
    );
  };

  return {
    advance,
    current: () => items()[0] ?? null,
    items,
    reconcile,
    refillIfEmpty,
  };
};
