import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
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
          exclude: ["src/**/*.contract.{test,spec}.{ts,tsx}"],
          setupFiles: ["./src/test/setup.unit.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "contract",
          environment: "happy-dom",
          include: ["src/**/*.contract.{test,spec}.{ts,tsx}"],
          setupFiles: ["./src/test/setup.contract.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["tests/browser/**/*.{test,spec}.{ts,tsx}"],
          setupFiles: ["./src/test/setup.browser.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
