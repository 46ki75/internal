import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  preset: "aws_lambda",
  srcDir: "server",
  // Verified against the dev HTTP API: its named stage prefixes Lambda rawPath,
  // including requests arriving through the custom domain and CloudFront.
  baseURL: "/api-gateway",
  imports: false,
  compatibilityDate: "2026-09-21",
  // Keep one Lambda entry graph; package the complete .output directory.
  inlineDynamicImports: true,
});
