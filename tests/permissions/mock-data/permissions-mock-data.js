/**
 * Données mock pour les tests de permissions granulaires
 * Utilisé par les tests avancés de validation
 */

const path = require('path');

// Configuration des données mock
const MOCK_CONFIG = {
  dataPath: path.join(__dirname, 'mock-data'),
  version: '1.0.0',
  description: 'Données mock pour tests de permissions granulaires'
};

// Mock des utilisateurs avec différents niveaux de permissions
const MOCK_USERS = {
  'super_admin_user': {
    id: 'super_admin_user',
    username: 'admin.system',
    displayName: 'Administrateur Système',
    role: 'super_admin',
    permissions: ['*'],
    metadata: {
      department: 'IT',
      level: 'administrator',
      lastLogin: '2025-11-04T07:30:00.000Z',
      createdAt: '2025-01-01T00:00:00.000Z'
    }
  },

  'ged_specialist_user': {
    id: 'ged_specialist_user',
    username: 'expert.ged',
    displayName: 'Expert GED',
    role: 'ged_specialist',
    permissions: [
      'dashboard:view',
      'chat_ged:*',
      'ai_assistant:*',
      'ged_upload:create',
      'ged_delete:delete',
      'ged_network_scan:admin',
      'ged_index_manage:admin',
      'ged_stats_view:view',
      'reports:view',
      'reports:export'
    ],
    metadata: {
      department: 'IT',
      level: 'senior',
      specialties: ['GED', 'AI', 'Document_Management'],
      lastLogin: '2025-11-04T06:45:00.000Z',
      createdAt: '2025-03-15T10:30:00.000Z'
    }
  },

  'manager_user': {
    id: 'manager_user',
    username: 'manager.dept',
    displayName: 'Manager Département',
    role: 'manager',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'sessions:edit',
      'computers:*',
      'loans:*',
      'users:view',
      'users:edit',
      'chat_ged:view',
      'chat_ged:create',
      'ai_assistant:view',
      'reports:view',
      'reports:export'
    ],
    metadata: {
      department: 'Management',
      level: 'senior',
      lastLogin: '2025-11-04T07:00:00.000Z',
      createdAt: '2025-02-01T08:00:00.000Z'
    }
  },

  'technician_user': {
    id: 'technician_user',
    username: 'tech.support',
    displayName: 'Technicien Support',
    role: 'technician',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'sessions:edit',
      'sessions:disconnect',
      'computers:view',
      'computers:edit',
      'loans:view',
      'loans:create',
      'users:view',
      'chat_ged:view',
      'ai_assistant:view',
      'reports:view'
    ],
    metadata: {
      department: 'IT Support',
      level: 'intermediate',
      certifications: ['RDS Administration', 'User Support'],
      lastLogin: '2025-11-04T06:15:00.000Z',
      createdAt: '2025-04-10T14:20:00.000Z'
    }
  },

  'viewer_user': {
    id: 'viewer_user',
    username: 'viewer.observer',
    displayName: 'Observateur',
    role: 'viewer',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'computers:view',
      'loans:view',
      'users:view',
      'reports:view'
    ],
    metadata: {
      department: 'Audit',
      level: 'junior',
      accessLevel: 'read-only',
      lastLogin: '2025-11-04T05:30:00.000Z',
      createdAt: '2025-05-20T09:15:00.000Z'
    }
  }
};

