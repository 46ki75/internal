import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createServer,
  loadConfigFromFile,
  mergeConfig,
  type ViteDevServer,
} from "vite";
import solid from "vite-plugin-solid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import storybook from "../../.storybook/main";

describe("Storybook development dependencies", () => {
  let vite: ViteDevServer | undefined;
  let directory: string;
  let origin: string;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "internal-storybook-"));
    const root = fileURLToPath(new URL("../../", import.meta.url));
    const loaded = await loadConfigFromFile(
      { command: "serve", mode: "development" },
      join(root, storybook.framework.options.builder.viteConfigPath),
      root,
      "error",
    );
    if (!loaded) {
      throw new Error("Could not load the Storybook Vite config");
    }
    vite = await createServer(
      mergeConfig(await storybook.viteFinal(loaded.config), {
        root,
        configFile: false,
        // Storybook's Solid framework adds this plugin to the isolated config.
        plugins: [solid()],
        cacheDir: join(directory, "vite"),
        logLevel: "error",
        optimizeDeps: { entries: [] },
        server: { host: "127.0.0.1", port: 0, watch: null, ws: false },
      }),
    );
    await vite.listen();
    const address = vite.httpServer?.address();
    if (!address || typeof address === "string") {
      throw new Error("Storybook Vite server did not bind a TCP port");
    }
    origin = `http://127.0.0.1:${address.port}`;
  }, 30_000);

  afterAll(async () => {
    await vite?.close();
    if (directory) {
      await rm(directory, { recursive: true, force: true, maxRetries: 3 });
    }
  });

  it("keeps the SolidStart application and API proxy out of Storybook", () => {
    expect(vite!.config.nitro).toBeUndefined();
    expect(vite!.config.server.proxy ?? {}).toEqual({});
  });

  it("serves Elmethis's nested CommonJS validator with an ESM default export", async () => {
    const client = vite!.environments.client;
    const elmethis = await client.pluginContainer.resolveId("@elmethis/solid");
    expect(elmethis).not.toBeNull();
    expect(elmethis!.id).not.toContain(join(directory, "vite", "deps"));

    let id = elmethis!.id;
    for (const dependency of ["@a2ui/web_core", "validate-color"]) {
      const resolved = await client.pluginContainer.resolveId(dependency, id);
      expect(resolved).not.toBeNull();
      id = resolved!.id;
    }
    expect(id).toContain(join(directory, "vite", "deps"));

    const response = await fetch(`${origin}/@fs/${id}`, {
      signal: AbortSignal.timeout(10_000),
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toMatch(
      /\bexport\s+default\b|\bas\s+default\b/,
    );
  });
});
