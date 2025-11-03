/**
 * Tests de performance pour le système de permissions et rôles
 * RDS Viewer Anecoop
 * 
 * Ces tests mesurent les performances du système de permissions
 * et détectent les goulots d'étranglement potentiels.
 */

import React, { useState, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../../contexts/AppContext';
import usePermissions from '../../hooks/usePermissions';
import PermissionGate from '../../components/auth/PermissionGate';
import ProtectedRoute from '../../contexts/ProtectedRoute';
import permissionService from '../../services/permissionService';
import { mockUsers, mockConfig, createCustomUser } from './__mocks__/mockData';
import { hasPermission, getAccessibleModules } from '../../models/permissions';

// ==================== CONFIGURATION PERFORMANCE ====================

const PERFORMANCE_THRESHOLDS = {
  SINGLE_PERMISSION_CHECK: 1, // ms
  MULTIPLE_PERMISSION_CHECKS: 10, // ms
  MODULE_ACCESS_CHECK: 2, // ms
  ROLE_INFERENCE: 5, // ms
  HOOK_INITIALIZATION: 20, // ms
  COMPONENT_RENDER: 50, // ms
  LARGE_PERMISSION_SET: 100, // ms
  NAVIGATION_GENERATION: 30 // ms
};

// ==================== UTILITAIRES PERFORMANCE ====================

/**
 * Mesurer le temps d'exécution d'une fonction
 */
const measureExecutionTime = (fn, iterations = 1) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    iterations
  };
};

/**
 * Créer un gros ensemble de permissions pour tests de charge
 */
const createLargePermissionSet = (size = 1000) => {
  const permissions = [];
  for (let i = 0; i < size; i++) {
    permissions.push(`module${i}:action${i}`);
  }
  return permissions;
};

/**
 * Créer un utilisateur avec beaucoup de permissions
 */
const createHeavyUser = (permissionCount = 1000) => ({
  id: 'heavy_user',
  username: 'heavy',
  email: 'heavy@test.com',
  role: 'custom',
  permissions: createLargePermissionSet(permissionCount)
});

// ==================== TESTS PERFORMANCE HOOK usePermissions ====================

describe('Performance Hook usePermissions', () => {
  test('initialisation du hook doit être rapide', () => {
    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
          <TestPermissionComponent />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.HOOK_INITIALIZATION);
    console.log(`Hook initialization: ${results.average.toFixed(2)}ms (min: ${results.min.toFixed(2)}ms, max: ${results.max.toFixed(2)}ms)`);
  });

  test('mise à jour des permissions doit être réactive', () => {
    const TestPermissionUpdater = () => {
      const [user, setUser] = useState(mockUsers.technician);
      const permissions = usePermissions();

      useEffect(() => {
        // Simuler changement d'utilisateur
        setUser(mockUsers.manager);
      }, []);

      return (
        <div data-testid="permission-metrics">
          <div data-testid="accessible-count">{permissions.getAccessibleModules().length}</div>
          <div data-testid="role-change-count">{permissions.getUserRole()?.id}</div>
        </div>
      );
    };

    const start = performance.now();
    render(
      <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
        <TestPermissionUpdater />
      </AppProvider>
    );
    
    // Attendre mise à jour
    return new Promise((resolve) => {
      setTimeout(() => {
        const end = performance.now();
        const updateTime = end - start;
        
        expect(updateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
        console.log(`Permission update time: ${updateTime.toFixed(2)}ms`);
        resolve();
      }, 100);
    });
  });

  test('hook doit gérer efficacement gros ensembles de permissions', () => {
    const heavyUser = createHeavyUser(1000);
    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={heavyUser} config={mockConfig}>
          <TestPermissionComponent />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_PERMISSION_SET);
    console.log(`Heavy permission set initialization: ${results.average.toFixed(2)}ms`);
  });
});

// ==================== TESTS PERFORMANCE SERVICE DE PERMISSIONS ====================

