// eslint.config.js
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default [
    js.configs.recommended,          // eslint:recommended 대체
    tseslint.configs.recommended, // plugin:@typescript-eslint/recommended 대체
    prettier,                        // plugin:prettier/recommended 대체
    {
      ignores: ["dist/**", "node_modules/**"],
    },
    {
        files: ["**/*.{ts,tsx,js,jsx}"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                // project: "./tsconfig.json",
            },
              env: {
                browser: true,
                node: true,
            },
            globals: {
                ...tseslint.environments.es2021.globals,
                ...tseslint.environments.browser.globals,
            },
        },
        rules: {
            // 필요 없는 규칙 끄기 / 프로젝트 맞춤 규칙 추가
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "no-redeclare": "off",
            "@typescript-eslint/no-redeclare": "off",

            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-unused-expressions": "off",
            "no-useless-escape": "off",

            "no-prototype-builtins": "off",
            "no-case-declarations": "off",
        },
    },
];
