'use strict';

const tseslint = require('typescript-eslint');
const pluginSecurity = require('eslint-plugin-security');
const importPlugin = require('eslint-plugin-import');
const { prettierPlugin, prettierFlatConfigs, COMMON_RULES, COMMON_TS_RULES } = require('../../eslint.shared.js');

module.exports = tseslint.config(
    { name: 'server/ignores', ignores: ['**/tests/**', 'dist/**'] },
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    pluginSecurity.configs.recommended,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
    ...prettierFlatConfigs,
    {
        name: 'server/import-resolver',
        settings: {
            // Use TypeScript resolver to correctly resolve tsconfig.json path aliases
            'import/resolver': {
                typescript: { project: './tsconfig.json' },
                node: true,
            },
        },
    },
    {
        name: 'server/base',
        plugins: { prettier: prettierPlugin },
        rules: {
            ...COMMON_RULES,
            '@typescript-eslint/no-extraneous-class': 'off',
        },
    },
    {
        name: 'server/typescript',
        files: ['**/*.ts'],
        rules: { ...COMMON_TS_RULES },
    },
);
