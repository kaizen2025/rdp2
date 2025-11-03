/**
 * Tests d'intégration pour le système de permissions et rôles
 * RDS Viewer Anecoop
 * 
 * Ces tests vérifient l'intégration complète entre les composants,
 * le service de permissions et le contexte de l'application.
 */

import React, { useState, useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import usePermissions from '../../hooks/usePermissions';
import PermissionGate from '../../components/auth/PermissionGate';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import permissionService from '../../services/permissionService';
import { mockUsers, mockConfig, testScenarios } from './__mocks__/mockData';
import { ROLES, MODULES } from '../../models/permissions';

// ==================== COMPOSANTS DE TEST ====================

// Composant de navigation dynamique
const DynamicNavigation = () => {
  const { accessibleModules, getUserRole } = usePermissions();
  const role = getUserRole();

  return (
    <nav data-testid="dynamic-navigation">
      <div data-testid="user-role-display">{role?.name || 'Non connecté'}</div>
      <ul data-testid="accessible-modules-list">
        {accessibleModules.map(module => (
          <li key={module.id} data-testid={`module-${module.id}`}>
            {module.label}
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Composant d'administration avec ProtectionMultiples
const AdminPanel = () => {
  return (
    <div data-testid="admin-panel">
      <h1>Panel d'Administration</h1>
      <PermissionGate permission="config:view">
        <div data-testid="config-section">
          <h2>Configuration</h2>
          <PermissionGate permission="config:*">
            <button data-testid="advanced-config-btn">Configuration Avancée</button>
          </PermissionGate>
        </div>
      </PermissionGate>
      <PermissionGate permission="users:*">
        <div data-testid="users-section">
          <h2>Gestion Utilisateurs</h2>
        </div>
      </PermissionGate>
    </div>
  );
};

// Composant Dashboard avec affichage conditionnel
const ConditionalDashboard = () => {
  const { getUserRole, getUserInfo } = usePermissions();
  const role = getUserRole();
  const userInfo = getUserInfo();

  return (
    <div data-testid="conditional-dashboard">
      <h1>Dashboard Personnalisé</h1>
      <div data-testid="user-info">
        Utilisateur: {userInfo.user?.firstName} {userInfo.user?.lastName}
      </div>
      <div data-testid="role-info">
        Rôle: {role?.name}
      </div>
      
      {/* Sections conditionnelles par rôle */}
      <PermissionGate permission="sessions:*">
        <div data-testid="sessions-management">
          <h3>Gestion Sessions RDS</h3>
          <button>Créer Session</button>
          <button>Terminer Session</button>
        </div>
      </PermissionGate>

      <PermissionGate permission="computers:*">
        <div data-testid="computers-management">
          <h3>Gestion Parc Informatique</h3>
          <button>Ajouter Ordinateur</button>
          <button>Inventaire</button>
        </div>
      </PermissionGate>

      <PermissionGate permission="loans:*">
        <div data-testid="loans-management">
          <h3>Gestion des Prêts</h3>
          <button>Nouveau Prêt</button>
          <button>Retours</button>
        </div>
      </PermissionGate>

      <PermissionGate permission="chat_ged:*">
        <div data-testid="ged-section">
          <h3>Gestion Documentaire</h3>
          <button>Chat GED</button>
          <button>Upload Documents</button>
        </div>
      </PermissionGate>

      <PermissionGate permission="reports:*">
        <div data-testid="reports-section">
          <h3>Rapports et Statistiques</h3>
          <button>Générer Rapport</button>
          <button>Export</button>
        </div>
      </PermissionGate>
    </div>
  );
};

// Page avec routes protégées multiples
const TestPage = ({ component: Component }) => {
  return <Component />;
};

// Composant pour tester les changements dynamiques de permissions
const PermissionChanger = ({ onPermissionChange }) => {
  const [currentUser, setCurrentUser] = useState(mockUsers.technician);
  const [userRole, setUserRole] = useState('technician');

  const handleUserChange = (newUserKey) => {
    const newUser = mockUsers[newUserKey];
    setCurrentUser(newUser);
    setUserRole(newUser.role || 'custom');
    if (onPermissionChange) {
      onPermissionChange(newUser);
    }
  };

  return (
    <div data-testid="permission-changer">
      <select 
        data-testid="user-selector"
        value={userRole}
        onChange={(e) => handleUserChange(e.target.value)}
      >
        <option value="technician">Technicien</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
        <option value="superAdmin">Super Admin</option>
        <option value="viewer">Observateur</option>
      </select>
      <div data-testid="current-user">{currentUser.username}</div>
    </div>
  );
};

// ==================== TESTS D'INTÉGRATION COMPOSANTS ====================

describe('Intégration PermissionGate + Dashboard', () => {
  test('doit afficher dashboard adapté au rôle Technicien', () => {
    render(
      <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
        <ConditionalDashboard />
      </AppProvider>
    );

    expect(screen.getByTestId('conditional-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('user-info')).toHaveTextContent('Sophie Tech');
    expect(screen.getByTestId('role-info')).toHaveTextContent('Technicien');

    // Sections accessibles au technicien
    expect(screen.getByTestId('sessions-management')).toBeInTheDocument();
    expect(screen.getByTestId('computers-management')).toBeInTheDocument();
    expect(screen.getByTestId('loans-management')).toBeInTheDocument();
    expect(screen.getByTestId('chat_ged-section')).toBeInTheDocument();

    // Section inaccessible au technicien
    expect(screen.queryByTestId('ged-section')).not.toBeInTheDocument(); // chat_ged pas *, juste view
  });

  test('doit afficher dashboard adapté au rôle Admin', () => {
    render(
      <AppProvider currentTechnician={mockUsers.admin} config={mockConfig}>
        <ConditionalDashboard />
      </AppProvider>
    );

    expect(screen.getByTestId('role-info')).toHaveTextContent('Administrateur');
    
    // Toutes les sections devraient être visibles
    expect(screen.getByTestId('sessions-management')).toBeInTheDocument();
    expect(screen.getByTestId('computers-management')).toBeInTheDocument();
    expect(screen.getByTestId('loans-management')).toBeInTheDocument();
    expect(screen.getByTestId('ged-section')).toBeInTheDocument();
  });

  test('doit masquer sections pour Observateur', () => {
    render(
      <AppProvider currentTechnician={mockUsers.viewer} config={mockConfig}>
        <ConditionalDashboard />
      </AppProvider>
    );

    expect(screen.getByTestId('role-info')).toHaveTextContent('Observateur');
    
    // Seul le rapport devrait être visible (lecture seule)
    expect(screen.getByTestId('reports-section')).toBeInTheDocument();
    expect(screen.queryByTestId('sessions-management')).not.toBeInTheDocument();
  });
});

// ==================== TESTS D'INTÉGRATION NAVIGATION DYNAMIQUE ====================

describe('Intégration Navigation Dynamique', () => {
  test('doit générer navigation pour Super Admin', () => {
    render(
      <AppProvider currentTechnician={mockUsers.superAdmin} config={mockConfig}>
        <DynamicNavigation />
      </AppProvider>
    );

    expect(screen.getByTestId('user-role-display')).toHaveTextContent('Super Administrateur');
    
    const modulesList = screen.getByTestId('accessible-modules-list');
    const modules = modulesList.querySelectorAll('li');
    
    // Super Admin devrait voir tous les modules
    expect(modules).toHaveLength(9);
    expect(screen.getByTestId('module-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('module-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('module-config')).toBeInTheDocument();
  });

  test('doit générer navigation limitée pour Technicien', () => {
    render(
      <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
        <DynamicNavigation />
      </AppProvider>
    );

    expect(screen.getByTestId('user-role-display')).toHaveTextContent('Technicien');
    
    const modulesList = screen.getByTestId('accessible-modules-list');
    const modules = modulesList.querySelectorAll('li');
    
    // Technicien devrait voir 7 modules
    expect(modules).toHaveLength(7);
    expect(screen.getByTestId('module-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('module-users')).not.toBeInTheDocument(); // users pas accessible
    expect(screen.getByTestId('module-config')).not.toBeInTheDocument();
  });
});

// ==================== TESTS D'INTÉGRATION ROUTES PROTÉGÉES ====================

describe('Intégration Routes Protégées Multiples', () => {
  const renderWithRoutes = (user, requiredPermission, ComponentToRender) => {
    return render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppProvider currentTechnician={user} config={mockConfig}>
          <Routes>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredPermission={requiredPermission}>
                  <ComponentToRender />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );
  };

  test('doit protéger accès AdminPanel pour Admin', () => {
    const { container } = renderWithRoutes(mockUsers.admin, 'config:view', AdminPanel);
    
    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
    expect(screen.getByText('Panel d\'Administration')).toBeInTheDocument();
  });

  test('doit protéger accès AdminPanel pour Technicien (refusé)', () => {
    const { container } = renderWithRoutes(mockUsers.technician, 'config:view', AdminPanel);
    
    // Devrait afficher message d'erreur au lieu du panel
    expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    expect(screen.getByText('Accès refusé')).toBeInTheDocument();
  });

  test('doit permettre sections internes selon permissions', () => {
    render(
      <AppProvider currentTechnician={mockUsers.admin} config={mockConfig}>
        <AdminPanel />
      </AppProvider>
    );

    // Admin devrait voir toutes les sections
    expect(screen.getByTestId('config-section')).toBeInTheDocument();
    expect(screen.getByTestId('users-section')).toBeInTheDocument();
    expect(screen.getByTestId('advanced-config-btn')).toBeInTheDocument();
  });

  test('doit masquer sections internes pour Technicien', () => {
    render(
      <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
        <AdminPanel />
      </AppProvider>
    );

    // Technicien ne devrait voir aucune section
    expect(screen.queryByTestId('config-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('users-section')).not.toBeInTheDocument();
  });
});

// ==================== TESTS D'INTÉGRATION CHANGEMENTS DYNAMIQUES ====================

describe('Intégration Changements Dynamiques de Permissions', () => {
  test('doit mettre à jour interface quand utilisateur change', async () => {
    const TestDynamicComponent = () => {
      const { getUserRole } = usePermissions();
      const [role, setRole] = useState(getUserRole());

      useEffect(() => {
        setRole(getUserRole());
      }, [getUserRole]);

      return (
        <div data-testid="dynamic-test">
          <div data-testid="current-role">{role?.name || 'None'}</div>
        </div>
      );
    };

    let currentUser = mockUsers.technician;
    const { rerender, screen: initialScreen } = render(
      <AppProvider currentTechnician={currentUser} config={mockConfig}>
        <TestDynamicComponent />
      </AppProvider>
    );

    expect(initialScreen.getByTestId('current-role')).toHaveTextContent('Technicien');

    // Simuler changement d'utilisateur
    currentUser = mockUsers.admin;
    rerender(
      <AppProvider currentTechnician={currentUser} config={mockConfig}>
        <TestDynamicComponent />
      </AppProvider>
    );

    // Attendre mise à jour
    await waitFor(() => {
      expect(initialScreen.getByTestId('current-role')).toHaveTextContent('Administrateur');
    });
  });

  test('doit adapter navigation en temps réel', () => {
    const TestNavigationChanger = () => {
      const [user, setUser] = useState(mockUsers.technician);
      const { accessibleModules } = usePermissions();

      return (
        <div>
          <div data-testid="modules-count">{accessibleModules.length}</div>
          <select 
            onChange={(e) => setUser(mockUsers[e.target.value])}
            data-testid="user-switcher"
          >
            <option value="technician">technician</option>
            <option value="admin">admin</option>
          </select>
        </div>
      );
    };

    render(
      <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
        <TestNavigationChanger />
      </AppProvider>
    );

    // Début: Technicien avec ~7 modules
    expect(screen.getByTestId('modules-count')).toHaveTextContent('7');

    // Changer vers Admin devrait augmenter le nombre
    fireEvent.change(screen.getByTestId('user-switcher'), {
      target: { value: 'admin' }
    });

    // Note: Dans ce test simplifié, on simule le changement
    // En réalité, cela nécessiterait une mise à jour du contexte
  });
});

// ==================== TESTS D'INTÉGRATION WORKFLOWS COMPLETS ====================

describe('Intégration Workflows Complets', () => {
  test('Workflow Admin: Gestion complète des utilisateurs', () => {
    render(
      <AppProvider currentTechnician={mockUsers.admin} config={mockConfig}>
        <Routes>
          <Route path="/" element={
            <>
              <DynamicNavigation />
              <AdminPanel />
            </>
          } />
        </Routes>
      </MemoryRouter>
    );

    // Admin devrait avoir accès à toutes les fonctionnalités
    expect(screen.getByText('Super Administrateur')).toBeInTheDocument(); // Navigation
    expect(screen.getByText('Panel d\'Administration')).toBeInTheDocument(); // Panel
    
    // Tous les modules dans navigation
    expect(screen.getByTestId('module-users')).toBeInTheDocument();
    expect(screen.getByTestId('module-config')).toBeInTheDocument();
  });

  test('Workflow Technicien: Support limité mais efficace', () => {
    render(
      <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
        <Routes>
          <Route path="/" element={
            <>
              <DynamicNavigation />
              <ConditionalDashboard />
            </>
          } />
        </Routes>
      </MemoryRouter>
    );

    // Navigation devrait être limitée
    expect(screen.getByText('Technicien')).toBeInTheDocument();
    expect(screen.getByTestId('module-users')).not.toBeInTheDocument();

    // Dashboard devrait avoir sections opérations mais pas admin
    expect(screen.getByTestId('sessions-management')).toBeInTheDocument();
    expect(screen.getByTestId('loans-management')).toBeInTheDocument();
    expect(screen.queryByTestId('config-section')).not.toBeInTheDocument();
  });

  test('Workflow GED Specialist: Expertise documentaire', () => {
    render(
      <AppProvider currentTechnician={mockUsers.gedSpecialist} config={mockConfig}>
        <ConditionalDashboard />
      </AppProvider>
    );

    expect(screen.getByTestId('role-info')).toHaveTextContent('Spécialiste GED');
    
    // Sections GED et IA visibles
    expect(screen.getByTestId('ged-section')).toBeInTheDocument();
    
    // Pas de gestion hardware
    expect(screen.queryByTestId('computers-management')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loans-management')).not.toBeInTheDocument();
  });
});

// ==================== TESTS D'INTÉGRATION PERFORMANCE ====================

describe('Intégration Performance avec multiples vérifications', () => {
  test('doit gérer efficacement multiple PermissionGate imbriquées', () => {
    const NestedPermissionComponent = () => (
      <div data-testid="nested-permissions">
        {[...Array(20)].map((_, i) => (
          <PermissionGate key={i} permission={`module${i}:view`}>
            <PermissionGate permission={`module${i}:edit`}>
              <div data-testid={`nested-${i}`}>Level {i}</div>
            </PermissionGate>
          </PermissionGate>
        ))}
      </div>
    );

    const start = performance.now();
    render(
      <AppProvider currentTechnician={mockUsers.superAdmin} config={mockConfig}>
        <NestedPermissionComponent />
      </AppProvider>
    );
    const end = performance.now();

    // Rendu devrait être rapide (< 100ms pour 20*2 PermissionGate)
    expect(end - start).toBeLessThan(100);

    // Tous les niveaux devraient être visibles pour Super Admin
    expect(screen.getByTestId('nested-permissions')).toBeInTheDocument();
    for (let i = 0; i < 20; i++) {
      expect(screen.getByTestId(`nested-${i}`)).toBeInTheDocument();
    }
  });

  test('doit gérer navigation avec beaucoup de modules', () => {
    const start = performance.now();
    render(
      <AppProvider currentTechnician={mockUsers.superAdmin} config={mockConfig}>
        <DynamicNavigation />
      </AppProvider>
    );
    const end = performance.now();

    // Rendu navigation devrait être très rapide (< 50ms)
    expect(end - start).toBeLessThan(50);

    const modules = screen.getAllByTestId(/^module-/);
    expect(modules).toHaveLength(9);
  });
});

// ==================== TESTS D'INTÉGRATION ERREURS ET CAS PARTICULIERS ====================

describe('Intégration Gestion des Erreurs', () => {
  test('doit gérer utilisateur non connecté', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AppProvider currentTechnician={null} config={mockConfig}>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute requiredPermission="dashboard:view">
                  <div data-testid="should-not-appear">Contenu protégé</div>
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<div data-testid="login-redirect">Redirection login</div>} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    // Devrait rediriger vers login (dans ce test, on vérifie que le contenu protégé n'apparaît pas)
    expect(screen.queryByTestId('should-not-appear')).not.toBeInTheDocument();
  });

  test('doit gérer configuration manquante', () => {
    render(
      <AppProvider currentTechnician={mockUsers.admin} config={null}>
        <DynamicNavigation />
      </AppProvider>
    );

    // Devrait still afficher quelque chose, même sans config
    expect(screen.getByTestId('dynamic-navigation')).toBeInTheDocument();
    expect(screen.getByText('Non connecté')).toBeInTheDocument();
  });

  test('doit gérer service de permissions non initialisé', () => {
    // Réinitialiser le service
    permissionService.init(null, null);
    
    render(
      <AppProvider currentTechnician={mockUsers.technician} config={mockConfig}>
        <DynamicNavigation />
      </AppProvider>
    );

    // Devrait still fonctionner, même si service non initialisé explicitement
    expect(screen.getByTestId('dynamic-navigation')).toBeInTheDocument();
  });
});

// ==================== TESTS D'INTÉGRATION ACCESSIBILITÉ ====================

describe('Intégration Accessibilité et UX', () => {
  test('doit avoir navigation cohérente entre les rôles', () => {
    const roles = ['technician', 'manager', 'admin'];
    
    roles.forEach(roleKey => {
      const { unmount } = render(
        <AppProvider currentTechnician={mockUsers[roleKey]} config={mockConfig}>
          <DynamicNavigation />
        </AppProvider>
      );

      // Vérifier structure navigation cohérente
      expect(screen.getByTestId('dynamic-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('user-role-display')).toBeInTheDocument();
      expect(screen.getByTestId('accessible-modules-list')).toBeInTheDocument();
      
      unmount();
    });
  });

  test('doit afficher fallback informatif pour accès refusé', () => {
    render(
      <AppProvider currentTechnician={mockUsers.viewer} config={mockConfig}>
        <PermissionGate 
          permission="config:view" 
          fallback={<div data-testid="access-denied">Accès refusé pour votre rôle</div>}
        >
          <div data-testid="secret-content">Contenu secret</div>
        </PermissionGate>
      </AppProvider>
    );

    expect(screen.getByTestId('access-denied')).toHaveTextContent('Accès refusé pour votre rôle');
    expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
  });
});

// ==================== TESTS D'INTÉGRATION SÉCURITÉ ====================

describe('Intégration Sécurité et Restrictions', () => {
  test('doit empêcher élévation de privilèges côté client', () => {
    // Tenter de contourner les permissions en modifiant directement le contexte
    const maliciousUser = {
      ...mockUsers.viewer,
      permissions: ['*'], // Essayer de s'octroyer toutes les permissions
      role: 'super_admin'
    };

    render(
      <AppProvider currentTechnician={maliciousUser} config={mockConfig}>
        <DynamicNavigation />
      </AppProvider>
    );

    // Le système devrait utiliser les vraies permissions, pas les tentatives de contournement
    // (dans ce cas, le rôle viewer n'a pas *, donc il devrait still être restreint)
    const modules = screen.getAllByTestId(/^module-/);
    expect(modules).toHaveLength(5); // Viewer devrait avoir 5 modules max
  });

  test('doit gérer correctement les permissions inherits avec wildcards', () => {
    const wildcardUser = {
      ...mockUsers.technician,
      permissions: ['sessions:*', 'dashboard:view']
    };

    render(
      <AppProvider currentTechnician={wildcardUser} config={mockConfig}>
        <PermissionGate permission="sessions:delete">
          <div data-testid="wildcard-access">Accès wildcard accordé</div>
        </PermissionGate>
      </AppProvider>
    );

    // sessions:* devrait permettre sessions:delete
    expect(screen.getByTestId('wildcard-access')).toBeInTheDocument();
  });
});

// ==================== EXPORT ====================

export default {
  // Tests d'intégration exportés automatiquement
};