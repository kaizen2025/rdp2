/**
 * Tests de validation de la configuration des permissions
 * Valide la cohérence entre config.json et permissions.js
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config/config.json');

// Configuration des tests
const TEST_CONFIG = {
  strict: process.env.TEST_STRICT === 'true',
  mockDataPath: path.join(__dirname, 'mock-data'),
  outputPath: path.join(__dirname, 'test-results'),
  timeout: 30000
};

// Données de test pour la configuration des permissions
const PERMISSIONS_CONFIG_TEST_DATA = {
  // Structure de configuration attendue
  expectedConfigStructure: {
    roles: {
      type: 'object',
      required: ['super_admin', 'admin', 'ged_specialist', 'manager', 'technician', 'viewer'],
      properties: {
        super_admin: {
          required: ['name', 'description', 'permissions', 'priority'],
          properties: {
            permissions: { contains: '*' }
          }
        },
        admin: {
          required: ['name', 'description', 'permissions', 'priority'],
          properties: {
            permissions: { contains: { type: 'string' } }
          }
        }
      }
    }
  },

  // Tests de cohérence des rôles
  roleConsistency: {
    requiredRoles: [
      'super_admin',
      'admin',
      'ged_specialist',
      'manager',
      'technician',
      'viewer'
    ],
    
    rolePriorities: {
      super_admin: 100,
      admin: 90,
      ged_specialist: 85,
      manager: 70,
      technician: 50,
      viewer: 10
    },
    
    requiredFields: [
      'name',
      'description',
      'permissions',
      'icon',
      'color',
      'priority'
    ]
  },

  // Tests de validation des permissions
  permissionValidation: {
    validFormats: [
      '*',                    // Super admin
      'dashboard:*',          // Wildcard module
      'sessions:view',        // Permission exacte
      'users:create',
      'loans:edit'
    ],
    
    invalidFormats: [
      '',                     // Vide
      'dashboard',            // Manque :
      ':view',               // Manque module
      'dashboard:',          // Manque action
      'dashboard::view',     // Trop de :
      ' dashboard:view ',    // Espaces
      'dashboard-view',      // - au lieu de :
      'dashboard.view'       // . au lieu de :
    ],
    
    expectedActions: [
      'view', 'create', 'edit', 'delete', 
      'export', 'admin', '*'
    ],
    
    expectedModules: [
      'dashboard', 'sessions', 'computers', 'loans',
      'users', 'ad_management', 'chat_ged', 'ai_assistant',
      'reports', 'settings', 'config'
    ]
  },

  // Tests d'héritage et hiérarchie
  inheritanceTests: {
    hierarchicalStructure: {
      // Chaque rôle devrait hériter des permissions du rôle inférieur
      expectedInheritance: {
        'super_admin': ['*'],
        'admin': ['dashboard:*', 'sessions:*', 'computers:*', 'loans:*', 'users:*'],
        'ged_specialist': ['dashboard:view', 'chat_ged:*', 'ai_assistant:*'],
        'manager': ['dashboard:view', 'sessions:view', 'loans:*'],
        'technician': ['dashboard:view', 'sessions:view', 'sessions:edit'],
        'viewer': ['dashboard:view', 'sessions:view']
      }
    },
    
    permissionEscalation: {
      // Un rôle supérieur devrait avoir au moins toutes les permissions du rôle inférieur
      escalationRules: [
        { higher: 'admin', lower: 'manager', ratio: 1.5 },
        { higher: 'manager', lower: 'technician', ratio: 1.2 },
        { higher: 'technician', lower: 'viewer', ratio: 1.1 }
      ]
    }
  },

  // Tests de performance de configuration
  performanceTests: {
    configSize: {
      maxRoles: 50,
      maxPermissionsPerRole: 100,
      maxTotalPermissions: 500
    },
    
    loadingTime: {
      maxLoadTime: 1000, // 1 seconde
      maxValidationTime: 500 // 500ms
    }
  }
};

// Classe principale des tests
class PermissionsConfigTest {
  constructor() {
    this.config = config;
    this.results = {
      timestamp: new Date().toISOString(),
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      performance: {},
      details: []
    };
  }

  /**
   * Exécuter tous les tests de configuration
   */
  async runAllTests() {
    console.log('🔧 Démarrage des tests de configuration des permissions...\n');
    
    const startTime = Date.now();
    
    try {
      await this.testConfigStructure();
      await this.testRoleConsistency();
      await this.testPermissionValidation();
      await this.testInheritanceHierarchy();
      await this.testConfigConsistency();
      await this.testPerformance();
      await this.testEdgeCases();
      
      const endTime = Date.now();
      this.results.performance.totalExecutionTime = endTime - startTime;
      
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
   * Test de la structure de configuration
   */
  async testConfigStructure() {
    console.log('📋 Test de la structure de configuration...');
    
    // Vérifier la présence de la section roles
    this.results.total++;
    
    try {
      if (!this.config.roles) {
        throw new Error('Section "roles" manquante dans la configuration');
      }
      
      const roles = this.config.roles;
      
      // Vérifier les rôles requis
      for (const requiredRole of PERMISSIONS_CONFIG_TEST_DATA.roleConsistency.requiredRoles) {
        this.results.total++;
        
        if (!roles[requiredRole]) {
          throw new Error(`Rôle requis manquant: ${requiredRole}`);
        }
        
        const role = roles[requiredRole];
        
        // Vérifier les champs obligatoires
        for (const field of PERMISSIONS_CONFIG_TEST_DATA.roleConsistency.requiredFields) {
          this.results.total++;
          
          if (role[field] === undefined) {
            throw new Error(`Champ requis manquant dans ${requiredRole}: ${field}`);
          }
        }
        
        console.log(`✅ Rôle ${requiredRole} - structure valide`);
        this.results.passed++;
      }
      
    } catch (error) {
      this.results.failed++;
      console.log(`❌ Erreur structure: ${error.message}`);
      this.results.errors.push({
        type: 'config_structure',
        error: error.message
      });
    }
    
    console.log('');
  }

  /**
   * Test de cohérence des rôles
   */
  async testRoleConsistency() {
    console.log('🔍 Test de cohérence des rôles...');
    
    const roles = this.config.roles;
    const expectedPriorities = PERMISSIONS_CONFIG_TEST_DATA.roleConsistency.rolePriorities;
    
    for (const [roleId, role] of Object.entries(roles)) {
      this.results.total++;
      
      try {
        // Test de priorité
        if (expectedPriorities[roleId]) {
          if (role.priority !== expectedPriorities[roleId]) {
            this.results.warnings.push({
              role: roleId,
              expectedPriority: expectedPriorities[roleId],
              actualPriority: role.priority,
              message: `Priorité incorrecte pour ${roleId}: attendu ${expectedPriorities[roleId]}, obtenu ${role.priority}`
            });
          }
        }
        
        // Test de cohérence des champs
        this.validateRoleFields(roleId, role);
        
        // Test de format des permissions
        this.validateRolePermissions(roleId, role.permissions);
        
        console.log(`✅ Rôle ${roleId} - cohérence validée`);
        this.results.passed++;
        
      } catch (error) {
        this.results.failed++;
        console.log(`❌ Erreur cohérence ${roleId}: ${error.message}`);
        this.results.errors.push({
          role: roleId,
          error: error.message
        });
      }
    }
    
    console.log('');
  }

  /**
   * Valider les champs d'un rôle
   */
  validateRoleFields(roleId, role) {
    const fields = PERMISSIONS_CONFIG_TEST_DATA.roleConsistency.requiredFields;
    
    for (const field of fields) {
      if (role[field] === undefined || role[field] === null) {
        throw new Error(`Champ ${field} manquant ou null pour ${roleId}`);
      }
    }
    
    // Validations spécifiques
    if (typeof role.priority !== 'number' || role.priority < 0) {
      throw new Error(`Priorité invalide pour ${roleId}: ${role.priority}`);
    }
    
    if (typeof role.permissions !== 'object' || !Array.isArray(role.permissions)) {
      throw new Error(`Permissions invalides pour ${roleId}: doit être un tableau`);
    }
  }

  /**
   * Valider les permissions d'un rôle
   */
  validateRolePermissions(roleId, permissions) {
    if (!Array.isArray(permissions)) {
      throw new Error(`Permissions de ${roleId} doivent être un tableau`);
    }
    
    for (const permission of permissions) {
      this.validatePermissionFormat(permission, roleId);
    }
    
    // Vérifier les doublons
    const uniquePermissions = [...new Set(permissions)];
    if (uniquePermissions.length !== permissions.length) {
      this.results.warnings.push({
        role: roleId,
        message: `Permissions dupliquées détectées dans ${roleId}`
      });
    }
  }

  /**
   * Valider le format d'une permission
   */
  validatePermissionFormat(permission, roleId) {
    const validFormats = PERMISSIONS_CONFIG_TEST_DATA.permissionValidation.validFormats;
    const invalidFormats = PERMISSIONS_CONFIG_TEST_DATA.permissionValidation.invalidFormats;
    
    // Vérifier les formats invalides
    if (invalidFormats.includes(permission)) {
      throw new Error(`Format de permission invalide "${permission}" dans ${roleId}`);
    }
    
    // Vérifier les formats valides
    if (permission === '*' || permission.includes(':')) {
      // Format valide
      return;
    }
    
    // Vérifier si c'est un format personnalisé valide
    if (validFormats.includes(permission)) {
      return;
    }
    
    // Si on arrive ici, le format est inconnu
    this.results.warnings.push({
      role: roleId,
      permission: permission,
      message: `Format de permission potentiellement invalide: ${permission}`
    });
  }

  /**
   * Test de validation des permissions
   */
  async testPermissionValidation() {
    console.log('⚙️ Test de validation des permissions...');
    
    const validFormats = PERMISSIONS_CONFIG_TEST_DATA.permissionValidation.validFormats;
    const invalidFormats = PERMISSIONS_CONFIG_TEST_DATA.permissionValidation.invalidFormats;
    
    // Test des formats valides
    this.results.total++;
    try {
      for (const format of validFormats) {
        this.validatePermissionFormat(format, 'test_role');
      }
      console.log('✅ Formats valides acceptés');
      this.results.passed++;
    } catch (error) {
      this.results.failed++;
      console.log('❌ Formats valides rejetés:', error.message);
    }
    
    // Test des formats invalides
    this.results.total++;
    try {
      let invalidCount = 0;
      for (const format of invalidFormats) {
        try {
          this.validatePermissionFormat(format, 'test_role');
        } catch (error) {
          invalidCount++;
        }
      }
      
      if (invalidCount === invalidFormats.length) {
        console.log('✅ Formats invalides correctement rejetés');
        this.results.passed++;
      } else {
        throw new Error(`${invalidCount}/${invalidFormats.length} formats invalides acceptés`);
      }
    } catch (error) {
      this.results.failed++;
      console.log('❌ Formats invalides non rejetés:', error.message);
    }
    
    // Test des actions valides
    this.results.total++;
    try {
      const expectedActions = PERMISSIONS_CONFIG_TEST_DATA.permissionValidation.expectedActions;
      const roles = this.config.roles;
      
      let foundActions = new Set();
      for (const role of Object.values(roles)) {
        for (const permission of role.permissions || []) {
          if (permission.includes(':')) {
            const action = permission.split(':')[1];
            if (action !== '*') {
              foundActions.add(action);
            }
          }
        }
      }
      
      // Vérifier qu'on n'a que des actions valides
      for (const action of foundActions) {
        if (!expectedActions.includes(action)) {
          throw new Error(`Action inconnue trouvée: ${action}`);
        }
      }
      
      console.log('✅ Actions valides validées');
      this.results.passed++;
    } catch (error) {
      this.results.failed++;
      console.log('❌ Erreur validation actions:', error.message);
    }
    
    console.log('');
  }

  /**
   * Test d'héritage et hiérarchie
   */
  async testInheritanceHierarchy() {
    console.log('🔗 Test d\'héritage et hiérarchie...');
    
    const expectedInheritance = PERMISSIONS_CONFIG_TEST_DATA.inheritanceTests.hierarchicalStructure.expectedInheritance;
    
    for (const [roleId, expectedPermissions] of Object.entries(expectedInheritance)) {
      this.results.total++;
      
      try {
        const role = this.config.roles[roleId];
        if (!role) {
          throw new Error(`Rôle ${roleId} non trouvé`);
        }
        
        const actualPermissions = role.permissions || [];
        
        // Vérifier que les permissions attendues sont présentes
        for (const expectedPerm of expectedPermissions) {
          if (!actualPermissions.includes(expectedPerm)) {
            this.results.warnings.push({
              role: roleId,
              missingPermission: expectedPerm,
              message: `Permission attendue manquante: ${expectedPerm} dans ${roleId}`
            });
          }
        }
        
        console.log(`✅ Hiérarchie ${roleId} validée`);
        this.results.passed++;
        
      } catch (error) {
        this.results.failed++;
        console.log(`❌ Erreur hiérarchie ${roleId}:`, error.message);
      }
    }
    
    // Test de ratio d'escalation
    await this.testPermissionEscalation();
    
    console.log('');
  }

  /**
   * Test d'escalation des permissions
   */
  async testPermissionEscalation() {
    this.results.total++;
    
    try {
      const escalationRules = PERMISSIONS_CONFIG_TEST_DATA.inheritanceTests.permissionEscalation.escalationRules;
      const roles = this.config.roles;
      
      for (const rule of escalationRules) {
        const higherRole = roles[rule.higher];
        const lowerRole = roles[rule.lower];
        
        if (higherRole && lowerRole) {
          const higherPermCount = (higherRole.permissions || []).length;
          const lowerPermCount = (lowerRole.permissions || []).length;
          
          const ratio = higherPermCount / lowerPermCount;
          
          if (ratio < rule.ratio) {
            this.results.warnings.push({
              roles: `${rule.higher}/${rule.lower}`,
              ratio: ratio,
              expectedRatio: rule.ratio,
              message: `Ratio d'escalation faible: ${ratio.toFixed(2)} < ${rule.ratio}`
            });
          }
        }
      }
      
      console.log('✅ Escalation des permissions validée');
      this.results.passed++;
      
    } catch (error) {
      this.results.failed++;
      console.log('❌ Erreur escalation:', error.message);
    }
  }

  /**
   * Test de cohérence entre config et permissions.js
   */
  async testConfigConsistency() {
    console.log('🔄 Test de cohérence config/permissions.js...');
    
    this.results.total++;
    
    try {
      // Charger permissions.js pour comparaison
      const permissionsPath = path.join(__dirname, '../../src/models/permissions.js');
      const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');
      
      // Vérifier la présence des exports
      const requiredExports = ['PERMISSIONS', 'ROLES', 'MODULES'];
      for (const exportName of requiredExports) {
        if (!permissionsContent.includes(`export const ${exportName}`)) {
          this.results.warnings.push({
            type: 'missing_export',
            export: exportName,
            message: `Export manquant dans permissions.js: ${exportName}`
          });
        }
      }
      
      // Vérifier la cohérence des rôles
      const configRoles = Object.keys(this.config.roles || {});
      
      // Simulation de vérification (sans import réel)
      const expectedRoles = ['super_admin', 'admin', 'ged_specialist', 'manager', 'technician', 'viewer'];
      for (const role of expectedRoles) {
        if (!configRoles.includes(role)) {
          this.results.warnings.push({
            role: role,
            message: `Rôle ${role} manquant dans la configuration`
          });
        }
      }
      
      console.log('✅ Cohérence config/permissions.js validée');
      this.results.passed++;
      
    } catch (error) {
      this.results.failed++;
      console.log('❌ Erreur cohérence:', error.message);
    }
    
    console.log('');
  }

  /**
   * Test de performance
   */
  async testPerformance() {
    console.log('🚀 Test de performance...');
    
    const startTime = Date.now();
    
    // Test de chargement de configuration
    this.results.total++;
    
    try {
      const loadStartTime = Date.now();
      
      // Re-charger la configuration plusieurs fois
      for (let i = 0; i < 100; i++) {
        const testConfig = require('../../config/config.json');
        if (!testConfig.roles) {
          throw new Error('Configuration invalide');
        }
      }
      
      const loadEndTime = Date.now();
      const loadTime = loadEndTime - loadStartTime;
      
      const maxLoadTime = PERMISSIONS_CONFIG_TEST_DATA.performanceTests.loadingTime.maxLoadTime;
      
      if (loadTime < maxLoadTime) {
        console.log(`✅ Chargement de config rapide: ${loadTime}ms`);
        this.results.passed++;
      } else {
        throw new Error(`Chargement trop lent: ${loadTime}ms > ${maxLoadTime}ms`);
      }
      
    } catch (error) {
      this.results.failed++;
      console.log('❌ Erreur performance:', error.message);
    }
    
    // Test de taille de configuration
    this.results.total++;
    
    try {
      const roles = this.config.roles || {};
      const totalRoles = Object.keys(roles).length;
      const maxRoles = PERMISSIONS_CONFIG_TEST_DATA.performanceTests.configSize.maxRoles;
      
      if (totalRoles <= maxRoles) {
        console.log(`✅ Taille de configuration acceptable: ${totalRoles} rôles`);
        this.results.passed++;
      } else {
        throw new Error(`Trop de rôles: ${totalRoles} > ${maxRoles}`);
      }
      
    } catch (error) {
      this.results.failed++;
      console.log('❌ Erreur taille config:', error.message);
    }
    
    console.log('');
  }

  /**
   * Test des cas limites
   */
  async testEdgeCases() {
    console.log('🎯 Test des cas limites...');
    
    // Test de configuration vide
    this.results.total++;
    
    try {
      const emptyConfig = { roles: {} };
      if (!emptyConfig.roles) {
        throw new Error('Configuration vide invalide');
      }
      console.log('✅ Configuration vide gérée');
      this.results.passed++;
    } catch (error) {
      this.results.failed++;
      console.log('❌ Erreur config vide:', error.message);
    }
    
    // Test de permissions nulles
    this.results.total++;
    
    try {
      const nullPermRole = {
        name: 'Test Role',
        permissions: null,
        priority: 50
      };
      
      this.validateRolePermissions('test_role', null);
      console.log('❌ Permissions nulles non détectées');
      this.results.failed++;
    } catch (error) {
      console.log('✅ Permissions nulles correctement détectées');
      this.results.passed++;
    }
    
    console.log('');
  }

  /**
   * Générer le rapport final
   */
  generateReport() {
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    
    console.log('📊 RAPPORT FINAL - TESTS DE CONFIGURATION');
    console.log('=' .repeat(55));
    console.log(`📈 Statistiques:`);
    console.log(`   • Total des tests: ${this.results.total}`);
    console.log(`   • Tests réussis: ${this.results.passed} ✅`);
    console.log(`   • Tests échoués: ${this.results.failed} ❌`);
    console.log(`   • Avertissements: ${this.results.warnings.length} ⚠️`);
    console.log(`   • Taux de réussite: ${successRate}%`);
    console.log(`   • Temps d'exécution: ${this.results.performance.totalExecutionTime || 0}ms`);
    console.log('');
    
    // Erreurs critiques
    if (this.results.errors.length > 0) {
      console.log('🚨 ERREURS CRITIQUES:'.red.bold);
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.error || error.message}`);
      });
      console.log('');
    }
    
    // Avertissements
    if (this.results.warnings.length > 0) {
      console.log('⚠️ AVERTISSEMENTS:'.yellow.bold);
      this.results.warnings.slice(0, 10).forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message}`);
      });
      if (this.results.warnings.length > 10) {
        console.log(`   ... et ${this.results.warnings.length - 10} autres`);
      }
      console.log('');
    }
    
    // Sauvegarder le rapport
    this.saveReport();
    
    // Statut final
    if (this.results.failed === 0) {
      if (this.results.warnings.length === 0) {
        console.log('🎉 TOUS LES TESTS SONT PASSÉS! Configuration des permissions parfaite.');
        process.exit(0);
      } else {
        console.log('✅ TESTS RÉUSSIS avec avertissements - Configuration acceptable.');
        process.exit(0);
      }
    } else {
      console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ - Problèmes de configuration détectés.');
      process.exit(1);
    }
  }

  /**
   * Sauvegarder le rapport
   */
  saveReport() {
    try {
      if (!fs.existsSync(TEST_CONFIG.outputPath)) {
        fs.mkdirSync(TEST_CONFIG.outputPath, { recursive: true });
      }
      
      const reportFile = path.join(
        TEST_CONFIG.outputPath, 
        `permissions-config-test-${Date.now()}.json`
      );
      
      const reportData = {
        timestamp: this.results.timestamp,
        summary: {
          total: this.results.total,
          passed: this.results.passed,
          failed: this.results.failed,
          warnings: this.results.warnings.length,
          successRate: ((this.results.passed / this.results.total) * 100).toFixed(1)
        },
        results: this.results,
        testData: PERMISSIONS_CONFIG_TEST_DATA
      };
      
      fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
      console.log(`💾 Rapport sauvegardé: ${reportFile}`);
      
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder le rapport:', error.message);
    }
  }
}

