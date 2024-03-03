/* eslint-env node */
module.exports = {
    env: {
        browser: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
    ignorePatterns: [".eslintrc.cjs", ".gitignore", "public/"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    root: true,
    rules: {
        "prefer-template": "error",
        "prettier/prettier": "error",
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
