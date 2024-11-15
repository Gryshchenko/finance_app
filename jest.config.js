const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

const { baseUrl, paths } = compilerOptions;

module.exports = {
    maxWorkers: '50%',
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
    testPathIgnorePatterns: ['/node_modules/'],
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
                openReport: true,
            },
        ],
    ],
};
