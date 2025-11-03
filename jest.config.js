/**
 * Configuration Jest pour les tests - Module Prêts de Matériel
 */

module.exports = {
    // Environment de test
    testEnvironment: 'jsdom',

    // Fichiers de setup
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

    // Patterns de fichiers de test
    testMatch: [
        '**/src/tests/**/*.test.js',
        '**/src/tests/**/loans*.test.js',
        '**/__tests__/**/*.js'
    ],

    // Couverture de code - Focus sur le module Prêts
    collectCoverageFrom: [
        'src/components/loan-management/**/*.{js,jsx}',
        'src/pages/Loans*.{js,jsx}',
        'src/services/apiService.js',
        'src/utils/**/*.js',
        '!src/tests/**',
        '!src/index.js',
        '!src/reportWebVitals.js',
        '!src/setupTests.js'
    ],

    // Thresholds de couverture - Plus stricts pour le module critique
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        },
        'src/components/loan-management/': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        },
        'src/pages/Loans*.js': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        }
    },

    // Reporters étendus
    coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
    coverageDirectory: 'coverage/loans',

    // Transformer pour JSX avec support React
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },

    // Patterns à ignorer
    testPathIgnorePatterns: [
        '/node_modules/',
        '/build/',
        '/dist/',
        '/coverage/'
    ],

    // Module name mapper pour les imports CSS/images et assets
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/tests/__mocks__/fileMock.js'
    },

    // Extensions supportées
    moduleFileExtensions: [
        'js',
        'jsx',
        'json',
        'node'
    ],

    // Timeout adapté aux tests complexes
    testTimeout: 15000,

    // Configuration globale
    testEnvironmentOptions: {
        url: 'http://localhost',
        customExportConditions: ['node', 'node-addons']
    },

    // Options de performance
    maxWorkers: '50%',

    // Restauration automatique des mocks
    restoreMocks: true,
    clearMocks: true,

    // Verbose pour les tests
    verbose: true,

    // Configuration des reporters
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: 'test-results',
            outputName: 'loans-test-results.xml',
            suiteName: 'Prêts de Matériel - Tests'
        }]
    ],

    // Configuration des snapshots
    snapshotSerializers: ['enzyme-to-json/serializer'],

    // Random order pour découvrir les problèmes de dépendances
    randomize: true,

    // Configuration timers fake pour les tests
    fakeTimers: {
        enableGlobally: false
    },

    // Ne pas échouer sur les dépréciations
    errorOnDeprecated: false,

    // Bailing - arrêter après 5 échecs consécutifs
    bail: 5
};
