import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Every TanStack Router file-route exports `const Route =
      // createFileRoute(...)` alongside its component by convention (and
      // shadcn/Base UI components co-export hooks/cva() functions the same
      // way) — that's the file-based-routing layout, not a fast-refresh
      // hazard. Worst case without this rule is a full reload instead of a
      // hot-swap during local dev, not a correctness issue.
      "react-refresh/only-export-components": "off",
    },
  },
]);
