/**
 * Utilitaires pour les tests de performance UI
 * Fonctions helpers pour mesurer, comparer et analyser les performances
 */

const { performance } = require('perf_hooks');

// Classe pour mesurer les performances
class PerformanceProfiler {
  constructor() {
    this.measurements = new Map();
    this.profiles = new Map();
  }

  // Commencer une mesure
  start(label) {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    
    this.measurements.get(label).push({
      start: performance.now(),
      end: null,
      duration: null
    });
  }

  // Terminer une mesure
  end(label) {
    if (!this.measurements.has(label)) {
      throw new Error(`Measurement '${label}' not started`);
    }

    const measurements = this.measurements.get(label);
    const currentMeasurement = measurements[measurements.length - 1];
    
    if (currentMeasurement.end !== null) {
      throw new Error(`Measurement '${label}' already ended`);
    }

    currentMeasurement.end = performance.now();
    currentMeasurement.duration = currentMeasurement.end - currentMeasurement.start;
  }

  // Obtenir les statistiques d'une mesure
  getStats(label) {
    if (!this.measurements.has(label)) {
      return null;
    }

    const measurements = this.measurements.get(label)
      .filter(m => m.duration !== null)
      .map(m => m.duration);

    if (measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);

    return {
      count: measurements.length,
      average: sum / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      p50: this.percentile(sorted, 50),
      p75: this.percentile(sorted, 75),
      p90: this.percentile(sorted, 90),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      latest: measurements[measurements.length - 1],
      all: measurements
    };
  }

  // Calculer un percentile
  percentile(sortedArray, percent) {
    const index = Math.ceil((percent / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  // Vérifier si une performance respecte un seuil
  checkThreshold(label, threshold) {
    const stats = this.getStats(label);
    if (!stats) {
      return { passed: false, reason: 'No measurements found' };
    }

    const passed = stats.average <= threshold;
    return {
      passed,
      average: stats.average,
      threshold,
      reason: passed ? 'OK' : `Average (${stats.average.toFixed(2)}ms) exceeds threshold (${threshold}ms)`
    };
  }

  // Nettoyer les mesures
  clear(label = null) {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }

  // Exporter les résultats
  export() {
    const result = {};
    for (const [label] of this.measurements) {
      result[label] = this.getStats(label);
    }
    return result;
  }
}

// Utilitaires pour simuler les interactions utilisateur
const UserInteractionSimulator = {
  // Simuler un clic
  async click(element, options = {}) {
    const startTime = performance.now();
    
    const event = new Event('click', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: element, enumerable: true });
    
    element.dispatchEvent(event);
    
    if (options.waitForResponse) {
      await new Promise(resolve => setTimeout(resolve, options.waitForResponse));
    }
    
    const endTime = performance.now();
    return endTime - startTime;
  },

  // Simuler la saisie dans un champ
  async type(element, text, options = {}) {
    const startTime = performance.now();
    
    // Simuler la frappe caractère par caractère
    for (const char of text) {
      const inputEvent = new Event('input', { bubbles: true });
      const keyEvent = new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true
      });
      
      element.dispatchEvent(inputEvent);
      element.dispatchEvent(keyEvent);
      
      if (options.charDelay) {
        await new Promise(resolve => setTimeout(resolve, options.charDelay));
      }
    }
    
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);
    
    const endTime = performance.now();
    return endTime - startTime;
  },

  // Simuler le scroll
  async scroll(element, amount, options = {}) {
    const startTime = performance.now();
    
    const scrollEvent = new Event('scroll', { bubbles: true });
    element.dispatchEvent(scrollEvent);
    
    // Simuler le mouvement de scroll
    element.scrollTop += amount;
    
    if (options.smooth) {
      await new Promise(resolve => setTimeout(resolve, options.duration || 300));
    }
    
    const endTime = performance.now();
    return endTime - startTime;
  },

  // Simuler un hover
  async hover(element, options = {}) {
    const startTime = performance.now();
    
    const mouseenterEvent = new Event('mouseenter', { bubbles: true });
    element.dispatchEvent(mouseenterEvent);
    
    if (options.duration) {
      await new Promise(resolve => setTimeout(resolve, options.duration));
      
      const mouseleaveEvent = new Event('mouseleave', { bubbles: true });
      element.dispatchEvent(mouseleaveEvent);
    }
    
    const endTime = performance.now();
    return endTime - startTime;
  }
};

