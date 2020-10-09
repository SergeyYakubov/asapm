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
        'no-continue': 'off',
        'no-plusplus': 'off',
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'no-restricted-syntax': 'off',
        'default-case': 'off',
        'no-console': 'off',
        'max-len': 'off',
        'import/prefer-default-export': 'off',
        'no-param-reassign': 'off',

        '@typescript-eslint/naming-convention': 'off', // Should be enabled later
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-use-before-define': 'warn',

        "react/jsx-indent": ["error", 4],
        "react/jsx-indent-props": ["error", 4],
        'react/jsx-props-no-spreading': 'off',
        'react/no-render-return-value': 'warn',

        'prettier/prettier': [
            'error',
            {

                endOfLine: 'auto',
                singleQuote: true,
                tabWidth: 4,
                useTabs: false,
                printWidth: 180,
            },
        ],
    },
};
