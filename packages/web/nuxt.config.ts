import { fetchSSMParameter } from "./utils/fetchSsmParameter";

if (process.env.STAGE_NAME == null) {
  throw new Error("STAGE_NAME is not set");
} else {
  console.log(`STAGE_NAME: ${process.env.STAGE_NAME}`);
}

const USER_POOL_ID = await fetchSSMParameter(
  `/${process.env.STAGE_NAME}/46ki75/internal/cognito/userpool/id`
);

const USER_POOL_CLIENT_ID = await fetchSSMParameter(
  `/${process.env.STAGE_NAME}/46ki75/internal/cognito/userpool/client/id`
);

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  ssr: false,
  devServer: {
    host: "127.0.0.1",
    port: 20000,
  },
  vite: {
    server: {
      proxy: {
        "/api/graphql": {
          target: "http://localhost:9000/lambda-url/internal-graphql",
          changeOrigin: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
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
});
