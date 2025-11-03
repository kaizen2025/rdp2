/**
 * Configuration des tests pour RDS Viewer Anecoop
 * Setup global pour Jest et React Testing Library
 */

// Configuration globale pour les tests
global.performance = {
  now: () => Date.now()
};

// Mock pour window.matchMedia
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

// Mock pour window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock pour window.IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Ignorer les assets statiques dans les tests
const assetStub = {
  get: () => '',
  has: () => false,
};
require.cache[require.resolve('*.svg')] = assetStub;
require.cache[require.resolve('*.css')] = { exports: {} };

// Mock des modules qui peuvent causer des problèmes
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ 
    pathname: '/', 
    search: '', 
    hash: '', 
    state: null, 
    key: 'default' 
  }),
  Navigate: ({ to, replace = false, state = null, children }) => (
    <div data-testid="navigate" data-to={to} data-replace={replace}>
      {children}
    </div>
  ),
}));

// Configuration des timeouts
jest.setTimeout(30000); // 30 secondes

// Silence des warnings non critiques en mode test
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ReactDOM.render is deprecated')
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Configuration des expect personnalisés
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHavePermission(received, permission) {
    const hasPerm = received.hasPermission(permission);
    const pass = hasPerm;
    
    return {
      message: () => 
        pass 
          ? `expected not to have permission ${permission}`
          : `expected to have permission ${permission}`,
      pass,
    };
  },
  
  toHaveModuleAccess(received, moduleId) {
    const hasAccess = received.canAccessModule(moduleId);
    const pass = hasAccess;
    
    return {
      message: () => 
        pass 
          ? `expected not to have access to module ${moduleId}`
          : `expected to have access to module ${moduleId}`,
      pass,
    };
  }
});

// Utilitaires globaux pour les tests
global.createMockUser = (permissions, role = null) => ({
  id: 'mock_user',
  username: 'mockuser',
  email: 'mock@test.com',
  role,
  permissions: permissions || [],
});

global.createMockConfig = (roles = {}) => ({
  roles: {
    super_admin: {
      name: 'Super Administrateur',
      description: 'Accès complet',
      permissions: ['*'],
      icon: '👑',
      color: '#d32f2f'
    },
    admin: {
      name: 'Administrateur',
      description: 'Gestion complète',
      permissions: [
        'dashboard:*', 'sessions:*', 'computers:*', 'loans:*', 'users:*',
        'ad_management:*', 'chat_ged:*', 'ai_assistant:*', 'reports:*',
        'settings:*', 'config:view'
      ],
      icon: '👨‍💼',
      color: '#f57c00'
    },
    manager: {
      name: 'Manager',
      description: 'Gestionnaire',
      permissions: [
        'dashboard:view', 'sessions:view', 'computers:*', 'loans:*',
        'users:view', 'chat_ged:view', 'chat_ged:create',
        'ai_assistant:view', 'reports:view', 'reports:export'
      ],
      icon: '👔',
      color: '#1976d2'
    },
    technician: {
      name: 'Technicien',
      description: 'Support technique',
      permissions: [
        'dashboard:view', 'sessions:view', 'sessions:edit',
        'computers:view', 'loans:view', 'loans:create',
        'chat_ged:view', 'ai_assistant:view', 'reports:view'
      ],
      icon: '🔧',
      color: '#388e3c'
    },
    viewer: {
      name: 'Observateur',
      description: 'Lecture seule',
      permissions: [
        'dashboard:view', 'sessions:view', 'computers:view',
        'loans:view', 'reports:view'
      ],
      icon: '👁️',
      color: '#757575'
    },
    ...roles
  },
  modules: {
    dashboard: { id: 'dashboard', requiredPermission: 'dashboard:view' },
    sessions: { id: 'sessions', requiredPermission: 'sessions:view' },
    computers: { id: 'computers', requiredPermission: 'computers:view' },
    loans: { id: 'loans', requiredPermission: 'loans:view' },
    users: { id: 'users', requiredPermission: 'users:view' },
    chat_ged: { id: 'chat_ged', requiredPermission: 'chat_ged:view' },
    ai_assistant: { id: 'ai_assistant', requiredPermission: 'ai_assistant:view' },
    reports: { id: 'reports', requiredPermission: 'reports:view' },
    settings: { id: 'settings', requiredPermission: 'settings:view' }
  }
});

// Helpers pour créer des scénarios de test
global.createTestScenario = (userPermissions, expectedRole, expectedModules) => {
  const user = createMockUser(userPermissions);
  const config = createMockConfig();
  
  return {
    user,
    config,
    expected: {
      role: expectedRole,
      modulesCount: expectedModules,
      permissions: userPermissions
    }
  };
};

// Helper pour mesurer les performances
global.measureExecutionTime = (fn, iterations = 1) => {
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

// Helper pour attendre async
global.waitFor = (callback, options = {}) => {
  const { timeout = 4500, interval = 100 } = options;
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const tick = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(tick, interval);
        }
      }
    };
    
    tick();
  });
};

// Configuration de coverage
process.env.COVERAGE = 'true';

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.REACT_APP_TEST_ENV = 'test';

// Supprimer les logs en mode test (sauf erreurs)
if (process.env.NODE_ENV === 'test') {
  const originalLog = console.log;
  console.log = (...args) => {
    if (args[0] && args[0].startsWith('[PERFORMANCE]')) {
      originalLog(...args); // Garder les logs de performance
    }
  };
}