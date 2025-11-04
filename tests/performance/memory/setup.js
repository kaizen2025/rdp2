/**
 * Setup pour chaque test de mémoire
 * Configure les utilitaires et vérifications avant chaque test
 */

const { HeapAnalyzer, LeakDetector } = require('./heapProfiler');

// Configuration avant chaque test
beforeEach(() => {
  // Force le GC pour commencer avec une mémoire propre
  if (global.gc) {
    global.gc();
  }
  
  // Attend la stabilisation
  return new Promise(resolve => setTimeout(resolve, 100));
});

// Helper pour forcer le GC avec vérification
function forceGC() {
  if (global.gc) {
    global.gc();
    return true;
  }
  console.warn('GC non disponible, utilisez node --expose-gc');
  return false;
}

// Helper pour attendre la stabilisation mémoire
function waitForMemoryStabilization(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let lastMemory = process.memoryUsage().heapUsed;
    let stableCount = 0;
    const requiredStableCount = 5;
    
    const checkInterval = setInterval(() => {
      const currentMemory = process.memoryUsage().heapUsed;
      const memoryDiff = Math.abs(currentMemory - lastMemory);
      
      if (memoryDiff < 1024 * 1024) { // Moins de 1MB de différence
        stableCount++;
      } else {
        stableCount = 0;
      }
      
      lastMemory = currentMemory;
      
      // Stabilisé ou timeout
      if (stableCount >= requiredStableCount || Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve({
          stabilized: stableCount >= requiredStableCount,
          timeSpent: Date.now() - startTime,
          finalMemory: currentMemory
        });
      }
    }, 100);
  });
}

// Helper pour mesurer l'allocation mémoire
function measureMemoryAllocation(fn) {
  const before = process.memoryUsage();
  const result = fn();
  const after = process.memoryUsage();
  
  return {
    result,
    memoryIncrease: {
      heapUsed: after.heapUsed - before.heapUsed,
      heapTotal: after.heapTotal - before.heapTotal,
      rss: after.rss - before.rss,
      external: after.external - before.external
    }
  };
}

// Helper pour créer des données de test
function createTestData(size = 'medium') {
  const sizes = {
    small: 1000,
    medium: 10000,
    large: 100000,
    xlarge: 1000000
  };
  
  const count = sizes[size] || sizes.medium;
  return new Array(count).fill(`test-data-${Date.now()}`);
}

// Expose les helpers globalement
global.forceGC = forceGC;
global.waitForMemoryStabilization = waitForMemoryStabilization;
global.measureMemoryAllocation = measureMemoryAllocation;
global.createTestData = createTestData;

// Configuration pour Jest
if (typeof jest !== 'undefined') {
  // Timeout par défaut pour les tests async
  jest.setTimeout(30000);
}