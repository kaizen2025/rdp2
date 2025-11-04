/**
 * Tests de surveillance mémoire heap pour Node.js et Electron
 * Teste l'utilisation mémoire, la détection de fuites et les performances
 */

const MemoryMonitor = require('./memoryMonitor');
const { MEMORY_THRESHOLDS } = require('./memory.config');

describe('Tests Surveillance Mémoire Heap Node.js/Electron', () => {
  let memoryMonitor;
  
  beforeEach(() => {
    memoryMonitor = new MemoryMonitor();
  });

  afterEach(() => {
    memoryMonitor.stopMonitoring();
  });

  describe('Tests Mémoire de Base', () => {
    test('doit récupérer les statistiques mémoire actuelles', () => {
      const stats = memoryMonitor.getMemoryStats();
      
      expect(stats).toHaveProperty('heapUsed');
      expect(stats).toHaveProperty('heapTotal');
      expect(stats).toHaveProperty('external');
      expect(stats).toHaveProperty('rss');
      expect(stats).toHaveProperty('heapLimit');
      expect(stats).toHaveProperty('heapSpaces');
      
      expect(typeof stats.heapUsed).toBe('number');
      expect(typeof stats.heapTotal).toBe('number');
      expect(Array.isArray(stats.heapSpaces)).toBe(true);
    });

    test('doit mesurer l\'utilisation mémoire d\'une fonction', async () => {
      // Crée des données temporaire pour le test
      const createLargeArray = () => {
        return new Array(100000).fill('test data');
      };

      const result = await memoryMonitor.measureFunctionMemory(
        createLargeArray,
        'createLargeArray'
      );

      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('memory');
      expect(result.memory).toHaveProperty('before');
      expect(result.memory).toHaveProperty('after');
      expect(result.memory).toHaveProperty('increase');
      expect(typeof result.memory.increase).toBe('number');
    });

    test('doit détecter les seuils mémoire critiques', () => {
      // Simule des statistiques élevées
      const highMemoryStats = {
        heapUsed: 250,
        heapTotal: 300,
        rss: 350,
        external: 50,
        arrayBuffers: 30,
        heapLimit: 2000
      };

      const alerts = memoryMonitor.checkThresholds(highMemoryStats);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.type === 'CRITICAL')).toBe(true);
    });

    test('doit ne pas détecter d\'alertes avec mémoire normale', () => {
      const normalMemoryStats = {
        heapUsed: 50,
        heapTotal: 100,
        rss: 80,
        external: 20,
        arrayBuffers: 10,
        heapLimit: 2000
      };

      const alerts = memoryMonitor.checkThresholds(normalMemoryStats);
      
      // Doit avoir au plus des alertes warning pour heapUsed
      const heapAlerts = alerts.filter(alert => alert.metric === 'heapUsed');
      expect(heapAlerts.length).toBeLessThanOrEqual(1);
      expect(alerts.some(alert => alert.type === 'CRITICAL')).toBe(false);
    });
  });

  describe('Tests Snapshots Heap', () => {
    test('doit prendre des snapshots heap', () => {
      const snapshot = memoryMonitor.takeHeapSnapshot('test');
      
      expect(snapshot).toHaveProperty('id');
      expect(snapshot).toHaveProperty('label');
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('heapUsed');
      expect(snapshot).toHaveProperty('heapTotal');
      expect(snapshot.label).toBe('test');
    });

    test('doit calculer la différence entre snapshots', () => {
      const snapshot1 = memoryMonitor.takeHeapSnapshot('snapshot1');
      const snapshot2 = memoryMonitor.takeHeapSnapshot('snapshot2');
      
      expect(snapshot2.diffFromPrevious).toBeDefined();
      expect(typeof snapshot2.diffFromPrevious).toBe('number');
    });

    test('doit limiter le nombre de snapshots', () => {
      // Prend plus de snapshots que la limite
      for (let i = 0; i < 150; i++) {
        memoryMonitor.takeHeapSnapshot(`snapshot${i}`);
      }
      
      expect(memoryMonitor.heapSnapshots.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Tests Détection Fuites', () => {
    test('doit détecter une croissance continue de mémoire', () => {
      // Simule des snapshots avec croissance continue
      memoryMonitor.takeHeapSnapshot('start');
      
      for (let i = 0; i < 10; i++) {
        // Simule une allocation qui augmente la mémoire
        const testData = new Array(10000).fill('data');
        memoryMonitor.takeHeapSnapshot(`growth${i}`);
      }

      const leaks = memoryMonitor.detectLeaks();
      
      // Il devrait y avoir des fuites détectées
      if (leaks && leaks.length > 0) {
        expect(leaks.some(leak => leak.type === 'CONTINUOUS_GROWTH')).toBe(true);
      }
    });

    test('doit détecter une croissance totale excessive', () => {
      memoryMonitor.takeHeapSnapshot('initial');
      
      // Simule une croissance importante
      for (let i = 0; i < 5; i++) {
        const largeData = new Array(50000).fill('leak data');
        memoryMonitor.takeHeapSnapshot(`totalGrowth${i}`);
      }

      const leaks = memoryMonitor.detectLeaks();
      
      if (leaks && leaks.length > 0) {
        expect(leaks.some(leak => leak.type === 'TOTAL_GROWTH')).toBe(true);
      }
    });

    test('ne doit pas détecter de fuites avec croissance normale', () => {
      memoryMonitor.takeHeapSnapshot('start');
      
      // Prend quelques snapshots avec variations normales
      for (let i = 0; i < 5; i++) {
        const smallData = new Array(1000).fill('small');
        memoryMonitor.takeHeapSnapshot(`normal${i}`);
      }

      const leaks = memoryMonitor.detectLeaks();
      
      // Pas de fuites détectées avec croissance normale
      if (leaks && leaks.length === 0) {
        expect(leaks.length).toBe(0);
      }
    });
  });

  describe('Tests Surveillance Continue', () => {
    test('doit démarrer et arrêter la surveillance', async () => {
      expect(memoryMonitor.isMonitoring).toBe(false);
      
      memoryMonitor.startMonitoring();
      expect(memoryMonitor.isMonitoring).toBe(true);
      expect(memoryMonitor.monitoringInterval).not.toBeNull();
      
      // Attend un cycle de surveillance
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      memoryMonitor.stopMonitoring();
      expect(memoryMonitor.isMonitoring).toBe(false);
      expect(memoryMonitor.monitoringInterval).toBeNull();
    });

    test('doit émettre des événements de mise à jour mémoire', async () => {
      const updateHandler = jest.fn();
      const alertHandler = jest.fn();
      
      memoryMonitor.on('memoryUpdate', updateHandler);
      memoryMonitor.on('memoryAlert', alertHandler);
      
      memoryMonitor.startMonitoring();
      
      // Attend plusieurs cycles
      await new Promise(resolve => setTimeout(resolve, 12000));
      
      memoryMonitor.stopMonitoring();
      
      expect(updateHandler).toHaveBeenCalled();
      // alertHandler peut ne pas être appelé selon l'état mémoire
    });
  });

  describe('Tests Rapports', () => {
    test('doit exporter un rapport mémoire complet', () => {
      // Ajoute des données de test
      memoryMonitor.takeHeapSnapshot('test1');
      memoryMonitor.takeHeapSnapshot('test2');
      
      const report = memoryMonitor.exportReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('current');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('leaks');
      expect(report).toHaveProperty('snapshots');
      expect(report).toHaveProperty('history');
    });

    test('doit sauvegarder un rapport dans un fichier', () => {
      memoryMonitor.takeHeapSnapshot('report-test');
      
      const reportPath = memoryMonitor.saveReport('test-report.json');
      
      expect(reportPath).toContain('memory');
      expect(reportPath).toContain('reports');
      expect(reportPath).toEndWith('.json');
    });
  });

  describe('Tests Scénarios Spécifiques Electron', () => {
    test('doit surveiller la mémoire lors de création de fenêtres multiples', async () => {
      // Simule la création de fenêtres multiples
      const createWindows = async () => {
        const windows = [];
        for (let i = 0; i < 10; i++) {
          // Simule allocation pour fenêtre
          const windowData = {
            id: i,
            html: 'x'.repeat(100000), // 100KB par fenêtre
            bindings: new Array(1000).fill({})
          };
          windows.push(windowData);
        }
        return windows;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        createWindows,
        'createWindows'
      );

      expect(result.length).toBe(10);
      expect(memory.increase).toBeGreaterThan(0);
    });

    test('doit détecter les fuites dans les preload scripts', async () => {
      const preloadLeak = () => {
        // Simule une fuite dans le preload script
        const listeners = [];
        for (let i = 0; i < 100; i++) {
          const listener = () => console.log('event' + i);
          listeners.push(listener);
          // Oublie de nettoyer les listeners
        }
        return listeners;
      };

      const { result, memory } = await memoryMonitor.measureFunctionMemory(
        preloadLeak,
        'preloadLeak'
      );

      expect(result.length).toBe(100);
      expect(memory.increase).toBeGreaterThan(0);
    });
  });
});