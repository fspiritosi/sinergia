import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig, // Disable ESLint rules that conflict with Prettier
  {
    rules: {
      // Enforce no console.log in production code
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // React/Next.js specific
      "react/no-unescaped-entities": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // General best practices
      "prefer-const": "warn",
      "no-var": "error",
    },
  },
  // Override default ignores of eslint-config-next
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional ignores:
    "node_modules/**",
    "src/generated/**",
    "*.config.{js,ts,mjs}",
    "coverage/**",
    "playwright-report/**",
    ".auth/**",
  ]),
]);

export default eslintConfig;
