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
  server: {
    headers: { "Cache-Control": "public, max-age=0" },
    port: 11070,
    proxy: {
      "/api": {
        target: endpoint,
        changeOrigin: true,
      },
      "/invocations": {
        target: endpoint,
        changeOrigin: true,
        configure(proxy: {
          on: (
            event: "proxyReq",
            listener: (request: {
              removeHeader: (name: string) => void;
            }) => void,
          ) => void;
        }) {
          proxy.on("proxyReq", (proxyRequest) => {
            proxyRequest.removeHeader("cookie");
            proxyRequest.removeHeader("sec-fetch-site");
            proxyRequest.removeHeader("sec-fetch-mode");
            proxyRequest.removeHeader("sec-fetch-dest");
          });
        },
      },
    },
  },
  nitro: {
    // The CSR build does not need Nitro's raw WASM path, which Vite cannot bundle for Shiki in SSR.
    wasm: false,
    prerender: {
      routes: ["/"],
      failOnError: true,
    },
  },
});
