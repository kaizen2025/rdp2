// src/tests/inventory-setup.js - CONFIGURATION SPÉCIALE POUR LES TESTS D'INVENTAIRE

import '@testing-library/jest-dom';
import { setupTestEnvironment } from './setup';

// Configuration spécifique pour les tests d'inventaire
setupTestEnvironment();

// Mock des APIs spécifiques à l'inventaire
global.fetch = jest.fn();

// Mock de l'API Web Storage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = {
  getItem: mockLocalStorage.getItem,
  setItem: mockLocalStorage.setItem,
  removeItem: mockLocalStorage.removeItem,
  clear: mockLocalStorage.clear,
};

// Mock de sessionStorage
global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock de l'API File
global.File = class File {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.type = properties?.type || '';
    this.size = properties?.size || 0;
    this.lastModified = properties?.lastModified || Date.now();
  }
};

// Mock de l'API FileReader
global.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      if (this.onload) {
        this.result = `data:${file.type};base64,${btoa(file.parts[0])}`;
        this.onload({ target: this });
      }
    }, 10);
  }
  
  readAsText(file) {
    setTimeout(() => {
      if (this.onload) {
        this.result = file.parts[0];
        this.onload({ target: this });
      }
    }, 10);
  }
};

// Mock de l'API Image
global.Image = class Image {
  constructor() {
    this.src = '';
    this.width = 0;
    this.height = 0;
    this.onload = null;
    this.onerror = null;
  }
  
  set src(value) {
    this._src = value;
    // Simuler le chargement d'image
    setTimeout(() => {
      if (this.onload && value.startsWith('data:')) {
        this.width = 800;
        this.height = 600;
        this.onload({ target: this });
      } else if (this.onerror) {
        this.onerror({ target: this });
      }
    }, 5);
  }
  
  get src() {
    return this._src;
  }
};

// Mock de l'API URL
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

// Mock de l'API Canvas
const mockCanvas = {
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Uint8Array(4) })),
    setTransform: jest.fn(),
    draw: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    bezierCurveTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    lineTo: jest.fn(),
    moveTo: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    textAlign: 'left',
    textBaseline: 'alphabetic',
    font: '14px Arial'
  }))
};

HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;

// Mock de l'API HTML5 Drag and Drop
const mockDataTransfer = {
  files: [],
  types: [],
  items: [],
  effects: 'copy',
  dropEffect: 'copy',
  clearData: jest.fn(),
  getData: jest.fn(() => ''),
  setData: jest.fn(),
  setDragImage: jest.fn()
};

global.DataTransfer = class DataTransfer {
  constructor() {
    return mockDataTransfer;
  }
};

// Mock de l'API ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock de l'API IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock de performance.now
global.performance.now = jest.fn(() => Date.now());

// Configuration pour les tests de upload de fichiers
export const setupFileUploadMocks = () => {
  // Mock des FileList
  const createMockFileList = (files = []) => {
    const fileList = {
      length: files.length,
      item: (index) => files[index],
      ...Array.from(files)
    };
    Object.defineProperty(fileList, Symbol.iterator, {
      value: files[Symbol.iterator].bind(files)
    });
    return fileList;
  };

  // Mock de drop event
  const createMockDropEvent = (files = []) => {
    return {
      dataTransfer: {
        files: createMockFileList(files),
        types: ['Files'],
        effectAllowed: 'copy',
        dropEffect: 'copy'
      },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      target: {}
    };
  };

  return {
    createMockFileList,
    createMockDropEvent
  };
};

// Configuration pour les tests d'upload d'images
export const setupImageUploadMocks = () => {
  const { createMockFileList } = setupFileUploadMocks();
  
  // Créer des fichiers image de test
  const createTestImageFile = (name = 'test.jpg', size = 1024 * 1024) => {
    return new File(['fake image data'], name, { 
      type: 'image/jpeg',
      size: size,
      lastModified: Date.now()
    });
  };

  const createMultipleImageFiles = (count = 3) => {
    return Array.from({ length: count }, (_, i) => 
      createTestImageFile(`test${i + 1}.jpg`, (i + 1) * 1024 * 1024)
    );
  };

  return {
    createTestImageFile,
    createMultipleImageFiles,
    createMockFileList
  };
};

// Configuration pour les tests d'alertes
export const setupAlertMocks = () => {
  const mockWindowAlert = jest.fn();
  const mockWindowConfirm = jest.fn(() => true);
  const mockWindowPrompt = jest.fn(() => 'mock response');
  
  global.window.alert = mockWindowAlert;
  global.window.confirm = mockWindowConfirm;
  global.window.prompt = mockWindowPrompt;

  return {
    mockWindowAlert,
    mockWindowConfirm,
    mockWindowPrompt,
    resetMocks: () => {
      mockWindowAlert.mockClear();
      mockWindowConfirm.mockClear();
      mockWindowPrompt.mockClear();
    }
  };
};

// Configuration pour les tests de performance
export const setupPerformanceMocks = () => {
  let mockTime = 0;
  
  const advanceTime = (ms) => {
    mockTime += ms;
    return mockTime;
  };
  
  global.performance.now = jest.fn(() => mockTime);
  
  const mockPerformanceObserver = {
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => [])
  };
  
  global.PerformanceObserver = jest.fn().mockImplementation(() => mockPerformanceObserver);
  
  return {
    advanceTime,
    mockTime: () => mockTime,
    resetTime: () => {
      mockTime = 0;
    }
  };
};

