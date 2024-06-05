/** @type {import('jest').Config} */
module.exports = {
    maxWorkers: '50%',
    preset: 'ts-jest',
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
        '^src/(.*)$': '<rootDir>/src/$1',
        '^types/(.*)$': '<rootDir>/src/types//$1',
        '^interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
        '^translationsKeys/(.*)$': '<rootDir>/src/translationsKeys/$1',
    },
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
        '^.+\\.(ts|js)?$': 'ts-jest',
    },
    testTimeout: 200000,
};