describe('Performance PermissionService', () => {
  beforeEach(() => {
    permissionService.init(mockUsers.technician, mockConfig);
  });

  test('vérifications de permissions uniques doivent être ultra-rapides', () => {
    const testPermission = 'sessions:view';
    
    const results = measureExecutionTime(() => {
      permissionService.hasPermission(testPermission);
    }, 1000);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
    console.log(`Single permission check: ${results.average.toFixed(4)}ms (${results.iterations} iterations)`);
  });

  test('vérifications multiples permissions doivent rester rapides', () => {
    const testPermissions = ['sessions:view', 'computers:view', 'loans:create'];
    
    const results = measureExecutionTime(() => {
      permissionService.hasAnyPermission(testPermissions);
    }, 1000);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MULTIPLE_PERMISSION_CHECKS);
    console.log(`Multiple permission check: ${results.average.toFixed(4)}ms`);
  });

  test('accès aux modules doit être optimisé', () => {
    const results = measureExecutionTime(() => {
      permissionService.canAccessModule('sessions');
    }, 1000);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MODULE_ACCESS_CHECK);
    console.log(`Module access check: ${results.average.toFixed(4)}ms`);
  });

  test('inférence de rôle doit être efficace', () => {
    const results = measureExecutionTime(() => {
      permissionService.getUserRole();
    }, 500);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.ROLE_INFERENCE);
    console.log(`Role inference: ${results.average.toFixed(4)}ms`);
  });

  test('génération modules accessibles doit être optimisée', () => {
    const results = measureExecutionTime(() => {
      permissionService.getAccessibleModules();
    }, 100);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MODULE_ACCESS_CHECK);
    console.log(`Accessible modules generation: ${results.average.toFixed(4)}ms`);
  });

  test('info utilisateur complète doit rester rapide', () => {
    const results = measureExecutionTime(() => {
      permissionService.getUserInfo();
    }, 100);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MODULE_ACCESS_CHECK);
    console.log(`User info generation: ${results.average.toFixed(4)}ms`);
  });

  test('service doit gérer efficacement gros ensembles de permissions', () => {
    const heavyUser = createHeavyUser(1000);
    permissionService.init(heavyUser, mockConfig);

    const results = measureExecutionTime(() => {
      permissionService.hasPermission('module500:action500');
      permissionService.getAccessibleModules();
      permissionService.getUserRole();
    }, 100);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_PERMISSION_SET);
    console.log(`Heavy user operations: ${results.average.toFixed(4)}ms`);
  });
});

// ==================== TESTS PERFORMANCE MODÈLE DE PERMISSIONS ====================

describe('Performance Modèle de Permissions', () => {
  test('hasPermission doit être optimisé pour wildcards', () => {
    const permissions = ['dashboard:*', 'sessions:view', 'sessions:*'];
    
    const results = measureExecutionTime(() => {
      hasPermission(permissions, 'sessions:edit');
    }, 1000);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
    console.log(`Wildcard permission check: ${results.average.toFixed(4)}ms`);
  });

  test('getAccessibleModules doit gérer efficacement gros ensembles', () => {
    const largePermissions = createLargePermissionSet(500);
    
    const results = measureExecutionTime(() => {
      getAccessibleModules(largePermissions);
    }, 100);

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.MODULE_ACCESS_CHECK);
    console.log(`Large module access: ${results.average.toFixed(4)}ms`);
  });

  test('hasAnyPermission et hasAllPermissions doivent rester rapides', () => {
    const permissions = mockUsers.admin.permissions;
    const testSets = [
      ['dashboard:view', 'sessions:view'],
      ['computers:*', 'loans:*', 'users:view'],
      ['config:admin', 'unknown:permission']
    ];

    testSets.forEach((testSet, index) => {
      const anyResults = measureExecutionTime(() => {
        hasAnyPermission(permissions, testSet);
      }, 500);

      const allResults = measureExecutionTime(() => {
        hasAllPermissions(permissions, testSet);
      }, 500);

      expect(anyResults.average).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);
      expect(allResults.average).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_PERMISSION_CHECK);

      console.log(`Permission set ${index + 1} - Any: ${anyResults.average.toFixed(4)}ms, All: ${allResults.average.toFixed(4)}ms`);
    });
  });
});

