/**
 * Configuration spécialisée pour les tests du Dashboard
 * Configure l'environnement de test et les utilitaires spécifiques
 */

import '@testing-library/jest-dom';

// Configuration globale pour les tests de performance
if (typeof performance !== 'undefined') {
  global.performance = {
    ...global.performance,
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {}
  };
}

// Mock de requestAnimationFrame pour les tests
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock de ResizeObserver pour les composants responsive
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
  }
  
  observe(element) {
    this.elements.add(element);
    // Simuler une observation
    setTimeout(() => {
      this.callback([{ target: element, contentRect: { width: 100, height: 100 } }]);
    }, 0);
  }
  
  unobserve(element) {
    this.elements.delete(element);
  }
  
  disconnect() {
    this.elements.clear();
  }
};

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Map();
  }
  
  observe(element) {
    this.elements.set(element, { isIntersecting: false });
  }
  
  unobserve(element) {
    this.elements.delete(element);
  }
  
  disconnect() {
    this.elements.clear();
  }
};

// Configuration du localStorage mock amélioré
const createEnhancedLocalStorage = () => {
  const store = {};
  
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
};

// Appliquer le localStorage mock
global.localStorage = createEnhancedLocalStorage();

// Configuration de sessionStorage
global.sessionStorage = createEnhancedLocalStorage();

// Mock de fetch avec support pour différentes réponses
const createMockFetch = () => {
  const mockResponses = new Map();
  
  const mockFetch = (url, options = {}) => {
    const key = `${options.method || 'GET'} ${url}`;
    
    if (mockResponses.has(key)) {
      const response = mockResponses.get(key);
      return Promise.resolve(response);
    }
    
    // Réponse par défaut
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('{}'),
      blob: () => Promise.resolve(new Blob())
    });
  };
  
  mockFetch.__setMockResponse = (method, url, response) => {
    mockFetch.mockResponses.set(`${method} ${url}`, response);
  };
  
  mockFetch.mockResponses = mockResponses;
  
  return mockFetch;
};

global.fetch = createMockFetch();

// Mock de console pour réduire le bruit dans les tests
const originalConsole = { ...global.console };

global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Configuration des timers Jest pour les tests asynchrones
jest.useFakeTimers({
  advanceTimersByTime: 100,
  now: new Date('2024-11-04T10:00:00Z')
});

// Utilitaires pour les tests de performance
global.PerformanceMonitor = {
  measure: (name, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  },
  
  measureAsync: async (name, fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
};

// Utilitaires pour les tests de mémoire
global.MemoryTracker = {
  start: () => {
    if (process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  },
  
  end: (startMemory) => {
    if (process.memoryUsage) {
      const endMemory = process.memoryUsage().heapUsed;
      const increase = endMemory - startMemory;
      console.log(`Memory increase: ${(increase / 1024 / 1024).toFixed(2)}MB`);
      return increase;
    }
    return 0;
  }
};

// Configuration pour les tests d'accessibilité
global AccessibilityHelper = {
  checkColorContrast: (foreground, background) => {
    // Simulation simple du calcul de contraste
    const getLuminance = (color) => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    };
    
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    return ratio;
  },
  
  getAriaLabel: (element) => {
    return element.getAttribute('aria-label') || 
           element.getAttribute('aria-labelledby') ||
           element.textContent || '';
  }
};

// Mock des modules externes lourds
jest.mock('react-grid-layout', () => ({
  Responsive: ({ children, ...props }) => (
    <div data-testid="responsive-grid-layout" {...props}>
      {children}
    </div>
  ),
  WidthProvider: (Component) => (props) => <Component {...props} />
}));

jest.mock('jspdf', () => {
  const MockJsPDF = class {
    constructor(orientation = 'p', unit = 'mm', format = 'a4') {
      this.internal = {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297
        }
      };
      this.pages = [];
    }
    
    setFontSize(size) { this.currentFontSize = size; }
    setTextColor(r, g, b) { this.textColor = { r, g, b }; }
    text(text, x, y, options) { 
      this.pages.push({ text, x, y, options }); 
    }
    addPage() { this.pages.push({}); }
    addImage(imageData, format, x, y, width, height, alias, compression, rotation, dx, dy) {
      this.pages.push({ type: 'image', imageData, format, x, y, width, height });
    }
    save(filename) { 
      this.filename = filename; 
      console.log(`Mock PDF saved: ${filename}`);
    }
  };
  
  return { default: MockJsPDF };
});