// Mock des cas de test avec différents scénarios
const MOCK_TEST_SCENARIOS = {
  // Scénarios de sécurité
  security: {
    'unauthorized_access': {
      name: 'Tentative d\'accès non autorisé',
      user: 'viewer_user',
      requestedPermissions: [
        'users:create',
        'users:edit',
        'config:admin',
        'settings:edit'
      ],
      expectedResults: {
        'users:create': false,
        'users:edit': false,
        'config:admin': false,
        'settings:edit': false
      },
      severity: 'high'
    },

    'privilege_escalation': {
      name: 'Tentative d\'escalade de privilèges',
      user: 'technician_user',
      requestedPermissions: [
        'admin:*',
        'config:admin',
        'users:delete'
      ],
      expectedResults: {
        'admin:*': false,
        'config:admin': false,
        'users:delete': false
      },
      severity: 'critical'
    },

    'valid_access': {
      name: 'Accès valide dans les permissions',
      user: 'manager_user',
      requestedPermissions: [
        'loans:view',
        'loans:create',
        'loans:edit',
        'reports:view'
      ],
      expectedResults: {
        'loans:view': true,
        'loans:create': true,
        'loans:edit': true,
        'reports:view': true
      },
      severity: 'normal'
    }
  },

  // Scénarios de performance
  performance: {
    'bulk_permission_check': {
      name: 'Vérification en masse des permissions',
      user: 'ged_specialist_user',
      permissions: [
        'dashboard:view',
        'chat_ged:*',
        'ai_assistant:*',
        'ged_upload:create',
        'ged_delete:delete',
        'ged_network_scan:admin',
        'ged_index_manage:admin',
        'ged_stats_view:view',
        'reports:view',
        'reports:export'
      ],
      testPermissions: Array.from({length: 100}, (_, i) => `test_module_${i % 10}:test_action_${i % 5}`),
      maxTime: 50, // ms
      iterations: 1000
    },

    'cache_performance': {
      name: 'Performance du cache des permissions',
      user: 'super_admin_user',
      permissions: ['*'],
      cacheEnabled: true,
      testPermissions: Array.from({length: 50}, (_, i) => `module_${i}:action_${i}`),
      expectedCacheHitRate: 0.95
    }
  },

  // Scénarios d'intégration
  integration: {
    'ged_workflow': {
      name: 'Workflow GED complet',
      user: 'ged_specialist_user',
      workflow: [
        {
          step: 'Connexion au système',
          permission: 'dashboard:view',
          expected: true
        },
        {
          step: 'Accès au chat GED',
          permission: 'chat_ged:view',
          expected: true
        },
        {
          step: 'Création de document',
          permission: 'ged_upload:create',
          expected: true
        },
        {
          step: 'Suppression de document',
          permission: 'ged_delete:delete',
          expected: true
        },
        {
          step: 'Administration IA',
          permission: 'ai_assistant:admin',
          expected: true
        },
        {
          step: 'Export de rapport',
          permission: 'reports:export',
          expected: true
        }
      ]
    },

    'support_workflow': {
      name: 'Workflow Support technique',
      user: 'technician_user',
      workflow: [
        {
          step: 'Consultation dashboard',
          permission: 'dashboard:view',
          expected: true
        },
        {
          step: 'Gestion session utilisateur',
          permission: 'sessions:edit',
          expected: true
        },
        {
          step: 'Déconnexion forcée',
          permission: 'sessions:disconnect',
          expected: true
        },
        {
          step: 'Gestion prêts',
          permission: 'loans:create',
          expected: true
        },
        {
          step: 'Administration',
          permission: 'admin:*',
          expected: false
        }
      ]
    }
  },

  // Scénarios de validation de format
  format_validation: {
    'valid_formats': {
      name: 'Formats de permissions valides',
      user: 'admin_user',
      testPermissions: [
        '*',                    // Super admin
        'dashboard:*',          // Wildcard module
        'sessions:view',        // Permission exacte
        'users:create',
        'loans:edit',
        'config:admin'
      ],
      expectedAllValid: true
    },

    'invalid_formats': {
      name: 'Formats de permissions invalides',
      user: 'viewer_user',
      testPermissions: [
        '',                     // Vide
        'dashboard',            // Manque :
        ':view',               // Manque module
        'dashboard:',          // Manque action
        'dashboard::view',     // Trop de :
        ' dashboard:view ',    // Espaces
        'dashboard-view',      // - au lieu de :
        'dashboard.view',      // . au lieu de :
        'Dashboard:View',      // Majuscules
        '123:invalid'          // Caractères spéciaux
      ],
      expectedAllInvalid: true
    },

    'edge_cases': {
      name: 'Cas limites',
      user: 'viewer_user',
      testPermissions: [
        [],                    // Tableau vide
        null,                  // Null
        undefined,             // Undefined
        'dashboard:view:extra', // Trop de parties
        'very_long_module_name_with_underscores:view',
        'dash:123',
        'mod:act!@#$%^&*()'
      ],
      expectedErrorHandling: true
    }
  }
};