// Utilitaires pour générer des données de test
const TestDataGenerator = {
  // Générer des éléments de liste avec propriétés variables
  generateListItems(count, options = {}) {
    const {
      includeChildren = false,
      includeMetadata = true,
      includeBadges = true,
      categories = ['A', 'B', 'C', 'D', 'E'],
      minScore = 0,
      maxScore = 100
    } = options;

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      title: `Element ${i}`,
      description: `Description for element ${i} with some additional content`,
      category: categories[i % categories.length],
      score: Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore,
      tags: Array.from({ length: 3 }, (_, j) => `tag${i}-${j}`),
      priority: Math.floor(Math.random() * 10),
      timestamp: new Date(Date.now() - i * 60000), // Différentes timestamps
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      ...(includeChildren && i % 10 === 0 ? {
        children: Array.from({ length: 5 }, (_, j) => ({
          id: `${i}-${j}`,
          title: `Child ${i}-${j}`,
          description: `Child description ${i}-${j}`,
          category: categories[j % categories.length]
        }))
      } : {}),
      ...(includeMetadata && {
        metadata: {
          created: new Date(Date.now() - Math.random() * 86400000 * 30),
          updated: new Date(Date.now() - Math.random() * 86400000 * 7),
          author: `User${i % 10}`,
          version: Math.floor(Math.random() * 5) + 1
        }
      }),
      ...(includeBadges && {
        badge: i % 20 === 0 ? Math.floor(Math.random() * 99).toString() : null
      })
    }));
  },

  // Générer des notifications avec différents types
  generateNotifications(count, options = {}) {
    const {
      severities = ['info', 'success', 'warning', 'error'],
      types = ['system', 'user', 'notification', 'alert'],
      maxMessageLength = 200
    } = options;

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      title: `Notification ${i}`,
      message: `Message content for notification ${i} with some additional text to make it realistic`,
      severity: severities[i % severities.length],
      type: types[i % types.length],
      timestamp: new Date(Date.now() - i * 30000), // 30 secondes d'intervalle
      read: i % 3 === 0, // 1/3 lues
      actionUrl: `/action/${i}`,
      userId: Math.floor(Math.random() * 1000),
      ...(i % 10 === 0 ? {
        actions: [
          { label: 'Voir', action: 'view' },
          { label: 'Ignorer', action: 'dismiss' }
        ]
      } : {})
    }));
  },

  // Générer des données de menu avec hiérarchie
  generateMenuItems(count, options = {}) {
    const {
      maxDepth = 3,
      includeIcons = true,
      includeBadges = true,
      categories = ['Navigation', 'Actions', 'Tools', 'Settings']
    } = options;

    const icons = ['Home', 'Settings', 'People', 'Folder', 'File'];
    const items = [];

    const createMenuItem = (id, depth = 0) => ({
      id,
      label: `Menu Item ${id}`,
      description: `Description for menu item ${id}`,
      icon: includeIcons ? icons[id % icons.length] : null,
      category: categories[id % categories.length],
      priority: Math.floor(Math.random() * 10),
      keywords: [`keyword${id}`, `category${id % 10}`, `tag${id % 5}`],
      ...(includeBadges && {
        badge: id % 15 === 0 ? Math.floor(Math.random() * 99).toString() : null
      }),
      ...(depth < maxDepth && id % 8 === 0 ? {
        children: Array.from({ length: 3 }, (_, j) => 
          createMenuItem(`${id}-${j}`, depth + 1)
        )
      } : {})
    });

    for (let i = 0; i < count; i++) {
      items.push(createMenuItem(i));
    }

    return items;
  }
};

// Utilitaires pour les benchmarks
const BenchmarkSuite = {
  // Benchmark d'une fonction
  async benchmark(name, fn, iterations = 100, warmup = 10) {
    // Warmup
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    const profiler = new PerformanceProfiler();
    profiler.start(name);

    for (let i = 0; i < iterations; i++) {
      await fn();
    }

    profiler.end(name);
    return profiler.getStats(name);
  },

  // Benchmark comparatif
  async compare(name, implementations, iterations = 100) {
    const results = {};

    for (const [implName, implFn] of Object.entries(implementations)) {
      console.log(`Running benchmark for ${implName}...`);
      results[implName] = await this.benchmark(`${name}_${implName}`, implFn, iterations);
    }

    return results;
  },

  // Benchmark de performance mémoire
  benchmarkMemory(name, fn, iterations = 50) {
    const initialMemory = process.memoryUsage();
    
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    
    // Forcer la collecte des déchets (si disponible)
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    
    return {
      initialHeapUsed: initialMemory.heapUsed,
      finalHeapUsed: finalMemory.heapUsed,
      memoryIncrease: finalMemory.heapUsed - initialMemory.heapUsed,
      memoryIncreasePerIteration: (finalMemory.heapUsed - initialMemory.heapUsed) / iterations
    };
  }
};