jest.mock('xlsx', () => ({
  utils: {
    book_new: () => ({ SheetNames: [], Sheets: {} }),
    aoa_to_sheet: (data) => ({ data }),
    json_to_sheet: (data) => ({ data }),
    book_append_sheet: (workbook, sheet, name) => {
      workbook.SheetNames.push(name);
      workbook.Sheets[name] = sheet;
    }
  },
  writeFile: (workbook, filename) => {
    console.log(`Mock Excel saved: ${filename}`);
  }
}));

jest.mock('html2canvas', () => ({
  default: (element, options) => {
    return Promise.resolve({
      toDataURL: () => 'data:image/png;base64,mock',
      toBlob: (callback) => callback(new Blob(['mock'], { type: 'image/png' }))
    });
  }
}));

// Configuration des timeouts pour différents types de tests
const setTestTimeouts = () => {
  // Tests unitaires : 5 secondes
  jest.setTimeout(5000);
  
  // Tests d'intégration : 10 secondes
  if (process.env.NODE_ENV === 'integration') {
    jest.setTimeout(10000);
  }
  
  // Tests de performance : 30 secondes
  if (process.env.NODE_ENV === 'performance') {
    jest.setTimeout(30000);
  }
};

// Nettoyage après chaque test
afterEach(() => {
  // Nettoyer les mocks
  jest.clearAllMocks();
  
  // Nettoyer les timers
  jest.clearAllTimers();
  
  // Nettoyer localStorage et sessionStorage
  global.localStorage.clear();
  global.sessionStorage.clear();
  
  // Réinitialiser les consoles
  global.console.log.mockClear();
  global.console.warn.mockClear();
  global.console.error.mockClear();
  
  // Réinitialiser fetch
  global.fetch.mockClear();
});

// Configuration avant tous les tests
beforeAll(() => {
  setTestTimeouts();
  
  // Configuration pour les tests de performance
  if (process.env.PERFORMANCE_TESTS === 'true') {
    console.log('Starting performance tests...');
    
    // Désactiver la garbage collection pour des mesures cohérentes
    if (global.gc) {
      global.gc();
    }
  }
});

// Configuration après tous les tests
afterAll(() => {
  // Rapport final pour les tests de performance
  if (process.env.PERFORMANCE_TESTS === 'true') {
    console.log('Performance tests completed');
    
    // Forcer la garbage collection pour le rapport final
    if (global.gc) {
      global.gc();
    }
  }
});

// Utilitaires personnalisés pour les tests
global.TestUtils = {
  // Attend que tous les émojis et animations soient terminés
  waitForAnimations: () => jest.advanceTimersByTime(100),
  
  // Simule un clic utilisateur réaliste
  simulateUserClick: (element) => {
    fireEvent.click(element);
    jest.advanceTimersByTime(1);
  },
  
  // Simule un hover utilisateur
  simulateUserHover: (element) => {
    fireEvent.mouseEnter(element);
    jest.advanceTimersByTime(1);
  },
  
  // Crée des données de test avec variation
  createVariableData: (count, baseData, variance = 0.1) => {
    return Array.from({ length: count }, (_, i) => {
      const base = baseData[i % baseData.length];
      return {
        ...base,
        value: Math.round(base.value * (1 + (Math.random() - 0.5) * variance)),
        timestamp: new Date(base.timestamp.getTime() + i * 60000).toISOString()
      };
    });
  },
  
  // Vérifie les propriétés d'accessibilité
  checkA11yProperties: (element) => {
    return {
      hasLabel: !!(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')),
      hasRole: !!element.getAttribute('role'),
      tabIndex: element.getAttribute('tabindex'),
      isFocusable: element.getAttribute('tabindex') !== '-1'
    };
  }
};

// Export pour usage dans les tests
export default {
  createEnhancedLocalStorage,
  createMockFetch,
  setTestTimeouts
};