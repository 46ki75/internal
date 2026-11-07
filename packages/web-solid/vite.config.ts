import { solidStart } from "@solidjs/start/config";
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
  build: {
    // Older CSS targets make Lightning CSS replace light-dark() with an OS
    // media query, which ignores runtime color-scheme changes.
    cssTarget: ["chrome123", "firefox120", "safari17.5"],
  },
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
    },
    // The CSR build does not need Nitro's raw WASM path, which Vite cannot bundle for Shiki in SSR.
    wasm: false,
    prerender: {
      routes: ["/"],
      failOnError: true,
    },
  },
});
