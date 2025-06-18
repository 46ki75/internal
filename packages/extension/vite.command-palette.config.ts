import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    lib: {
      entry: "./src/command-palette/main.ts",
      formats: ["iife"],
      name: "ContentScript",
      fileName: () => "command-palette.iife.js",
      cssFileName: "command-palette",
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
