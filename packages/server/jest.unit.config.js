/**
 * Jest config — UNIT tests
 *
 * Covers pure in-process tests (no DB, no HTTP server):
 *   tests/*.test.ts          — root-level utilities (Utils, BaseError, Logger, …)
 *   tests/**\/*.unit.test.ts — explicitly named unit tests (e.g. ExchangeRateService)
 *
 * Runs fully in parallel — safe because there are no shared I/O resources.
 */

const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

const { baseUrl, paths } = compilerOptions;

module.exports = {
    displayName: { name: 'unit', color: 'blue' },
    maxWorkers: '50%',
    preset: 'ts-jest',
    modulePaths: [baseUrl],
    moduleNameMapper: pathsToModuleNameMapper(paths),

    testMatch: ['<rootDir>/tests/*.test.ts', '<rootDir>/tests/**/*.unit.test.ts'],

    collectCoverage: true,
    coverageReporters: ['lcov', 'text-summary'],
    coverageProvider: 'v8',
    coverageDirectory: 'jest-coverage/unit',

    setupFiles: ['./jest.setup.ts'],
    testPathIgnorePatterns: ['/node_modules/'],

    transform: {
        '^.+\\.ts?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
    },

    testTimeout: 30000,

    reporters: [
        'default',
        [
            'jest-html-reporters',
            {
                publicPath: './jest-html-report',
                filename: 'unit-report.html',
                openReport: false,
            },
        ],
    ],
};
