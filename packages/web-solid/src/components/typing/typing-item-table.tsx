import { createUniqueId, For, Show } from "solid-js";
import { ElmInlineText } from "@elmethis/solid";
import {
  createTable,
  tableFeatures,
  type ColumnDef,
} from "@tanstack/solid-table";

import type { components } from "~/openapi/schema";
import { splitTypingCharacters } from "./create-typing-session";
import styles from "./typing-item-table.module.css";

export type TypingItem = components["schemas"]["TypingResponse"];

export interface TypingItemTableProps {
  items: TypingItem[];
}

const features = tableFeatures({});

const columns: ColumnDef<typeof features, TypingItem>[] = [
  {
    accessorKey: "text",
    header: "Practice text",
    cell: (info) => <span class={styles.text}>{info.getValue<string>()}</span>,
  },
  {
    id: "glyphs",
    accessorFn: (item) => splitTypingCharacters(item.text).length,
    header: "Glyphs",
    cell: (info) => (
      <span class={styles.glyphs}>{info.getValue<number>()}</span>
    ),
  },
];

export const TypingItemTable = (props: TypingItemTableProps) => {
  const titleId = createUniqueId();
  const table = createTable({
    features,
    get data() {
      return props.items;
    },
    columns,
    getRowId: (item) => item.id,
  });

  return (
    <section class={styles.section} aria-labelledby={titleId}>
      <header class={styles.header}>
        <h2 id={titleId}>
          <ElmInlineText>Saved exercises</ElmInlineText>
        </h2>
        <ElmInlineText
          class={styles.count}
          size="0.75rem"
          color="var(--elmethis-color-neutral-weak)"
        >
          {props.items.length} {props.items.length === 1 ? "item" : "items"}
        </ElmInlineText>
      </header>

      <div class={styles.frame}>
        <table class={styles.table}>
          <caption>Saved typing exercises</caption>
          <thead>
            <For each={table.getHeaderGroups()}>
              {(headerGroup) => (
                <tr>
                  <For each={headerGroup.headers}>
                    {(header) => (
                      <th scope="col" colSpan={header.colSpan}>
                        <Show when={!header.isPlaceholder}>
                          <table.FlexRender header={header} />
                        </Show>
                      </th>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </thead>
          <tbody>
            <Show
              when={table.getRowModel().rows.length > 0}
              fallback={
                <tr>
                  <td class={styles.empty} colSpan={columns.length}>
                    No saved exercises.
                  </td>
                </tr>
              }
            >
              <For each={table.getRowModel().rows}>
                {(row) => (
                  <tr>
                    <For each={row.getAllCells()}>
                      {(cell) => (
                        <td>
                          <table.FlexRender cell={cell} />
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>
    </section>
  );
};
