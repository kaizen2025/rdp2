/**
 * Setup global pour les tests de performance UI
 * Configure l'environnement de test et les métriques globales
 */

const { PerformanceProfiler } = require('./utils/performance-utils');
const { testFixtures } = require('./fixtures/test-fixtures');
const fs = require('fs');
const path = require('path');

// Profiler global pour tous les tests
global.performanceProfiler = new PerformanceProfiler();

// Répertoire pour les résultats
const resultsDir = path.join(__dirname, 'results');

// Créer le répertoire de résultats s'il n'existe pas
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Configuration globale des timeouts
jest.setTimeout(30000);

// Configuration des reporters personnalisés
const customReporters = [
  'default',
  ['jest-html-reporters', {
    publicPath: resultsDir,
    filename: 'ui-reactivity-performance-report.html',
    expand: true,
    inlineAssets: true,
    pageTitle: 'Rapport de Performance UI Réactivité',
    hideIcon: true,
    logoImgPath: '',
    customInfos: [
      {
        title: 'Tests de Performance UI',
        content: 'Tests de réactivité de l\'interface utilisateur sous charge'
      }
    ]
  }]
];

// Configuration des métriques globales
const globalMetrics = {
  testSuite: 'UI Réactivité Performance',
  environment: process.env.NODE_ENV || 'test',
  nodeVersion: process.version,
  platform: process.platform,
  startTime: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  performanceBenchmarks: {},
  memoryUsage: {},
  timingMetrics: {}
};

// Fonction pour collecter les métriques de performance
function collectPerformanceMetrics() {
  const memUsage = process.memoryUsage();
  
  return {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
    arrayBuffers: memUsage.arrayBuffers || 0,
    heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
    heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2)
  };
}

// Hook avant chaque test
beforeEach(() => {
  // Démarrer le profiler pour ce test
  const testName = expect.getState().currentTestName || 'unknown';
  global.performanceProfiler.start(`test_${testName}`);
  
  // Réinitialiser les mocks WebSocket
  jest.clearAllMocks();
  
  // Réinitialiser les timers
  jest.useFakeTimers();
});

// Hook après chaque test
afterEach(() => {
  const testName = expect.getState().currentTestName || 'unknown';
  
  try {
    global.performanceProfiler.end(`test_${testName}`);
  } catch (error) {
    console.warn(`Could not end performance measurement for test: ${testName}`);
  }
  
  // Restaurer les timers
  jest.useRealTimers();
  
  // Nettoyer les intervals et timeouts
  jest.clearAllTimers();
});

// Hook avant tous les tests
beforeAll(() => {
  console.log('🚀 Initialisation de la suite de tests de performance UI...');
  
  // Collecter les métriques initiales
  globalMetrics.initialMemory = collectPerformanceMetrics();
  
  // Préparer les fixtures de test
  testFixtures.preloadData();
  
  // Configurer les handlers d'erreurs non capturées
  const originalErrorHandler = process.listeners('uncaughtException').pop();
  process.removeAllListeners('uncaughtException');
  
  process.on('uncaughtException', (error) => {
    console.error('Erreur non capturée dans les tests:', error);
    globalMetrics.uncaughtErrors = (globalMetrics.uncaughtErrors || 0) + 1;
    globalMetrics.lastError = error.message;
    
    // Restaurer le handler original et le relancer
    process.listeners('uncaughtException').forEach(listener => {
      process.removeListener('uncaughtException', listener);
    });
    if (originalErrorHandler) {
      process.on('uncaughtException', originalErrorHandler);
    }
    throw error;
  });
  
  // Configurer les handlers de promesses rejetées
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesse rejetée non gérée:', reason);
    globalMetrics.unhandledRejections = (globalMetrics.unhandledRejections || 0) + 1;
    globalMetrics.lastRejection = reason;
  });
  
  console.log('✅ Suite de tests initialisée');
});

// Hook après tous les tests
afterAll(async () => {
  console.log('📊 Finalisation de la suite de tests...');
  
  // Collecter les métriques finales
  globalMetrics.finalMemory = collectPerformanceMetrics();
  globalMetrics.endTime = new Date().toISOString();
  
  // Calculer la mémoire utilisée pendant les tests
  globalMetrics.memoryIncrease = 
    globalMetrics.finalMemory.heapUsed - globalMetrics.initialMemory.heapUsed;
  
  // Exporter les métriques de performance globales
  const globalPerformanceData = global.performanceProfiler.export();
  
  // Générer le rapport global
  await generateGlobalReport({
    ...globalMetrics,
    performanceData: globalPerformanceData,
    fixtureStats: {
      listItems: testFixtures.getDataStats('list', 'dashboard'),
      notifications: testFixtures.getDataStats('notifications', 'dashboard'),
      menus: testFixtures.getDataStats('menu', 'dashboard')
    }
  });
  
  // Nettoyer
  testFixtures.clearCache();
  
  console.log('✅ Suite de tests finalisée');
});

