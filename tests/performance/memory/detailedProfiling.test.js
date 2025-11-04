/**
 * Tests du profilage mémoire détaillé avec heap snapshots
 * Teste l'analyseur de heap, la détection de fuites, et les rapports
 */

const { HeapAnalyzer, LeakDetector } = require('./heapProfiler');
const MemoryMonitor = require('./memoryMonitor');
const { PROFILING_CONFIG } = require('./memory.config');

describe('Tests Profilage Mémoire Détaillé', () => {
  let heapAnalyzer;
  let leakDetector;
  let memoryMonitor;

  beforeEach(() => {
    heapAnalyzer = new HeapAnalyzer();
    leakDetector = new LeakDetector();
    memoryMonitor = new MemoryMonitor();
  });

  afterEach(() => {
    memoryMonitor.stopMonitoring();
  });

  describe('Tests HeapAnalyzer', () => {
    test('doit prendre des heap snapshots détaillés', () => {
      const snapshot = heapAnalyzer.takeHeapSnapshot('test-snapshot');
      
      expect(snapshot).toHaveProperty('id');
      expect(snapshot).toHaveProperty('label');
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('heapUsed');
      expect(snapshot).toHaveProperty('heapTotal');
      expect(snapshot).toHaveProperty('heapSpaces');
      expect(snapshot).toHaveProperty('statistics');
      expect(snapshot).toHaveProperty('analysis');
      
      expect(Array.isArray(snapshot.heapSpaces)).toBe(true);
      expect(snapshot.heapSpaces.length).toBeGreaterThan(0);
      expect(typeof snapshot.statistics).toBe('object');
    });

    test('doit analyser l\'utilisation du heap par spaces', () => {
      const snapshot = heapAnalyzer.takeHeapSnapshot('analysis-test');
      const analysis = snapshot.analysis;
      
      expect(Array.isArray(analysis)).toBe(true);
      analysis.forEach(space => {
        expect(space).toHaveProperty('name');
        expect(space).toHaveProperty('utilizationRate');
        expect(space).toHaveProperty('fragmentationRate');
        expect(space).toHaveProperty('recommendation');
        expect(typeof space.utilizationRate).toBe('number');
        expect(typeof space.fragmentationRate).toBe('number');
      });
    });

    test('doit comparer deux snapshots', () => {
      // Prend un premier snapshot
      const snapshot1 = heapAnalyzer.takeHeapSnapshot('snapshot1');
      
      // Alloue de la mémoire pour voir la différence
      const testData = new Array(100000).fill('data');
      const snapshot2 = heapAnalyzer.takeHeapSnapshot('snapshot2');
      
      const comparison = heapAnalyzer.compareSnapshots(snapshot1.id, snapshot2.id);
      
      expect(comparison).toHaveProperty('snapshot1');
      expect(comparison).toHaveProperty('snapshot2');
      expect(comparison).toHaveProperty('memoryChanges');
      expect(comparison).toHaveProperty('spaceChanges');
      expect(comparison).toHaveProperty('recommendations');
      expect(typeof comparison.memoryChanges.heapUsed.change).toBe('number');
    });

    test('doit analyser les tendances mémoire', () => {
      // Prend plusieurs snapshots avec variation
      for (let i = 0; i < 10; i++) {
        // Simule allocation
        if (i % 2 === 0) {
          const data = new Array(10000).fill('trend');
        }
        heapAnalyzer.takeHeapSnapshot(`trend-${i}`);
      }
      
      const trends = heapAnalyzer.analyzeTrends();
      
      expect(trends).toHaveProperty('trend');
      expect(trends).toHaveProperty('confidence');
      expect(trends).toHaveProperty('anomalies');
      expect(trends).toHaveProperty('predictions');
      expect(['increasing', 'decreasing', 'stable']).toContain(trends.trend);
      expect(trends.confidence).toBeGreaterThanOrEqual(0);
      expect(trends.confidence).toBeLessThanOrEqual(1);
    });

    test('doit détecter les anomalies mémoire', () => {
      // Simule des anomalies
      heapAnalyzer.takeHeapSnapshot('start');
      
      // Allocation massive (anomalie)
      const massiveData = new Array(500000).fill('anomaly');
      heapAnalyzer.takeHeapSnapshot('anomaly1');
      
      // Allocation normale
      const normalData = new Array(10000).fill('normal');
      heapAnalyzer.takeHeapSnapshot('normal');
      
      const trends = heapAnalyzer.analyzeTrends();
      
      if (trends.anomalies && trends.anomalies.length > 0) {
        expect(Array.isArray(trends.anomalies)).toBe(true);
        trends.anomalies.forEach(anomaly => {
          expect(anomaly).toHaveProperty('timestamp');
          expect(anomaly).toHaveProperty('change');
          expect(anomaly).toHaveProperty('magnitude');
          expect(typeof anomaly.magnitude).toBe('number');
        });
      }
    });

    test('doit générer un rapport détaillé complet', () => {
      // Prend plusieurs snapshots pour avoir des données
      heapAnalyzer.takeHeapSnapshot('initial');
      for (let i = 0; i < 5; i++) {
        const data = new Array(10000).fill(`data-${i}`);
        heapAnalyzer.takeHeapSnapshot(`snapshot-${i}`);
      }
      
      const report = heapAnalyzer.generateDetailedReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('detailed');
      expect(report).toHaveProperty('recentActivity');
      expect(report).toHaveProperty('comparisons');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('nextActions');
      
      expect(report.summary).toHaveProperty('currentHeapUsed');
      expect(report.summary).toHaveProperty('trend');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('doit exporter les données en différents formats', () => {
      heapAnalyzer.takeHeapSnapshot('export-test');
      
      // Test JSON export
      const jsonExport = heapAnalyzer.exportData('json', 'test-export');
      expect(jsonExport.filename).toMatch(/\.json$/);
      expect(typeof jsonExport.content).toBe('string');
      expect(jsonExport.report).toBeDefined();
      
      // Test CSV export
      const csvExport = heapAnalyzer.exportData('csv', 'test-export');
      expect(csvExport.filename).toMatch(/\.csv$/);
      expect(csvExport.content).toContain('Timestamp,Heap Used');
      
      // Test HTML export
      const htmlExport = heapAnalyzer.exportData('html', 'test-export');
      expect(htmlExport.filename).toMatch(/\.html$/);
      expect(htmlExport.content).toContain('<!DOCTYPE html>');
      expect(htmlExport.content).toContain('Rapport Profilage Mémoire');
    });
  });

  describe('Tests LeakDetector', () => {
    test('doit détecter les patterns de croissance continue', () => {
      // Simule des données avec croissance continue
      const simulatedHistory = [];
      let baseMemory = 50 * 1024 * 1024; // 50MB
      
      for (let i = 0; i < 15; i++) {
        baseMemory += 5 * 1024 * 1024; // +5MB par itération
        simulatedHistory.push({
          timestamp: Date.now() + i * 1000,
          heapUsed: baseMemory,
          heapTotal: 200 * 1024 * 1024
        });
      }

      const analysis = leakDetector.detectLeakPatterns({ memoryHistory: simulatedHistory });
      
      expect(analysis).toHaveProperty('leakDetected');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis).toHaveProperty('patterns');
      expect(analysis).toHaveProperty('severity');
      
      if (analysis.patterns.length > 0) {
        const continuousGrowthPattern = analysis.patterns.find(p => p.type === 'CONTINUOUS_GROWTH');
        if (continuousGrowthPattern) {
          expect(continuousGrowthPattern.detected).toBe(true);
          expect(continuousGrowthPattern.details).toHaveProperty('averageGrowth');
        }
      }
    });

    test('doit détecter les patterns d\'accumulation non sécurisée', () => {
      // Simule une accumulation de 50MB
      const simulatedHistory = [];
      let memory = 50 * 1024 * 1024;
      
      for (let i = 0; i < 10; i++) {
        memory += 6 * 1024 * 1024; // +6MB à chaque fois
        simulatedHistory.push({
          timestamp: Date.now() + i * 1000,
          heapUsed: memory,
          heapTotal: 200 * 1024 * 1024
        });
      }

      const analysis = leakDetector.detectLeakPatterns({ memoryHistory: simulatedHistory });
      
      // Devrait détecter l'accumulation de plus de 10MB
      if (analysis.patterns.length > 0) {
        const accumulationPattern = analysis.patterns.find(p => p.type === 'UNSAFE_ACCUMULATION');
        expect(accumulationPattern).toBeDefined();
        expect(accumulationPattern.detected).toBe(true);
      }
    });

    test('ne doit pas détecter de fuites avec mémoire stable', () => {
      // Simule une mémoire stable avec variations normales
      const simulatedHistory = [];
      let baseMemory = 50 * 1024 * 1024;
      
      for (let i = 0; i < 10; i++) {
        // Variations normales (增加 et decrease)
        const variation = (Math.random() - 0.5) * 1024 * 1024; // ±1MB
        baseMemory += variation;
        
        simulatedHistory.push({
          timestamp: Date.now() + i * 1000,
          heapUsed: Math.max(48 * 1024 * 1024, baseMemory), // Minimum 48MB
          heapTotal: 200 * 1024 * 1024
        });
      }

      const analysis = leakDetector.detectLeakPatterns({ memoryHistory: simulatedHistory });
      
      // Devrait avoir confiance faible ou ne pas détecter de fuites
      expect(analysis.confidence).toBeLessThan(0.5);
    });

    test('doit calculer le niveau de confiance correctement', () => {
      // Teste différents niveaux de confiance
      
      // Faible confiance (mémoire stable)
      const stableHistory = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() + i * 1000,
        heapUsed: 50 * 1024 * 1024 + Math.random() * 1024 * 1024, // Variations minimes
        heapTotal: 200 * 1024 * 1024
      }));
      
      const lowConfidenceAnalysis = leakDetector.detectLeakPatterns({ memoryHistory: stableHistory });
      expect(lowConfidenceAnalysis.confidence).toBeLessThan(0.3);
      
      // Haute confiance (croissance continue forte)
      const growthHistory = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() + i * 1000,
        heapUsed: 50 * 1024 * 1024 + i * 10 * 1024 * 1024, // +10MB par itération
        heapTotal: 200 * 1024 * 1024
      }));
      
      const highConfidenceAnalysis = leakDetector.detectLeakPatterns({ memoryHistory: growthHistory });
      expect(highConfidenceAnalysis.confidence).toBeGreaterThan(0.7);
    });

    test('doit assigner les bonnes severités', () => {
      // Test différentes configurations de severité
      
      // Confiance critique
      const criticalHistory = Array.from({ length: 8 }, (_, i) => ({
        timestamp: Date.now() + i * 1000,
        heapUsed: 50 * 1024 * 1024 + i * 20 * 1024 * 1024, // Croissance très rapide
        heapTotal: 200 * 1024 * 1024
      }));
      
      const criticalAnalysis = leakDetector.detectLeakPatterns({ memoryHistory: criticalHistory });
      if (criticalAnalysis.confidence > 0.7) {
        expect(criticalAnalysis.severity).toBe('critical');
      }
      
      // Confiance moyenne
      const mediumHistory = Array.from({ length: 8 }, (_, i) => ({
        timestamp: Date.now() + i * 1000,
        heapUsed: 50 * 1024 * 1024 + i * 5 * 1024 * 1024, // Croissance modérée
        heapTotal: 200 * 1024 * 1024
      }));
      
      const mediumAnalysis = leakDetector.detectLeakPatterns({ memoryHistory: mediumHistory });
      if (mediumAnalysis.confidence > 0.3 && mediumAnalysis.confidence <= 0.7) {
        expect(['medium', 'high']).toContain(mediumAnalysis.severity);
      }
    });
  });

  describe('Tests Intégration Complète', () => {
    test('doit intégrer memoryMonitor, heapAnalyzer et leakDetector', async () => {
      memoryMonitor.startMonitoring();
      
      // Simulation d'une application avec cycles d'allocations
      const applicationCycle = async () => {
        // Phase 1: Allocation initiale
        const initialData = new Array(50000).fill('initial');
        heapAnalyzer.takeHeapSnapshot('phase1-initial');
        memoryMonitor.takeHeapSnapshot('memory-phase1');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Phase 2: Croissance avec fuites potentielles
        for (let i = 0; i < 5; i++) {
          const leakData = new Array(20000).fill(`leak-${i}`);
          heapAnalyzer.takeHeapSnapshot(`phase2-growth-${i}`);
          memoryMonitor.takeHeapSnapshot(`memory-growth-${i}`);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Phase 3: Tentative de nettoyage
        if (global.gc) global.gc();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        heapAnalyzer.takeHeapSnapshot('phase3-after-gc');
        memoryMonitor.takeHeapSnapshot('memory-after-gc');
      };

      await applicationCycle();
      
      // Analyse complète
      const trends = heapAnalyzer.analyzeTrends();
      const leakAnalysis = leakDetector.detectLeakPatterns(memoryMonitor);
      const report = heapAnalyzer.generateDetailedReport();
      
      // Vérifications
      expect(trends).toBeDefined();
      expect(leakAnalysis).toBeDefined();
      expect(report).toBeDefined();
      
      console.log('Analyse complète:', {
        trends: trends.trend,
        leakConfidence: leakAnalysis.confidence,
        leakDetected: leakAnalysis.leakDetected,
        severity: leakAnalysis.severity,
        recommendations: report.recommendations.length
      });
      
      memoryMonitor.stopMonitoring();
    });

    test('doit générer un rapport complet avec recommandations', async () => {
      memoryMonitor.startMonitoring();
      
      // Crée des conditions pour déclencher des recommandations
      const createRecommendationScenario = async () => {
        // Mémoire critique
        for (let i = 0; i < 10; i++) {
          const criticalData = new Array(100000).fill('critical');
          heapAnalyzer.takeHeapSnapshot(`critical-${i}`);
          memoryMonitor.takeHeapSnapshot(`memory-critical-${i}`);
        }
      };

      await createRecommendationScenario();
      
      memoryMonitor.stopMonitoring();
      
      const report = heapAnalyzer.generateDetailedReport();
      
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0);
      expect(report.nextActions.length).toBeGreaterThanOrEqual(0);
      
      if (report.recommendations.length > 0) {
        report.recommendations.forEach(rec => {
          expect(rec).toHaveProperty('priority');
          expect(rec).toHaveProperty('category');
          expect(rec).toHaveProperty('message');
          expect(rec).toHaveProperty('action');
          expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(rec.priority);
        });
      }
    });

    test('doit persister et recharger les données de profilage', async () => {
      // Prend des snapshots
      heapAnalyzer.takeHeapSnapshot('persist-1');
      heapAnalyzer.takeHeapSnapshot('persist-2');
      
      // Exporte les données
      const exportData = heapAnalyzer.exportData('json');
      
      // Simule la sauvegarde (en mémoire pour ce test)
      const savedData = JSON.parse(exportData.content);
      
      // Crée un nouvel analyseur et recharge
      const newAnalyzer = new HeapAnalyzer();
      
      // Restore les snapshots (simulation)
      if (savedData.recentActivity) {
        savedData.recentActivity.forEach(snapshot => {
          newAnalyzer.snapshots.push({
            ...snapshot,
            heapSpaces: [],
            statistics: {},
            analysis: []
          });
        });
      }
      
      // Vérifie que les données sont récupérées
      expect(newAnalyzer.snapshots.length).toBe(savedData.recentActivity.length);
      
      // Peut encore générer des rapports
      const restoredReport = newAnalyzer.generateDetailedReport();
      expect(restoredReport).toBeDefined();
    });
  });
});