// Mock des données de performance
const MOCK_PERFORMANCE_DATA = {
  // Métriques de base
  baseline: {
    single_permission_check: 0.1,      // ms
    wildcard_check: 0.05,              // ms
    cache_lookup: 0.01,                // ms
    config_load: 10,                   // ms
    role_inference: 5                  // ms
  },

  // Charges de travail typiques
  workload: {
    light: {
      users: 10,
      roles: 3,
      permissions_per_user: 5,
      checks_per_second: 50
    },
    medium: {
      users: 100,
      roles: 6,
      permissions_per_user: 15,
      checks_per_second: 500
    },
    heavy: {
      users: 1000,
      roles: 10,
      permissions_per_user: 30,
      checks_per_second: 5000
    }
  },

  // Seuils de performance
  thresholds: {
    max_single_check_time: 1,          // ms
    max_wildcard_check_time: 0.5,      // ms
    max_cache_lookup_time: 0.1,        // ms
    max_config_load_time: 100,         // ms
    max_role_inference_time: 20,       // ms
    min_cache_hit_rate: 0.9,           // 90%
    max_memory_usage_mb: 50            // MB
  }
};

// Mock des configurations de test
const MOCK_TEST_CONFIGS = {
  // Configuration de test rapide
  quick: {
    description: 'Tests rapides pour développement',
    timeout: 5000,
    iterations: 100,
    coverage: ['basic', 'format_validation']
  },

  // Configuration de test complète
  full: {
    description: 'Tests complets pour validation',
    timeout: 30000,
    iterations: 10000,
    coverage: ['security', 'performance', 'integration', 'format_validation']
  },

  // Configuration de test de performance
  performance: {
    description: 'Tests de performance spécialisés',
    timeout: 60000,
    iterations: 100000,
    coverage: ['performance'],
    monitor: {
      memory: true,
      cpu: true,
      latency: true
    }
  },

  // Configuration de test de sécurité
  security: {
    description: 'Tests de sécurité approfondis',
    timeout: 20000,
    iterations: 1000,
    coverage: ['security'],
    strict: true,
    fail_on_warning: true
  }
};

// Mock des erreurs attendues
const MOCK_ERROR_CASES = {
  validation_errors: [
    {
      type: 'invalid_permission_format',
      permission: 'dashboard-view',
      expectedError: 'Permission must be in format "module:action"'
    },
    {
      type: 'missing_colon',
      permission: 'dashboard',
      expectedError: 'Permission must contain exactly one colon'
    },
    {
      type: 'too_many_colons',
      permission: 'dashboard:view:extra',
      expectedError: 'Permission cannot contain more than one colon'
    },
    {
      type: 'empty_permission',
      permission: '',
      expectedError: 'Permission cannot be empty'
    },
    {
      type: 'unknown_action',
      permission: 'dashboard:unknown_action',
      expectedError: 'Unknown action: unknown_action'
    }
  ],

  runtime_errors: [
    {
      type: 'cache_miss',
      scenario: 'Cache disabled with cold start',
      expectedBehavior: 'Fallback to direct validation'
    },
    {
      type: 'config_reload',
      scenario: 'Configuration reloaded during validation',
      expectedBehavior: 'Atomic update with no interruption'
    },
    {
      type: 'concurrent_access',
      scenario: 'Multiple simultaneous permission checks',
      expectedBehavior: 'Thread-safe operations'
    }
  ]
};

// Mock des données de benchmark
const MOCK_BENCHMARK_DATA = {
  // Résultats de benchmark typiques
  results: {
    'permission_check_speed': {
      'super_admin_*': { min: 0.01, max: 0.05, avg: 0.02, unit: 'ms' },
      'wildcard_dashboard_*': { min: 0.02, max: 0.08, avg: 0.04, unit: 'ms' },
      'exact_sessions_view': { min: 0.01, max: 0.03, avg: 0.015, unit: 'ms' },
      'cache_hit': { min: 0.005, max: 0.01, avg: 0.007, unit: 'ms' },
      'cache_miss': { min: 0.02, max: 0.06, avg: 0.03, unit: 'ms' }
    },

    'memory_usage': {
      'baseline': { min: 5, max: 10, avg: 7, unit: 'MB' },
      'with_cache': { min: 15, max: 25, avg: 20, unit: 'MB' },
      'peak_usage': { min: 30, max: 50, avg: 40, unit: 'MB' }
    },

    'throughput': {
      'single_thread': { min: 10000, max: 50000, avg: 25000, unit: 'checks/sec' },
      'multi_thread': { min: 50000, max: 200000, avg: 100000, unit: 'checks/sec' },
      'with_cache': { min: 100000, max: 500000, avg: 250000, unit: 'checks/sec' }
    }
  },

  // Comparaisons de versions
  version_comparison: {
    'v1.0.0_vs_v1.1.0': {
      speed_improvement: '15%',
      memory_reduction: '10%',
      accuracy_improvement: '5%'
    },
    'v1.1.0_vs_v1.2.0': {
      speed_improvement: '25%',
      memory_reduction: '15%',
      accuracy_improvement: '8%'
    }
  }
};

