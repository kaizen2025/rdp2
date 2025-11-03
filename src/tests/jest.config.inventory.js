// src/tests/jest.config.inventory.js - CONFIGURATION JEST POUR LES TESTS D'INVENTAIRE

const path = require('path');

module.exports = {
  // Configuration de base
  displayName: 'Inventory Tests',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  
  // Patterns de fichiers de test
  testMatch: [
    '<rootDir>/src/tests/inventory*.test.js',
    '<rootDir>/src/tests/**/inventory*.test.js'
  ],
  
  // Configuration des modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@mocks/(.*)$': '<rootDir>/src/tests/__mocks__/$1'
  },
  
  // Configuration des modules
  moduleDirectories: [
    'node_modules',
    path.resolve(__dirname, '../src')
  ],
  
  // Configuration des variables d'environnement
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
  },
  
  // Configuration des timeouts
  testTimeout: 30000, // 30 secondes pour les tests d'intégration
  
  // Configuration des reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'inventory-junit.xml'
    }],
    ['jest-html-reporters', {
      publicPath: 'test-results',
      filename: 'inventory-report.html',
      expand: true
    }]
  ],
  
  // Configuration de la couverture
  collectCoverageFrom: [
    'src/components/inventory/**/*.{js,jsx}',
    'src/pages/ComputersPage.js',
    'src/services/apiService.js',
    'src/contexts/**/*Context.js',
    '!**/*.test.{js,jsx}',
    '!**/*.spec.{js,jsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  
  // Couverture minimale exigée
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/inventory/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/pages/ComputersPage.js': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Configuration des transformations
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(css|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/src/tests/__mocks__/fileMock.js'
  },
  
  // Configuration des mocks
  setupFiles: [
    '<rootDir>/src/tests/setup.js'
  ],
  
  // Configuration des modules non testés
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Configuration des watch plugins
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/test-results/'
  ],
  
  // Configuration des accessoires de test
  testAccessories: {
    enableFindRelatedTests: true,
    enableFastRefresh: true
  },
  
  // Configuration pour les tests de performance
  maxWorkers: process.env.CI ? 2 : '50%', // Utiliser 50% des CPUs en local
  
  // Configuration spécifique pour les tests d'inventaire
  testRunner: 'jest-circus',
  
  // Configuration pour la détection des fuites
  detectLeaks: true,
  
  // Configuration pour la détection des handlers ouverts
  detectOpenHandles: true,
  
  // Configuration pour les tests lents
  slowTestThreshold: 5000, // 5 secondes
  
  // Configuration pour les tests parallèles
  runInBand: process.env.CI === 'true', // Séquentiel en CI pour éviter les conflits
  
  // Configuration des snapshots
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],
  
  // Configuration pour les tests avec Canvas
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.js',
    '<rootDir>/src/tests/inventory-setup.js'
  ],
  
  // Variables d'environnement pour les tests
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.PERFORMANCE_TESTS': 'true',
    'process.env.DEBUG_TESTS': 'false'
  },
  
  // Configuration pour les tests de régression
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  
  // Configuration pour les tests d'accessibilité
  testEnvironmentOptions: {
    'jest-environment-jsdom': {
      url: 'http://localhost:3000'
    }
  }
};
