/* eslint-env node */
module.exports = {
    env: {
        browser: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/stylistic",
        "prettier",
    ],
    ignorePatterns: [".eslintrc.cjs", ".gitignore", "public/"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    root: true,
    rules: {
        "prefer-template": "error",
    },
    overrides: [
        {
            files: ["webpack/**/*.*"],
            env: {
                node: true,
            },
        },
    ],
}
