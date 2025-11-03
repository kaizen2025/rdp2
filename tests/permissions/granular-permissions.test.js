/**
 * Tests de validation des permissions granulaires
 * Valide tous les patterns de permissions : wildcards, actions, héritage
 */

const fs = require('fs');
const path = require('path');

// Import des modules de permissions
const permissionsModule = require('../../src/models/permissions');

// Configuration des tests
const TEST_CONFIG = {
  verbose: process.env.TEST_VERBOSE === 'true',
  mockDataPath: path.join(__dirname, 'mock-data'),
  outputPath: path.join(__dirname, 'test-results')
};

// Données de test pour les permissions granulaires
const GRANULAR_PERMISSIONS_TEST_DATA = {
  // Tests de base
  basic: {
    '*': {
      description: 'Super admin avec toutes les permissions',
      permissions: ['*'],
      expectedResults: {
        'dashboard:view': true,
        'sessions:edit': true,
        'users:create': true,
        'config:admin': true,
        'any:permission': true
      }
    },
    
    'dashboard:*': {
      description: 'Permission wildcard module',
      permissions: ['dashboard:*'],
      expectedResults: {
        'dashboard:view': true,
        'dashboard:edit': true,
        'dashboard:create': true,
        'dashboard:delete': true,
        'dashboard:export': true,
        'sessions:view': false,
        'users:view': false
      }
    },
    
    'sessions:view': {
      description: 'Permission exacte',
      permissions: ['sessions:view'],
      expectedResults: {
        'sessions:view': true,
        'sessions:edit': false,
        'sessions:create': false,
        'dashboard:view': false
      }
    }
  },

  // Tests granulaires d'actions
  granularActions: {
    'create_action': {
      description: 'Permissions de création granulaires',
      permissions: [
        'users:create',
        'loans:create',
        'computers:create'
      ],
      expectedResults: {
        'users:create': true,
        'loans:create': true,
        'computers:create': true,
        'users:edit': false,
        'loans:edit': false,
        'computers:edit': false,
        'users:view': false
      }
    },
    
    'read_action': {
      description: 'Permissions de lecture granulaires',
      permissions: [
        'sessions:view',
        'users:view',
        'computers:view'
      ],
      expectedResults: {
        'sessions:view': true,
        'users:view': true,
        'computers:view': true,
        'sessions:edit': false,
        'users:edit': false,
        'computers:edit': false
      }
    },
    
    'update_action': {
      description: 'Permissions de modification granulaires',
      permissions: [
        'sessions:edit',
        'users:edit',
        'loans:edit'
      ],
      expectedResults: {
        'sessions:edit': true,
        'users:edit': true,
        'loans:edit': true,
        'sessions:view': true, // Chaque permission édit implique view
        'users:view': true,
        'loans:view': true,
        'sessions:create': false,
        'users:create': false,
        'loans:create': false
      }
    },
    
    'delete_action': {
      description: 'Permissions de suppression granulaires',
      permissions: [
        'loans:delete',
        'ged_delete:delete'
      ],
      expectedResults: {
        'loans:delete': true,
        'ged_delete:delete': true,
        'loans:edit': false,
        'loans:create': false,
        'loans:view': false
      }
    }
  },

  // Tests d'héritage de permissions
  inheritance: {
    'manager_inheritance': {
      description: 'Héritage des permissions du manager',
      permissions: [
        'dashboard:view',
        'sessions:view',
        'loans:*',
        'users:view',
        'chat_ged:view',
        'reports:view'
      ],
      expectedResults: {
        'dashboard:view': true,
        'sessions:view': true,
        'loans:view': true,
        'loans:create': true,
        'loans:edit': true,
        'loans:delete': true,
        'loans:export': true,
        'users:view': true,
        'users:edit': false,
        'users:create': false,
        'users:delete': false,
        'chat_ged:view': true,
        'chat_ged:create': false,
        'reports:view': true,
        'reports:export': false,
        'settings:view': false
      }
    },
    
    'ged_specialist_inheritance': {
      description: 'Héritage des permissions du spécialiste GED',
      permissions: [
        'dashboard:view',
        'chat_ged:*',
        'ai_assistant:*',
        'ged_upload:create',
        'ged_delete:delete',
        'ged_network_scan:admin',
        'ged_index_manage:admin',
        'reports:view'
      ],
      expectedResults: {
        'dashboard:view': true,
        'chat_ged:view': true,
        'chat_ged:create': true,
        'chat_ged:edit': true,
        'chat_ged:delete': true,
        'chat_ged:export': true,
        'ai_assistant:view': true,
        'ai_assistant:create': true,
        'ai_assistant:edit': true,
        'ai_assistant:delete': true,
        'ged_upload:create': true,
        'ged_delete:delete': true,
        'ged_network_scan:admin': true,
        'ged_index_manage:admin': true,
        'reports:view': true,
        'sessions:view': false,
        'users:view': false
      }
    }
  },

  // Tests d'exceptions et permissions spéciales
  exceptions: {
    'config_exceptions': {
      description: 'Exceptions pour la configuration système',
      permissions: [
        'dashboard:view',
        'sessions:*',
        'users:*',
        'loans:*',
        'config:view'
      ],
      expectedResults: {
        'config:view': true,
        'config:edit': false,
        'config:admin': false,
        'config:delete': false,
        'dashboard:view': true,
        'sessions:view': true,
        'sessions:edit': true,
        'users:view': true,
        'users:edit': true
      }
    },
    
    'special_permissions': {
      description: 'Permissions spéciales GED et IA',
      permissions: [
        'ged_upload:create',
        'ged_delete:delete',
        'ged_network_scan:admin',
        'ged_index_manage:admin',
        'ged_stats_view:view'
      ],
      expectedResults: {
        'ged_upload:create': true,
        'ged_delete:delete': true,
        'ged_network_scan:admin': true,
        'ged_index_manage:admin': true,
        'ged_stats_view:view': true,
        'ged_upload:delete': false,
        'ged_upload:view': false,
        'chat_ged:view': false,
        'ai_assistant:view': false
      }
    },
    
    'mixed_permissions': {
      description: 'Mix de permissions granulaires et wildcards',
      permissions: [
        'dashboard:*',
        'sessions:view',
        'sessions:edit',
        'users:create',
        'computers:view',
        'loans:delete'
      ],
      expectedResults: {
        'dashboard:view': true,
        'dashboard:edit': true,
        'dashboard:create': true,
        'dashboard:delete': true,
        'sessions:view': true,
        'sessions:edit': true,
        'sessions:create': false,
        'sessions:delete': false,
        'users:create': true,
        'users:view': false,
        'users:edit': false,
        'users:delete': false,
        'computers:view': true,
        'computers:edit': false,
        'loans:delete': true,
        'loans:view': false
      }
    }
  },

  // Tests de combinaison de permissions
  combinations: {
    'or_logic': {
      description: 'Logique OU pour permissions multiples',
      requiredPermissions: ['users:create', 'loans:view'],
      testPermissions: [
        ['users:create'],
        ['loans:view'],
        ['users:create', 'loans:view'],
        ['users:edit']
      ],
      expectedResults: [true, true, true, false]
    },
    
    'and_logic': {
      description: 'Logique ET pour permissions multiples',
      requiredPermissions: ['sessions:view', 'users:view'],
      testPermissions: [
        ['sessions:view', 'users:view'],
        ['sessions:view', 'users:edit'],
        ['sessions:view'],
        ['users:view'],
        []
      ],
      expectedResults: [true, false, false, false, false]
    }
  }
};

