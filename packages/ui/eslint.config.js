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
      // This rule wants every file to export only components, but shadcn/
      // Base UI primitives routinely co-export a hook or cva() variant
      // function alongside the component (e.g. `useDirection` +
      // `DirectionProvider`, `buttonVariants` + `Button`) — that's the
      // standard layout here, not a mistake. `allowConstantExport` doesn't
      // cover it (these are hooks/functions, not plain constants), and
      // this is a component-library package, not app route files, so the
      // worst case of disabling it is a full reload instead of a hot-swap
      // during local dev on this package — not a correctness issue.
      "react-refresh/only-export-components": "off",
      // Several components here wrap third-party stateful APIs (embla
      // carousel, matchMedia) and need one synchronous setState on
      // mount/ref-attach to read the external source's current value
      // before subscribing to future changes — not a cascading-render bug.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
