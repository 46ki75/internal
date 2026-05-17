import { ssgAdapter } from "@qwik.dev/router/adapters/ssg/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config";

const ENDPOINT = `https://${
  process.env.VITE_STAGE_NAME === "prod"
    ? "internal"
    : process.env.VITE_STAGE_NAME + "-internal"
}.46ki75.com`;

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["@qwik-router-config"],
      },
    },
    plugins: [
      ssgAdapter({
        origin: ENDPOINT,
      }),
    ],
  };
});