// Classe principale des tests
class GranularPermissionsTest {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    console.log('🔐 Démarrage des tests de validation des permissions granulaires...\n');
    
    try {
      await this.testBasicPermissions();
      await this.testGranularActions();
      await this.testInheritance();
      await this.testExceptions();
      await this.testCombinations();
      await this.testEdgeCases();
      await this.testPerformance();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Erreur durant les tests:', error);
      this.results.errors.push({
        phase: 'execution',
        error: error.message,
        stack: error.stack
      });
    }

    return this.results;
  }

  /**
   * Test des permissions de base
   */
  async testBasicPermissions() {
    console.log('📋 Test des permissions de base...');
    
    const basicTests = GRANULAR_PERMISSIONS_TEST_DATA.basic;
    
    for (const [key, test] of Object.entries(basicTests)) {
      this.results.total++;
      
      try {
        const testResults = this.validatePermissions(test.permissions, test.expectedResults);
        
        if (testResults.allValid) {
          this.results.passed++;
          console.log(`✅ ${test.description} - RÉUSSI`);
          if (TEST_CONFIG.verbose) {
            console.log(`   Permissions: ${test.permissions.join(', ')}`);
          }
        } else {
          this.results.failed++;
          console.log(`❌ ${test.description} - ÉCHEC`);
          console.log(`   Erreurs: ${testResults.errors.join(', ')}`);
          this.results.errors.push({
            test: key,
            description: test.description,
            permissions: test.permissions,
            errors: testResults.errors
          });
        }
        
      } catch (error) {
        this.results.failed++;
        console.log(`💥 ${test.description} - ERREUR: ${error.message}`);
        this.results.errors.push({
          test: key,
          description: test.description,
          error: error.message
        });
      }
    }
    
    console.log('');
  }

  /**
   * Test des actions granulaires
   */
  async testGranularActions() {
    console.log('⚙️ Test des actions granulaires...');
    
    const granularTests = GRANULAR_PERMISSIONS_TEST_DATA.granularActions;
    
    for (const [key, test] of Object.entries(granularTests)) {
      this.results.total++;
      
      try {
        const testResults = this.validatePermissions(test.permissions, test.expectedResults);
        
        if (testResults.allValid) {
          this.results.passed++;
          console.log(`✅ ${test.description} - RÉUSSI`);
        } else {
          this.results.failed++;
          console.log(`❌ ${test.description} - ÉCHEC`);
          console.log(`   Erreurs: ${testResults.errors.join(', ')}`);
          this.results.errors.push({
            test: key,
            description: test.description,
            permissions: test.permissions,
            errors: testResults.errors
          });
        }
        
      } catch (error) {
        this.results.failed++;
        console.log(`💥 ${test.description} - ERREUR: ${error.message}`);
        this.results.errors.push({
          test: key,
          description: test.description,
          error: error.message
        });
      }
    }
    
    console.log('');
  }

  /**
   * Test de l'héritage des permissions
   */
  async testInheritance() {
    console.log('🔗 Test de l\'héritage des permissions...');
    
    const inheritanceTests = GRANULAR_PERMISSIONS_TEST_DATA.inheritance;
    
    for (const [key, test] of Object.entries(inheritanceTests)) {
      this.results.total++;
      
      try {
        const testResults = this.validatePermissions(test.permissions, test.expectedResults);
        
        if (testResults.allValid) {
          this.results.passed++;
          console.log(`✅ ${test.description} - RÉUSSI`);
        } else {
          this.results.failed++;
          console.log(`❌ ${test.description} - ÉCHEC`);
          console.log(`   Erreurs: ${testResults.errors.join(', ')}`);
          this.results.errors.push({
            test: key,
            description: test.description,
            permissions: test.permissions,
            errors: testResults.errors
          });
        }
        
      } catch (error) {
        this.results.failed++;
        console.log(`💥 ${test.description} - ERREUR: ${error.message}`);
        this.results.errors.push({
          test: key,
          description: test.description,
          error: error.message
        });
      }
    }
    
    console.log('');
  }

  /**
   * Test des exceptions et permissions spéciales
   */
  async testExceptions() {
    console.log('🚫 Test des exceptions et permissions spéciales...');
    
    const exceptionTests = GRANULAR_PERMISSIONS_TEST_DATA.exceptions;
    
    for (const [key, test] of Object.entries(exceptionTests)) {
      this.results.total++;
      
      try {
        const testResults = this.validatePermissions(test.permissions, test.expectedResults);
        
        if (testResults.allValid) {
          this.results.passed++;
          console.log(`✅ ${test.description} - RÉUSSI`);
        } else {
          this.results.failed++;
          console.log(`❌ ${test.description} - ÉCHEC`);
          console.log(`   Erreurs: ${testResults.errors.join(', ')}`);
          this.results.errors.push({
            test: key,
            description: test.description,
            permissions: test.permissions,
            errors: testResults.errors
          });
        }
        
      } catch (error) {
        this.results.failed++;
        console.log(`💥 ${test.description} - ERREUR: ${error.message}`);
        this.results.errors.push({
          test: key,
          description: test.description,
          error: error.message
        });
      }
    }
    
    console.log('');
  }

  /**
   * Test des combinaisons de permissions
   */
  async testCombinations() {
    console.log('🔀 Test des combinaisons de permissions...');
    
    const combinationTests = GRANULAR_PERMISSIONS_TEST_DATA.combinations;
    
    for (const [key, test] of Object.entries(combinationTests)) {
      this.results.total++;
      
      try {
        let allValid = true;
        const errors = [];
        
        for (let i = 0; i < test.testPermissions.length; i++) {
          const userPermissions = test.testPermissions[i];
          const expectedResult = test.expectedResults[i];
          
          let actualResult;
          if (key === 'or_logic') {
            actualResult = permissionsModule.hasAnyPermission(
              userPermissions, 
              test.requiredPermissions
            );
          } else if (key === 'and_logic') {
            actualResult = permissionsModule.hasAllPermissions(
              userPermissions, 
              test.requiredPermissions
            );
          }
          
          if (actualResult !== expectedResult) {
            allValid = false;
            errors.push(`Permissions ${JSON.stringify(userPermissions)}: attendu ${expectedResult}, obtenu ${actualResult}`);
          }
        }
        
        if (allValid) {
          this.results.passed++;
          console.log(`✅ ${test.description} - RÉUSSI`);
        } else {
          this.results.failed++;
          console.log(`❌ ${test.description} - ÉCHEC`);
          console.log(`   Erreurs: ${errors.join('; ')}`);
          this.results.errors.push({
            test: key,
            description: test.description,
            errors: errors
          });
        }
        
      } catch (error) {
        this.results.failed++;
        console.log(`💥 ${test.description} - ERREUR: ${error.message}`);
        this.results.errors.push({
          test: key,
          description: test.description,
          error: error.message
        });
      }
    }
    
    console.log('');
  }

  /**
   * Test des cas limites
   */
  async testEdgeCases() {
    console.log('🎯 Test des cas limites...');
    
    const edgeCases = [
      {
        name: 'Permissions vides',
        permissions: [],
        tests: {
          'any:permission': false,
          '*': false
        }
      },
      {
        name: 'Permission avec espaces',
        permissions: [' dashboard : view '],
        tests: {
          'dashboard:view': false, // Espaces non gérés
          ' dashboard : view ': false
        }
      },
      {
        name: 'Permission malformée',
        permissions: ['dashboard'],
        tests: {
          'dashboard': false, // Pas de :
          'dashboard:view': false
        }
      },
      {
        name: 'Double wildcard',
        permissions: ['**'],
        tests: {
          'dashboard:view': false,
          'any:permission': false
        }
      },
      {
        name: 'Permission avec caractères spéciaux',
        permissions: ['dashboard:view@', 'users:create!'],
        tests: {
          'dashboard:view@': false,
          'users:create!': false
        }
      }
    ];
    
    for (const testCase of edgeCases) {
      this.results.total++;
      
      try {
        const testResults = this.validatePermissions(testCase.permissions, testCase.tests);
        
        if (testResults.allValid) {
          this.results.passed++;
          console.log(`✅ ${testCase.name} - RÉUSSI`);
        } else {
          this.results.failed++;
          console.log(`❌ ${testCase.name} - ÉCHEC`);
          console.log(`   Erreurs: ${testResults.errors.join(', ')}`);
        }
        
      } catch (error) {
        this.results.failed++;
        console.log(`💥 ${testCase.name} - ERREUR: ${error.message}`);
      }
    }
    
    console.log('');
  }

  /**
   * Test des performances
   */
  async testPerformance() {
    console.log('🚀 Test des performances...');
    
    const startTime = Date.now();
    const testPermissions = Array.from({length: 1000}, (_, i) => `permission_${i}:action`);
    const testPermission = 'permission_500:action';
    
    try {
      // Test de vitesse de validation
      const iterations = 10000;
      for (let i = 0; i < iterations; i++) {
        permissionsModule.hasPermission(testPermissions, testPermission);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (duration < 5000) { // Moins de 5 secondes pour 10k validations
        this.results.passed++;
        console.log(`✅ Test de performance - RÉUSSI (${duration}ms pour ${iterations} validations)`);
      } else {
        this.results.failed++;
        console.log(`❌ Test de performance - ÉCHEC (trop lent: ${duration}ms)`);
      }
      
    } catch (error) {
      this.results.failed++;
      console.log(`💥 Test de performance - ERREUR: ${error.message}`);
    }
    
    console.log('');
  }

  /**
   * Valider des permissions contre des résultats attendus
   */
  validatePermissions(userPermissions, expectedResults) {
    const errors = [];
    
    for (const [permission, expectedResult] of Object.entries(expectedResults)) {
      const actualResult = permissionsModule.hasPermission(userPermissions, permission);
      
      if (actualResult !== expectedResult) {
        errors.push(`${permission}: attendu ${expectedResult}, obtenu ${actualResult}`);
      }
    }
    
    return {
      allValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Générer le rapport final
   */
  generateReport() {
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    
    console.log('📊 RAPPORT FINAL DES TESTS');
    console.log('=' .repeat(50));
    console.log(`Total des tests: ${this.results.total}`);
    console.log(`Tests réussis: ${this.results.passed} ✅`);
    console.log(`Tests échoués: ${this.results.failed} ❌`);
    console.log(`Taux de réussite: ${successRate}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERREURS DÉTAILLÉES:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test || error.phase}: ${error.description}`);
        if (error.errors) {
          error.errors.forEach(err => console.log(`   - ${err}`));
        }
        if (error.error) {
          console.log(`   Erreur: ${error.error}`);
        }
      });
    }
    
    // Sauvegarder le rapport
    this.saveReport();
    
    // Déterminer le statut global
    if (this.results.failed === 0 && this.results.errors.length === 0) {
      console.log('\n🎉 TOUS LES TESTS SONT PASSÉS! Le système de permissions granulaires est validée.');
      process.exit(0);
    } else {
      console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ. Vérifiez la configuration des permissions.');
      process.exit(1);
    }
  }

  /**
   * Sauvegarder le rapport dans un fichier
   */
  saveReport() {
    try {
      // Créer le répertoire de sortie s'il n'existe pas
      if (!fs.existsSync(TEST_CONFIG.outputPath)) {
        fs.mkdirSync(TEST_CONFIG.outputPath, { recursive: true });
      }
      
      const reportFile = path.join(TEST_CONFIG.outputPath, `granular-permissions-test-${Date.now()}.json`);
      const reportData = {
        timestamp: new Date().toISOString(),
        results: this.results,
        config: TEST_CONFIG
      };
      
      fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
      console.log(`\n💾 Rapport sauvegardé: ${reportFile}`);
      
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder le rapport:', error.message);
    }
  }
}

