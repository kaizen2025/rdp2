/**
 * Données mock pour les tests de permissions et rôles
 * Inclut des utilisateurs simulés avec différents rôles et permissions
 */

// ==================== UTILISATEURS MOCK ====================

export const mockUsers = {
  // Super Admin - Accès complet
  superAdmin: {
    id: 'user_super_admin',
    username: 'superadmin',
    email: 'superadmin@anecoop.com',
    role: 'super_admin',
    firstName: 'Super',
    lastName: 'Admin',
    department: 'IT',
    permissions: ['*']
  },

  // Admin - Gestion complète sans wildcard
  admin: {
    id: 'user_admin',
    username: 'admin',
    email: 'admin@anecoop.com',
    role: 'admin',
    firstName: 'Jean',
    lastName: 'Admin',
    department: 'IT',
    permissions: [
      'dashboard:*',
      'sessions:*',
      'computers:*',
      'loans:*',
      'users:*',
      'ad_management:*',
      'chat_ged:*',
      'ai_assistant:*',
      'reports:*',
      'settings:*',
      'config:view'
    ]
  },

  // GED Specialist - Expert en GED et IA
  gedSpecialist: {
    id: 'user_ged_specialist',
    username: 'ged_spe',
    email: 'ged.specialist@anecoop.com',
    role: 'ged_specialist',
    firstName: 'Marie',
    lastName: 'GedExpert',
    department: 'Documentation',
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
    ]
  },

  // Manager - Gestionnaire avec droits étendus
  manager: {
    id: 'user_manager',
    username: 'manager',
    email: 'manager@anecoop.com',
    role: 'manager',
    firstName: 'Pierre',
    lastName: 'Manager',
    department: 'Operations',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'computers:*',
      'loans:*',
      'users:view',
      'chat_ged:view',
      'chat_ged:create',
      'ai_assistant:view',
      'reports:view',
      'reports:export'
    ]
  },

  // Technician - Support technique
  technician: {
    id: 'user_technician',
    username: 'tech',
    email: 'tech@anecoop.com',
    role: 'technician',
    firstName: 'Sophie',
    lastName: 'Tech',
    department: 'Support',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'sessions:edit',
      'computers:view',
      'loans:view',
      'loans:create',
      'chat_ged:view',
      'ai_assistant:view',
      'reports:view'
    ]
  },

  // Viewer - Observateur (accès lecture seule)
  viewer: {
    id: 'user_viewer',
    username: 'viewer',
    email: 'viewer@anecoop.com',
    role: 'viewer',
    firstName: 'Luc',
    lastName: 'Viewer',
    department: 'Consultation',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'computers:view',
      'loans:view',
      'reports:view'
    ]
  },

  // Utilisateur sans rôle défini (doit utiliser permissions directes)
  customUser: {
    id: 'user_custom',
    username: 'custom',
    email: 'custom@anecoop.com',
    firstName: 'Custom',
    lastName: 'User',
    department: 'Test',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'sessions:edit'
    ]
  },

  // Utilisateur sans permissions
  noPermissions: {
    id: 'user_no_perm',
    username: 'noperm',
    email: 'noperm@anecoop.com',
    firstName: 'No',
    lastName: 'Perm',
    department: 'Denied',
    permissions: []
  }
};

// ==================== CONFIGURATION MOCK ====================

export const mockConfig = {
  roles: {
    super_admin: {
      name: 'Super Administrateur',
      description: 'Accès complet à toutes les fonctionnalités',
      permissions: ['*'],
      icon: '👑',
      color: '#d32f2f'
    },
    admin: {
      name: 'Administrateur',
      description: 'Gestion complète de l\'application',
      permissions: [
        'dashboard:*',
        'sessions:*',
        'computers:*',
        'loans:*',
        'users:*',
        'ad_management:*',
        'chat_ged:*',
        'ai_assistant:*',
        'reports:*',
        'settings:*',
        'config:view'
      ],
      icon: '👨‍💼',
      color: '#f57c00'
    },
    ged_specialist: {
      name: 'Spécialiste GED',
      description: 'Expert en gestion documentaire et IA',
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
      icon: '📚',
      color: '#9c27b0'
    },
    manager: {
      name: 'Manager',
      description: 'Gestionnaire avec droits étendus',
      permissions: [
        'dashboard:view',
        'sessions:view',
        'computers:*',
        'loans:*',
        'users:view',
        'chat_ged:view',
        'chat_ged:create',
        'ai_assistant:view',
        'reports:view',
        'reports:export'
      ],
      icon: '👔',
      color: '#1976d2'
    },
    technician: {
      name: 'Technicien',
      description: 'Support technique',
      permissions: [
        'dashboard:view',
        'sessions:view',
        'sessions:edit',
        'computers:view',
        'loans:view',
        'loans:create',
        'chat_ged:view',
        'ai_assistant:view',
        'reports:view'
      ],
      icon: '🔧',
      color: '#388e3c'
    },
    viewer: {
      name: 'Observateur',
      description: 'Consultation uniquement',
      permissions: [
        'dashboard:view',
        'sessions:view',
        'computers:view',
        'loans:view',
        'reports:view'
      ],
      icon: '👁️',
      color: '#757575'
    }
  },
  modules: {
    dashboard: {
      id: 'dashboard',
      label: 'Tableau de bord',
      path: '/',
      requiredPermission: 'dashboard:view'
    },
    sessions: {
      id: 'sessions',
      label: 'Sessions RDS',
      path: '/sessions',
      requiredPermission: 'sessions:view'
    },
    computers: {
      id: 'computers',
      label: 'Ordinateurs',
      path: '/computers',
      requiredPermission: 'computers:view'
    },
    loans: {
      id: 'loans',
      label: 'Prêts',
      path: '/loans',
      requiredPermission: 'loans:view'
    },
    users: {
      id: 'users',
      label: 'Utilisateurs AD',
      path: '/users',
      requiredPermission: 'users:view'
    },
    chat_ged: {
      id: 'chat_ged',
      label: 'Chat GED',
      path: '/chat-ged',
      requiredPermission: 'chat_ged:view'
    },
    ai_assistant: {
      id: 'ai_assistant',
      label: 'Assistant IA',
      path: '/ai-assistant',
      requiredPermission: 'ai_assistant:view'
    },
    reports: {
      id: 'reports',
      label: 'Rapports',
      path: '/reports',
      requiredPermission: 'reports:view'
    },
    settings: {
      id: 'settings',
      label: 'Paramètres',
      path: '/settings',
      requiredPermission: 'settings:view'
    }
  }
};

