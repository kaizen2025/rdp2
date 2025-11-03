/**
 * Setup spécifique pour les tests des sessions RDS
 * Configuration des mocks, timers et utilitaires de test
 */

// Configuration des timers pour les tests
jest.useFakeTimers();

// Configuration des dates pour la cohérence des tests
const originalDate = global.Date;
jest.spyOn(global, 'Date').mockImplementation((...args) => {
  if (args.length === 0) {
    // Date fixe pour les tests (2025-01-15 10:30:00 UTC)
    return new originalDate('2025-01-15T10:30:00.000Z');
  }
  return new originalDate(...args);
});

// Mock pour Date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'HH:mm') return '10:30';
    if (formatStr === 'dd MMM yyyy HH:mm') return '15 Jan 2025 10:30';
    return '2025-01-15';
  }),
  subHours: jest.fn((date, hours) => {
    return new Date(date.getTime() - (hours * 60 * 60 * 1000));
  }),
  formatDistanceToNow: jest.fn((date, options) => {
    return 'il y a 2 heures';
  }),
}));

jest.mock('date-fns/locale', () => ({
  fr: {},
}));

// Mock pour Recharts (nécessaire pour les tests des graphiques)
jest.mock('recharts', () => ({
  LineChart: ({ children, ...props }) => (
    <svg data-testid="line-chart" {...props}>
      {children}
      <div data-testid="chart-tooltip" style={{ display: 'none' }} />
    </svg>
  ),
  AreaChart: ({ children, ...props }) => (
    <svg data-testid="area-chart" {...props}>
      {children}
      <div data-testid="chart-tooltip" style={{ display: 'none' }} />
    </svg>
  ),
  Line: () => <line data-testid="line" />,
  Area: () => <area data-testid="area" />,
  XAxis: () => <g data-testid="x-axis" />,
  YAxis: () => <g data-testid="y-axis" />,
  CartesianGrid: () => <g data-testid="cartesian-grid" />,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  Legend: () => <g data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock pour les icônes Material-UI
jest.mock('@mui/icons-material', () => ({
  Person: () => <svg data-testid="PersonIcon" />,
  Dns: () => <svg data-testid="DnsIcon" />,
  Timer: () => <svg data-testid="TimerIcon" />,
  ScreenShare: () => <svg data-testid="ScreenShareIcon" />,
  Computer: () => <svg data-testid="ComputerIcon" />,
  Message: () => <svg data-testid="MessageIcon" />,
  Info: () => <svg data-testid="InfoIcon" />,
  Refresh: () => <svg data-testid="RefreshIcon" />,
  Announcement: () => <svg data-testid="AnnouncementIcon" />,
  CheckCircle: () => <svg data-testid="CheckCircleIcon" />,
  RadioButtonUnchecked: () => <svg data-testid="RadioButtonUncheckedIcon" />,
  Cancel: () => <svg data-testid="CancelIcon" />,
  Warning: () => <svg data-testid="WarningIcon" />,
  AccessTime: () => <svg data-testid="TimeIcon" />,
  Close: () => <svg data-testid="CloseIcon" />,
  NotificationsActive: () => <svg data-testid="AlertIcon" />,
}));

// Mock pour window.electronAPI (si pas déjà défini)
if (!global.window.electronAPI) {
  global.window.electronAPI = {
    launchRdp: jest.fn().mockResolvedValue({ success: true }),
  };
}

// Configuration de ResizeObserver pour les tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Configuration de MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock pour IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Configuration des EventListeners globaux
const originalAddEventListener = global.addEventListener;
const originalRemoveEventListener = global.removeEventListener;

global.addEventListener = jest.fn(originalAddEventListener);
global.removeEventListener = jest.fn(originalRemoveEventListener);

// Configuration du localStorage pour les tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => {
      return Object.keys(store)[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Configuration du sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => {
      return Object.keys(store)[index] || null;
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock pour fetch si pas déjà défini
if (!global.fetch) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('OK'),
  });
}

// Configuration du matchers personnalisés
expect.extend({
  // Matcher pour vérifier si un élément est visible
  toBeVisible(received) {
    const isVisible = received.offsetWidth > 0 || received.offsetHeight > 0 || 
                     received.getClientRects().length > 0;
    
    return {
      message: () => `expected element not to be visible`,
      pass: isVisible,
    };
  },

  // Matcher pour vérifier si une chaîne contient une session RDS
  toBeValidSession(received) {
    const required = ['id', 'sessionId', 'username', 'server', 'isActive'];
    const hasAllProperties = required.every(prop => received.hasOwnProperty(prop));
    
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid session object`,
      pass: hasAllProperties,
    };
  },

  // Matcher pour vérifier si un nombre est dans une plage
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});

// Configuration globale pour les tests async
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args));

// Configuration pour les tests de performance
const performanceMonitor = {
  marks: new Map(),
  measures: new Map(),
};

global.performance = {
  ...global.performance,
  mark: (name) => {
    performanceMonitor.marks.set(name, Date.now());
  },
  measure: (measureName, startMark, endMark) => {
    const startTime = performanceMonitor.marks.get(startMark);
    const endTime = performanceMonitor.marks.get(endMark);
    if (startTime && endTime) {
      performanceMonitor.measures.set(measureName, endTime - startTime);
    }
  },
  getEntriesByType: (type) => {
    return Array.from(performanceMonitor.measures.entries()).map(([name, value]) => ({
      name,
      duration: value,
      entryType: type,
    }));
  },
  now: () => Date.now(),
  clearMarks: () => performanceMonitor.marks.clear(),
  clearMeasures: () => performanceMonitor.measures.clear(),
};

// Configuration pour les tests de mémoire
if (!global.gc) {
  global.gc = () => {
    // Simulation de garbage collection
  };
}

// Helpers pour les tests
global.testUtils = {
  // Créer une session mock rapidement
  createMockSession: (overrides = {}) => ({
    id: `sess-${Date.now()}`,
    sessionId: '1',
    username: 'test.user',
    server: 'RDS-SERVER-01',
    isActive: true,
    startTime: new Date().toISOString(),
    endTime: null,
    clientAddress: '192.168.1.100',
    protocol: 'RDP',
    ...overrides,
  }),

  // Créer un serveur mock rapidement
  createMockServer: (overrides = {}) => ({
    id: `server-${Date.now()}`,
    name: 'RDS-SERVER-01',
    status: 'online',
    metrics: {
      cpu: 50,
      memory: 60,
      disk: 40,
      sessions: 25,
      ...overrides.metrics,
    },
    ...overrides,
  }),

  // Attendre une condition
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout after ${timeout}ms`));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },

  // Mesurer le temps d'exécution
  measureExecutionTime: async (fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start,
    };
  },
};

// Configuration pour les tests de Material-UI
global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Reset après chaque test
afterEach(() => {
  // Nettoyer les timers
  jest.clearAllTimers();
  
  // Nettoyer les mocks
  jest.clearAllMocks();
  
  // Reset du localStorage
  localStorage.clear();
  
  // Reset des performances
  performanceMonitor.marks.clear();
  performanceMonitor.measures.clear();
  if (global.performance.clearMarks) global.performance.clearMarks();
  if (global.performance.clearMeasures) global.performance.clearMeasures();
});

// Configuration avant chaque test
beforeEach(() => {
  // Reset du console pour éviter le spam des logs de tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Configuration après tous les tests
afterAll(() => {
  // Restore console methods
  console.log.mockRestore();
  console.warn.mockRestore();
  console.error.mockRestore();
  
  // Cleanup global mocks
  jest.restoreAllMocks();
});

// Export pour utilisation dans les tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    localStorageMock,
    sessionStorageMock,
    performanceMonitor,
  };
}
