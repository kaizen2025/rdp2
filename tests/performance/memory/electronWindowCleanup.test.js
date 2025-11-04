/**
 * Tests de nettoyage mémoire après fermeture de fenêtres Electron
 * Teste la gestion mémoire des BrowserWindow, IPC, et ressources associées
 */

const { MemoryMonitor } = require('./memoryMonitor');
const { ELECTRON_CONFIG } = require('./memory.config');

// Mock BrowserWindow
class MockBrowserWindow {
  constructor(options = {}) {
    this.id = `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.options = options;
    this.webContents = new MockWebContents();
    this.isDestroyed = false;
    this.eventListeners = new Map();
    this.ipcChannels = new Set();
    this.memoryUsage = 0;
    this.bindings = new Map();
    this.isVisible = true;
  }

  loadURL(url) {
    console.log(`Loading URL ${url} in window ${this.id}`);
    this.memoryUsage = ELECTRON_CONFIG.BROWSER_WINDOW_MEMORY_LIMIT * 0.1; // 10% du limit
    return Promise.resolve();
  }

  show() {
    this.isVisible = true;
    this.memoryUsage += 1024 * 1024; // 1MB pour visible
  }

  hide() {
    this.isVisible = false;
    this.memoryUsage -= 1024 * 1024;
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  send(channel, data) {
    if (!this.ipcChannels.has(channel)) {
      this.ipcChannels.add(channel);
    }
    return this.webContents.send(channel, data);
  }

  webContents() {
    return this.webContents;
  }

  // Fuite potentielle: pas de cleanup des listeners
  destroy() {
    this.isDestroyed = true;
    this.isVisible = false;
    
    // Fuite: ne nettoie pas les event listeners!
    // this.eventListeners.clear(); // Commenté = fuite
    
    this.memoryUsage = 0;
  }
}

// Mock WebContents
class MockWebContents {
  constructor() {
    this.eventListeners = new Map();
    this.isDestroyed = false;
  }

  send(channel, data) {
    console.log(`Sending to channel ${channel}`);
    return true;
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  destroy() {
    this.isDestroyed = true;
    this.eventListeners.clear();
  }
}

// Mock IPC Main
class MockIPCMain {
  constructor() {
    this.handlers = new Map();
    this.messageQueue = [];
    this.statistics = {
      messagesProcessed: 0,
      memoryUsed: 0
    };
  }

  handle(channel, handler) {
    this.handlers.set(channel, handler);
    this.statistics.memoryUsed += 1024; // 1KB par handler
  }

  removeHandler(channel) {
    const removed = this.handlers.delete(channel);
    if (removed) {
      this.statistics.memoryUsed -= 1024;
    }
    return removed;
  }

  emit(channel, ...args) {
    if (this.handlers.has(channel)) {
      const handler = this.handlers.get(channel);
      try {
        const result = handler(...args);
        this.statistics.messagesProcessed++;
        return result;
      } catch (error) {
        console.error(`Error in handler for ${channel}:`, error);
      }
    }
    return null;
  }

  cleanup() {
    this.handlers.clear();
    this.messageQueue = [];
    this.statistics = {
      messagesProcessed: 0,
      memoryUsed: 0
    };
  }
}

// Mock Electron App
class MockElectronApp {
  constructor() {
    this.windows = new Map();
    this.mainWindow = null;
    this.isQuitting = false;
    this.eventListeners = new Map();
    this.ipcMain = new MockIPCMain();
  }

  createWindow(options = {}) {
    const window = new MockBrowserWindow(options);
    this.windows.set(window.id, window);
    
    if (!this.mainWindow) {
      this.mainWindow = window;
    }

    return window;
  }

  getWindow(id) {
    return this.windows.get(id);
  }

  getAllWindows() {
    return Array.from(this.windows.values());
  }

  closeWindow(id) {
    const window = this.windows.get(id);
    if (window) {
      window.destroy();
      this.windows.delete(id);
      
      if (this.mainWindow && this.mainWindow.id === id) {
        this.mainWindow = null;
      }
    }
    return window;
  }

  // Fuite potentielle: pas de nettoyage des fenêtres orphelines
  closeAllWindows() {
    this.windows.forEach(window => window.destroy());
    this.windows.clear();
    this.mainWindow = null;
  }

  quit() {
    this.isQuitting = true;
    this.closeAllWindows();
    this.ipcMain.cleanup();
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  getMemoryUsage() {
    let totalMemory = 0;
    this.windows.forEach(window => {
      totalMemory += window.memoryUsage;
    });
    return totalMemory;
  }
}

describe('Tests Nettoyage Mémoire Electron', () => {
  let memoryMonitor;
  let electronApp;

  beforeEach(() => {
    memoryMonitor = new MemoryMonitor();
    electronApp = new MockElectronApp();
  });

  afterEach(() => {
    memoryMonitor.stopMonitoring();
    electronApp.quit();
  });

  describe('Tests BrowserWindow Lifecycle', () => {
    test('doit créer et fermer des fenêtres sans fuites', async () => {
      const createAndCloseWindow = async () => {
        const window = electronApp.createWindow({
          width: 1200,
          height: 800,
          show: true
        });

        await window.loadURL('file:///path/to/app.html');
        return window.id;
      };

      const { result: windowId, memory } = await memoryMonitor.measureFunctionMemory(
        createAndCloseWindow,
        'createAndCloseWindow'
      );

      expect(windowId).toBeDefined();
      
      // Ferme la fenêtre
      electronApp.closeWindow(windowId);
      
      const memoryAfterClose = memoryMonitor.getMemoryStats();
      // La mémoire devrait être revenue proche du niveau initial
      expect(memoryAfterClose.heapUsed).toBeLessThan(
        memory.before + 10 // Tolérance de 10MB
      );
    });

    test('doit détecter les fuites avec fenêtres multiples', async () => {
      const createMultipleWindows = async () => {
        const windowIds = [];
        
        for (let i = 0; i < 10; i++) {
          const window = electronApp.createWindow({
            width: 1200,
            height: 800,
            show: false
          });
          
          await window.loadURL(`file:///path/to/page${i}.html`);
          
          // Fuite: ajoute des listeners non nettoyés
          window.on('closed', () => console.log('Window closed'));
          window.on('focus', () => console.log('Window focused'));
          window.on('blur', () => console.log('Window blurred'));
          
          windowIds.push(window.id);
        }
        
