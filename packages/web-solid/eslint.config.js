import js from "@eslint/js";
import solid from "eslint-plugin-solid/configs/typescript";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import vitest from "@vitest/eslint-plugin";

export default defineConfig([
  globalIgnores([
    ".output",
    ".vinxi",
    "node_modules",
    "storybook-static",
    "src/openapi/schema.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      solid,
    ],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "all"],
      "consistent-return": "error",
      "default-case-last": "error",
      "guard-for-in": "error",
      radix: "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { minimumDescriptionLength: 10 },
      ],
      "@typescript-eslint/no-meaningless-void-operator": "error",
      "@typescript-eslint/no-misused-spread": "error",
      "@typescript-eslint/no-mixed-enums": "error",
      "@typescript-eslint/no-useless-default-assignment": "error",
      "@typescript-eslint/related-getter-setter-pairs": "error",
      "@typescript-eslint/return-await": [
        "error",
        "error-handling-correctness-only",
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/unbound-method": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.{spec,test}.{ts,tsx}"],
    extends: [vitest.configs.recommended],
    rules: {
      "@typescript-eslint/await-thenable": "warn",
    },
  },
]);
