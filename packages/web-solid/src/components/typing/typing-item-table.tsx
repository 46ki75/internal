import { createUniqueId, For, Show } from "solid-js";
import { ElmHeading, ElmInlineText } from "@elmethis/solid";
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/solid-table";

import { splitTypingCharacters } from "./create-typing-session";
import styles from "./typing-item-table.module.css";

export interface TypingItem {
  completion_count: number;
  description: string;
  id: string;
  text: string;
}

export interface TypingItemTableProps {
  items: TypingItem[];
}

const columns: ColumnDef<TypingItem>[] = [
  {
    accessorKey: "description",
    header: "Description",
    cell: (info) => (
      <div class={styles.description}>
        <span>{info.getValue<string>()}</span>
        <code>{info.row.original.id}</code>
      </div>
    ),
  },
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
  {
    accessorKey: "completion_count",
    header: "Completions",
    cell: (info) => (
      <span class={styles.completionCount}>{info.getValue<number>()}</span>
    ),
  },
];

export const TypingItemTable = (props: TypingItemTableProps) => {
  const titleId = createUniqueId();
  const table = createSolidTable({
    get data() {
      return props.items;
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (item) => item.id,
  });

  return (
    <section class={styles.section} aria-labelledby={titleId}>
      <header class={styles.header}>
        <ElmHeading level={2} id={titleId}>
          Saved exercises
        </ElmHeading>
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
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
                    <For each={row.getVisibleCells()}>
                      {(cell) => (
                        <td>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
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
