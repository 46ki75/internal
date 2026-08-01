import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "live",
    environment: "node",
    include: ["tests/live/**/*.live.test.ts"],
    testTimeout: 15_000,
  },
});
