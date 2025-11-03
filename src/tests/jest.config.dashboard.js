// src/tests/jest.config.dashboard.js
/**
 * Configuration Jest spécialisée pour les tests du Dashboard
 * Optimisée pour les tests de performance et d'intégration
 */

module.exports = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Fichiers de setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/src/tests/__mocks__/setupDashboardTests.js'
  ],
  
  // Pattern de reconnaissance des tests
  testMatch: [
    '**/src/tests/**/*.test.js',
    '**/tests/**/*.test.js'
  ],
  
  // Ignorer les fichiers de test dans la couverture
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Mapping des modules pour les mocks
  moduleNameMapping: {
    // Material-UI mocks
    '^@mui/material$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^@mui/icons-material$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^@mui/x-date-pickers$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^@mui/x-date-pickers/DatePicker$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^@mui/x-date-pickers/LocalizationProvider$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^@mui/x-date-pickers/AdapterDateFns$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    
    // React Router mocks
    '^react-router-dom$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^react-router$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    
    // Utilitaires mocks
    '^../utils/lazyModules$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^date-fns/locale$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    
    // Contexte mocks
    '^../contexts/CacheContext$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    
    // Composants communs mocks
    '^../components/common/PageHeader$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^../components/common/StatCard$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    '^../components/common/LoadingScreen$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js',
    
    // Services mocks
    '^../services/apiService$': '<rootDir>/src/tests/__mocks__/dashboardMocks.js'
  },
  
  // Extensions de fichiers à traiter
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Patterns à ignorer pour la couverture
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/',
    '/dist/',
    '/build/',
    '/public/',
    '/src/index.js',
    '/src/reportWebVitals.js'
  ],
  
  // Fichiers à inclure dans la couverture
  collectCoverageFrom: [
    'src/components/dashboard/**/*.js',
    'src/pages/DashboardPage.js',
    'src/components/common/StatCard.js',
    'src/components/common/PageHeader.js',
    'src/components/common/LoadingScreen.js',
    'src/services/apiService.js'
  ],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Seuils spécifiques pour le dashboard
    'src/components/dashboard/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/pages/DashboardPage.js': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Rapports de couverture
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  
  // Répertoire de sortie pour la couverture
  coverageDirectory: 'coverage',
  
  // Configuration des transformations
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Variables d'environnement pour les tests
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Timeout global pour les tests
  testTimeout: 30000, // 30 secondes pour les tests de performance
  
  // Configuration spécifique pour les tests de performance
  maxWorkers: process.env.CI ? 2 : '50%', // Limiter les workers en CI pour la stabilité
  
  // Verbose output pour les tests
  verbose: true,
  
  // Afficher les tests lents (> 5s)
  slowTestThreshold: 5000,
  
  // Configurations spéciales pour les différents types de tests
  projects: [
    {
      displayName: 'unit-tests',
      testMatch: ['<rootDir>/src/tests/dashboard.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.js',
        '<rootDir>/src/tests/__mocks__/setupDashboardTests.js'
      ]
    },
    {
      displayName: 'integration-tests',
      testMatch: ['<rootDir>/src/tests/dashboard-integration.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.js',
        '<rootDir>/src/tests/__mocks__/setupDashboardTests.js'
      ]
    },
    {
      displayName: 'performance-tests',
      testMatch: ['<rootDir>/src/tests/dashboard-performance.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.js',
        '<rootDir>/src/tests/__mocks__/setupDashboardTests.js'
      ],
      testTimeout: 60000, // Plus de temps pour les tests de performance
      maxWorkers: 1 // Un seul worker pour les tests de performance
    }
  ],
  
  // Patterns de test à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Configuration des reporters personnalisés
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'dashboard-tests.xml',
        suiteName: 'Dashboard Tests'
      }
    ]
  ],
  
  // Configuration pour les snapshots
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],
  
  // Configurations spéciales pour les tests de performance
  forceExit: true,
  detectOpenHandles: true,
  runInBand: process.env.PERFORMANCE_TESTS === 'true'
};