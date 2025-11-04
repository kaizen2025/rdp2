/**
 * Teardown global pour les tests de performance UI
 * Nettoie l'environnement et génère le rapport final
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const { resultsDir, generateGlobalReport } = require('./globalSetup');

/**
 * Fonction principale de teardown
 */
async function globalTeardown() {
  console.log('🧹 Nettoyage de l\'environnement de test...');
  
  const startTime = performance.now();
  
  try {
    // 1. Nettoyer les ressources temporaires
    await cleanupTemporaryResources();
    
    // 2. Sauvegarder les métriques finales
    await saveFinalMetrics();
    
    // 3. Générer le rapport de synthèse
    await generateFinalSummaryReport();
    
    // 4. Vérifier l'intégrité des résultats
    await validateResults();
    
    const endTime = performance.now();
    const cleanupTime = endTime - startTime;
    
    console.log(`✅ Nettoyage terminé en ${cleanupTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    
    // Sauvegarder l'erreur de nettoyage
    const errorLog = {
      timestamp: new Date().toISOString(),
      phase: 'global-teardown',
      error: error.message,
      stack: error.stack
    };
    
    const errorLogPath = path.join(resultsDir, `cleanup-error-${Date.now()}.json`);
    fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
    
    throw error;
  }
}

/**
 * Nettoie les ressources temporaires
 */
async function cleanupTemporaryResources() {
  console.log('🗑️  Suppression des ressources temporaires...');
  
  // Nettoyer les fichiers temporaires dans le répertoire results
  const tempFiles = fs.readdirSync(resultsDir)
    .filter(file => file.startsWith('temp-') || file.includes('.tmp'))
    .map(file => path.join(resultsDir, file));
  
  tempFiles.forEach(file => {
    try {
      fs.unlinkSync(file);
      console.log(`🗑️  Supprimé: ${file}`);
    } catch (error) {
      console.warn(`⚠️  Impossible de supprimer ${file}:`, error.message);
    }
  });
  
  // Nettoyer les anciens rapports (garder seulement les 10 derniers)
  const reportFiles = fs.readdirSync(resultsDir)
    .filter(file => file.includes('-report-'))
    .map(file => ({
      path: path.join(resultsDir, file),
      time: fs.statSync(path.join(resultsDir, file)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  // Garder seulement les 10 rapports les plus récents
  if (reportFiles.length > 10) {
    const filesToDelete = reportFiles.slice(10);
    filesToDelete.forEach(file => {
      try {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Ancien rapport supprimé: ${path.basename(file.path)}`);
      } catch (error) {
        console.warn(`⚠️  Impossible de supprimer ${file.path}:`, error.message);
      }
    });
  }
}

/**
 * Sauvegarde les métriques finales
 */
