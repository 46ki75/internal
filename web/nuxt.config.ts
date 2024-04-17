// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  devServer: { port: 4000 },
  vite: {
    server: {
      proxy: {
        "/api": { target: "http://localhost:4000" },
      },
    },
  },
});