// Fonction principale pour les tests Jest
describe('Validation des Permissions Granulaires', () => {
  let granularTest;
  
  beforeEach(() => {
    granularTest = new GranularPermissionsTest();
  });
  
  afterEach(() => {
    if (granularTest && granularTest.results) {
      console.log(`Tests exécutés: ${granularTest.results.total}, Réussis: ${granularTest.results.passed}, Échoués: ${granularTest.results.failed}`);
    }
  });
  
  test('Validation des permissions wildcards', () => {
    const wildcardTests = GRANULAR_PERMISSIONS_TEST_DATA.basic;
    
    for (const [key, test] of Object.entries(wildcardTests)) {
      const result = granularTest.validatePermissions(test.permissions, test.expectedResults);
      expect(result.allValid).toBe(true);
    }
  });
  
  test('Validation des actions granulaires', () => {
    const actionTests = GRANULAR_PERMISSIONS_TEST_DATA.granularActions;
    
    for (const [key, test] of Object.entries(actionTests)) {
      const result = granularTest.validatePermissions(test.permissions, test.expectedResults);
      expect(result.allValid).toBe(true);
    }
  });
  
  test('Validation de l\'héritage des permissions', () => {
    const inheritanceTests = GRANULAR_PERMISSIONS_TEST_DATA.inheritance;
    
    for (const [key, test] of Object.entries(inheritanceTests)) {
      const result = granularTest.validatePermissions(test.permissions, test.expectedResults);
      expect(result.allValid).toBe(true);
    }
  });
  
  test('Validation des exceptions et permissions spéciales', () => {
    const exceptionTests = GRANULAR_PERMISSIONS_TEST_DATA.exceptions;
    
    for (const [key, test] of Object.entries(exceptionTests)) {
      const result = granularTest.validatePermissions(test.permissions, test.expectedResults);
      expect(result.allValid).toBe(true);
    }
  });
  
  test('Validation des combinaisons logiques', () => {
    const combinationTests = GRANULAR_PERMISSIONS_TEST_DATA.combinations;
    
    for (const [key, test] of Object.entries(combinationTests)) {
      for (let i = 0; i < test.testPermissions.length; i++) {
        const userPermissions = test.testPermissions[i];
        const expectedResult = test.expectedResults[i];
        
        let actualResult;
        if (key === 'or_logic') {
          actualResult = permissionsModule.hasAnyPermission(userPermissions, test.requiredPermissions);
        } else if (key === 'and_logic') {
          actualResult = permissionsModule.hasAllPermissions(userPermissions, test.requiredPermissions);
        }
        
        expect(actualResult).toBe(expectedResult);
      }
    }
  });
});

// Export pour utilisation en ligne de commande
if (require.main === module) {
  const test = new GranularPermissionsTest();
  test.runAllTests();
}

module.exports = GranularPermissionsTest;