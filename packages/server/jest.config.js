const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = require('./tsconfig.json');

const { baseUrl, paths } = compilerOptions;

module.exports = {
    // ─── Concurrency ──────────────────────────────────────────────────────────
    // Integration tests each start an Express server + open DB connections.
    // '50%' was the old default and caused system overload when many test files
    // ran simultaneously. Use the dedicated configs for better control:
    //   jest.unit.config.js        — unit tests, fully parallel
    //   jest.integration.config.js — integration tests, maxWorkers: 2
    // This value is the fallback for the "run everything" jest-test script.
    maxWorkers: 1,

    preset: 'ts-jest',
    modulePaths: [baseUrl],
    moduleNameMapper: pathsToModuleNameMapper(paths),
    collectCoverage: true,
    coverageReporters: ['lcov'],
    coverageProvider: 'v8',
    coverageDirectory: 'jest-coverage',
    coverageThreshold: {
        global: {
            lines: 70,
            statements: 70,
        },
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist'],
    setupFiles: ['./jest.setup.ts'],
    transform: {
        '^.+\\.ts?$': [
            'ts-jest',
            // required due to custom location of tsconfig.json configuration file
            // https://kulshekhar.github.io/ts-jest/docs/getting-started/options/tsconfig
            { tsconfig: './tsconfig.json' },
        ],
    },
    testTimeout: 200000,
    reporters: [
        'default',
        [
            'jest-html-reporters',
            {
                publicPath: './jest-html-report',
                filename: 'report.html',
                openReport: false,
            },
        ],
    ],
};