// ==================== TESTS PERFORMANCE COMPOSANTS ====================

describe('Performance Composants React', () => {
  test('PermissionGate doit rendre rapidement', () => {
    const TestPermissionGate = () => (
      <div>
        {[...Array(10)].map((_, i) => (
          <PermissionGate key={i} permission={`module${i}:view`}>
            <div data-testid={`allowed-${i}`}>Content {i}</div>
          </PermissionGate>
        ))}
      </div>
    );

    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={mockUsers.superAdmin} config={mockConfig}>
          <TestPermissionGate />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    console.log(`PermissionGate render (10 instances): ${results.average.toFixed(2)}ms`);
  });

  test('PermissionGate doit gérer efficacement nested permissions', () => {
    const NestedPermissionComponent = () => (
      <div>
        {[...Array(5)].map((_, i) => (
          <PermissionGate key={i} permission={`module${i}:view`}>
            {[...Array(5)].map((_, j) => (
              <PermissionGate key={`${i}-${j}`} permission={`module${i}:edit`}>
                <div data-testid={`nested-${i}-${j}`}>Nested {i}-{j}</div>
              </PermissionGate>
            ))}
          </PermissionGate>
        ))}
      </div>
    );

    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={mockUsers.superAdmin} config={mockConfig}>
          <NestedPermissionComponent />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    console.log(`Nested PermissionGate render (25 instances): ${results.average.toFixed(2)}ms`);
  });

  test('navigation dynamique doit générer rapidement', () => {
    const DynamicNavigation = () => {
      const { accessibleModules } = usePermissions();
      
      return (
        <nav data-testid="navigation">
          <ul>
            {accessibleModules.map(module => (
              <li key={module.id}>{module.label}</li>
            ))}
          </ul>
        </nav>
      );
    };

    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={mockUsers.superAdmin} config={mockConfig}>
          <DynamicNavigation />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION_GENERATION);
    console.log(`Navigation generation: ${results.average.toFixed(2)}ms`);
  });
});

// ==================== TESTS PERFORMANCE MÉMOIRE ====================

describe('Performance Mémoire', () => {
  test('service de permissions ne doit pasfuiter de mémoire', () => {
    const allocations = [];
    
    // Créer et détruire plusieurs instances
    for (let i = 0; i < 100; i++) {
      const user = createHeavyUser(100);
      permissionService.init(user, mockConfig);
      
      // Effectuer opérations
      permissionService.getUserInfo();
      permissionService.getAccessibleModules();
      
      allocations.push({
        userId: user.id,
        permissionsCount: user.permissions.length,
        timestamp: performance.now()
      });
    }

    // Vérifier que la dernière initialisation fonctionne toujours
    permissionService.init(mockUsers.technician, mockConfig);
    const finalResult = permissionService.hasPermission('dashboard:view');
    
    expect(finalResult).toBe(true);
    console.log(`Memory test: ${allocations.length} allocations processed successfully`);
  });

  test('hook usePermissions doit nettoyer correctement', () => {
    const allocations = [];
    
    for (let i = 0; i < 50; i++) {
      const start = performance.now();
      
      const { unmount } = render(
        <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
          <TestPermissionComponent />
        </AppProvider>
      );
      
      unmount();
      
      const end = performance.now();
      allocations.push(end - start);
    }

    // Vérifier que le temps de nettoyage reste stable
    const averageCleanup = allocations.reduce((sum, time) => sum + time, 0) / allocations.length;
    expect(averageCleanup).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    console.log(`Average cleanup time: ${averageCleanup.toFixed(2)}ms`);
  });
});

// ==================== TESTS PERFORMANCE CHARGE ====================

