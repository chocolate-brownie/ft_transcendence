// ESLint flat config — bug-catching only, Prettier handles all style.
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    rules: {
      // ── Dead code detection ───────────────────────────────────────
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],

      // ── Async/Promise bugs ────────────────────────────────────────
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",

      // ── Type safety ───────────────────────────────────────────────
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",

      // ── Logic bugs ────────────────────────────────────────────────
      "no-constant-condition": "error",
      "no-debugger": "error",
      "no-duplicate-case": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-fallthrough": "error",
      "no-unreachable": "error",

      // ── Variable hygiene ──────────────────────────────────────────
      "prefer-const": "warn",
      "no-var": "error",

      // ── React hooks (prevents subtle state bugs) ──────────────────
      "react-hooks/rules-of-hooks": "error", // Hooks must be called at top level
      "react-hooks/exhaustive-deps": "warn", // useEffect must list all dependencies
    },
  },
  prettier,
];
