import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createServer,
  loadConfigFromFile,
  mergeConfig,
  type UserConfig,
  type ViteDevServer,
} from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("development proxy", () => {
  const requests: Array<{
    url: string | undefined;
    method: string | undefined;
    headers: Record<string, unknown>;
    body: string;
  }> = [];
  const upstream = createHttpServer((request, response) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        chunks.push(Buffer.from(chunk as Uint8Array));
      }
      requests.push({
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: Buffer.concat(chunks).toString(),
      });
      if (request.headers.authorization) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify([{ id: "bookmark-1", name: "Favorite" }]));
      } else {
        response.writeHead(401, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ message: "Unauthorized" }));
      }
    })().catch((error: unknown) => response.destroy(error as Error));
  });
  let vite: ViteDevServer | undefined;
  let config: UserConfig;
  let directory: string;
  let origin: string;
  let upstreamHost: string;

  beforeAll(async () => {
    upstream.listen(0, "127.0.0.1");
    await once(upstream, "listening");
    const address = upstream.address();
    if (!address || typeof address === "string") {
      throw new Error("Upstream did not bind a TCP port");
    }
    upstreamHost = `127.0.0.1:${address.port}`;
    directory = await mkdtemp(join(tmpdir(), "internal-dev-proxy-"));
    const root = fileURLToPath(new URL("../../", import.meta.url));
    const loaded = await loadConfigFromFile(
      { command: "serve", mode: "development" },
      join(root, "vite.config.ts"),
      root,
      "error",
    );
    if (!loaded) {
      throw new Error("Could not load the application Vite config");
    }
    config = loaded.config;
    // Replace external services before Nitro initializes from the app configuration.
    for (const proxies of [
      loaded.config.server?.proxy,
      loaded.config.nitro?.devProxy,
    ]) {
      for (const proxy of Object.values<unknown>(proxies ?? {})) {
        if (proxy && typeof proxy === "object" && "target" in proxy) {
          proxy.target = `http://${upstreamHost}`;
        }
      }
    }
    vite = await createServer(
      mergeConfig(loaded.config, {
        root,
        configFile: false,
        cacheDir: join(directory, "vite"),
        logLevel: "error",
        server: { host: "127.0.0.1", port: 0, watch: null, ws: false },
        nitro: { buildDir: join(directory, "nitro") },
      }),
    );
    await vite.listen();
    const viteAddress = vite.httpServer?.address();
    if (!viteAddress || typeof viteAddress === "string") {
      throw new Error("Vite did not bind a TCP port");
    }
    origin = `http://127.0.0.1:${viteAddress.port}`;
  }, 30_000);

  afterAll(async () => {
    await vite?.close();
    upstream.closeAllConnections();
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
    if (directory) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("configures only the API proxy without development request middleware", () => {
    expect(Object.keys(config.nitro?.devProxy ?? {})).toEqual(["/api/**"]);
    expect(config.server?.proxy ?? {}).toEqual({});
    expect(config.nitro?.devHandlers ?? []).toEqual([]);
  });

  it.each([
    ["Elmethis", ["@elmethis/solid", "@a2ui/web_core", "validate-color"]],
    [
      "SolidStart's dev toolbar",
      [
        "@solidjs/start",
        "@jridgewell/trace-mapping",
        "@jridgewell/resolve-uri",
      ],
    ],
  ])("prebundles nested CommonJS dependencies used by %s", async (_, chain) => {
    const client = vite!.environments.client;
    let id: string | undefined;
    for (const dependency of chain) {
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

  it("forwards API paths, query strings, and authorization instead of rendering HTML", async () => {
    const response = await fetch(`${origin}/api/v1/bookmark?refresh=true`, {
      headers: { Authorization: "Bearer test-token" },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual([
      { id: "bookmark-1", name: "Favorite" },
    ]);
    expect(requests.at(-1)).toMatchObject({
      url: "/api/v1/bookmark?refresh=true",
      method: "GET",
      headers: { authorization: "Bearer test-token", host: upstreamHost },
    });
  });

  it("preserves API error status and JSON", async () => {
    const response = await fetch(`${origin}/api/v1/bookmark`, {
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Unauthorized" });
    expect(requests.at(-1)?.headers).not.toHaveProperty("authorization");
  });
});
