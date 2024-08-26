// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import jest from "eslint-plugin-jest";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  eslintPluginPrettierRecommended,
  {
    ignores: ["**/out", "**/dist", "**/node_modules", "**/.next", "**/cdk.out", "packages/site/src/components/ui"],
  },
  {
    rules: {
      // https://typescript-eslint.io/rules/no-unused-vars/#benefits-over-typescript
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.js"],
    ...jest.configs["flat/recommended"],
    rules: {
      ...jest.configs["flat/recommended"].rules,
      "jest/prefer-expect-assertions": "off",
    },
  },
);
