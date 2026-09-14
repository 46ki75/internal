import { solidStart } from "@solidjs/start/config";
import { fromNodeMiddleware } from "nitro/h3";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const stage = process.env.VITE_STAGE_NAME ?? "dev";

if (!(["dev", "stg", "prod"] as const).includes(stage as never)) {
  throw new Error(`Invalid VITE_STAGE_NAME: ${stage}`);
}

const endpoint = `https://${stage === "prod" ? "internal" : `${stage}-internal`}.46ki75.com`;

export default defineConfig({
  plugins: [
    solidStart({
      ssr: false,
      serialization: { mode: "json" },
    }),
    nitro(),
  ],
  server: {
    headers: { "Cache-Control": "public, max-age=0" },
    port: 11070,
  },
  nitro: {
    // Nitro handles extensionless requests before Vite's server.proxy middleware.
    devProxy: {
      "/api/**": {
        target: endpoint,
        changeOrigin: true,
      },
      "/invocations": {
        target: endpoint,
        changeOrigin: true,
      },
    },
    devHandlers: [
      {
        route: "/invocations",
        middleware: true,
        handler: fromNodeMiddleware((request, _response, next) => {
          delete request.headers.cookie;
          delete request.headers["sec-fetch-site"];
          delete request.headers["sec-fetch-mode"];
          delete request.headers["sec-fetch-dest"];
          next();
        }),
      },
    ],
    // The CSR build does not need Nitro's raw WASM path, which Vite cannot bundle for Shiki in SSR.
    wasm: false,
    prerender: {
      routes: ["/"],
      failOnError: true,
    },
  },
});
