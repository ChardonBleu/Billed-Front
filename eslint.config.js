import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    ignores: [
      "src/__tests__/*",
      "src/__mocks__/*",
      "coverage/*",
      "setup-jest.js",
      "block-navigation.js",
    ],
    rules: {
      "no-undef": "warn",
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: { globals: globals.browser },
  },
  pluginReact.configs.flat.recommended,
]);
