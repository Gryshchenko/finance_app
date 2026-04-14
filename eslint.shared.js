'use strict';

const prettierPlugin = require('eslint-plugin-prettier');
const { rules: prettierRules } = require('eslint-config-prettier/flat');

// Split prettier rules by plugin scope to avoid ESLint v9 flat-config errors.
// @typescript-eslint rules require the plugin to be registered in the same config object,
// but the plugin is typically scoped to .ts files only — so we apply these rules separately.
const prettierTsRules = Object.fromEntries(
    Object.entries(prettierRules).filter(([key]) => key.startsWith('@typescript-eslint/')),
);
const prettierNonTsRules = Object.fromEntries(
    Object.entries(prettierRules).filter(([key]) => !key.startsWith('@typescript-eslint/')),
);

/**
 * Common formatting and style rules shared across all packages.
 * Requires eslint-plugin-prettier and eslint-plugin-import to be registered
 * in the config object where these rules are applied.
 */
const COMMON_RULES = {
    'prettier/prettier': 'error',
    'no-use-before-define': 'off',
    'no-global-assign': 'off',
    'comma-dangle': 'off',
    'quotes': 'off',
    'space-before-function-paren': 'off',
    'import/newline-after-import': 'warn',
    'import/order': [
        'error',
        {
            'alphabetize': { order: 'asc', caseInsensitive: true },
            'newlines-between': 'always',
            'groups': [['builtin', 'external'], 'internal', 'unknown', ['parent', 'sibling'], 'index'],
            'distinctGroup': false,
        },
    ],
};

/**
 * Common @typescript-eslint rule overrides shared across all packages.
 * Must be applied inside a config object scoped to TypeScript files
 * where the @typescript-eslint plugin is already registered.
 */
const COMMON_TS_RULES = {
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
};

/**
 * Reusable flat-config blocks that integrate eslint-config-prettier.
 * Rules are split by scope:
 *   - prettierNonTsRules: applied globally (no plugin required)
 *   - prettierTsRules: applied only to TS files (requires @typescript-eslint plugin in scope)
 */
const prettierFlatConfigs = [
    { name: 'prettier/non-ts-rules', rules: prettierNonTsRules },
    { name: 'prettier/ts-rules', files: ['**/*.ts', '**/*.tsx'], rules: prettierTsRules },
];

module.exports = {
    prettierPlugin,
    prettierFlatConfigs,
    COMMON_RULES,
    COMMON_TS_RULES,
};
