import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["tests/**/*.live.test.ts", "tests/**/*.lambda.test.ts"],
    restoreMocks: true,
  },
});
