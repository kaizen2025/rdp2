import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock global objects
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

// Mock performance API
global.performance = {
  now: jest.fn(() => performance.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Global test utilities
global.testUtils = {
  measureRenderTime: async (component) => {
    const startTime = performance.now();
    await component();
    const endTime = performance.now();
    return endTime - startTime;
  },

  simulateUserInteraction: async (element, eventType = 'click') => {
    const event = new Event(eventType, { bubbles: true });
    Object.defineProperty(event, 'target', { value: element, enumerable: true });
    element.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 0));
  },

  createMockFormData: () => {
    const formData = {
      data: new Map(),
      append: jest.fn((key, value) => {
        formData.data.set(key, value);
      }),
      get: jest.fn((key) => formData.data.get(key)),
      getAll: jest.fn((key) => Array.from(formData.data.values()).filter(v => v === key)),
      has: jest.fn((key) => formData.data.has(key)),
      delete: jest.fn((key) => formData.data.delete(key)),
      set: jest.fn((key, value) => formData.data.set(key, value)),
      entries: jest.fn(() => formData.data.entries()),
      keys: jest.fn(() => formData.data.keys()),
      values: jest.fn(() => formData.data.values()),
      forEach: jest.fn((callback) => formData.data.forEach((value, key) => callback(value, key))),
      [Symbol.iterator]: jest.fn(function* () {
        yield* formData.data;
      })
    };
    return formData;
  },

  createMockWebSocket: () => ({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1,
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  })
};

// Performance testing utilities
global.performanceMonitor = {
  memoryUsage: {
    get usage() {
      return process.memoryUsage ? process.memoryUsage() : { heapUsed: 0, heapTotal: 0 };
    }
  },

  measureAsync: async (fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  },

  measureSync: (fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  },

  monitorMemoryLeaks: () => {
    const heapBefore = global.performanceMonitor.memoryUsage.heapUsed;
    
    return {
      checkAfter: () => {
        const heapAfter = global.performanceMonitor.memoryUsage.heapUsed;
        const memoryIncrease = heapAfter - heapBefore;
        return {
          heapBefore,
          heapAfter,
          memoryIncrease,
          hasMemoryLeak: memoryIncrease > 1024 * 1024 // 1MB threshold
        };
      }
    };
  }
};

// Mock Material-UI components for better performance testing
jest.mock('@mui/material', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props} data-testid="mui-button">
      {children}
    </button>
  ),
  TextField: ({ onChange, ...props }) => (
    <input onChange={onChange} {...props} data-testid="mui-textfield" />
  ),
  MenuItem: ({ children, ...props }) => (
    <li {...props} data-testid="mui-menu-item">
      {children}
    </li>
  ),
  MenuList: ({ children, ...props }) => (
    <ul {...props} data-testid="mui-menu-list">
      {children}
    </ul>
  ),
  Dialog: ({ open, children, ...props }) => (
    open ? <div {...props} data-testid="mui-dialog">{children}</div> : null
  ),
  Snackbar: ({ open, children, ...props }) => (
    open ? <div {...props} data-testid="mui-snackbar">{children}</div> : null
  ),
  List: ({ children, ...props }) => (
    <ul {...props} data-testid="mui-list">{children}</ul>
  ),
  ListItem: ({ children, ...props }) => (
    <li {...props} data-testid="mui-list-item">{children}</li>
  ),
  ListItemText: ({ children, ...props }) => (
    <span {...props} data-testid="mui-list-item-text">{children}</span>
  )
}));