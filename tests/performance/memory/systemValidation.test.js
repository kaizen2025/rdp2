/**
 * Test de validation simple du système de tests de mémoire
 * Vérifie que tous les modules se chargent correctement
 */

const path = require('path');

describe('Validation Système Tests de Mémoire', () => {
  test('doit charger le MemoryMonitor', () => {
    const MemoryMonitor = require('./memoryMonitor');
    expect(MemoryMonitor).toBeDefined();
    
    const monitor = new MemoryMonitor();
    expect(monitor).toHaveProperty('getMemoryStats');
    expect(monitor).toHaveProperty('startMonitoring');
    expect(monitor).toHaveProperty('takeHeapSnapshot');
  });

  test('doit charger le HeapAnalyzer', () => {
    const { HeapAnalyzer } = require('./heapProfiler');
    expect(HeapAnalyzer).toBeDefined();
    
    const analyzer = new HeapAnalyzer();
    expect(analyzer).toHaveProperty('takeHeapSnapshot');
    expect(analyzer).toHaveProperty('analyzeTrends');
  });

  test('doit charger le LeakDetector', () => {
    const { LeakDetector } = require('./heapProfiler');
    expect(LeakDetector).toBeDefined();
    
    const detector = new LeakDetector();
    expect(detector).toHaveProperty('detectLeakPatterns');
  });

  test('doit charger la configuration', () => {
    const config = require('./memory.config');
    expect(config).toHaveProperty('MEMORY_THRESHOLDS');
    expect(config).toHaveProperty('PROFILING_CONFIG');
    expect(config).toHaveProperty('REACT_CONFIG');
    expect(config).toHaveProperty('WEBSOCKET_CONFIG');
  });

  test('doit mesurer l\'utilisation mémoire de base', () => {
    const MemoryMonitor = require('./memoryMonitor');
    const monitor = new MemoryMonitor();
    
    const stats = monitor.getMemoryStats();
    
    expect(stats).toHaveProperty('heapUsed');
    expect(stats).toHaveProperty('heapTotal');
    expect(stats).toHaveProperty('rss');
    expect(typeof stats.heapUsed).toBe('number');
    expect(stats.heapUsed).toBeGreaterThan(0);
  });

  test('doit prendre des snapshots heap', () => {
    const MemoryMonitor = require('./memoryMonitor');
    const monitor = new MemoryMonitor();
    
    // Crée des données de test
    const testData = new Array(1000).fill('test');
    
    const snapshot = monitor.takeHeapSnapshot('validation-test');
    expect(snapshot).toBeDefined();
    expect(snapshot.label).toBe('validation-test');
    expect(snapshot.heapUsed).toBeGreaterThan(0);
  });

  test('doit mesurer l\'impact d\'une fonction', async () => {
    const MemoryMonitor = require('./memoryMonitor');
    const monitor = new MemoryMonitor();
    
    const testFunction = () => {
      return new Array(10000).fill('data');
    };
    
    const result = await monitor.measureFunctionMemory(testFunction, 'test-function');
    
    expect(result).toHaveProperty('result');
    expect(result).toHaveProperty('memory');
    expect(result.memory).toHaveProperty('increase');
    expect(typeof result.memory.increase).toBe('number');
  });

  test('doit exporter un rapport', () => {
    const MemoryMonitor = require('./memoryMonitor');
    const monitor = new MemoryMonitor();
    
    monitor.takeHeapSnapshot('report-test');
    
    const report = monitor.exportReport();
    
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('current');
    expect(report).toHaveProperty('snapshots');
    expect(report.snapshots.length).toBeGreaterThan(0);
  });

  test('doit charger l\'exemple d\'intégration', () => {
    const { RDPMemoryIntegration } = require('./integrationExample');
    expect(RDPMemoryIntegration).toBeDefined();
  });

  test('doit avoir tous les fichiers de test', () => {
    const fs = require('fs');
    const testFiles = [
      'nodeElectronHeap.test.js',
      'reactComponentLeaks.test.js',
      'websocketLeaks.test.js',
      'gedMassiveOperations.test.js',
      'electronWindowCleanup.test.js',
      'detailedProfiling.test.js'
    ];
    
    testFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('doit avoir la configuration Jest', () => {
    const fs = require('fs');
    const configPath = path.join(__dirname, 'jest.config.memory.js');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test('doit avoir le README', () => {
    const fs = require('fs');
    const readmePath = path.join(__dirname, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
    
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('Système de Détection et Test des Fuites de Mémoire');
    expect(content).toContain('Node.js --inspect');
    expect(content).toContain('React DevTools Profiler');
  });
});

// Test asynchrone global pour vérifier le système complet
async function testSystemComplet() {
  console.log('🔬 Test complet du système de mémoire...');
  
  const MemoryMonitor = require('./memoryMonitor');
  const { HeapAnalyzer, LeakDetector } = require('./heapProfiler');
  
  // Initialise les composants
  const monitor = new MemoryMonitor();
  const analyzer = new HeapAnalyzer();
  const detector = new LeakDetector();
  
  console.log('📊 Statistiques initiales:', monitor.getMemoryStats());
  
  // Prend des snapshots
  analyzer.takeHeapSnapshot('test-complet-start');
  monitor.takeHeapSnapshot('monitor-start');
  
  // Simule une allocation
  const testData = new Array(50000).fill('test-complet-data');
  
  // Prend des snapshots après allocation
  analyzer.takeHeapSnapshot('test-complet-after');
  monitor.takeHeapSnapshot('monitor-after');
  
  // Analyse
  const trends = analyzer.analyzeTrends();
  const leakAnalysis = detector.detectLeakPatterns(monitor);
  const report = monitor.exportReport();
  
  console.log('📈 Tendances:', trends.trend);
  console.log('🔍 Analyse fuites:', leakAnalysis.leakDetected ? 'DÉTECTÉES' : 'AUCUNE');
  console.log('📋 Rapport généré avec', report.snapshots.length, 'snapshots');
  
  console.log('✅ Test complet terminé');
}

// Exécute le test complet si appelé directement
if (require.main === module) {
  testSystemComplet().catch(console.error);
}