// Utilitaires pour valider les performances
const PerformanceValidator = {
  // Valider qu'une mesure est dans les limites acceptables
  validateMeasurement(value, thresholds) {
    const result = {
      value,
      passed: true,
      issues: []
    };

    for (const [metric, threshold] of Object.entries(thresholds)) {
      if (value[metric] > threshold) {
        result.passed = false;
        result.issues.push(`${metric} (${value[metric].toFixed(2)}) exceeds threshold (${threshold})`);
      }
    }

    return result;
  },

  // Valider plusieurs mesures
  validateMultiple(measurements, thresholds) {
    const results = {};
    let allPassed = true;

    for (const [name, measurement] of Object.entries(measurements)) {
      results[name] = this.validateMeasurement(measurement, thresholds);
      if (!results[name].passed) {
        allPassed = false;
      }
    }

    return {
      allPassed,
      results
    };
  },

  // Générer un rapport de validation
  generateValidationReport(validationResult, title) {
    const report = {
      title,
      timestamp: new Date().toISOString(),
      passed: validationResult.allPassed,
      summary: {},
      details: validationResult.results
    };

    // Créer un résumé
    const passedCount = Object.values(validationResult.results)
      .filter(result => result.passed).length;
    const totalCount = Object.keys(validationResult.results).length;
    
    report.summary = {
      totalTests: totalCount,
      passed: passedCount,
      failed: totalCount - passedCount,
      passRate: `${((passedCount / totalCount) * 100).toFixed(1)}%`
    };

    return report;
  }
};

// Utilitaires pour les mocks réalistes
const RealisticMocks = {
  // Mock WebSocket avec latence réaliste
  createRealisticWebSocket() {
    return {
      send: jest.fn().mockImplementation((data) => {
        // Simuler latence de réseau
        return new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      }),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: 1,
      
      // Simuler des événements périodiques
      simulateMessage: (message) => {
        const messageEvent = new Event('message');
        messageEvent.data = message;
        // Déclencher les listeners
        this.addEventListener.mock.calls.forEach(([event, handler]) => {
          if (event === 'message') {
            handler(messageEvent);
          }
        });
      },
      
      simulateError: () => {
        const errorEvent = new Event('error');
        this.addEventListener.mock.calls.forEach(([event, handler]) => {
          if (event === 'error') {
            handler(errorEvent);
          }
        });
      }
    };
  },

  // Mock API avec délai variable
  createRealisticApi() {
    return {
      get: jest.fn().mockImplementation((url) => {
        return new Promise((resolve, reject) => {
          const delay = Math.random() * 200 + 50; // 50-250ms
          setTimeout(() => {
            if (Math.random() < 0.02) { // 2% d'erreur
              reject(new Error('Network error'));
            } else {
              resolve({
                data: { url, timestamp: Date.now() },
                status: 200
              });
            }
          }, delay);
        });
      }),
      
      post: jest.fn().mockImplementation((url, data) => {
        return new Promise((resolve) => {
          const delay = Math.random() * 100 + 20; // 20-120ms
          setTimeout(() => {
            resolve({
              data: { url, data, timestamp: Date.now(), id: Math.random().toString(36) },
              status: 201
            });
          }, delay);
        });
      })
    };
  },

  // Mock de performance pour les animations
  createAnimationMock() {
    const callbacks = new Set();
    
    return {
      requestAnimationFrame: jest.fn().mockImplementation((callback) => {
        callbacks.add(callback);
        const id = Math.random();
        
        // Simuler l'appel après un frame
        setTimeout(() => {
          if (callbacks.has(callback)) {
            callback(performance.now());
          }
        }, 16.67); // ~60fps
        
        return id;
      }),
      
      cancelAnimationFrame: jest.fn().mockImplementation((id) => {
        // Simulation simplifiée
      }),
      
      triggerFrame: () => {
        // Déclencher tous les callbacks enregistrés
        callbacks.forEach(callback => {
          callback(performance.now());
        });
      }
    };
  }
};

// Export des utilitaires
module.exports = {
  PerformanceProfiler,
  UserInteractionSimulator,
  TestDataGenerator,
  BenchmarkSuite,
  PerformanceValidator,
  RealisticMocks
};