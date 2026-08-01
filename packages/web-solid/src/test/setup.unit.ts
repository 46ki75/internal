import { beforeEach, vi } from "vitest";

import "./setup";

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("Unexpected network request in unit test"),
  );
});