async function saveFinalMetrics() {
  console.log('💾 Sauvegarde des métriques finales...');
  
  const finalMetrics = {
    timestamp: new Date().toISOString(),
    processInfo: {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
  
  const metricsPath = path.join(resultsDir, `final-metrics-${Date.now()}.json`);
  fs.writeFileSync(metricsPath, JSON.stringify(finalMetrics, null, 2));
  
  console.log(`📊 Métriques sauvegardées: ${metricsPath}`);
}

/**
 * Génère un rapport de synthèse
 */
async function generateFinalSummaryReport() {
  console.log('📋 Génération du rapport de synthèse...');
  
  try {
    // Collecter tous les rapports générés
    const reportFiles = fs.readdirSync(resultsDir)
      .filter(file => file.includes('-report-') && file.endsWith('.json'))
      .map(file => ({
        path: path.join(resultsDir, file),
        data: JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'))
      }));
    
    if (reportFiles.length === 0) {
      console.log('ℹ️  Aucun rapport trouvé à synthétiser');
      return;
    }
    
    // Calculer les statistiques globales
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let totalDuration = 0;
    const allPerformanceData = {};
    
    reportFiles.forEach(report => {
      totalTests += report.data.totalTests || 0;
      passedTests += report.data.passedTests || 0;
      failedTests += report.data.failedTests || 0;
      
      if (report.data.duration) {
        totalDuration += report.data.duration;
      }
      
      // Fusionner les données de performance
      if (report.data.performanceData) {
        Object.assign(allPerformanceData, report.data.performanceData);
      }
    });
    
    // Générer le rapport de synthèse
    const summaryReport = {
      generatedAt: new Date().toISOString(),
      testSuites: reportFiles.length,
      overallStats: {
        totalTests,
        passedTests,
        failedTests,
        passRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) + '%' : '0%',
        averageDuration: reportFiles.length > 0 ? (totalDuration / reportFiles.length).toFixed(2) + 'ms' : '0ms'
      },
      performanceSummary: {
        totalBenchmarks: Object.keys(allPerformanceData).length,
        averageResponseTime: calculateAverageResponseTime(allPerformanceData),
        slowestTest: findSlowestTest(allPerformanceData),
        fastestTest: findFastestTest(allPerformanceData)
      },
      recommendations: generateGlobalRecommendations(allPerformanceData),
      reportsIncluded: reportFiles.map(r => path.basename(r.path)),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: require('os').cpus().length,
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem()
      }
    };
    
    const summaryPath = path.join(resultsDir, `summary-report-${Date.now()}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
    
    // Générer également un rapport HTML de synthèse
    await generateSummaryHTMLReport(summaryReport, summaryPath.replace('.json', '.html'));
    
    console.log(`📋 Rapport de synthèse généré: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du rapport de synthèse:', error);
    throw error;
  }
}

/**
 * Valide l'intégrité des résultats
 */
async function validateResults() {
  console.log('🔍 Validation de l\'intégrité des résultats...');
  
  const validationResults = {
    timestamp: new Date().toISOString(),
    checks: [],
    errors: [],
    warnings: []
  };
  
  try {
    // Vérifier que les répertoires existent
    const dirsToCheck = [
      resultsDir,
      path.join(__dirname, '../fixtures'),
      path.join(__dirname, '../utils')
    ];
    
    dirsToCheck.forEach(dir => {
      if (fs.existsSync(dir)) {
        validationResults.checks.push({
          type: 'directory-existence',
          path: dir,
          status: 'ok'
        });
      } else {
        validationResults.errors.push({
          type: 'missing-directory',
          path: dir,
          message: `Le répertoire ${dir} n'existe pas`
        });
      }
    });
    
    // Vérifier les fichiers de configuration
    const configFiles = [
      path.join(__dirname, '../config/performance-config.js'),
      path.join(__dirname, '../config/jest-ui.config.js')
    ];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        validationResults.checks.push({
          type: 'config-file',
          path: file,
          status: 'ok'
        });
      } else {
        validationResults.warnings.push({
          type: 'missing-config',
          path: file,
          message: `Fichier de configuration manquant: ${file}`
        });
      }
    });
    
    // Vérifier l'espace disque disponible
    try {
      const stats = fs.statSync(resultsDir);
      const freeSpaceCheck = {
        type: 'disk-space',
        status: 'ok',
        freeSpace: 'sufficient'
      };
      
      // Estimation basique de l'espace libre (approximative)
      const availableReports = fs.readdirSync(resultsDir).length;
      if (availableReports > 100) {
        freeSpaceCheck.freeSpace = 'low';
        validationResults.warnings.push({
          type: 'many-reports',
          message: `${availableReports} rapports générés, vérifiez l'espace disque`
        });
      }
      
      validationResults.checks.push(freeSpaceCheck);
    } catch (error) {
      validationResults.warnings.push({
        type: 'disk-space-check-failed',
        message: 'Impossible de vérifier l\'espace disque: ' + error.message
      });
    }
    
    // Sauvegarder les résultats de validation
    const validationPath = path.join(resultsDir, `validation-results-${Date.now()}.json`);
    fs.writeFileSync(validationPath, JSON.stringify(validationResults, null, 2));
    
    console.log(`✅ Validation terminée: ${validationResults.checks.length} vérifications, ${validationResults.errors.length} erreurs, ${validationResults.warnings.length} avertissements`);
    
  } catch (error) {
    validationResults.errors.push({
      type: 'validation-error',
      message: 'Erreur lors de la validation: ' + error.message
    });
    
    const errorPath = path.join(resultsDir, `validation-error-${Date.now()}.json`);
    fs.writeFileSync(errorPath, JSON.stringify(validationResults, null, 2));
    
    console.error('❌ Erreur lors de la validation:', error);
  }
}

/**
 * Fonctions utilitaires pour le rapport de synthèse
 */
function calculateAverageResponseTime(performanceData) {
  const allTimes = [];
  
  for (const [test, data] of Object.entries(performanceData)) {
    if (data && data.all && Array.isArray(data.all)) {
      allTimes.push(...data.all);
    }
  }
  
  return allTimes.length > 0 
    ? (allTimes.reduce((a, b) => a + b, 0) / allTimes.length).toFixed(2)
    : '0';
}

function findSlowestTest(performanceData) {
  let slowestTest = null;
  let slowestTime = 0;
  
  for (const [test, data] of Object.entries(performanceData)) {
    if (data && data.max > slowestTime) {
      slowestTime = data.max;
      slowestTest = test;
    }
  }
  
  return slowestTest ? { test: slowestTest, time: slowestTime.toFixed(2) } : null;
}

