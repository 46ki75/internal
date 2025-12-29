import { defineNuxtConfig } from "nuxt/config";
import { fetchSSMParameter } from "./utils/fetchSsmParameter";

const STAGE_NAME = process.env.STAGE_NAME ?? "dev";

const USER_POOL_ID = await fetchSSMParameter(
  `/${STAGE_NAME}/46ki75/internal/cognito/userpool/id`
);

const USER_POOL_CLIENT_ID = await fetchSSMParameter(
  `/${STAGE_NAME}/46ki75/internal/cognito/userpool/client/id`
);

const ENDPOINT = `https://${
  STAGE_NAME === "prod" ? "internal" : STAGE_NAME + "-internal"
}.46ki75.com`;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  devServer: {
    host: "127.0.0.1",
    port: 20000,
  },
  vite: {
    server: {
      proxy: {
        "/api": {
          target: `${ENDPOINT}`,
          changeOrigin: true,
        },
      },
    },
    css: {},
  },
  modules: ["@pinia/nuxt"],
  runtimeConfig: {
    public: {
      USER_POOL_ID,
      USER_POOL_CLIENT_ID,
    },
  },
  postcss: {
    plugins: {
      cssnano: {},
      autoprefixer: {},
      "postcss-preset-env": {
        stage: 3,
      },
    },
  },
  app: {
    head: {
      title: "Home",
      link: [
        {
          rel: "icon",
          href: "/favicon.svg",
        },
        {
          rel: "manifest",
          href: "/manifest.json",
        },
      ],
    },
  },
});
