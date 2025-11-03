/**
 * Configuration Jest spécifique pour les tests des sessions RDS
 * Optimisée pour les tests React/Material-UI
 */

module.exports = {
  // Fichiers de test
  testMatch: [
    '<rootDir>/src/tests/sessions/**/*.test.js',
  ],

  // Setup et teardown
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/src/tests/sessions/setup.js'
  ],

  // Variables d'environnement
  testEnvironment: 'jsdom',

  // Configuration des modules
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^@mui/icons-material/(.*)$': '<rootDir>/__mocks__/@mui-icons-material/$1',
    '^recharts/(.*)$': '<rootDir>/__mocks__/recharts/$1',
    '^date-fns/(.*)$': '<rootDir>/__mocks__/date-fns/$1'
  },

  // Configuration des transformations
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Ignore des patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],

  // Configuration du collecteur de couverture
  collectCoverageFrom: [
    'src/pages/SessionsPage.js',
    'src/components/sessions/*.js',
    'src/contexts/AppContext.js',
    'src/contexts/CacheContext.js',
    'src/services/apiService.js',
    '!src/tests/**',
    '!src/**/*.test.js',
    '!src/**/*.stories.js',
    '!src/**/*.spec.js',
  ],

  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Seuils spécifiques pour les modules critiques
    'src/pages/SessionsPage.js': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/components/sessions/*.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Configuration des reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],

  // Configuration des reporters en mode verbose
  verbose: true,

  // Timeout spécifique pour les tests de performance
  testTimeout: 30000, // 30 secondes pour les tests de performance

  // Configuration des mocks
  clearMocks: true,
  restoreMocks: true,

  // Configuration des assets
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'node',
  ],

  // Configuration des warnings
  errorOnDeprecated: false,

  // Configuration des résolveurs
  resolver: 'jest-pnp-resolver',

  // Configuration spécifique pour les tests de performance
  maxWorkers: process.env.CI ? 2 : '50%', // Limiter en CI

  // Configuration des modules es6
  extensionsToTreatAsEsm: ['.js'],

  // Variables d'environnement pour les tests
  testEnvironmentOptions: {
    url: 'http://localhost',
    customExportConditions: ['node', 'node-addons'],
  },

  // Configuration des snapshots
  snapshotSerializers: [
    'enzyme-to-json/serializer',
  ],

  // Configuration spécifique pour les tests de sessions
  testTimeout: {
    default: 10000, // 10 secondes par défaut
    longRunningTests: 60000, // 60 secondes pour les tests longs
    performanceTests: 120000, // 2 minutes pour les tests de performance
  },

  // Configuration des timers
  fakeTimers: {
    enableGlobally: false, // Activé seulement pour les tests qui en ont besoin
  },

  // Configuration du reporter de résultats personnalisé
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'sessions-test-results.xml',
        suiteName: 'Sessions RDS Tests',
        uniqueOutputName: 'false',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: 'coverage',
        filename: 'sessions-test-report.html',
        pageTitle: 'Rapport de Tests - Sessions RDS',
        expand: true,
        hideIcon: false,
        logoImgPath: '',
        inlineAssets: true,
      },
    ],
  ],

  // Configuration spécifique pour les tests d'intégration
  testRunner: 'jest-circus', // Plus flexible que jasmine

  // Configuration des notifications
  notify: false,
  notifyMode: 'failure-change',

  // Configuration du cache
  cacheDirectory: '<rootDir>/.jest-cache',

  // Configuration des files watcher
  watchPathIgnorePatterns: [
    '<rootDir>/.git/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],

  // Configuration des test results
  testResultsProcessor: undefined,

  // Configuration des custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/src/tests/sessions/setup.js',
    '<rootDir>/src/tests/sessions/matchers.js',
  ],
};