// ==================== SCÉNARIOS DE TEST ====================

export const testScenarios = {
  // Scénario 1: Super Admin - devrait avoir accès à tout
  superAdminScenario: {
    user: mockUsers.superAdmin,
    config: mockConfig,
    expected: {
      hasPermission: (perm) => true,
      canAccessModule: () => true,
      isAdmin: true,
      isSuperAdmin: true,
      accessibleModulesCount: 9 // Tous les modules
    }
  },

  // Scénario 2: Admin - devrait avoir accès à tout sauf config admin
  adminScenario: {
    user: mockUsers.admin,
    config: mockConfig,
    expected: {
      hasPermission: (perm) => perm !== 'config:*' && perm !== 'config:admin',
      canAccessModule: (moduleId) => moduleId !== 'config',
      isAdmin: true,
      isSuperAdmin: false,
      accessibleModulesCount: 8 // Tous sauf config
    }
  },

  // Scénario 3: Technicien - devrait avoir accès limité
  technicianScenario: {
    user: mockUsers.technician,
    config: mockConfig,
    expected: {
      hasPermission: (perm) => perm.startsWith('sessions:') || perm.startsWith('dashboard:') || 
                                   perm.startsWith('computers:') || perm.startsWith('loans:') ||
                                   perm.startsWith('chat_ged:') || perm.startsWith('ai_assistant:') ||
                                   perm === 'reports:view',
      canAccessModule: (moduleId) => ['dashboard', 'sessions', 'computers', 'loans', 'chat_ged', 'ai_assistant', 'reports'].includes(moduleId),
      isAdmin: false,
      isSuperAdmin: false,
      accessibleModulesCount: 7
    }
  },

  // Scénario 4: Viewer - accès lecture seule
  viewerScenario: {
    user: mockUsers.viewer,
    config: mockConfig,
    expected: {
      hasPermission: (perm) => perm.endsWith(':view') && 
                               ['dashboard', 'sessions', 'computers', 'loans', 'reports'].includes(perm.split(':')[0]),
      canAccessModule: (moduleId) => ['dashboard', 'sessions', 'computers', 'loans', 'reports'].includes(moduleId),
      isAdmin: false,
      isSuperAdmin: false,
      accessibleModulesCount: 5
    }
  },

  // Scénario 5: Utilisateur sans permissions
  noPermissionsScenario: {
    user: mockUsers.noPermissions,
    config: mockConfig,
    expected: {
      hasPermission: () => false,
      canAccessModule: () => false,
      isAdmin: false,
      isSuperAdmin: false,
      accessibleModulesCount: 0
    }
  }
};

// ==================== PERMISSIONS SPÉCIALES ====================

export const specialPermissions = {
  // Permissions avec wildcard
  wildcardPermissions: ['*', 'dashboard:*', 'sessions:*', 'config:*'],

  // Permissions granulaires
  granularPermissions: ['dashboard:view', 'sessions:edit', 'computers:create', 'users:delete'],

  // Permissions spéciales GED
  gedPermissions: [
    'ged_upload:create',
    'ged_delete:delete', 
    'ged_network_scan:admin',
    'ged_index_manage:admin',
    'ged_stats_view:view'
  ],

  // Modules et leurs permissions requises
  modulePermissions: {
    dashboard: 'dashboard:view',
    sessions: 'sessions:view',
    computers: 'computers:view',
    loans: 'loans:view',
    users: 'users:view',
    chat_ged: 'chat_ged:view',
    ai_assistant: 'ai_assistant:view',
    reports: 'reports:view',
    settings: 'settings:view',
    config: 'config:view'
  }
};

// ==================== UTILITAIRES ====================

/**
 * Créer un utilisateur mock avec des permissions personnalisées
 */
export const createCustomUser = (permissions, role = null) => ({
  id: 'custom_user',
  username: 'custom',
  email: 'custom@anecoop.com',
  role,
  firstName: 'Custom',
  lastName: 'User',
  department: 'Test',
  permissions
});

/**
 * Créer une configuration mock minimale
 */
export const createMockConfig = (roles = {}) => ({
  roles: {
    ...mockConfig.roles,
    ...roles
  },
  modules: mockConfig.modules
});

/**
 * Vérifier si un scénario de test est valide
 */
export const validateScenario = (scenario) => {
  const { user, config, expected } = scenario;
  
  if (!user) return false;
  if (!config) return false;
  if (!expected) return false;
  
  return true;
};

export default {
  mockUsers,
  mockConfig,
  testScenarios,
  specialPermissions,
  createCustomUser,
  createMockConfig,
  validateScenario
};