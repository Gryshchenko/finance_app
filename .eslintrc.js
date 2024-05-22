module.exports = {
    env: {
        es2021: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended', // Использование рекомендованных правил для TypeScript
        'plugin:node/recommended',
        'airbnb-base',
        'plugin:prettier/recommended', // Интеграция с Prettier
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
        project: './tsconfig.json', // Указание на ваш tsconfig.json
    },
    rules: {
        'prettier/prettier': 'error',
        'no-console': 'off',
        'no-underscore-dangle': 'off',
        'no-useless-constructor': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
        'consistent-return': 'off',
        'class-methods-use-this': 'off',
        'no-param-reassign': ['error', { props: false }],
        'import/prefer-default-export': 'off',
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                mjs: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
};
