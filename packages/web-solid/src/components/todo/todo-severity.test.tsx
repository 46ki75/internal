import { render } from "@solidjs/testing-library";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmMdiIcon: () => <span aria-hidden="true" />,
}));

import { TodoSeverity } from "./todo-severity";

it.each(["UNKNOWN", "DEBUG", "INFO", "WARN", "ERROR"] as const)(
  "renders the %s severity",
  (severity) => {
    const result = render(() => <TodoSeverity severity={severity} />);

    expect(result.getByText(severity)).toBeVisible();
  },
);
