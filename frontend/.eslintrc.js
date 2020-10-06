module.exports = {
    extends: [
        'airbnb-typescript',
        'airbnb/hooks',
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'prettier',
        'prettier/react',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended'
    ],
    plugins: ['react', '@typescript-eslint', 'jest'],
    env: {
        browser: true,
        es6: true,
        jest: true,
    },
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2018,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    rules: {
        'linebreak-style': 'off',
        'no-plusplus': 'error',
        'indent': ['error', 4],
        'no-restricted-syntax': 'off',
        '@typescript-eslint/naming-convention': 'off', // Should be enabled later
        'default-case': 'off',
        'react/jsx-props-no-spreading': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'prettier/prettier': [
            'error',
            {

                endOfLine: 'auto',
                singleQuote: true,
                tabWidth: 4,
                useTabs: false,
            },
        ],
    },
};
