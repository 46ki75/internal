import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Vite plugins resolve the root environment before Vitest selects a project.
    environment: "happy-dom",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "happy-dom",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: ["src/**/*.integration.{test,spec}.{ts,tsx}"],
          setupFiles: ["./src/test/setup.unit.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "happy-dom",
          include: ["src/**/*.integration.{test,spec}.{ts,tsx}"],
          setupFiles: ["./src/test/setup.integration.ts"],
        },
      },
    ],
  },
});
