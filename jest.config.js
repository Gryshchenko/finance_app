/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
        '^src/(.*)$': '<rootDir>/src/$1',
        '^types/(.*)$': '<rootDir>/src/types//$1',
        '^interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
        '^translationsKeys/(.*)$': '<rootDir>/src/translationsKeys/$1',
    },
    collectCoverage: false,
    coverageReporters: ['lcov'],
    testPathIgnorePatterns: ['/node_modules/'],
    transform: {
        '^.+\\.(ts|js)?$': 'ts-jest',
    },
};
