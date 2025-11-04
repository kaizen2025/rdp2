/**
 * Reporter personnalisé pour les tests de mémoire
 * Génère des rapports détaillés sur les performances mémoire
 */

class MemoryTestReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.testResults = [];
    this.memorySnapshots = [];
    this.startTime = Date.now();
  }

  onRunStart(results, options) {
    this.startTime = Date.now();
    console.log('🧪 Démarrage des tests de mémoire...');
    console.log(`📊 Configuration: ${results.numTotalTests} tests planifiés`);
  }

  onTestStart(test, aggregatedResult, serializableOptions) {
    // Prend un snapshot mémoire avant chaque test
    const memoryBefore = process.memoryUsage();
    this.memorySnapshots.push({
      testName: test.title,
      timestamp: Date.now(),
      memoryBefore,
      phase: 'start'
    });
  }

  onTestResult(test, testResult, aggregatedResult, serializableOptions) {
    // Snapshot mémoire après chaque test
    const memoryAfter = process.memoryUsage();
    this.memorySnapshots.push({
      testName: test.title,
      timestamp: Date.now(),
      memoryAfter,
      phase: 'end',
      memoryDiff: {
        heapUsed: memoryAfter.heapUsed - this.memorySnapshots[this.memorySnapshots.length - 1].memoryBefore.heapUsed,
        heapTotal: memoryAfter.heapTotal - this.memorySnapshots[this.memorySnapshots.length - 1].memoryBefore.heapTotal,
        rss: memoryAfter.rss - this.memorySnapshots[this.memorySnapshots.length - 1].memoryBefore.rss
      },
      success: testResult.numPassingTests > 0 && testResult.numFailingTests === 0,
      duration: testResult.duration
    });

    this.testResults.push({
      name: test.title,
      status: testResult.numFailingTests === 0 ? 'PASSED' : 'FAILED',
      duration: testResult.duration,
      memoryImpact: memoryAfter.heapUsed - this.memorySnapshots[this.memorySnapshots.length - 1].memoryBefore.heapUsed,
      assertions: testResult.numPassingTests + testResult.numFailingTests,
      errors: testResult.failureMessages
    });
  }

  onRunComplete(contexts, results, aggregatedResult) {
    const totalTime = Date.now() - this.startTime;
    const finalMemory = process.memoryUsage();

    // Génère le rapport
    const report = this.generateReport(results, totalTime, finalMemory);

    // Sauvegarde le rapport
    this.saveReport(report);

    // Affiche un résumé
    this.printSummary(report);
  }

  generateReport(results, totalTime, finalMemory) {
    const passedTests = results.numPassedTests;
    const failedTests = results.numFailedTests;
    const skippedTests = results.numPendingTests;

    // Calcule les statistiques mémoire
    const memoryStats = this.calculateMemoryStats();
    const testCategories = this.categorizeTests();

    return {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: totalTime,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      summary: {
        totalTests: results.numTotalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        passRate: (passedTests / results.numTotalTests * 100).toFixed(2) + '%',
        duration: totalTime + 'ms'
      },
      memory: {
        final: {
          heapUsed: finalMemory.heapUsed / 1024 / 1024,
          heapTotal: finalMemory.heapTotal / 1024 / 1024,
          rss: finalMemory.rss / 1024 / 1024,
          external: finalMemory.external / 1024 / 1024
        },
        statistics: memoryStats,
        trends: this.analyzeMemoryTrends()
      },
      tests: {
        byCategory: testCategories,
        details: this.testResults,
        highMemoryTests: this.findHighMemoryTests()
      },
      recommendations: this.generateRecommendations()
    };
  }

  calculateMemoryStats() {
    if (this.memorySnapshots.length < 2) return null;

    const memoryChanges = this.memorySnapshots
      .filter(s => s.phase === 'end' && s.memoryDiff)
      .map(s => s.memoryDiff);

    const heapUsedChanges = memoryChanges.map(m => m.heapUsed);
    const rssChanges = memoryChanges.map(m => m.rss);

    return {
      totalHeapImpact: heapUsedChanges.reduce((sum, change) => sum + change, 0),
      averageHeapImpact: heapUsedChanges.reduce((sum, change) => sum + change, 0) / heapUsedChanges.length,
      maxHeapIncrease: Math.max(...heapUsedChanges),
      maxHeapDecrease: Math.min(...heapUsedChanges),
      totalRssImpact: rssChanges.reduce((sum, change) => sum + change, 0),
      averageRssImpact: rssChanges.reduce((sum, change) => sum + change, 0) / rssChanges.length,
      testsWithMemoryIncrease: memoryChanges.filter(m => m.heapUsed > 0).length,
      testsWithMemoryDecrease: memoryChanges.filter(m => m.heapUsed < 0).length
    };
  }

  categorizeTests() {
    const categories = {
      'Node.js/Electron Heap': [],
      'React Components': [],
      'WebSocket': [],
      'GED Operations': [],
      'Electron Window Cleanup': [],
      'Detailed Profiling': []
    };

    this.testResults.forEach(test => {
      if (test.name.includes('Node.js') || test.name.includes('Electron') || test.name.includes('Heap')) {
        categories['Node.js/Electron Heap'].push(test);
      } else if (test.name.includes('React') || test.name.includes('Component')) {
        categories['React Components'].push(test);
      } else if (test.name.includes('WebSocket')) {
        categories['WebSocket'].push(test);
      } else if (test.name.includes('GED')) {
        categories['GED Operations'].push(test);
      } else if (test.name.includes('Electron') && test.name.includes('Window')) {
        categories['Electron Window Cleanup'].push(test);
      } else if (test.name.includes('Profilage') || test.name.includes('Profiling')) {
        categories['Detailed Profiling'].push(test);
      }
    });

    return Object.entries(categories).map(([category, tests]) => ({
      name: category,
      count: tests.length,
      passed: tests.filter(t => t.status === 'PASSED').length,
      failed: tests.filter(t => t.status === 'FAILED').length,
      averageMemoryImpact: tests.reduce((sum, t) => sum + t.memoryImpact, 0) / tests.length
    }));
  }

  analyzeMemoryTrends() {
    const testResults = this.testResults.filter(t => t.memoryImpact !== undefined);
    
    if (testResults.length < 3) return { message: 'Données insuffisantes pour analyser les tendances' };

    const sortedResults = testResults.sort((a, b) => a.name.localeCompare(b.name));
    const memoryImpacts = sortedResults.map(t => t.memoryImpact);

    const trend = {
      direction: 'stable',
      confidence: 0,
      description: ''
    };

    // Analyse simple de tendance
    const startImpacts = memoryImpacts.slice(0, Math.floor(memoryImpacts.length / 3));
    const endImpacts = memoryImpacts.slice(-Math.floor(memoryImpacts.length / 3));
    
    const startAvg = startImpacts.reduce((sum, i) => sum + i, 0) / startImpacts.length;
    const endAvg = endImpacts.reduce((sum, i) => sum + i, 0) / endImpacts.length;
    
    const change = endAvg - startAvg;
    const changePercentage = (change / Math.abs(startAvg)) * 100;

    if (Math.abs(changePercentage) > 20) {
      trend.direction = change > 0 ? 'increasing' : 'decreasing';
      trend.confidence = Math.min(Math.abs(changePercentage) / 100, 1);
      trend.description = `Tendance ${trend.direction} avec confiance de ${(trend.confidence * 100).toFixed(1)}%`;
    } else {
      trend.description = 'Mémoire stable à travers les tests';
    }

    return trend;
  }

  findHighMemoryTests(threshold = 10 * 1024 * 1024) { // 10MB
    return this.testResults
      .filter(test => test.memoryImpact > threshold)
      .map(test => ({
        name: test.name,
        memoryImpact: test.memoryImpact / 1024 / 1024,
        status: test.status
      }));
  }

  generateRecommendations() {
    const recommendations = [];
    const stats = this.calculateMemoryStats();

    if (!stats) return recommendations;

    // Recommandations basées sur l'impact mémoire total
    if (stats.totalHeapImpact > 50 * 1024 * 1024) { // 50MB
      recommendations.push({
        priority: 'HIGH',
        category: 'MEMORY_PRESSURE',
        message: 'Impact mémoire total important détecté',
        action: 'Analyser les tests avec forte allocation mémoire',
        impact: 'Tests potentiels de fuite mémoire'
      });
    }

    // Recommandations basées sur les tests à forte consommation
    const highMemoryTests = this.findHighMemoryTests();
    if (highMemoryTests.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'MEMORY_ALLOCATION',
        message: `${highMemoryTests.length} tests avec forte allocation mémoire`,
        action: 'Optimiser ou investiguer ces tests spécifiques',
        tests: highMemoryTests.map(t => t.name)
      });
    }

    // Recommandations basées sur les tendances
    const trends = this.analyzeMemoryTrends();
    if (trends.direction === 'increasing') {
      recommendations.push({
        priority: 'HIGH',
        category: 'MEMORY_TREND',
        message: 'Tendance croissante de l\'utilisation mémoire',
        action: 'Vérifier les patterns d\'allocation et les fuites potentielles',
        confidence: trends.confidence
      });
    }

    return recommendations;
  }

  saveReport(report) {
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = this.options.outputDirectory || './reports';
    const outputFile = this.options.outputFile || 'memory-test-results.json';
    const outputPath = path.join(outputDir, outputFile);
    
    // Crée le dossier s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📊 Rapport sauvegardé: ${outputPath}`);
  }

  printSummary(report) {
    console.log('\n📋 === RÉSUMÉ DES TESTS DE MÉMOIRE ===');
    console.log(`✅ Tests réussis: ${report.summary.passed}/${report.summary.totalTests}`);
    console.log(`❌ Tests échoués: ${report.summary.failed}`);
    console.log(`⏱️  Durée totale: ${report.summary.duration}`);
    
    if (report.memory.statistics) {
      const mem = report.memory.statistics;
      console.log('\n📊 IMPACT MÉMOIRE:');
      console.log(`🔸 Impact heap total: ${(mem.totalHeapImpact / 1024 / 1024).toFixed(2)}MB`);
      console.log(`🔸 Impact heap moyen: ${(mem.averageHeapImpact / 1024 / 1024).toFixed(2)}MB`);
      console.log(`🔸 Plus forte augmentation: ${(mem.maxHeapIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`🔸 Tests avec augmentation mémoire: ${mem.testsWithMemoryIncrease}`);
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n⚠️  RECOMMANDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`   ${rec.priority}: ${rec.message}`);
      });
    }
    
    console.log('\n📈 TENDANCE MÉMOIRE:', report.memory.trends.description);
    console.log('===========================================\n');
  }
}

module.exports = MemoryTestReporter;