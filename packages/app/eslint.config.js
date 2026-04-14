// https://docs.expo.dev/guides/using-eslint/
'use strict';

const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNativePlugin = require('eslint-plugin-react-native');
const reactotronPlugin = require('eslint-plugin-reactotron');
const { prettierPlugin, prettierFlatConfigs, COMMON_RULES, COMMON_TS_RULES } = require('../../eslint.shared.js');

module.exports = defineConfig([
    {
        name: 'app/ignores',
        ignores: ['node_modules/**', 'ios/**', 'android/**', '.expo/**', '.vscode/**'],
    },
    ...expoConfig,
    ...prettierFlatConfigs,
    {
        name: 'app/base',
        plugins: {
            'react-native': reactNativePlugin,
            'reactotron': reactotronPlugin,
            'prettier': prettierPlugin,
        },
        rules: {
            ...COMMON_RULES,
            // App-specific import order with React / Expo path groups
            'import/order': [
                'error',
                {
                    'alphabetize': { order: 'asc', caseInsensitive: true },
                    'newlines-between': 'always',
                    'groups': [['builtin', 'external'], 'internal', 'unknown', ['parent', 'sibling'], 'index'],
                    'distinctGroup': false,
                    'pathGroups': [
                        { pattern: 'react', group: 'external', position: 'before' },
                        { pattern: 'react-native', group: 'external', position: 'before' },
                        { pattern: 'expo{,-*}', group: 'external', position: 'before' },
                        { pattern: '@/**', group: 'unknown', position: 'after' },
                    ],
                    'pathGroupsExcludedImportTypes': ['react', 'react-native', 'expo', 'expo-*'],
                },
            ],
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: 'react',
                            importNames: ['default'],
                            message: "Import named exports from 'react' instead.",
                        },
                        {
                            name: 'react-native',
                            importNames: ['SafeAreaView'],
                            message: "Use the SafeAreaView from 'react-native-safe-area-context' instead.",
                        },
                        {
                            name: 'react-native',
                            importNames: ['Text', 'Button', 'TextInput'],
                            message: "Use the custom wrapper component from '@/components'.",
                        },
                    ],
                },
            ],
            // react-native (replaces plugin:react-native/all)
            'react-native/no-unused-styles': 'error',
            'react-native/no-inline-styles': 'error',
            'react-native/no-color-literals': 'error',
            'react-native/sort-styles': 'error',
            'react-native/split-platform-components': 'error',
            'react-native/no-raw-text': 'off',
            'react-native/no-single-element-style-arrays': 'error',
            // reactotron
            'reactotron/no-tron-in-production': 'error',
        },
    },
    {
        name: 'app/typescript',
        files: ['**/*.ts', '**/*.tsx'],
        rules: { ...COMMON_TS_RULES },
    },
]);
