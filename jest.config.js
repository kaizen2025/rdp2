/**
 * Configuration Jest pour les tests
 */

module.exports = {
    // Environment de test
    testEnvironment: 'node',

    // Fichiers de setup
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Patterns de fichiers de test
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js'
    ],

    // Couverture de code
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        'server/**/*.js',
        '!src/index.js',
        '!src/reportWebVitals.js',
        '!src/setupTests.js'
    ],

    // Thresholds de couverture
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },

    // Reporters
    coverageReporters: ['text', 'lcov', 'html'],

    // Transformer pour JSX
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
    },

    // Ignorer
    testPathIgnorePatterns: [
        '/node_modules/',
        '/build/',
        '/dist/'
    ],

    // Module name mapper pour les imports CSS/images
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
    },

    // Timeout
    testTimeout: 10000
};