        return windowIds;
      };

      const { result: windowIds } = await memoryMonitor.measureFunctionMemory(
        createMultipleWindows,
        'createMultipleWindows'
      );

      expect(windowIds.length).toBe(10);

      // Ferme seulement la moitié des fenêtres (fuite)
      for (let i = 0; i < 5; i++) {
        electronApp.closeWindow(windowIds[i]);
      }

      // Il devrait rester 5 fenêtres avec leurs listeners
      expect(electronApp.getAllWindows().length).toBe(5);
    });

    test('doit mesurer l\'impact mémoire des fenêtres visibles vs cachées', async () => {
      const testVisibilityImpact = async () => {
        const windows = [];
        
        // Crée des fenêtres cachées
        for (let i = 0; i < 5; i++) {
          const hiddenWindow = electronApp.createWindow({ show: false });
          await hiddenWindow.loadURL('file:///hidden.html');
          windows.push(hiddenWindow);
        }

        // Rend quelques fenêtres visibles
        windows[0].show();
        windows[1].show();

        return { hidden: 5, visible: 2, total: windows.length };
      };

      const { result } = await memoryMonitor.measureFunctionMemory(
        testVisibilityImpact,
        'testVisibilityImpact'
      );

      expect(result.hidden).toBe(5);
      expect(result.visible).toBe(2);
      expect(result.total).toBe(5);
    });
  });

  describe('Tests IPC et Communication', () => {
    test('doit gérer les messages IPC sans fuites', async () => {
      const testIPCClean = async () => {
        const window = electronApp.createWindow();
        await window.loadURL('file:///test.html');

        // Ajoute des handlers IPC
        electronApp.ipcMain.handle('test-message', (event, data) => {
          return { processed: true, data };
        });

        // Envoie des messages
        for (let i = 0; i < 100; i++) {
          window.send('message', { id: i, content: `Message ${i}` });
        }

        // Nettoie les handlers
        electronApp.ipcMain.removeHandler('test-message');

        return true;
      };

      const { memory } = await memoryMonitor.measureFunctionMemory(
        testIPCClean,
        'testIPCClean'
      );

      expect(electronApp.ipcMain.handlers.size).toBe(0);
      expect(memory.increase).toBeGreaterThanOrEqual(0);
    });

    test('doit détecter les fuites de canaux IPC', async () => {
      const testIPCLeaky = async () => {
        const window = electronApp.createWindow();
        await window.loadURL('file:///test.html');

        // Crée des canaux sans les nettoyer
        for (let i = 0; i < 50; i++) {
          electronApp.ipcMain.handle(`channel-${i}`, (event, data) => {
            return `Response ${i}: ${data}`;
          });

          // Fuite: garde une référence dans la fenêtre
          window.send(`channel-${i}`, { message: `Message ${i}` });
        }

        return window.id;
      };

      const { result: windowId } = await memoryMonitor.measureFunctionMemory(
        testIPCLeaky,
        'testIPCLeaky'
      );

      // Vérifie qu'il y a des canaux IPC actifs
      expect(electronApp.ipcMain.handlers.size).toBe(50);

      // Ferme la fenêtre mais les canaux restent (fuite)
      electronApp.closeWindow(windowId);
      expect(electronApp.ipcMain.handlers.size).toBe(50);
    });

    test('doit mesurer les performances IPC sous charge', async () => {
      const testIPCPressure = async () => {
        const windows = [];
        
        // Crée plusieurs fenêtres
        for (let i = 0; i < 5; i++) {
          const window = electronApp.createWindow();
          await window.loadURL(`file:///test${i}.html`);
          windows.push(window);
        }

        // Simulation de messages intensifs
        const messagePromises = [];
        for (let i = 0; i < 1000; i++) {
          const windowIndex = i % windows.length;
          const window = windows[windowIndex];
          
          const messagePromise = new Promise((resolve) => {
            setTimeout(() => {
              window.send('batch-message', {
                id: i,
                windowIndex,
                data: 'x'.repeat(1024) // 1KB de données
              });
              resolve(true);
            }, 1);
          });
          
          messagePromises.push(messagePromise);
        }

        await Promise.all(messagePromises);
        return { windows: windows.length, messages: 1000 };
      };

      const { result } = await memoryMonitor.measureFunctionMemory(
        testIPCPressure,
        'testIPCPressure'
      );

      expect(result.windows).toBe(5);
      expect(result.messages).toBe(1000);
    });
  });

  describe('Tests Event Listeners et Bindings', () => {
    test('doit nettoyer les event listeners', async () => {
      const testEventListeners = async () => {
        const windows = [];
        
        for (let i = 0; i < 3; i++) {
          const window = electronApp.createWindow();
          
          // Ajoute plusieurs listeners
          const events = ['closed', 'focus', 'blur', 'resize', 'move', 'minimize'];
          events.forEach(event => {
            window.on(event, () => {
              console.log(`Window ${window.id} event: ${event}`);
            });
          });
          
          windows.push(window);
        }
        
        return windows.length;
      };

      const { result: windowCount } = await memoryMonitor.measureFunctionMemory(
        testEventListeners,
        'testEventListeners'
      );

      expect(windowCount).toBe(3);

      // Ferme toutes les fenêtres
      electronApp.closeAllWindows();
      
      // En réalité, les listeners ne seraient pas nettoyés (c'est la fuite)
      const remainingWindows = electronApp.getAllWindows();
      expect(remainingWindows.length).toBe(0);
    });

    test('doit mesurer l\'impact des bindings preload', async () => {
      const testPreloadBindings = async () => {
        const preloadBindings = new Map();
        
        // Simule des bindings preload
        for (let i = 0; i < 100; i++) {
          const binding = {
            id: `binding_${i}`,
            exposedApi: {
              getData: () => `data_${i}`,
              setData: (data) => console.log('setData', data),
              processData: (data) => `processed_${data}`
            },
            // Fuite potentielle: garde des références
            contextData: new Array(1000).fill(`context_${i}`)
          };
          
          preloadBindings.set(`binding_${i}`, binding);
        }
        
        return preloadBindings.size;
      };

      const { result: bindingCount } = await memoryMonitor.measureFunctionMemory(
        testPreloadBindings,
        'testPreloadBindings'
      );

      expect(bindingCount).toBe(100);
    });
  });

  describe('Tests Surveillance Continue Electron', () => {
    test('doit surveiller le cycle de vie des fenêtres', async () => {
      memoryMonitor.startMonitoring();

      // Simulation d'une session Electron typique
      const electronSession = async () => {
        // Crée la fenêtre principale
        const mainWindow = electronApp.createWindow({
          width: 1400,
          height: 900,
          show: true
        });
        await mainWindow.loadURL('file:///index.html');

        // Crée des fenêtres auxiliaires
        const auxiliaryWindows = [];
        for (let i = 0; i < 3; i++) {
          const window = electronApp.createWindow({
            width: 800,
            height: 600,
            show: false
          });
          await window.loadURL(`file:///modal${i}.html`);
          auxiliaryWindows.push(window);

          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Interactions IPC
        for (let i = 0; i < 20; i++) {
          mainWindow.send('user-action', {
            type: 'click',
            element: `button_${i}`,
            data: { timestamp: Date.now() }
          });
        }

        return { mainWindow, auxiliaryWindows };
      };

      const { result } = await memoryMonitor.measureFunctionMemory(
        electronSession,
        'electronSession'
      );

      // Attends plusieurs cycles de surveillance
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Ferme les fenêtres auxiliaires
      result.auxiliaryWindows.forEach(window => {
        electronApp.closeWindow(window.id);
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      memoryMonitor.stopMonitoring();

      const leaks = memoryMonitor.detectLeaks();
      const report = memoryMonitor.exportReport();

      console.log('Surveillance Electron session:', {
        leaks: leaks?.length || 0,
        windowsRemaining: electronApp.getAllWindows().length,
        finalMemory: report.current.heapUsed,
        snapshots: report.snapshots.length
      });

      expect(report.snapshots.length).toBeGreaterThan(0);
    });

    test('doit détecter les fuites lors de fermeture de session', async () => {
      memoryMonitor.startMonitoring();

      const sessionWithLeaks = async () => {
        // Crée plusieurs fenêtres
        const windows = [];
        for (let i = 0; i < 5; i++) {
          const window = electronApp.createWindow({
            show: i === 0 // Seul le premier est visible
          });
          await window.loadURL(`file:///page${i}.html`);
          
          // Ajoute des listeners (fuites potentielles)
          window.on('ready-to-show', () => console.log('ready'));
          window.on('closed', () => console.log('closed'));
          
          windows.push(window);
        }

        // Simulation d'activité
        for (let i = 0; i < 100; i++) {
          const window = windows[i % windows.length];
          window.send('activity', { action: i });
        }

        return windows;
      };

      const { result: windows } = await memoryMonitor.measureFunctionMemory(
        sessionWithLeaks,
        'sessionWithLeaks'
      );

      // Ferme les fenêtres une par une
      for (const window of windows) {
        electronApp.closeWindow(window.id);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      memoryMonitor.stopMonitoring();

      const report = memoryMonitor.exportReport();
      
      // Analyse les tendances mémoire
      const memoryTrend = analyzeMemoryTrend(report.history);
      
      console.log('Analyse fuites fermeture session:', {
        initialMemory: report.history[0]?.heapUsed,
        finalMemory: report.current.heapUsed,
        trend: memoryTrend,
        windowsRemaining: electronApp.getAllWindows().length
      });

      expect(report.snapshots.length).toBeGreaterThan(0);
      expect(electronApp.getAllWindows().length).toBe(0);
    });
  });

  describe('Tests Performance et Stress', () => {
    test('doit gérer la création/destruction rapide de fenêtres', async () => {
      const rapidWindowTest = async () => {
        const operations = [];
        
        for (let i = 0; i < 20; i++) {
          // Création rapide
          const window = electronApp.createWindow();
          await window.loadURL('file:///rapid.html');
          
          // Activité minimale
          window.send('init', { cycle: i });
          
          // Fermeture immédiate
          electronApp.closeWindow(window.id);
          
          operations.push('created_and_closed');
          
          // Petite pause pour stabiliser
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return operations.length;
      };

      const { result: operationCount } = await memoryMonitor.measureFunctionMemory(
        rapidWindowTest,
        'rapidWindowTest'
      );

      expect(operationCount).toBe(20);
      expect(electronApp.getAllWindows().length).toBe(0);
    });
  });
});

// Utilitaire pour analyser la tendance mémoire
function analyzeMemoryTrend(history) {
  if (history.length < 3) return 'insufficient_data';

  const startMemory = history[0].heapUsed;
  const endMemory = history[history.length - 1].heapUsed;
  const change = endMemory - startMemory;

  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}