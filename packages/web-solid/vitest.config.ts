import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solid()],
        resolve: {
          alias: {
            "~": fileURLToPath(new URL("./src", import.meta.url)),
          },
        },
        test: {
          name: "app",
          environment: "happy-dom",
          setupFiles: ["./src/test/setup.ts"],
          exclude: [...configDefaults.exclude, "src/test/dev-proxy.test.ts"],
        },
      },
      {
        // Nitro's workers must use Node exports rather than Solid's browser conditions.
        test: {
          name: "dev-server",
          environment: "node",
          include: ["src/test/dev-proxy.test.ts"],
        },
      },
    ],
  },
});
