// ESLint flat config — bug-catching only, Prettier handles all style.
// Think of this like -Wall -Werror in gcc, but for JavaScript/TypeScript.
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // ── Dead code detection (like -Wunused-variable) ──────────────
      "no-unused-vars": "off", // Disable base rule — TS version is smarter
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }, // Allow _req, _next etc.
      ],

      // ── Async/Promise bugs (most common JS footgun) ───────────────
      "@typescript-eslint/no-floating-promises": "error", // Forgot to await
      "@typescript-eslint/no-misused-promises": "error", // Async fn where sync expected
      "@typescript-eslint/await-thenable": "error", // await on non-Promise

      // ── Type safety ───────────────────────────────────────────────
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",

      // ── Logic bugs (like -Wall basics) ────────────────────────────
      "no-constant-condition": "error",
      "no-debugger": "error",
      "no-duplicate-case": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-fallthrough": "error",
      "no-unreachable": "error",

      // ── Variable hygiene ──────────────────────────────────────────
      "prefer-const": "warn", // Use const unless you reassign
      "no-var": "error", // var is function-scoped (legacy), let/const are block-scoped
    },
  },
  prettier, // Must be last — disables any rules that conflict with Prettier
];
