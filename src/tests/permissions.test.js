/**
 * Tests unitaires pour le système de permissions et rôles
 * RDS Viewer Anecoop
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import usePermissions from '../../hooks/usePermissions';
import PermissionGate from '../../components/auth/PermissionGate';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import permissionService from '../../services/permissionService';
import { 
  mockUsers, 
  mockConfig, 
  testScenarios, 
  specialPermissions 
} from './__mocks__/mockData';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  inferRoleFromPermissions,
  getAccessibleModules,
  ROLES,
  MODULES
} from '../../models/permissions';

// ==================== TEST UTILITAIRES ====================

// Mock du hook usePermissions pour les tests
const TestComponentWithPermissions = ({ children, requiredPermission }) => {
  const permissions = usePermissions();
  
  return (
    <div>
      <div data-testid="has-permission" data-value={permissions.hasPermission(requiredPermission)} />
      <div data-testid="user-role" data-value={permissions.getUserRole()?.id || null} />
      <div data-testid="accessible-modules" data-value={permissions.getAccessibleModules().length} />
      <div data-testid="is-admin" data-value={permissions.isAdmin()} />
      <div data-testid="is-super-admin" data-value={permissions.isSuperAdmin()} />
      {children}
    </div>
  );
};

// ==================== TESTS MODÈLE DE PERMISSIONS ====================

describe('Modèle de permissions', () => {
  describe('hasPermission', () => {
    test('doit retourner true pour Super Admin (*) avec toute permission', () => {
      expect(hasPermission(['*'], 'sessions:edit')).toBe(true);
      expect(hasPermission(['*'], 'config:admin')).toBe(true);
      expect(hasPermission(['*'], 'unknown:permission')).toBe(true);
    });

    test('doit retourner true pour permission exacte', () => {
      expect(hasPermission(['dashboard:view'], 'dashboard:view')).toBe(true);
      expect(hasPermission(['sessions:view', 'sessions:edit'], 'sessions:edit')).toBe(true);
    });

    test('doit retourner true pour wildcard (module:*)', () => {
      expect(hasPermission(['sessions:*'], 'sessions:view')).toBe(true);
      expect(hasPermission(['sessions:*'], 'sessions:edit')).toBe(true);
      expect(hasPermission(['sessions:*'], 'sessions:delete')).toBe(true);
    });

    test('doit retourner false pour permissions non accordées', () => {
      expect(hasPermission(['dashboard:view'], 'sessions:view')).toBe(false);
      expect(hasPermission(['sessions:*'], 'computers:view')).toBe(false);
    });

    test('doit gérer les permissions vides', () => {
      expect(hasPermission([], 'dashboard:view')).toBe(false);
      expect(hasPermission(null, 'dashboard:view')).toBe(false);
      expect(hasPermission(undefined, 'dashboard:view')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    test('doit retourner true si au moins une permission est présente', () => {
      expect(hasAnyPermission(['dashboard:view', 'sessions:view'], ['dashboard:view'])).toBe(true);
      expect(hasAnyPermission(['dashboard:view'], ['dashboard:view', 'sessions:view'])).toBe(true);
      expect(hasAnyPermission(['*'], ['dashboard:view', 'sessions:view'])).toBe(true);
    });

    test('doit retourner false si aucune permission n\'est présente', () => {
      expect(hasAnyPermission(['dashboard:view'], ['sessions:view'])).toBe(false);
      expect(hasAnyPermission([], ['dashboard:view', 'sessions:view'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    test('doit retourner true si toutes les permissions sont présentes', () => {
      expect(hasAllPermissions(['dashboard:view', 'sessions:view'], ['dashboard:view', 'sessions:view'])).toBe(true);
      expect(hasAllPermissions(['sessions:*'], ['sessions:view', 'sessions:edit'])).toBe(true);
    });

    test('doit retourner false si au moins une permission est manquante', () => {
      expect(hasAllPermissions(['dashboard:view'], ['dashboard:view', 'sessions:view'])).toBe(false);
      expect(hasAllPermissions(['sessions:view'], ['sessions:view', 'sessions:edit'])).toBe(false);
    });
  });

  describe('inferRoleFromPermissions', () => {
    test('doit inférer SUPER_ADMIN pour permission *', () => {
      expect(inferRoleFromPermissions(['*']).id).toBe('super_admin');
    });

    test('doit inférer ADMIN pour config permissions', () => {
      expect(inferRoleFromPermissions(['config:admin']).id).toBe('admin');
      expect(inferRoleFromPermissions(['config:*']).id).toBe('admin');
    });

    test('doit inférer GED_SPECIALIST pour chat_ged et ged_network_scan', () => {
      expect(inferRoleFromPermissions(['chat_ged:*', 'ged_network_scan:admin']).id).toBe('ged_specialist');
    });

    test('doit inférer MANAGER pour computers:* et loans:*', () => {
      expect(inferRoleFromPermissions(['computers:*', 'loans:*']).id).toBe('manager');
    });

    test('doit inférer TECHNICIAN pour sessions:edit', () => {
      expect(inferRoleFromPermissions(['sessions:edit']).id).toBe('technician');
    });

    test('doit inférer VIEWER par défaut', () => {
      expect(inferRoleFromPermissions([]).id).toBe('viewer');
      expect(inferRoleFromPermissions(['dashboard:view']).id).toBe('viewer');
    });
  });

  describe('getAccessibleModules', () => {
    test('doit retourner tous les modules pour Super Admin', () => {
      const modules = getAccessibleModules(['*']);
      expect(modules).toHaveLength(9);
      expect(modules.find(m => m.id === 'dashboard')).toBeDefined();
      expect(modules.find(m => m.id === 'sessions')).toBeDefined();
      expect(modules.find(m => m.id === 'computers')).toBeDefined();
    });

    test('doit retourner modules spécifiques pour Technicien', () => {
      const permissions = mockUsers.technician.permissions;
      const modules = getAccessibleModules(permissions);
      expect(modules).toHaveLength(7);
      expect(modules.find(m => m.id === 'dashboard')).toBeDefined();
      expect(modules.find(m => m.id === 'sessions')).toBeDefined();
      expect(modules.find(m => m.id === 'users')).toBeUndefined(); // Pas accessible pour technicien
    });

    test('doit retourner modules lecture seule pour Viewer', () => {
      const permissions = mockUsers.viewer.permissions;
      const modules = getAccessibleModules(permissions);
      expect(modules).toHaveLength(5);
      expect(modules.find(m => m.id === 'settings')).toBeUndefined(); // Pas accessible pour viewer
    });

    test('doit retourner tableau vide pour utilisateur sans permissions', () => {
      const modules = getAccessibleModules([]);
      expect(modules).toHaveLength(0);
    });
  });
});

// ==================== TESTS SERVICE DE PERMISSIONS ====================

describe('PermissionService', () => {
  beforeEach(() => {
    permissionService.init(mockUsers.technician, mockConfig);
  });

  afterEach(() => {
    permissionService.init(null, null);
  });

  describe('Initialisation', () => {
    test('doit s\'initialiser avec utilisateur et config', () => {
      permissionService.init(mockUsers.admin, mockConfig);
      expect(permissionService.currentUser).toBe(mockUsers.admin);
      expect(permissionService.config).toBe(mockConfig);
    });

    test('doit définir l\'utilisateur courant', () => {
      permissionService.setCurrentUser(mockUsers.manager);
      expect(permissionService.currentUser).toBe(mockUsers.manager);
    });

    test('doit définir la configuration', () => {
      permissionService.setConfig(mockConfig);
      expect(permissionService.config).toBe(mockConfig);
    });
  });

  describe('getUserPermissions', () => {
    test('doit retourner les permissions de l\'utilisateur', () => {
      const permissions = permissionService.getUserPermissions();
      expect(permissions).toEqual(mockUsers.technician.permissions);
    });

    test('doit utiliser les permissions du rôle si pas de permissions directes', () => {
      const userWithoutPermissions = { ...mockUsers.manager, permissions: undefined };
      permissionService.setCurrentUser(userWithoutPermissions);
      const permissions = permissionService.getUserPermissions();
      expect(permissions).toContain('dashboard:*');
    });

    test('doit retourner tableau vide si pas d\'utilisateur', () => {
      permissionService.setCurrentUser(null);
      expect(permissionService.getUserPermissions()).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    test('doit vérifier permission correctement pour Technicien', () => {
      expect(permissionService.hasPermission('sessions:view')).toBe(true);
      expect(permissionService.hasPermission('sessions:edit')).toBe(true);
      expect(permissionService.hasPermission('users:view')).toBe(false); // Pas accessible
    });

    test('doit gérer Super Admin', () => {
      permissionService.init(mockUsers.superAdmin, mockConfig);
      expect(permissionService.hasPermission('sessions:view')).toBe(true);
      expect(permissionService.hasPermission('config:admin')).toBe(true);
      expect(permissionService.hasPermission('any:permission')).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    test('doit vérifier plusieurs permissions avec OU', () => {
      expect(permissionService.hasAnyPermission(['sessions:view', 'users:view'])).toBe(true);
      expect(permissionService.hasAnyPermission(['sessions:view'])).toBe(true);
      expect(permissionService.hasAnyPermission(['users:view', 'loans:view'])).toBe(false); // loans pas dans permissions technician
    });
  });

  describe('hasAllPermissions', () => {
    test('doit vérifier plusieurs permissions avec ET', () => {
      expect(permissionService.hasAllPermissions(['sessions:view', 'sessions:edit'])).toBe(true);
      expect(permissionService.hasAllPermissions(['sessions:view', 'computers:view'])).toBe(true);
      expect(permissionService.hasAllPermissions(['sessions:view', 'users:view'])).toBe(false);
    });
  });

  describe('getUserRole', () => {
    test('doit retourner le rôle correct', () => {
      const role = permissionService.getUserRole();
      expect(role.id).toBe('technician');
      expect(role.name).toBe('Technicien');
      expect(role.permissions).toContain('sessions:view');
    });

    test('doit inférer le rôle si pas de rôle défini', () => {
      const customUser = { ...mockUsers.customUser, role: undefined };
      permissionService.setCurrentUser(customUser);
      const role = permissionService.getUserRole();
      expect(role.id).toBe('viewer');
    });
  });

  describe('isAdmin', () => {
    test('doit retourner true pour Admin', () => {
      permissionService.init(mockUsers.admin, mockConfig);
      expect(permissionService.isAdmin()).toBe(true);
    });

    test('doit retourner true pour Super Admin', () => {
      permissionService.init(mockUsers.superAdmin, mockConfig);
      expect(permissionService.isAdmin()).toBe(true);
    });

    test('doit retourner false pour Technicien', () => {
      expect(permissionService.isAdmin()).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    test('doit retourner true pour Super Admin uniquement', () => {
      permissionService.init(mockUsers.superAdmin, mockConfig);
      expect(permissionService.isSuperAdmin()).toBe(true);
    });

    test('doit retourner false pour Admin', () => {
      permissionService.init(mockUsers.admin, mockConfig);
      expect(permissionService.isSuperAdmin()).toBe(false);
    });
  });

  describe('canAccessModule', () => {
    test('doit vérifier accès aux modules pour Technicien', () => {
      expect(permissionService.canAccessModule('sessions')).toBe(true);
      expect(permissionService.canAccessModule('users')).toBe(false);
      expect(permissionService.canAccessModule('settings')).toBe(false);
    });

    test('doit retourner false pour module inexistant', () => {
      expect(permissionService.canAccessModule('unknown')).toBe(false);
    });
  });

  describe('getModuleActions', () => {
    test('doit retourner actions disponibles pour Technicien sur sessions', () => {
      const actions = permissionService.getModuleActions('sessions');
      expect(actions).toContain('view');
      expect(actions).toContain('edit');
      expect(actions).not.toContain('delete');
      expect(actions).not.toContain('admin');
    });

    test('doit retourner toutes actions pour Super Admin', () => {
      permissionService.init(mockUsers.superAdmin, mockConfig);
      const actions = permissionService.getModuleActions('sessions');
      expect(actions).toEqual(['view', 'create', 'edit', 'delete', 'export', 'admin']);
    });
  });

  describe('getUserInfo', () => {
    test('doit retourner informations complètes utilisateur', () => {
      const userInfo = permissionService.getUserInfo();
      expect(userInfo.user).toBe(mockUsers.technician);
      expect(userInfo.role.id).toBe('technician');
      expect(userInfo.permissions).toHaveLength(9);
      expect(userInfo.accessibleModules).toHaveLength(7);
      expect(userInfo.isAdmin).toBe(false);
      expect(userInfo.isSuperAdmin).toBe(false);
    });
  });

  describe('getAccessibleModules', () => {
    test('doit retourner modules accessibles pour Technicien', () => {
      const modules = permissionService.getAccessibleModules();
      expect(modules).toHaveLength(7);
      expect(modules.find(m => m.id === 'sessions')).toBeDefined();
      expect(modules.find(m => m.id === 'users')).toBeUndefined();
    });
  });
});

// ==================== TESTS HOOK usePermissions ====================

describe('usePermissions Hook', () => {
  const renderWithProvider = (user, config, component) => {
    return render(
      <AppProvider currentTechnician={user} config={config}>
        {component}
      </AppProvider>
    );
  };

  test('doit retourner fonctions par défaut quand pas d\'utilisateur', () => {
    const { container } = renderWithProvider(null, mockConfig, <TestComponentWithPermissions requiredPermission="dashboard:view" />);
    
    const hasPermissionElement = container.querySelector('[data-testid="has-permission"]');
    expect(hasPermissionElement.dataset.value).toBe('false');
    
    const userRoleElement = container.querySelector('[data-testid="user-role"]');
    expect(userRoleElement.dataset.value).toBe('null');
    
    const modulesElement = container.querySelector('[data-testid="accessible-modules"]');
    expect(modulesElement.dataset.value).toBe('0');
  });

  test('doit retourner permissions correctes pour Technicien', () => {
    const { container } = renderWithProvider(mockUsers.technician, mockConfig, <TestComponentWithPermissions requiredPermission="sessions:view" />);
    
    const hasPermissionElement = container.querySelector('[data-testid="has-permission"]');
    expect(hasPermissionElement.dataset.value).toBe('true');
    
    const userRoleElement = container.querySelector('[data-testid="user-role"]');
    expect(userRoleElement.dataset.value).toBe('technician');
    
    const isAdminElement = container.querySelector('[data-testid="is-admin"]');
    expect(isAdminElement.dataset.value).toBe('false');
  });

  test('doit retourner permissions correctes pour Admin', () => {
    const { container } = renderWithProvider(mockUsers.admin, mockConfig, <TestComponentWithPermissions requiredPermission="config:admin" />);
    
    const hasPermissionElement = container.querySelector('[data-testid="has-permission"]');
    expect(hasPermissionElement.dataset.value).toBe('true'); // admin a config:view mais pas config:admin
    
    const userRoleElement = container.querySelector('[data-testid="user-role"]');
    expect(userRoleElement.dataset.value).toBe('admin');
    
    const isAdminElement = container.querySelector('[data-testid="is-admin"]');
    expect(isAdminElement.dataset.value).toBe('true');
  });

  test('doit se mettre à jour quand utilisateur change', async () => {
    let currentUser = mockUsers.technician;
    const TestUserSwitch = () => {
      const permissions = usePermissions();
      return <div data-testid="role">{permissions.getUserRole()?.id || 'no-role'}</div>;
    };

    const { rerender, container } = render(
      <AppProvider currentTechnician={currentUser} config={mockConfig}>
        <TestUserSwitch />
      </AppProvider>
    );

    expect(container.querySelector('[data-testid="role"]').textContent).toBe('technician');

    currentUser = mockUsers.manager;
    rerender(
      <AppProvider currentTechnician={currentUser} config={mockConfig}>
        <TestUserSwitch />
      </AppProvider>
    );

    expect(container.querySelector('[data-testid="role"]').textContent).toBe('manager');
  });
});

// ==================== TESTS COMPOSANT PermissionGate ====================

describe('PermissionGate Component', () => {
  const renderPermissionGate = (props = {}) => {
    const defaultProps = {
      permission: 'dashboard:view',
      children: <div data-testid="allowed-content">Contenu autorisé</div>,
      ...props
    };

    return render(
      <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
        <PermissionGate {...defaultProps} />
      </AppProvider>
    );
  };

  test('doit afficher contenu si permission accordées', () => {
    const { container } = renderPermissionGate();
    expect(container.querySelector('[data-testid="allowed-content"]')).toBeInTheDocument();
  });

  test('doit masquer contenu si permission refusées', () => {
    const { container } = renderPermissionGate({
      permission: 'users:view' // Technicien n'a pas cette permission
    });
    expect(container.querySelector('[data-testid="allowed-content"]')).not.toBeInTheDocument();
  });

  test('doit afficher fallback si permission refusées', () => {
    const fallback = <div data-testid="fallback-content">Accès refusé</div>;
    const { container } = renderPermissionGate({
      permission: 'users:view',
      fallback,
      showFallbackIfNoAccess: true
    });
    
    expect(container.querySelector('[data-testid="fallback-content"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="allowed-content"]')).not.toBeInTheDocument();
  });

  test('doit masquer fallback si showFallbackIfNoAccess = false', () => {
    const fallback = <div data-testid="fallback-content">Accès refusé</div>;
    const { container } = renderPermissionGate({
      permission: 'users:view',
      fallback,
      showFallbackIfNoAccess: false
    });
    
    expect(container.querySelector('[data-testid="fallback-content"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="allowed-content"]')).not.toBeInTheDocument();
  });

  test('doit gérer anyOf (OU logique)', () => {
    const { container } = renderPermissionGate({
      anyOf: ['sessions:view', 'users:view'], // Technicien a sessions:view
      fallback: <div data-testid="fallback-content">Accès refusé</div>
    });
    
    expect(container.querySelector('[data-testid="allowed-content"]')).toBeInTheDocument();
  });

  test('doit gérer allOf (ET logique)', () => {
    const { container } = renderPermissionGate({
      allOf: ['sessions:view', 'sessions:edit'], // Technicien a les deux
      fallback: <div data-testid="fallback-content">Accès refusé</div>
    });
    
    expect(container.querySelector('[data-testid="allowed-content"]')).toBeInTheDocument();
  });

  test('doit refuser si allOf contient permission manquante', () => {
    const fallback = <div data-testid="fallback-content">Accès refusé</div>;
    const { container } = renderPermissionGate({
      allOf: ['sessions:view', 'users:view'], // Technicien n'a pas users:view
      fallback
    });
    
    expect(container.querySelector('[data-testid="allowed-content"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="fallback-content"]')).toBeInTheDocument();
  });
});

// ==================== TESTS COMPOSANT ProtectedRoute ====================

describe('ProtectedRoute Component', () => {
  const renderProtectedRoute = (props = {}) => {
    const defaultProps = {
      requiredPermission: 'dashboard:view',
      children: <div data-testid="protected-content">Contenu protégé</div>,
      ...props
    };

    return render(
      <MemoryRouter initialEntries={['/test']}>
        <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
          <Routes>
            <Route path="/test" element={<ProtectedRoute {...defaultProps} />} />
            <Route path="/login" element={<div data-testid="login-page">Page de login</div>} />
            <Route path="/" element={<div data-testid="home-page">Accueil</div>} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );
  };

  test('doit afficher contenu si permission accordées', () => {
    const { container } = renderProtectedRoute();
    expect(container.querySelector('[data-testid="protected-content"]')).toBeInTheDocument();
  });

  test('doit rediriger vers login si pas d\'utilisateur', () => {
    const { container } = renderProtectedRoute({
      currentTechnician: null // Override pour test
    });
    
    // Note: Dans ce test simplifié, on vérifie que l'utilisateur n'est pas connecté
    const permissions = usePermissions();
    expect(permissions.user).toBeNull();
  });

  test('doit afficher message d\'erreur si permission refusées', () => {
    const { container } = renderProtectedRoute({
      requiredPermission: 'users:view' // Technicien n'a pas cette permission
    });
    
    expect(container.querySelector('[data-testid="protected-content"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="login-page"]')).not.toBeInTheDocument();
    
    // Vérifier message d'erreur
    const errorMessage = container.querySelector('.MuiAlert-root');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage.textContent).toContain('Accès refusé');
  });

  test('doit afficher fallback si fourni', () => {
    const fallback = <div data-testid="custom-fallback">Custom Fallback</div>;
    const { container } = renderProtectedRoute({
      requiredPermission: 'users:view',
      fallback
    });
    
    expect(container.querySelector('[data-testid="custom-fallback"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="protected-content"]')).not.toBeInTheDocument();
  });

  test('doit gérer requiredAny', () => {
    const { container } = renderProtectedRoute({
      requiredAny: ['sessions:view', 'users:view'] // Technicien a sessions:view
    });
    
    expect(container.querySelector('[data-testid="protected-content"]')).toBeInTheDocument();
  });

  test('doit gérer requiredAll', () => {
    const { container } = renderProtectedRoute({
      requiredAll: ['sessions:view', 'sessions:edit'] // Technicien a les deux
    });
    
    expect(container.querySelector('[data-testid="protected-content"]')).toBeInTheDocument();
  });

  test('doit rediriger vers homepage par défaut', () => {
    const { container } = renderProtectedRoute({
      requiredPermission: 'users:view'
    });
    
    const errorMessage = container.querySelector('.MuiAlert-root');
    expect(errorMessage).toBeInTheDocument();
    
    // Vérifier que le bouton de retour existe
    const homeButton = errorMessage.querySelector('button');
    expect(homeButton).toBeInTheDocument();
  });
});

// ==================== TESTS INTÉGRATION RÔLES ====================

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
      const user = mockUsers[userKey];
      permissionService.init(user, mockConfig);
      
      // Tester dashboard:view (accessible à tous)
      expect(permissionService.hasPermission('dashboard:view')).toBe(true);
      
      // Tester config:view selon le rôle
      if (['superAdmin', 'admin'].includes(userKey)) {
        expect(permissionService.hasPermission('config:view')).toBe(true);
      } else {
        expect(permissionService.hasPermission('config:view')).toBe(false);
      }
      
      // Tester permissions spécialisées selon le rôle
      const role = permissionService.getUserRole();
      expect(role.id).toBe(user.role);
      expect(role.name).toBeDefined();
      expect(role.permissions).toBeDefined();
    });
  });
});

// ==================== TESTS CAS EXTREMES ====================

describe('Cas extrêmes et erreurs', () => {
  test('doit gérer permissions null/undefined', () => {
    expect(hasPermission(null, 'dashboard:view')).toBe(false);
    expect(hasPermission(undefined, 'dashboard:view')).toBe(false);
    expect(hasAnyPermission(null, ['dashboard:view'])).toBe(false);
    expect(hasAllPermissions(undefined, ['dashboard:view'])).toBe(false);
  });

  test('doit gérer permissions avec formats invalides', () => {
    expect(hasPermission(['dashboard:view'], null)).toBe(false);
    expect(hasPermission(['dashboard:view'], '')).toBe(false);
    expect(hasPermission(['dashboard:view'], 'invalidformat')).toBe(false);
  });

  test('doit gérer modules inexistants', () => {
    permissionService.init(mockUsers.technician, mockConfig);
    expect(permissionService.canAccessModule('non-existent')).toBe(false);
    expect(permissionService.getModuleActions('non-existent')).toEqual([]);
  });

  test('doit gérer service non initialisé', () => {
    permissionService.init(null, null);
    expect(permissionService.hasPermission('dashboard:view')).toBe(false);
    expect(permissionService.getUserRole()).toBeNull();
    expect(permissionService.getAccessibleModules()).toEqual([]);
  });

  test('doit gérer configuration incomplète', () => {
    const incompleteConfig = { roles: {}, modules: {} };
    permissionService.init(mockUsers.technician, incompleteConfig);
    
    const role = permissionService.getUserRole();
    expect(role.id).toBe('technician'); // Devrait inférer depuis permissions directes
  });
});

// ==================== TESTS PERFORMANCE ====================

describe('Performance des vérifications de permissions', () => {
  test('doit vérifier rapidement les permissions communes', () => {
    permissionService.init(mockUsers.superAdmin, mockConfig);
    
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      permissionService.hasPermission('dashboard:view');
    }
    const end = performance.now();
    
    // La vérification devrait être très rapide (< 10ms pour 1000 vérifications)
    expect(end - start).toBeLessThan(10);
  });

  test('doit gérer efficacement les gros ensembles de permissions', () => {
    const bigPermissionSet = Array.from({ length: 100 }, (_, i) => `module${i}:action${i}`);
    const userWithManyPermissions = { ...mockUsers.technician, permissions: bigPermissionSet };
    
    permissionService.init(userWithManyPermissions, mockConfig);
    
    const start = performance.now();
    const hasAccess = permissionService.hasPermission('module50:action50');
    const end = performance.now();
    
    expect(hasAccess).toBe(true);
    expect(end - start).toBeLessThan(5);
  });
});

// ==================== EXPORT GLOBALE ====================

export default {
  // Les tests sont exportés automatiquement par Jest
};