// Configuration pour les tests de réseau
export const setupNetworkMocks = () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  
  const mockNetworkResponse = (data, status = 200, delay = 0) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          statusText: status === 200 ? 'OK' : 'Error',
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
          blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
          headers: new Headers({ 'Content-Type': 'application/json' })
        });
      }, delay);
    });
  };
  
  const mockNetworkError = (error = 'Network Error', delay = 0) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(error));
      }, delay);
    });
  };
  
  return {
    mockFetch,
    mockNetworkResponse,
    mockNetworkError,
    resetMocks: () => {
      mockFetch.mockClear();
    }
  };
};

// Configuration pour les tests de date
export const setupDateMocks = () => {
  const mockDate = new Date('2024-11-04T12:00:00Z');
  const mockTimeZoneOffset = -60; // UTC+1
  
  const originalDate = Date;
  const originalNow = Date.now;
  
  global.Date = jest.fn().mockImplementation(() => mockDate);
  global.Date.now = jest.fn(() => mockDate.getTime());
  global.Date.UTC = originalDate.UTC.bind(originalDate);
  global.Date.parse = originalDate.parse.bind(originalDate);
  
  // Mock de date-fns
  jest.mock('date-fns', () => ({
    ...jest.requireActual('date-fns'),
    format: jest.fn((date, formatStr) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }),
    differenceInDays: jest.fn((dateLeft, dateRight) => {
      const diff = dateLeft.getTime() - dateRight.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    }),
    addDays: jest.fn((date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }),
    subDays: jest.fn((date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() - days);
      return result;
    }),
    isAfter: jest.fn((dateLeft, dateRight) => dateLeft.getTime() > dateRight.getTime()),
    isBefore: jest.fn((dateLeft, dateRight) => dateLeft.getTime() < dateRight.getTime()),
    isEqual: jest.fn((dateLeft, dateRight) => dateLeft.getTime() === dateRight.getTime())
  }));
  
  const { format, differenceInDays, addDays, subDays, isAfter, isBefore, isEqual } = require('date-fns');
  
  return {
    mockDate,
    mockTimeZoneOffset,
    format,
    differenceInDays,
    addDays,
    subDays,
    isAfter,
    isBefore,
    isEqual,
    advanceDays: (days) => {
      mockDate.setDate(mockDate.getDate() + days);
      global.Date.now = jest.fn(() => mockDate.getTime());
    },
    resetDate: () => {
      mockDate.setTime(new Date('2024-11-04T12:00:00Z').getTime());
      global.Date.now = jest.fn(() => mockDate.getTime());
    }
  };
};

// Configuration des erreurs simulées
export const setupErrorMocks = () => {
  const mockConsoleError = jest.fn();
  const mockConsoleWarn = jest.fn();
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = mockConsoleError;
  console.warn = mockConsoleWarn;
  
  return {
    mockConsoleError,
    mockConsoleWarn,
    resetMocks: () => {
      mockConsoleError.mockClear();
      mockConsoleWarn.mockClear();
    },
    restoreConsole: () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    }
  };
};

// Configuration globale des tests d'inventaire
export const setupInventoryTestEnvironment = () => {
  // Initialiser tous les mocks
  const fileUploadMocks = setupFileUploadMocks();
  const imageUploadMocks = setupImageUploadMocks();
  const alertMocks = setupAlertMocks();
  const performanceMocks = setupPerformanceMocks();
  const networkMocks = setupNetworkMocks();
  const dateMocks = setupDateMocks();
  const errorMocks = setupErrorMocks();
  
  console.log('🧪 Environment de test d\'inventaire configuré');
  
  return {
    fileUpload: fileUploadMocks,
    imageUpload: imageUploadMocks,
    alerts: alertMocks,
    performance: performanceMocks,
    network: networkMocks,
    dates: dateMocks,
    errors: errorMocks,
    
    // Helpers pour le debugging
    debug: {
      logState: (message) => {
        console.log(`🔍 [DEBUG] ${message}`, {
          performance: performanceMocks.mockTime(),
          alerts: alertMocks.mockWindowAlert.mock.calls.length,
          network: networkMocks.mockFetch.mock.calls.length,
          errors: errorMocks.mockConsoleError.mock.calls.length
        });
      },
      
      logPerformance: (label, startTime) => {
        const endTime = performanceMocks.mockTime();
        const duration = endTime - startTime;
        console.log(`⚡ [PERF] ${label}: ${duration.toFixed(2)}ms`);
        return endTime;
      }
    },
    
    // Reset de tous les mocks
    resetAll: () => {
      alertMocks.resetMocks();
      networkMocks.resetMocks();
      errorMocks.resetMocks();
      performanceMocks.resetTime();
      dateMocks.resetDate();
    }
  };
};

// Configuration automatique au chargement
const inventoryTestEnv = setupInventoryTestEnvironment();

// Export des helpers pour utilisation dans les tests
export default inventoryTestEnv;

// Configuration spécifique pour Jest
if (typeof beforeEach === 'function') {
  beforeEach(() => {
    inventoryTestEnv.resetAll();
  });
}

if (typeof afterAll === 'function') {
  afterAll(() => {
    inventoryTestEnv.errors.restoreConsole();
    inventoryTestEnv.dates.resetDate();
  });
}
