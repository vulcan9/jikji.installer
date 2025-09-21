module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // 필요하다면 추가
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        // 'plugin:react/recommended', // React 프로젝트라면
        'plugin:prettier/recommended', // Prettier 쓰면
    ],
    rules: {
        // 필요 없는 규칙 끄기 / 프로젝트 맞춤 규칙 추가
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        "no-redeclare": "off",
        "@typescript-eslint/no-redeclare": "off"
    },
    ignorePatterns: [
        'dist/',
        'node_modules/'
    ],
};
