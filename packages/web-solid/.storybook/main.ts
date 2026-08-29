import type { StorybookConfig } from "storybook-solidjs-vite";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

const config = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "storybook-solidjs-vite",
    options: {
      builder: {
        viteConfigPath: ".storybook/vite.config.ts",
      },
    },
  },
  viteFinal: async (baseConfig) =>
    mergeConfig(baseConfig, {
      resolve: {
        alias: {
          "~": fileURLToPath(new URL("../src", import.meta.url)),
        },
      },
    }),
} satisfies StorybookConfig;

export default config;