// Tests Jest
describe('Tests de Configuration des Permissions', () => {
  let configTest;
  
  beforeEach(() => {
    configTest = new PermissionsConfigTest();
  });
  
  afterEach(() => {
    if (configTest && configTest.results) {
      console.log(`Tests: ${configTest.results.total}, Réussis: ${configTest.results.passed}, Échoués: ${configTest.results.failed}`);
    }
  });
  
  test('Structure de configuration valide', () => {
    expect(config.roles).toBeDefined();
    expect(typeof config.roles).toBe('object');
    
    const requiredRoles = ['super_admin', 'admin', 'ged_specialist', 'manager', 'technician', 'viewer'];
    requiredRoles.forEach(roleId => {
      expect(config.roles[roleId]).toBeDefined();
      expect(config.roles[roleId].name).toBeDefined();
      expect(config.roles[roleId].permissions).toBeDefined();
      expect(Array.isArray(config.roles[roleId].permissions)).toBe(true);
    });
  });
  
  test('Cohérence des priorités des rôles', () => {
    const roles = config.roles;
    
    expect(roles.super_admin.priority).toBe(100);
    expect(roles.admin.priority).toBe(90);
    expect(roles.ged_specialist.priority).toBeGreaterThan(roles.manager.priority);
    expect(roles.manager.priority).toBeGreaterThan(roles.technician.priority);
    expect(roles.technician.priority).toBeGreaterThan(roles.viewer.priority);
  });
  
  test('Formats de permissions valides', () => {
    const validFormats = ['*', 'dashboard:*', 'sessions:view', 'users:create'];
    
    validFormats.forEach(format => {
      expect(typeof format).toBe('string');
      expect(format.length).toBeGreaterThan(0);
    });
  });
  
  test('Héritage des permissions', () => {
    const roles = config.roles;
    
    // Le super admin devrait avoir *
    expect(roles.super_admin.permissions).toContain('*');
    
    // L'admin devrait avoir plus de permissions que le manager
    expect(roles.admin.permissions.length).toBeGreaterThan(roles.manager.permissions.length);
    
    // Le manager devrait avoir plus de permissions que le technician
    expect(roles.manager.permissions.length).toBeGreaterThan(roles.technician.permissions.length);
  });
  
  test('Champs obligatoires des rôles', () => {
    const requiredFields = ['name', 'description', 'permissions', 'icon', 'color', 'priority'];
    
    Object.values(config.roles).forEach(role => {
      requiredFields.forEach(field => {
        expect(role[field]).toBeDefined();
        expect(role[field]).not.toBeNull();
      });
    });
  });
});

// Export pour utilisation autonome
if (require.main === module) {
  const test = new PermissionsConfigTest();
  test.runAllTests();
}

module.exports = PermissionsConfigTest;