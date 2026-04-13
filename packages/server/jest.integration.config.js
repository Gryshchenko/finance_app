/**
 * Jest config — INTEGRATION tests
 *
 * Covers tests that start an Express HTTP server and connect to a real DB:
 *   tests/auth, tests/account, tests/access, tests/balance, tests/category,
 *   tests/income, tests/profile, tests/registration, tests/stats,
 *   tests/transactions, tests/validation
 *
 * maxWorkers: 2 — runs at most 2 test files concurrently.
 * Each worker boots its own server on a random port, so 2 simultaneous
 * servers + DB connections is well within system limits.
 *
 * Set maxWorkers: 1 (or --runInBand) if DB connection pool is still exhausted.
 */

const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

const { baseUrl, paths } = compilerOptions;

module.exports = {
    displayName: { name: 'integration', color: 'yellow' },

    // ─── Concurrency ──────────────────────────────────────────────────────────
    // Each test file spins up a real Express server + DB connections.
    // Keep this low (2–3) to avoid port exhaustion and DB pool overflow.
    // Drop to 1 if the machine is still struggling.
    maxWorkers: 2,

    preset: 'ts-jest',
    modulePaths: [baseUrl],
    moduleNameMapper: pathsToModuleNameMapper(paths),

    // All tests inside subdirectories, excluding root-level and *.unit.test.ts
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
    testPathIgnorePatterns: [
        '/node_modules/',
        // Root-level flat files are unit tests — handled by jest.unit.config.js
        '<rootDir>/tests/[^/]+\\.test\\.ts$',
        // Explicitly named unit tests live in subdirectories but have no I/O
        '\\.unit\\.test\\.ts$',
    ],

    collectCoverage: true,
    coverageReporters: ['lcov', 'text-summary'],
    coverageProvider: 'v8',
    coverageDirectory: 'jest-coverage/integration',
    coverageThreshold: {
        global: {
            lines: 70,
            statements: 70,
        },
    },

    setupFiles: ['./jest.setup.ts'],

    transform: {
        '^.+\\.ts?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
    },

    testTimeout: 200000,

    reporters: [
        'default',
        [
            'jest-html-reporters',
            {
                publicPath: './jest-html-report',
                filename: 'integration-report.html',
                openReport: false,
            },
        ],
    ],
};