function findFastestTest(performanceData) {
  let fastestTest = null;
  let fastestTime = Infinity;
  
  for (const [test, data] of Object.entries(performanceData)) {
    if (data && data.min < fastestTime) {
      fastestTime = data.min;
      fastestTest = test;
    }
  }
  
  return fastestTest ? { test: fastestTest, time: fastestTime.toFixed(2) } : null;
}

function generateGlobalRecommendations(performanceData) {
  const recommendations = [];
  
  for (const [test, data] of Object.entries(performanceData)) {
    if (data && data.average > 100) {
      recommendations.push({
        test,
        severity: data.average > 500 ? 'high' : data.average > 200 ? 'medium' : 'low',
        issue: `Temps de réponse élevé (moyenne: ${data.average.toFixed(2)}ms)`,
        suggestion: getOptimizationSuggestion(test)
      });
    }
  }
  
  return recommendations;
}

function getOptimizationSuggestion(testName) {
  if (testName.includes('render')) {
    return 'Utiliser React.memo, useMemo, et implémenter la virtualisation';
  } else if (testName.includes('click')) {
    return 'Optimiser les gestionnaires d\'événements et éviter les calculs lourds';
  } else if (testName.includes('filter')) {
    return 'Ajouter du debouncing et de la memoization pour le filtrage';
  } else {
    return 'Analyser avec React DevTools et optimiser les re-renders';
  }
}

/**
 * Génère un rapport HTML de synthèse
 */
async function generateSummaryHTMLReport(report, outputPath) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Synthèse des Tests de Performance UI</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .header { text-align: center; margin-bottom: 40px; }
        .title { color: #2c3e50; margin-bottom: 10px; }
        .subtitle { color: #7f8c8d; font-size: 16px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .stat-card.success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .stat-card.warning { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .stat-card.info { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
        .stat-number { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 14px; opacity: 0.9; }
        .section { margin: 30px 0; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 8px; }
        .recommendation.high { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); border-left: 4px solid #e74c3c; }
        .recommendation.medium { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-left: 4px solid #f39c12; }
        .recommendation.low { background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); border-left: 4px solid #3498db; }
        .environment-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">📊 Synthèse des Tests de Performance UI</h1>
            <p class="subtitle">Rapport généré le ${new Date(report.generatedAt).toLocaleString('fr-FR')}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card success">
                <div class="stat-number">${report.overallStats.totalTests}</div>
                <div class="stat-label">Tests Exécutés</div>
            </div>
            <div class="stat-card info">
                <div class="stat-number">${report.overallStats.passRate}</div>
                <div class="stat-label">Taux de Réussite</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.overallStats.averageDuration}</div>
                <div class="stat-label">Durée Moyenne</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-number">${report.performanceSummary.totalBenchmarks}</div>
                <div class="stat-label">Benchmarks</div>
            </div>
        </div>
        
        ${report.performanceSummary.fastestTest ? `
        <div class="section">
            <h2>⚡ Performances</h2>
            <p><strong>Test le plus rapide:</strong> ${report.performanceSummary.fastestTest.test} (${report.performanceSummary.fastestTest.time}ms)</p>
            ${report.performanceSummary.slowestTest ? `
            <p><strong>Test le plus lent:</strong> ${report.performanceSummary.slowestTest.test} (${report.performanceSummary.slowestTest.time}ms)</p>
            ` : ''}
            <p><strong>Temps de réponse moyen:</strong> ${report.performanceSummary.averageResponseTime}ms</p>
        </div>
        ` : ''}
        
        ${report.recommendations && report.recommendations.length > 0 ? `
        <div class="section">
            <h2>💡 Recommandations d'Optimisation</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation ${rec.severity}">
                    <h4>${rec.test}</h4>
                    <p><strong>Problème:</strong> ${rec.issue}</p>
                    <p><strong>Suggestion:</strong> ${rec.suggestion}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="environment-info">
            <h3>🖥️ Environnement de Test</h3>
            <p><strong>Node.js:</strong> ${report.environment.nodeVersion}</p>
            <p><strong>Plateforme:</strong> ${report.environment.platform} (${report.environment.arch})</p>
            <p><strong>Processeurs:</strong> ${report.environment.cpus}</p>
            <p><strong>Mémoire totale:</strong> ${(report.environment.totalMemory / 1024 / 1024 / 1024).toFixed(1)} GB</p>
            <p><strong>Suites de tests:</strong> ${report.testSuites}</p>
        </div>
        
        <div class="footer">
            <p>Tests de Performance UI - Réactivité sous Charge</p>
            <p>Rapports détaillés disponibles dans le répertoire results/</p>
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(outputPath, html);
}

// Export de la fonction de teardown
module.exports = globalTeardown;