// Fonctions utilitaires pour les mock data
const mockDataUtils = {
  /**
   * Générer un utilisateur avec permissions personnalisées
   */
  generateUser: (id, role, customPermissions = []) => {
    const baseUser = MOCK_USERS[`${role}_user`];
    if (!baseUser) {
      throw new Error(`Rôle inconnu: ${role}`);
    }

    return {
      ...baseUser,
      id: id,
      permissions: customPermissions.length > 0 ? customPermissions : baseUser.permissions,
      metadata: {
        ...baseUser.metadata,
        generated: true,
        timestamp: new Date().toISOString()
      }
    };
  },

  /**
   * Créer un scénario de test personnalisé
   */
  createCustomScenario: (name, userId, permissions, testCases) => {
    return {
      name,
      user: userId,
      permissions,
      testCases,
      generated: true,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Valider la cohérence des données mock
   */
  validateMockData: () => {
    const errors = [];

    // Valider les utilisateurs
    Object.values(MOCK_USERS).forEach(user => {
      if (!user.permissions || !Array.isArray(user.permissions)) {
        errors.push(`Utilisateur ${user.id}: permissions invalides`);
      }
      if (!user.role) {
        errors.push(`Utilisateur ${user.id}: rôle manquant`);
      }
    });

    // Valider les scénarios
    Object.values(MOCK_TEST_SCENARIOS).forEach(category => {
      Object.values(category).forEach(scenario => {
        if (!scenario.name) {
          errors.push(`Scénario: nom manquant`);
        }
        if (!scenario.user) {
          errors.push(`Scénario ${scenario.name}: utilisateur manquant`);
        }
      });
    });

    return errors;
  },

  /**
   * Exporter les données mock pour les tests
   */
  exportForTests: () => {
    return {
      users: MOCK_USERS,
      scenarios: MOCK_TEST_SCENARIOS,
      performance: MOCK_PERFORMANCE_DATA,
      configs: MOCK_TEST_CONFIGS,
      errors: MOCK_ERROR_CASES,
      benchmarks: MOCK_BENCHMARK_DATA,
      metadata: {
        version: MOCK_CONFIG.version,
        generatedAt: new Date().toISOString(),
        validation: mockDataUtils.validateMockData()
      }
    };
  }
};

// Vérification de validation au chargement
if (require.main === module) {
  console.log('🔍 Validation des données mock...');
  
  const validationErrors = mockDataUtils.validateMockData();
  
  if (validationErrors.length === 0) {
    console.log('✅ Données mock valides');
    console.log(`📊 Résumé:`);
    console.log(`   • Utilisateurs: ${Object.keys(MOCK_USERS).length}`);
    console.log(`   • Scénarios: ${Object.values(MOCK_TEST_SCENARIOS).reduce((acc, cat) => acc + Object.keys(cat).length, 0)}`);
    console.log(`   • Configurations de test: ${Object.keys(MOCK_TEST_CONFIGS).length}`);
    
    // Exporter les données
    const exportData = mockDataUtils.exportForTests();
    console.log(`💾 Export des données mock prêt`);
    
  } else {
    console.log('❌ Erreurs dans les données mock:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    process.exit(1);
  }
}

// Export du module
module.exports = {
  // Configuration
  MOCK_CONFIG,
  
  // Données principales
  MOCK_USERS,
  MOCK_TEST_SCENARIOS,
  MOCK_PERFORMANCE_DATA,
  MOCK_TEST_CONFIGS,
  MOCK_ERROR_CASES,
  MOCK_BENCHMARK_DATA,
  
  // Utilitaires
  mockDataUtils,
  
  // Export par défaut
  default: {
    users: MOCK_USERS,
    scenarios: MOCK_TEST_SCENARIOS,
    performance: MOCK_PERFORMANCE_DATA,
    configs: MOCK_TEST_CONFIGS
  }
};