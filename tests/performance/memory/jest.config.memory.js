/**
 * Configuration Jest pour les tests de mémoire
 * Optimisée pour la détection de fuites et le profilage
 */

module.exports = {
  // Configuration de base
  testEnvironment: 'node',
  verbose: true,
  
  // Timeout étendu pour les tests de mémoire
  testTimeout: 30000, // 30 secondes par test
  
  // Patterns de fichiers de test
  testMatch: [
    '**/tests/performance/memory/**/*.test.js'
  ],
  
  // Configuration de la couverture
  collectCoverage: false, // Désactivé pour les tests de mémoire (impact performance)
  
  // Setup et teardown globaux
  globalSetup: './tests/performance/memory/globalSetup.js',
  globalTeardown: './tests/performance/memory/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/performance/memory/setup.js'],
  
  // Variables d'environnement pour tests de mémoire
  testEnvironmentOptions: {
    // Force le garbage collection pour des tests plus précis
    nodeEnv: 'test-memory'
  },
  
  // Configuration des assertions personnalisées
  setupFilesAfterEnv: [
    '<rootDir>/tests/performance/memory/setup.js'
  ],
  
  // Configuration des reporters
  reporters: [
    'default',
    [
      '<rootDir>/tests/performance/memory/customReporter.js',
      {
        outputDirectory: './tests/performance/memory/reports',
        outputFile: 'memory-test-results.json'
      }
    ]
  ],
  
  // Configuration des transformations (si nécessaire pour ES6 modules)
  transform: {},
  
  // Configuration du module
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/tests'
  ],
  
  // Configuration des variables d'environnement
  setupFiles: [
    '<rootDir>/tests/performance/memory/testEnv.js'
  ]
};