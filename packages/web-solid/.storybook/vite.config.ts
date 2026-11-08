import { defineConfig } from "vite";

// Keep SolidStart's route plugin out of Storybook's component-only build.
export default defineConfig({
  optimizeDeps: {
    // Elmethis stays unbundled for Solid JSX, but A2UI's CommonJS validator needs ESM interop.
    include: ["@elmethis/solid > @a2ui/web_core > validate-color"],
  },
});
