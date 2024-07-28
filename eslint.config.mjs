import { FlatCompat } from "@eslint/eslintrc"
import eslint from "@eslint/js"
import prettierConfig from "eslint-config-prettier"
import globals from "globals"
import tseslint from "typescript-eslint"

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
})

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    prettierConfig,
    { ignores: [".gitignore", "eslint.config.mjs", "public/"] },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    // 'inline-type-imports' | 'separate-type-imports';
                    fixStyle: "separate-type-imports",
                    // 'no-type-imports' | 'type-imports';
                    prefer: "type-imports",
                },
            ],
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/non-nullable-type-assertion-style": "off",
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
            "prefer-template": "error",
        },
    },
)
