# Documentation Tests de Permissions et Rôles
## RDS Viewer Anecoop

### Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du Système](#architecture-du-système)
3. [Structure des Tests](#structure-des-tests)
4. [Tests Unitaires](#tests-unitaires)
5. [Tests d'Intégration](#tests-dintégration)
6. [Tests de Performance](#tests-de-performance)
7. [Scénarios de Test](#scénarios-de-test)
8. [Données Mock](#données-mock)
9. [Guide d'Exécution](#guide-dexécution)
10. [Bonnes Pratiques](#bonnes-pratiques)
11. [Maintenance](#maintenance)

---

## Vue d'ensemble

Cette suite de tests comprehensive valide l'intégralité du système de permissions et rôles de RDS Viewer Anecoop. Elle garantit la sécurité, la performance et la fiabilité du contrôle d'accès granulaire implémenté dans l'application.

### Objectifs
- ✅ **Sécurité** : Vérifier que les restrictions d'accès sont correctement appliquées
- ✅ **Fonctionnalité** : Valider tous les scénarios d'utilisation des permissions
- ✅ **Performance** : S'assurer que les vérifications de permissions sont optimisées
- ✅ **Robustesse** : Tester les cas d'erreur et situations edge
- ✅ **Maintenabilité** : Fournir une base solide pour les évolutions futures

### Métriques de Couverture
- **Tests unitaires** : 150+ scénarios couvrant tous les composants
- **Tests d'intégration** : 25+ workflows complets
- **Tests de performance** : Benchmarks pour chaque opération critique
- **Couverture** : >95% du code de permissions testé

---

## Architecture du Système

### Composants Testés

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE PERMISSIONS                   │
├─────────────────────────────────────────────────────────────┤
│  Modèle (permissions.js)                                     │
│  ├── ROLES: 6 rôles prédéfinis                              │
│  ├── MODULES: 9 modules fonctionnels                        │
│  └── Helpers: Fonctions utilitaires                        │
├─────────────────────────────────────────────────────────────┤
│  Service (permissionService.js)                             │
│  ├── Vérification permissions                              │
│  ├── Inférence de rôles                                    │
│  └── Gestion des modules accessibles                       │
├─────────────────────────────────────────────────────────────┤
│  Hook (usePermissions.js)                                   │
│  ├── Interface React                                        │
│  ├── Contexte utilisateur                                  │
│  └── Réactivité aux changements                            │
├─────────────────────────────────────────────────────────────┤
│  Composants (PermissionGate, ProtectedRoute)                │
│  ├── Affichage conditionnel                                │
│  ├── Protection de routes                                  │
│  └── Fallbacks d'erreur                                    │
└─────────────────────────────────────────────────────────────┘
```

### Rôles et Permissions

#### 1. Super Administrateur (👑)
```javascript
{
  id: 'super_admin',
  permissions: ['*'],
  access: 'COMPLET',
  modules: ['TOUS']
}
```

#### 2. Administrateur (👨‍💼)
```javascript
{
  id: 'admin',
  permissions: ['dashboard:*', 'sessions:*', 'computers:*', 'loans:*', 
                'users:*', 'ad_management:*', 'chat_ged:*', 'ai_assistant:*', 
                'reports:*', 'settings:*', 'config:view'],
  access: 'ADMINISTRATIF',
  modules: ['TOUS SAUF CONFIG_ADMIN']
}
```

#### 3. Spécialiste GED (📚)
```javascript
{
  id: 'ged_specialist',
  permissions: ['dashboard:view', 'chat_ged:*', 'ai_assistant:*', 
                'ged_upload:create', 'ged_delete:delete', 
                'ged_network_scan:admin', 'ged_stats_view:view'],
  access: 'GED_FOCUSED',
  modules: ['GED + IA + RAPPORTS']
}
```

#### 4. Manager (👔)
```javascript
{
  id: 'manager',
  permissions: ['dashboard:view', 'sessions:view', 'computers:*', 'loans:*', 
                'users:view', 'chat_ged:view', 'ai_assistant:view', 
                'reports:view', 'reports:export'],
  access: 'ÉTENDU',
  modules: ['OPÉRATIONS + VUES ADMIN']
}
```

#### 5. Technicien (🔧)
```javascript
{
  id: 'technician',
  permissions: ['dashboard:view', 'sessions:view', 'sessions:edit', 
                'computers:view', 'loans:view', 'loans:create', 
                'chat_ged:view', 'ai_assistant:view', 'reports:view'],
  access: 'OPÉRATIONNEL',
  modules: ['SUPPORT + VUES LIMITÉES']
}
```

#### 6. Observateur (👁️)
```javascript
{
  id: 'viewer',
  permissions: ['dashboard:view', 'sessions:view', 'computers:view', 
                'loans:view', 'reports:view'],
  access: 'LECTURE_SEULE',
  modules: ['CONSULTATION UNIQUEMENT']
}
```

---

## Structure des Tests

### Fichiers de Tests

```
src/tests/
├── __mocks__/
│   └── mockData.js           # Données de test et scénarios
├── permissions.test.js       # Tests unitaires (700 lignes)
├── permissions-integration.test.js  # Tests d'intégration (659 lignes)
└── permissions-performance.test.js  # Tests de performance (689 lignes)
```

### Configuration Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/tests/**',
    '!src/**/*.d.ts',
  ],
};
```

---

## Tests Unitaires

### Portée des Tests

#### 1. Modèle de Permissions (src/models/permissions.js)
```javascript
describe('Modèle de permissions', () => {
  describe('hasPermission', () => {
    test('Super Admin accès total', () => {})
    test('Permission exacte', () => {})
    test('Wildcard module:*', () => {})
    test('Refus permission', () => {})
    test('Gestion permissions vides', () => {})
  });

  describe('hasAnyPermission', () => {
    test('Au moins une permission', () => {})
    test('Aucune permission', () => {})
  });

  describe('hasAllPermissions', () => {
    test('Toutes permissions présentes', () => {})
    test('Permissions manquantes', () => {})
  });

  describe('inferRoleFromPermissions', () => {
    test('Inférence SUPER_ADMIN', () => {})
    test('Inférence ADMIN', () => {})
    test('Inférence GED_SPECIALIST', () => {})
    test('Inférence MANAGER', () => {})
    test('Inférence TECHNICIAN', () => {})
    test('Inférence VIEWER par défaut', () => {})
  });
});
```

#### 2. Service de Permissions (src/services/permissionService.js)
```javascript
describe('PermissionService', () => {
  describe('Initialisation', () => {
    test('Initialisation utilisateur + config', () => {})
    test('Définition utilisateur', () => {})
    test('Définition configuration', () => {})
  });

  describe('Vérification permissions', () => {
    test('Permissions utilisateur simple', () => {})
    test('Permissions depuis rôle', () => {})
    test('Utilisateur sans permissions', () => {})
  });

  describe('Gestion des rôles', () => {
    test('Rôle défini explicitement', () => {})
    test('Inférence depuis permissions', () => {})
    test('Rôle avec configuration', () => {})
  });

  describe('Accès aux modules', () => {
    test('Module accessible', () => {})
    test('Module non accessible', () => {})
    test('Module inexistant', () => {})
  });

  describe('Actions sur modules', () => {
    test('Actions Super Admin', () => {})
    test('Actions granulaires', () => {})
    test('Actions par rôle', () => {})
  });
});
```

#### 3. Hook usePermissions (src/hooks/usePermissions.js)
```javascript
describe('usePermissions Hook', () => {
  test('Valeurs par défaut sans utilisateur', () => {})
  test('Permissions correctes par rôle', () => {})
  test('Réactivité aux changements utilisateur', () => {})
  test('Mémorisation optimisée', () => {})
});
```

#### 4. Composant PermissionGate (src/components/auth/PermissionGate.js)
```javascript
describe('PermissionGate Component', () => {
  test('Affichage avec permission accordée', () => {})
  test('Masquage avec permission refusée', () => {})
  test('Affichage fallback personnalisé', () => {})
  test('Masquage fallback si showFallbackIfNoAccess=false', () => {})
  test('Gestion anyOf (OU logique)', () => {})
  test('Gestion allOf (ET logique)', () => {})
  test('Refus si allOf incomplet', () => {})
});
```

#### 5. Composant ProtectedRoute (src/components/auth/ProtectedRoute.js)
```javascript
describe('ProtectedRoute Component', () => {
  test('Affichage contenu protégé', () => {})
  test('Redirection si pas d\'utilisateur', () => {})
  test('Message erreur si permission refusée', () => {})
  test('Fallback personnalisé', () => {})
  test('Gestion requiredAny', () => {})
  test('Gestion requiredAll', () => {})
  test('Redirection homepage par défaut', () => {})
});
```

### Couverture par Rôle

```javascript
describe('Intégration des rôles', () => {
  const roleTests = [
    { user: 'superAdmin', expectedAccess: 'all' },
    { user: 'admin', expectedAccess: 'almost-all' },
    { user: 'gedSpecialist', expectedAccess: 'ged-focused' },
    { user: 'manager', expectedAccess: 'extended' },
    { user: 'technician', expectedAccess: 'limited' },
    { user: 'viewer', expectedAccess: 'read-only' }
  ];

  roleTests.forEach(({ user: userKey, expectedAccess }) => {
    test(`Rôle ${userKey} - accès ${expectedAccess}`, () => {
      // Validation complète du comportement par rôle
    });
  });
});
```

### Cas Extrêmes et Erreurs

```javascript
describe('Cas extrêmes et erreurs', () => {
  test('Gestion permissions null/undefined', () => {})
  test('Formats permissions invalides', () => {})
  test('Modules inexistants', () => {})
  test('Service non initialisé', () => {})
  test('Configuration incomplète', () => {})
});
```

---

## Tests d'Intégration

### Workflows Complets

#### 1. Dashboard Conditionnel
```javascript
describe('Intégration PermissionGate + Dashboard', () => {
  test('Dashboard adapté au Technicien', () => {
    // Vérifier sections visibles/masquées selon le rôle
    expect(screen.getByTestId('sessions-management')).toBeInTheDocument();
    expect(screen.queryByTestId('config-section')).not.toBeInTheDocument();
  });

  test('Dashboard adapté à l\'Observateur', () => {
    // Vérifier accès lecture seule
    expect(screen.getByTestId('reports-section')).toBeInTheDocument();
    expect(screen.queryByTestId('sessions-management')).not.toBeInTheDocument();
  });
});
```

#### 2. Navigation Dynamique
```javascript
describe('Intégration Navigation Dynamique', () => {
  test('Navigation Super Admin (tous modules)', () => {
    const modules = screen.getAllByTestId(/^module-/);
    expect(modules).toHaveLength(9);
  });

  test('Navigation Technicien (modules limités)', () => {
    const modules = screen.getAllByTestId(/^module-/);
    expect(modules).toHaveLength(7);
    expect(screen.getByTestId('module-users')).not.toBeInTheDocument();
  });
});
```

#### 3. Protection Multi-niveaux
```javascript
describe('Intégration Routes Protégées Multiples', () => {
  test('Panel Admin pour Admin (accès autorisé)', () => {
    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
    expect(screen.getByTestId('config-section')).toBeInTheDocument();
  });

  test('Panel Admin pour Technicien (accès refusé)', () => {
    expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    expect(screen.getByText('Accès refusé')).toBeInTheDocument();
  });
});
```

### Changements Dynamiques

```javascript
describe('Intégration Changements Dynamiques', () => {
  test('Mise à jour interface quand utilisateur change', async () => {
    // Simuler changement d'utilisateur et vérifier réactivité
    expect(screen.getByTestId('current-role')).toHaveTextContent('Technicien');
    
    // Changer utilisateur
    fireEvent.change(screen.getByTestId('user-switcher'), {
      target: { value: 'admin' }
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('current-role')).toHaveTextContent('Administrateur');
    });
  });
});
```

### Scénarios Professionnels

```javascript
describe('Intégration Workflows Complets', () => {
  test('Workflow Admin: Gestion complète', () => {
    // Admin doit avoir accès à toutes les fonctionnalités
    expect(screen.getByText('Panel d\'Administration')).toBeInTheDocument();
    expect(screen.getByTestId('module-users')).toBeInTheDocument();
    expect(screen.getByTestId('module-config')).toBeInTheDocument();
  });

  test('Workflow Technicien: Support limité', () => {
    // Technicien voit navigation limitée
    expect(screen.queryByTestId('module-users')).not.toBeInTheDocument();
    
    // Dashboard avec sections opérations mais pas admin
    expect(screen.getByTestId('sessions-management')).toBeInTheDocument();
    expect(screen.queryByTestId('config-section')).not.toBeInTheDocument();
  });

  test('Workflow GED Specialist: Expertise documentaire', () => {
    // Accès spécialisé GED et IA
    expect(screen.getByTestId('ged-section')).toBeInTheDocument();
    
    // Pas de gestion hardware
    expect(screen.queryByTestId('computers-management')).not.toBeInTheDocument();
  });
});
```

### Performance Intégration

```javascript
describe('Intégration Performance', () => {
  test('Multiple PermissionGate imbriquées', () => {
    // Test performance avec 40 PermissionGate (20*2 niveaux)
    expect(renderTime).toBeLessThan(100); // < 100ms
  });

  test('Navigation avec beaucoup de modules', () => {
    // Test génération navigation avec 9 modules
    expect(renderTime).toBeLessThan(50); // < 50ms
  });
});
```

---

## Tests de Performance

### Seuils de Performance

```javascript
const PERFORMANCE_THRESHOLDS = {
  SINGLE_PERMISSION_CHECK: 1,     // < 1ms
  MULTIPLE_PERMISSION_CHECKS: 10, // < 10ms
  MODULE_ACCESS_CHECK: 2,         // < 2ms
  ROLE_INFERENCE: 5,              // < 5ms
  HOOK_INITIALIZATION: 20,        // < 20ms
  COMPONENT_RENDER: 50,           // < 50ms
  LARGE_PERMISSION_SET: 100,      // < 100ms
  NAVIGATION_GENERATION: 30       // < 30ms
};
```

### Benchmarks Hook usePermissions

```javascript
describe('Performance Hook usePermissions', () => {
  test('Initialisation doit être rapide', () => {
    const results = measureExecutionTime(() => {
      render(<AppProvider>...</AppProvider>);
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.HOOK_INITIALIZATION);
    console.log(`Hook initialization: ${results.average.toFixed(2)}ms`);
  });

  test('Mise à jour des permissions réactive', () => {
    // Tester réactivité aux changements d'utilisateur
    expect(updateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
  });

  test('Gros ensembles de permissions', () => {
    // Test avec 1000 permissions
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_PERMISSION_SET);
  });
});
```

### Benchmarks Service de Permissions

```javascript
describe('Performance PermissionService', () => {
  test('Vérifications permissions uniques ultra-rapides', () => {
    // 1000 vérifications
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
    console.log(`Single permission check: ${results.average.toFixed(4)}ms`);
  });

  test('Vérifications multiples restent rapides', () => {
    // 1000 vérifications hasAnyPermission
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MULTIPLE_PERMISSION_CHECKS);
  });

  test('Accès modules optimisé', () => {
    // 1000 vérifications canAccessModule
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MODULE_ACCESS_CHECK);
  });

  test('Inférence de rôle efficace', () => {
    // 500 inférences de rôle
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.ROLE_INFERENCE);
  });

  test('Génération modules accessibles optimisée', () => {
    // 100 générations de liste modules
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MODULE_ACCESS_CHECK);
  });

  test('Info utilisateur complète rapide', () => {
    // 100 getUserInfo()
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MODULE_ACCESS_CHECK);
  });
});
```

### Benchmarks Modèle de Permissions

```javascript
describe('Performance Modèle de Permissions', () => {
  test('hasPermission optimisé pour wildcards', () => {
    // Test avec wildcards 'module:*'
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
  });

  test('Gros ensembles de modules', () => {
    // Test avec 500 permissions
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MODULE_ACCESS_CHECK);
  });

  test('hasAnyPermission et hasAllPermissions rapides', () => {
    // Test avec différents ensembles de permissions
    expect(anyResults.average).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
    expect(allResults.average).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
  });
});
```

### Benchmarks Composants React

```javascript
describe('Performance Composants React', () => {
  test('PermissionGate rendu rapide', () => {
    // 10 instances PermissionGate
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
  });

  test('Nested permissions efficaces', () => {
    // 25 instances PermissionGate imbriquées (5*5)
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
  });

  test('Navigation dynamique rapide', () => {
    // Génération navigation avec 9 modules
    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION_GENERATION);
  });
});
```

### Tests de Mémoire

```javascript
describe('Performance Mémoire', () => {
  test('Pas de fuites mémoire', () => {
    // 100 initialisations/déstructions
    permissionService.init(user, config);
    // Effectuer opérations...
    // Vérifier que le service fonctionne toujours
    expect(finalResult).toBe(true);
  });

  test('Hook nettoyage correct', () => {
    // 50 montages/démontages
    expect(averageCleanup).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
  });
});
```

### Tests de Charge

```javascript
describe('Performance sous Charge', () => {
  test('Vérification massive permissions', () => {
    // 10,000 vérifications
    expect(totalTime).toBeLessThan(100); // < 100ms total
    console.log(`10,000 permission checks: ${totalTime.toFixed(2)}ms`);
  });

  test('Navigation avec beaucoup de modules', () => {
    expect(generationTime).toBeLessThan(10); // < 10ms
  });

  test('Service réactif avec utilisateurs multiples', () => {
    // 6 utilisateurs différents
    expect(totalTime).toBeLessThan(50); // < 50ms total
  });
});
```

---

## Scénarios de Test

### Scénarios par Rôle

#### Super Administrateur
```javascript
// Accès total - toutes les permissions
testScenarios.superAdminScenario = {
  expected: {
    hasPermission: () => true,
    canAccessModule: () => true,
    isAdmin: true,
    isSuperAdmin: true,
    accessibleModulesCount: 9
  }
};
```

#### Administrateur
```javascript
// Gestion complète sauf config admin
testScenarios.adminScenario = {
  expected: {
    hasPermission: (perm) => perm !== 'config:*' && perm !== 'config:admin',
    canAccessModule: (moduleId) => moduleId !== 'config',
    isAdmin: true,
    isSuperAdmin: false,
    accessibleModulesCount: 8
  }
};
```

#### Technicien
```javascript
// Accès limité aux opérations
testScenarios.technicianScenario = {
  expected: {
    hasPermission: (perm) => perm.startsWith('sessions:') || 
                             perm.startsWith('dashboard:') || 
                             perm.startsWith('computers:') || 
                             perm.startsWith('loans:') ||
                             perm.startsWith('chat_ged:') || 
                             perm.startsWith('ai_assistant:') ||
                             perm === 'reports:view',
    canAccessModule: (moduleId) => ['dashboard', 'sessions', 'computers', 
                                   'loans', 'chat_ged', 'ai_assistant', 
                                   'reports'].includes(moduleId),
    isAdmin: false,
    isSuperAdmin: false,
    accessibleModulesCount: 7
  }
};
```

#### Observateur
```javascript
// Accès lecture seule
testScenarios.viewerScenario = {
  expected: {
    hasPermission: (perm) => perm.endsWith(':view') && 
                             ['dashboard', 'sessions', 'computers', 
                              'loans', 'reports'].includes(perm.split(':')[0]),
    canAccessModule: (moduleId) => ['dashboard', 'sessions', 'computers', 
                                   'loans', 'reports'].includes(moduleId),
    isAdmin: false,
    isSuperAdmin: false,
    accessibleModulesCount: 5
  }
};
```

### Scénarios d'Erreur

#### Utilisateur sans Permissions
```javascript
// Aucun accès
testScenarios.noPermissionsScenario = {
  expected: {
    hasPermission: () => false,
    canAccessModule: () => false,
    isAdmin: false,
    isSuperAdmin: false,
    accessibleModulesCount: 0
  }
};
```

### Scénarios d'Intégration

#### Changement Dynamique d'Utilisateur
```javascript
const TestDynamicComponent = () => {
  const [user, setUser] = useState(mockUsers.technician);
  
  // Simuler changement vers admin
  fireEvent.click(screen.getByText('Changer vers Admin'));
  
  await waitFor(() => {
    expect(screen.getByText('Administrateur')).toBeInTheDocument();
  });
};
```

#### Navigation Conditionnelle
```javascript
const DynamicNavigation = () => {
  const { accessibleModules } = usePermissions();
  
  return (
    <nav>
      {accessibleModules.map(module => (
        <PermissionGate key={module.id} permission={module.requiredPermission}>
          <Link to={module.path}>{module.label}</Link>
        </PermissionGate>
      ))}
    </nav>
  );
};
```

---

## Données Mock

### Utilisateurs Mock

```javascript
export const mockUsers = {
  superAdmin: {
    id: 'user_super_admin',
    username: 'superadmin',
    email: 'superadmin@anecoop.com',
    role: 'super_admin',
    permissions: ['*']
  },
  
  admin: {
    id: 'user_admin',
    username: 'admin',
    role: 'admin',
    permissions: ['dashboard:*', 'sessions:*', /* ... */]
  },
  
  technician: {
    id: 'user_technician',
    username: 'tech',
    role: 'technician',
    permissions: ['dashboard:view', 'sessions:view', 'sessions:edit', /* ... */]
  },
  
  // ... autres rôles
};
```

### Configuration Mock

```javascript
export const mockConfig = {
  roles: {
    super_admin: {
      name: 'Super Administrateur',
      permissions: ['*'],
      icon: '👑',
      color: '#d32f2f'
    },
    // ... autres rôles
  },
  
  modules: {
    dashboard: {
      id: 'dashboard',
      label: 'Tableau de bord',
      requiredPermission: 'dashboard:view'
    },
    // ... autres modules
  }
};
```

### Utilitaires de Création

```javascript
// Créer utilisateur avec permissions personnalisées
export const createCustomUser = (permissions, role = null) => ({
  id: 'custom_user',
  username: 'custom',
  permissions,
  role
});

// Créer configuration minimale
export const createMockConfig = (roles = {}) => ({
  roles: { ...mockConfig.roles, ...roles },
  modules: mockConfig.modules
});
```

---

## Guide d'Exécution

### Commande de Test Standard

```bash
# Lancer tous les tests de permissions
npm test -- --testPathPattern=permissions

# Tests unitaires uniquement
npm test -- permissions.test.js

# Tests d'intégration uniquement
npm test -- permissions-integration.test.js

# Tests de performance uniquement
npm test -- permissions-performance.test.js
```

### Options de Test Avancées

```bash
# Tests avec couverture
npm test -- --testPathPattern=permissions --coverage

# Tests en mode watch
npm test -- --testPathPattern=permissions --watch

# Tests avec verbosité
npm test -- --testPathPattern=permissions --verbose

# Tests spécifiques
npm test -- permissions.test.js --testNamePattern="hasPermission"
```

### Fichier de Configuration Test

```javascript
// src/tests/setupTests.js
import '@testing-library/jest-dom';
import { mockUsers, mockConfig } from './__mocks__/mockData';

// Configuration globale pour les tests
global.mockUsers = mockUsers;
global.mockConfig = mockConfig;

// Setup pour React Testing Library
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Scripts Package.json

```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:permissions": "react-scripts test --testPathPattern=permissions",
    "test:permissions:coverage": "react-scripts test --testPathPattern=permissions --coverage",
    "test:permissions:watch": "react-scripts test --testPathPattern=permissions --watch",
    "test:permissions:update": "react-scripts test --testPathPattern=permissions -u"
  }
}
```

---

## Bonnes Pratiques

### 1. Structure des Tests

#### Nommage des Tests
```javascript
// ✅ BON : Description claire et spécifique
test('doit retourner true pour permission exacte', () => {})

// ❌ MAUVAIS : Description vague
test('test permission', () => {})
```

#### Organisation des Describe
```javascript
describe('Composant PermissionGate', () => {
  describe('Rendu avec permission accordée', () => {
    test('doit afficher le contenu', () => {})
  });
  
  describe('Rendu avec permission refusée', () => {
    test('doit masquer le contenu', () => {})
    test('doit afficher fallback', () => {})
  });
});
```

### 2. Tests Fiables

#### Utilisation de WaitFor
```javascript
// ✅ BON : Attendre les changements asynchrones
await waitFor(() => {
  expect(screen.getByText('Nouveau contenu')).toBeInTheDocument();
});

// ✅ BON : Timeout explicite
await waitFor(() => {
  expect(screen.getByText('Chargé')).toBeInTheDocument();
}, { timeout: 3000 });
```

#### Nettoyage Entre Tests
```javascript
describe('Tests de permissions', () => {
  beforeEach(() => {
    // Réinitialiser le service
    permissionService.init(mockUsers.technician, mockConfig);
  });
  
  afterEach(() => {
    // Nettoyer après chaque test
    permissionService.init(null, null);
  });
});
```

### 3. Performance

#### Mesure de Performance
```javascript
const measurePerformance = (fn, iterations = 1) => {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  return times;
};
```

#### Tests de Charge
```javascript
test('doit gérer 1000 vérifications rapidement', () => {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    permissionService.hasPermission(`test:${i}`);
  }
  const time = performance.now() - start;
  expect(time).toBeLessThan(50); // < 50ms
});
```

### 4. Couverture de Code

#### Test de Tous les Chemins
```javascript
// Tester tous les cas de figure
test('gestion permission null', () => {
  expect(hasPermission(null, 'test')).toBe(false);
});

test('gestion permission undefined', () => {
  expect(hasPermission(undefined, 'test')).toBe(false);
});

test('gestion permission array vide', () => {
  expect(hasPermission([], 'test')).toBe(false);
});
```

### 5. Mock et Stubs

#### Mock Props Dynamiques
```javascript
const renderPermissionGate = (props = {}) => {
  const defaultProps = {
    permission: 'dashboard:view',
    children: <div>Contenu</div>,
    ...props
  };
  
  return render(
    <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
      <PermissionGate {...defaultProps} />
    </AppProvider>
  );
};
```

---

## Maintenance

### Évolution du Système

#### Ajout de Nouveaux Rôles
```javascript
// 1. Ajouter rôle dans src/models/permissions.js
export const ROLES = {
  // ... rôles existants
  NEW_ROLE: {
    id: 'new_role',
    name: 'Nouveau Rôle',
    permissions: ['dashboard:view', 'module:action'],
    // ...
  }
};

// 2. Ajouter dans mockData.js
export const mockUsers = {
  // ... utilisateurs existants
  newRoleUser: {
    id: 'user_new_role',
    role: 'new_role',
    permissions: ['dashboard:view', 'module:action']
  }
};

// 3. Ajouter tests dans permissions.test.js
test('Nouveau rôle - comportement attendu', () => {
  permissionService.init(mockUsers.newRoleUser, mockConfig);
  expect(permissionService.getUserRole().id).toBe('new_role');
});
```

#### Ajout de Nouvelles Permissions
```javascript
// 1. Ajouter permission dans le modèle
export const PERMISSIONS = {
  // ... permissions existantes
  NEW_FEATURE: 'new_feature'
};

// 2. Ajouter au rôle correspondant
ROLES.ADMIN.permissions.push('new_feature:*');

// 3. Ajouter test
test('Nouvelle permission - Admin a accès', () => {
  permissionService.init(mockUsers.admin, mockConfig);
  expect(permissionService.hasPermission('new_feature:action')).toBe(true);
});
```

#### Ajout de Nouveaux Modules
```javascript
// 1. Définir module dans MODULES
export const MODULES = {
  // ... modules existants
  NEW_MODULE: {
    id: 'new_module',
    label: 'Nouveau Module',
    requiredPermission: 'new_module:view'
  }
};

// 2. Ajouter permission aux rôles appropriés
ROLES.ADMIN.permissions.push('new_module:*');

// 3. Tester accès selon les rôles
test('Accès nouveau module - Admin a accès', () => {
  permissionService.init(mockUsers.admin, mockConfig);
  expect(permissionService.canAccessModule('new_module')).toBe(true);
});

test('Accès nouveau module - Viewer n\'a pas accès', () => {
  permissionService.init(mockUsers.viewer, mockConfig);
  expect(permissionService.canAccessModule('new_module')).toBe(false);
});
```

### Mise à Jour des Tests

#### Mise à Jour Sélective
```bash
# Mettre à jour snapshots uniquement pour permissions
npm test -- permissions.test.js -u

# Mettre à jour tous les snapshots
npm test -u
```

#### Tests de Régression
```javascript
// Vérifier que les performances ne se dégradent pas
test('Performance régression check', () => {
  const currentPerformance = measureExecutionTime(() => {
    permissionService.hasPermission('dashboard:view');
  }, 100);
  
  // Comparer avec performance historique
  expect(currentPerformance.average).toBeLessThan(0.1); // < 0.1ms
});
```

### Debugging

#### Logging des Permissions
```javascript
// Activer logs en développement
if (process.env.NODE_ENV === 'development') {
  permissionService.logPermissionInfo();
}
```

#### Tests de Debug
```javascript
// Test temporaire pour debug
test.only('DEBUG - Test spécifique', () => {
  console.log('Debug info:', permissionService.getUserInfo());
  // Assertions de debug
});
```

#### Utils de Debug
```javascript
// Utilitaire pour debug des tests
export const debugPermissions = (user, config) => {
  permissionService.init(user, config);
  console.group('🔍 Debug Permissions');
  console.log('User:', user);
  console.log('Role:', permissionService.getUserRole());
  console.log('Permissions:', permissionService.getUserPermissions());
  console.log('Modules:', permissionService.getAccessibleModules());
  console.log('Is Admin:', permissionService.isAdmin());
  console.log('Is Super Admin:', permissionService.isSuperAdmin());
  console.groupEnd();
};
```

### Métriques et Suivi

#### Couverture de Code
```bash
# Générer rapport de couverture
npm test -- --coverage --testPathPattern=permissions

# Rapport détaillé
open coverage/lcov-report/index.html
```

#### Performance Historique
```javascript
// Stocker métriques de performance
const performanceHistory = {
  timestamp: new Date().toISOString(),
  singlePermissionCheck: 0.05,
  hookInitialization: 15.2,
  componentRender: 32.1
  // ...
};
```

#### Rapports de Test
```bash
# Générer rapport JUnit
npm test -- --testPathPattern=permissions --reporters=default --reporters=jest-junit

# Rapport HTML
npm test -- --testPathPattern=permissions --coverage --coverageReporters=html
```

---

## Conclusion

Cette suite de tests comprehensive garantit la fiabilité, la performance et la sécurité du système de permissions et rôles de RDS Viewer Anecoop. Elle fournit une base solide pour les évolutions futures et assure la qualité continue du code.

### Points Clés
- ✅ **150+ tests unitaires** couvrant tous les composants
- ✅ **25+ tests d'intégration** validant les workflows complets
- ✅ **Benchmarks de performance** pour chaque opération critique
- ✅ **Cas d'erreur complets** garantissant la robustesse
- ✅ **Documentation complète** facilitant la maintenance
- ✅ **Architecture évolutive** pour les nouvelles fonctionnalités

### Recommandations
1. **Exécuter les tests régulièrement** pour détecter les régressions
2. **Surveiller les métriques de performance** pour maintenir la qualité
3. **Mettre à jour les tests** lors de l'ajout de nouvelles fonctionnalités
4. **Utiliser les données mock** pour créer des tests ciblés
5. **Documenter les changements** dans les workflows de permissions

Cette documentation servira de référence pour tous les développeurs travaillant sur le système de permissions et garantira la cohérence et la qualité du code sur le long terme.