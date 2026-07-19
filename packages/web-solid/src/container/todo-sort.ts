import { Temporal } from "@js-temporal/polyfill";

import type { paths } from "~/openapi/schema";

export type ToDo =
  paths["/api/v1/to-do"]["get"]["responses"]["200"]["content"]["application/json"][number];
export type TodoSort = "deadline" | "severity";

type Severity = ToDo["severity"];

const severityOrder: Record<Severity, number> = {
  ERROR: 4,
  WARN: 3,
  INFO: 2,
  DEBUG: 1,
  UNKNOWN: 0,
};

export const sortTodos = (todos: readonly ToDo[], sort: TodoSort): ToDo[] => {
  const isDoneSort = (a: ToDo, b: ToDo) => {
    if (a.is_done === b.is_done) return 0;
    return a.is_done ? 1 : -1;
  };
  const deadlineSort = (a: ToDo, b: ToDo) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;

    return Temporal.PlainDate.from(a.deadline)
      .since(Temporal.PlainDate.from(b.deadline))
      .total({ unit: "day" });
  };
  const severitySort = (a: ToDo, b: ToDo) =>
    severityOrder[b.severity] - severityOrder[a.severity];

  return [...todos].sort((a, b) =>
    sort === "deadline"
      ? isDoneSort(a, b) || deadlineSort(a, b) || severitySort(a, b)
      : isDoneSort(a, b) || severitySort(a, b) || deadlineSort(a, b),
  );
};
