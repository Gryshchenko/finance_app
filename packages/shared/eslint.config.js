'use strict';

const tseslint = require('typescript-eslint');
const importPlugin = require('eslint-plugin-import');
const { prettierPlugin, prettierFlatConfigs, COMMON_RULES, COMMON_TS_RULES } = require('../../eslint.shared.js');

module.exports = tseslint.config(
    { name: 'shared/ignores', ignores: ['dist/**'] },
    tseslint.configs.recommended,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
    ...prettierFlatConfigs,
    {
        name: 'shared/import-resolver',
        settings: {
            'import/resolver': {
                typescript: { project: './tsconfig.json' },
                node: true,
            },
        },
    },
    {
        name: 'shared/base',
        plugins: { prettier: prettierPlugin },
        rules: { ...COMMON_RULES },
    },
    {
        name: 'shared/typescript',
        files: ['**/*.ts'],
        rules: { ...COMMON_TS_RULES },
    },
);