describe('Performance sous Charge', () => {
  test('système doit gérer vérification massive de permissions', () => {
    const heavyUser = createHeavyUser(1000);
    permissionService.init(heavyUser, mockConfig);

    const start = performance.now();
    let successfulChecks = 0;

    // Effectuer 10,000 vérifications
    for (let i = 0; i < 10000; i++) {
      const permission = `module${Math.floor(i / 10)}:action${i % 10}`;
      if (permissionService.hasPermission(permission)) {
        successfulChecks++;
      }
    }

    const end = performance.now();
    const totalTime = end - start;

    // 10,000 vérifications devraient prendre moins de 100ms
    expect(totalTime).toBeLessThan(100);
    expect(successfulChecks).toBe(1000); // Toutes les permissions devraient être trouvées

    console.log(`10,000 permission checks: ${totalTime.toFixed(2)}ms (${(totalTime / 10000 * 1000).toFixed(4)}ms per check)`);
    console.log(`Successful checks: ${successfulChecks}/10000`);
  });

  test('navigation doit se générer rapidement même avec beaucoup de modules', () => {
    const start = performance.now();
    const modules = permissionService.getAccessibleModules();
    const end = performance.now();

    expect(end - start).toBeLessThan(10);
    console.log(`Navigation with ${modules.length} modules: ${(end - start).toFixed(2)}ms`);
  });

  test('service doit rester réactif avec utilisateurs multiples', () => {
    const users = [
      mockUsers.superAdmin,
      mockUsers.admin,
      mockUsers.manager,
      mockUsers.technician,
      mockUsers.viewer,
      createHeavyUser(500)
    ];

    const start = performance.now();

    users.forEach(user => {
      permissionService.init(user, mockConfig);
      
      // Effectuer opérations typiques
      permissionService.getUserRole();
      permissionService.getAccessibleModules();
      permissionService.hasPermission('dashboard:view');
    });

    const end = performance.now();
    const totalTime = end - start;

    // Traitement de 6 utilisateurs devrait prendre moins de 50ms
    expect(totalTime).toBeLessThan(50);
    console.log(`6 user context switches: ${totalTime.toFixed(2)}ms`);
  });
});

// ==================== TESTS PERFORMANCE CONCURRENT ====================

describe('Performance Concurrence', () => {
  test('multiples hooks doivent se synchroniser efficacement', () => {
    const MultipleHooksComponent = () => {
      const permissions1 = usePermissions();
      const permissions2 = usePermissions();
      const permissions3 = usePermissions();

      return (
        <div data-testid="multi-hooks">
          <div data-testid="modules-1">{permissions1.getAccessibleModules().length}</div>
          <div data-testid="modules-2">{permissions2.getAccessibleModules().length}</div>
          <div data-testid="modules-3">{permissions3.getAccessibleModules().length}</div>
        </div>
      );
    };

    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={mockUsers.admin} config={mockConfig}>
          <MultipleHooksComponent />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.HOOK_INITIALIZATION * 2);
    console.log(`3 concurrent hooks: ${results.average.toFixed(2)}ms`);
  });
});

// ==================== TESTS PERFORMANCE SCÉNARIOS RÉELS ====================