// Fonction pour générer le rapport global
async function generateGlobalReport(metrics) {
  const reportPath = path.join(resultsDir, `global-performance-report-${Date.now()}.json`);
  const htmlPath = path.join(resultsDir, `global-performance-report-${Date.now()}.html`);
  
  const report = {
    ...metrics,
    summary: {
      totalTests: metrics.totalTests || 0,
      passedTests: metrics.passedTests || 0,
      failedTests: metrics.failedTests || 0,
      passRate: metrics.totalTests > 0 
        ? ((metrics.passedTests / metrics.totalTests) * 100).toFixed(1) + '%'
        : '0%',
      testDuration: new Date(metrics.endTime) - new Date(metrics.startTime),
      averageMemoryUsage: (metrics.memoryIncrease / 1024 / 1024).toFixed(2) + ' MB'
    },
    performance: {
      overallScore: calculateOverallScore(metrics.performanceData),
      benchmarks: metrics.performanceData,
      recommendations: generateRecommendations(metrics.performanceData)
    }
  };
  
  // Sauvegarder le rapport JSON
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Générer le rapport HTML
  const htmlReport = generateHTMLReport(report);
  fs.writeFileSync(htmlPath, htmlReport);
  
  console.log(`📊 Rapports générés:`);
  console.log(`   JSON: ${reportPath}`);
  console.log(`   HTML: ${htmlPath}`);
}

// Fonction pour calculer un score global de performance
function calculateOverallScore(performanceData) {
  const weights = {
    renderTime: 0.3,
    interactionTime: 0.3,
    memoryUsage: 0.2,
    errorRate: 0.2
  };
  
  let score = 0;
  let totalWeight = 0;
  
  for (const [test, data] of Object.entries(performanceData)) {
    if (data && data.average) {
      let testScore = 100;
      
      // Pénaliser les temps de réponse élevés
      if (data.average > 100) testScore -= 50;
      else if (data.average > 50) testScore -= 25;
      else if (data.average > 20) testScore -= 10;
      
      // Ajouter des pénalités pour les temps max élevés
      if (data.max > 500) testScore -= 20;
      else if (data.max > 200) testScore -= 10;
      
      score += testScore * weights.renderTime;
      totalWeight += weights.renderTime;
    }
  }
  
  return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
}

// Fonction pour générer des recommandations
function generateRecommendations(performanceData) {
  const recommendations = [];
  
  for (const [test, data] of Object.entries(performanceData)) {
    if (data && data.average > 50) {
      recommendations.push({
        test,
        issue: `Temps de réponse élevé (${data.average.toFixed(2)}ms)`,
        recommendation: getRecommendationForTest(test, data.average),
        severity: data.average > 200 ? 'high' : data.average > 100 ? 'medium' : 'low'
      });
    }
    
    if (data && data.p95 > data.average * 3) {
      recommendations.push({
        test,
        issue: `Grande variabilité (P95: ${data.p95.toFixed(2)}ms vs Moyenne: ${data.average.toFixed(2)}ms)`,
        recommendation: 'Optimiser la consistence des performances - vérifier la gestion des états',
        severity: 'medium'
      });
    }
  }
  
  return recommendations;
}

// Fonction pour obtenir des recommandations spécifiques par test
function getRecommendationForTest(test, averageTime) {
  if (test.includes('render')) {
    return 'Considérer l\'utilisation de React.memo, useMemo, et la virtualisation pour optimiser le rendu';
  } else if (test.includes('click')) {
    return 'Optimiser les gestionnaires d\'événements et éviter les calculs lourds dans les callbacks';
  } else if (test.includes('filter')) {
    return 'Implémenter la memoization des résultats de filtrage et ajouter du debouncing';
  } else if (test.includes('menu')) {
    return 'Virtualiser les grandes listes de menu et optimiser la recherche';
  } else {
    return 'Analyser les goulots d\'étranglement avec les outils de profiling React';
  }
}

// Fonction pour générer le rapport HTML
function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Global de Performance UI</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .score-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .score-value { font-size: 48px; font-weight: bold; }
        .recommendations { margin-top: 30px; }
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendation.high { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .recommendation.medium { background-color: #fff3cd; border-left: 4px solid #ffc107; }
        .recommendation.low { background-color: #d1ecf1; border-left: 4px solid #17a2b8; }
        .performance-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .performance-table th, .performance-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .performance-table th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Rapport Global de Performance UI</h1>
            <p>Généré le ${new Date(report.summary.endTime || Date.now()).toLocaleString('fr-FR')}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card score-card">
                <div class="metric-title">Score Global de Performance</div>
                <div class="score-value">${report.performance.overallScore || 0}/100</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Tests Totaux</div>
                <div class="metric-value">${report.summary.totalTests || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Taux de Réussite</div>
                <div class="metric-value">${report.summary.passRate || '0%'}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Utilisation Mémoire</div>
                <div class="metric-value">${report.summary.averageMemoryUsage || '0 MB'}</div>
            </div>
        </div>
        
        ${report.performance.recommendations && report.performance.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>💡 Recommandations d'Amélioration</h2>
            ${report.performance.recommendations.map(rec => `
                <div class="recommendation ${rec.severity}">
                    <h4>${rec.test}</h4>
                    <p><strong>Problème:</strong> ${rec.issue}</p>
                    <p><strong>Recommandation:</strong> ${rec.recommendation}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding: 20px; background: #e9ecef; border-radius: 8px;">
            <h3>📈 Métriques d'Environnement</h3>
            <p><strong>Environnement:</strong> ${report.environment}</p>
            <p><strong>Version Node.js:</strong> ${report.nodeVersion}</p>
            <p><strong>Plateforme:</strong> ${report.platform}</p>
            <p><strong>Durée des Tests:</strong> ${(report.summary.testDuration / 1000).toFixed(1)}s</p>
        </div>
    </div>
</body>
</html>`;
}

// Export des configurations
module.exports = {
  globalMetrics,
  resultsDir,
  customReporters,
  collectPerformanceMetrics,
  generateGlobalReport
};