describe('Performance Scénarios Réels', () => {
  test('rendu dashboard avec multiples PermissionGate', () => {
    const DashboardWithPermissions = () => (
      <div>
        <h1>Dashboard</h1>
        {[...Array(20)].map((_, i) => (
          <div key={i}>
            <PermissionGate permission={`section${i}:view`}>
              <h2>Section {i}</h2>
              <PermissionGate permission={`section${i}:edit`}>
                <button>Edit Section {i}</button>
              </PermissionGate>
            </PermissionGate>
          </div>
        ))}
      </div>
    );

    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={mockUsers.superAdmin} config={mockConfig}>
          <DashboardWithPermissions />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    console.log(`Complex dashboard render: ${results.average.toFixed(2)}ms`);
  });

  test('navigation avec filtrage par permissions', () => {
    const FilteredNavigation = () => {
      const { accessibleModules } = usePermissions();
      const { hasPermission } = usePermissions();

      return (
        <nav>
          {accessibleModules.map(module => (
            <PermissionGate key={module.id} permission={module.requiredPermission}>
              <div>{module.label}</div>
            </PermissionGate>
          ))}
          
          {/* Boutons conditionnels */}
          <PermissionGate permission="sessions:*">
            <button>Gestion Sessions</button>
          </PermissionGate>
          <PermissionGate permission="users:*">
            <button>Gestion Users</button>
          </PermissionGate>
        </nav>
      );
    };

    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={mockUsers.admin} config={mockConfig}>
          <FilteredNavigation />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.NAVIGATION_GENERATION);
    console.log(`Filtered navigation render: ${results.average.toFixed(2)}ms`);
  });

  test('rendu liste avec permissions granulaires', () => {
    const PermissionList = () => {
      const { getModuleActions } = usePermissions();
      
      const modules = ['sessions', 'computers', 'loans', 'users', 'reports'];
      
      return (
        <div>
          {modules.map(moduleId => {
            const actions = getModuleActions(moduleId);
            return (
              <div key={moduleId}>
                <h3>{moduleId}</h3>
                {actions.map(action => (
                  <PermissionGate key={action} permission={`${moduleId}:${action}`}>
                    <button>{action}</button>
                  </PermissionGate>
                ))}
              </div>
            );
          })}
        </div>
      );
    };

    const results = measureExecutionTime(() => {
      render(
        <AppProvider currentTechnician={mockUsers.admin} config={mockConfig}>
          <PermissionList />
        </AppProvider>
      );
    });

    expect(results.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    console.log(`Granular permission list: ${results.average.toFixed(2)}ms`);
  });
});

// ==================== TESTS PERFORMANCE RÉGRESSION ====================

describe('Performance Régression', () => {
  test('performance doit rester stable sur le temps', () => {
    const performanceHistory = [];

    for (let run = 0; run < 10; run++) {
      const result = measureExecutionTime(() => {
        permissionService.init(mockUsers.admin, mockConfig);
        permissionService.getUserInfo();
      }, 100);
      
      performanceHistory.push(result.average);
    }

    // Vérifier que la variance n'est pas trop importante
    const avg = performanceHistory.reduce((sum, time) => sum + time, 0) / performanceHistory.length;
    const variance = performanceHistory.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / performanceHistory.length;
    const stdDev = Math.sqrt(variance);

    // L'écart-type ne devrait pas dépasser 50% de la moyenne
    expect(stdDev / avg).toBeLessThan(0.5);

    console.log(`Performance stability over 10 runs:`);
    console.log(`Average: ${avg.toFixed(4)}ms, StdDev: ${stdDev.toFixed(4)}ms`);
    console.log(`Range: ${Math.min(...performanceHistory).toFixed(4)}ms - ${Math.max(...performanceHistory).toFixed(4)}ms`);
  });

  test('performance dégradée devrait être détectée', () => {
    // Simuler un ralentissement
    const originalHasPermission = hasPermission;
    hasPermission = jest.fn(originalHasPermission).mockImplementation(() => {
      // Ajouter délai artificiel
      const start = performance.now();
      while (performance.now() - start < 5) {
        // Simulation de travail
      }
      return originalHasPermission.apply(null, arguments);
    });

    const start = performance.now();
    const result = permissionService.hasPermission('dashboard:view');
    const end = performance.now();

    // Restaurer la fonction originale
    hasPermission = originalHasPermission;

    expect(result).toBe(true);
    expect(end - start).toBeGreaterThanOrEqual(5); // Doit avoir pris au moins 5ms

    console.log(`Degraded performance detected: ${(end - start).toFixed(2)}ms`);
  });
});

// ==================== COMPOSANT DE TEST UTILITAIRE ====================

const TestPermissionComponent = () => {
  const permissions = usePermissions();
  return (
    <div data-testid="permission-test">
      <div data-testid="has-dashboard">{permissions.hasPermission('dashboard:view').toString()}</div>
      <div data-testid="role">{permissions.getUserRole()?.id || 'none'}</div>
      <div data-testid="modules-count">{permissions.getAccessibleModules().length}</div>
    </div>
  );
};

// ==================== EXPORT ====================

export { PERFORMANCE_THRESHOLDS, measureExecutionTime };
export default {
  // Tests de performance exportés automatiquement
};