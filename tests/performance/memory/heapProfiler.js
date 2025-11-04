/**
 * Profilage mémoire détaillé avec heap snapshots
 * Analyse approfondie de l'utilisation mémoire et détection de fuites
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');
const { MemoryMonitor } = require('./memoryMonitor');
const { PROFILING_CONFIG } = require('./memory.config');

// Analyseur de heap
class HeapAnalyzer {
  constructor() {
    this.snapshots = [];
    this.retainedSizeCache = new Map();
    this.objectGraph = new Map();
  }

  /**
   * Prend un heap snapshot détaillé
   */
  takeHeapSnapshot(label = 'detailed', options = {}) {
    try {
      const heapUsed = v8.getHeapStatistics().used_heap_size;
      const heapTotal = v8.getHeapStatistics().total_heap_size;
      
      // Collecte des métadonnées détaillées
      const heapSpaces = v8.getHeapStatistics().heap_space_stats.map(space => ({
        name: space.name,
        usedSize: space.used_size,
        totalSize: space.total_size,
        availableSize: space.available_size,
        physicalSize: space.physical_size
      }));

      const snapshot = {
        id: this.snapshots.length + 1,
        label,
        timestamp: Date.now(),
        heapUsed,
        heapTotal,
        heapSpaces,
        statistics: {
          totalExternalSize: v8.getHeapStatistics().total_external_size,
          totalArrayBuffersSize: v8.getHeapStatistics().total_array_buffer_size,
          doesZapGarbage: v8.getHeapStatistics().does_zap_garbage,
          numberOfNativeContexts: v8.getHeapStatistics().number_of_native_contexts,
          numberOfDetachedContexts: v8.getHeapStatistics().number_of_detached_contexts
        },
        options: options,
        analysis: this.analyzeHeapUsage(heapSpaces)
      };

      this.snapshots.push(snapshot);
      
      // Garde seulement les derniers snapshots
      if (this.snapshots.length > PROFILING_CONFIG.HEAP_SAMPLES) {
        this.snapshots.shift();
      }

      return snapshot;
    } catch (error) {
      console.error('Erreur lors du heap snapshot:', error);
      return null;
    }
  }

  /**
   * Analyse l'utilisation du heap par spaces
   */
  analyzeHeapUsage(heapSpaces) {
    return heapSpaces.map(space => {
      const utilizationRate = (space.usedSize / space.totalSize) * 100;
      const fragmentationRate = space.availableSize > 0 ? 
        (space.availableSize / space.totalSize) * 100 : 0;

      return {
        name: space.name,
        utilizationRate: Number(utilizationRate.toFixed(2)),
        fragmentationRate: Number(fragmentationRate.toFixed(2)),
        isHighUtilization: utilizationRate > 80,
        isHighFragmentation: fragmentationRate > 30,
        recommendation: this.getOptimizationRecommendation(space)
      };
    });
  }

  /**
   * Recommandations d'optimisation
   */
  getOptimizationRecommendation(space) {
    const utilizationRate = (space.usedSize / space.totalSize) * 100;
    
    if (utilizationRate > 90) {
      return 'HIGH_UTILIZATION: Considérer un nettoyage de mémoire ou allocation d\'espace supplémentaire';
    } else if (utilizationRate > 80) {
      return 'MEDIUM_UTILIZATION: Surveiller l\'utilisation et optimiser les allocations';
    } else if (space.availableSize / space.totalSize > 0.3) {
      return 'HIGH_FRAGMENTATION: Considérer un compactage de mémoire';
    } else {
      return 'OPTIMAL: Utilisation normale';
    }
  }

  /**
   * Compare deux snapshots pour détecter les changements
   */
  compareSnapshots(snapshot1Id, snapshot2Id) {
    const snapshot1 = this.snapshots.find(s => s.id === snapshot1Id);
    const snapshot2 = this.snapshots.find(s => s.id === snapshot2Id);

    if (!snapshot1 || !snapshot2) {
      throw new Error('Snapshots non trouvés');
    }

    const comparison = {
      snapshot1: { id: snapshot1.id, label: snapshot1.label, timestamp: snapshot1.timestamp },
      snapshot2: { id: snapshot2.id, label: snapshot2.label, timestamp: snapshot2.timestamp },
      timeDifference: snapshot2.timestamp - snapshot1.timestamp,
      memoryChanges: {},
      spaceChanges: [],
      recommendations: []
    };

    // Calcule les changements de mémoire
    comparison.memoryChanges = {
      heapUsed: {
        before: snapshot1.heapUsed,
        after: snapshot2.heapUsed,
        change: snapshot2.heapUsed - snapshot1.heapUsed,
        percentage: ((snapshot2.heapUsed - snapshot1.heapUsed) / snapshot1.heapUsed) * 100
      },
      heapTotal: {
        before: snapshot1.heapTotal,
        after: snapshot2.heapTotal,
        change: snapshot2.heapTotal - snapshot1.heapTotal,
        percentage: ((snapshot2.heapTotal - snapshot1.heapTotal) / snapshot1.heapTotal) * 100
      }
    };

    // Compare les heap spaces
    snapshot1.heapSpaces.forEach(space1 => {
      const space2 = snapshot2.heapSpaces.find(s => s.name === space1.name);
      if (space2) {
        const utilizationChange = (space2.usedSize / space2.totalSize) - (space1.usedSize / space1.totalSize);
        
        if (Math.abs(utilizationChange) > 0.05) { // Plus de 5% de changement
          comparison.spaceChanges.push({
            name: space1.name,
            utilizationChange: utilizationChange * 100,
            before: {
              used: space1.usedSize,
              total: space1.totalSize,
              utilization: (space1.usedSize / space1.totalSize) * 100
            },
            after: {
              used: space2.usedSize,
              total: space2.totalSize,
              utilization: (space2.usedSize / space2.totalSize) * 100
            }
          });
        }
      }
    });

    // Génère des recommandations
    if (comparison.memoryChanges.heapUsed.change > 10 * 1024 * 1024) { // Plus de 10MB
      comparison.recommendations.push({
        type: 'MEMORY_GROWTH',
        severity: 'HIGH',
        message: 'Croissance significative de la mémoire heap',
        action: 'Analyser les allocations récentes et identifier les fuites potentielles'
      });
    }

    comparison.spaceChanges.forEach(change => {
      if (change.utilizationChange > 20) {
        comparison.recommendations.push({
          type: 'SPACE_UTILIZATION',
          severity: 'MEDIUM',
          space: change.name,
          message: `Augmentation de l'utilisation de ${change.name}`,
          action: 'Surveiller cet espace de heap'
        });
      }
    });

    return comparison;
  }

  /**
   * Analyse les tendances mémoire
   */
  analyzeTrends(timeRange = 300000) { // 5 minutes par défaut
    const now = Date.now();
    const relevantSnapshots = this.snapshots.filter(s => 
      now - s.timestamp <= timeRange
    );

    if (relevantSnapshots.length < 3) {
      return { trend: 'insufficient_data', message: 'Pas assez de données pour analyser les tendances' };
    }

    const trendAnalysis = {
      period: timeRange,
      snapshotCount: relevantSnapshots.length,
      startMemory: relevantSnapshots[0].heapUsed,
      endMemory: relevantSnapshots[relevantSnapshots.length - 1].heapUsed,
      peakMemory: Math.max(...relevantSnapshots.map(s => s.heapUsed)),
      averageMemory: relevantSnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / relevantSnapshots.length,
      trend: 'stable',
      confidence: 0,
      anomalies: [],
      predictions: {}
    };

    // Calcule la tendance
    const first = relevantSnapshots[0].heapUsed;
    const last = relevantSnapshots[relevantSnapshots.length - 1].heapUsed;
    const change = last - first;
    const changePercentage = (change / first) * 100;

    if (changePercentage > 20) {
      trendAnalysis.trend = 'increasing';
      trendAnalysis.confidence = Math.min(Math.abs(changePercentage) / 100, 0.9);
    } else if (changePercentage < -20) {
      trendAnalysis.trend = 'decreasing';
      trendAnalysis.confidence = Math.min(Math.abs(changePercentage) / 100, 0.9);
    } else {
      trendAnalysis.trend = 'stable';
      trendAnalysis.confidence = 1 - Math.abs(changePercentage) / 100;
    }

    // Détecte les anomalies (changements soudains)
    for (let i = 1; i < relevantSnapshots.length; i++) {
      const prev = relevantSnapshots[i - 1];
      const curr = relevantSnapshots[i];
      const change = curr.heapUsed - prev.heapUsed;
      
      if (Math.abs(change) > 5 * 1024 * 1024) { // Plus de 5MB de changement
        trendAnalysis.anomalies.push({
          timestamp: curr.timestamp,
          change: change,
          magnitude: Math.abs(change),
          before: prev.heapUsed,
          after: curr.heapUsed
        });
      }
    }

    // Prédictions simples
    if (trendAnalysis.trend === 'increasing' && trendAnalysis.confidence > 0.7) {
      const growthRate = change / relevantSnapshots.length;
      trendAnalysis.predictions = {
        inOneHour: last + (growthRate * (3600 / (timeRange / relevantSnapshots.length))),
        inTenMinutes: last + (growthRate * (600 / (timeRange / relevantSnapshots.length))),
        riskOfOOM: (last + (growthRate * (3600 / (timeRange / relevantSnapshots.length)))) > (v8.getHeapStatistics().heap_space_limit_size * 0.8)
      };
    }

    return trendAnalysis;
  }

  /**
   * Génère un rapport détaillé
   */
  generateDetailedReport() {
    const currentSnapshot = this.snapshots[this.snapshots.length - 1];
    if (!currentSnapshot) {
      return { error: 'Aucun snapshot disponible' };
    }

    const trends = this.analyzeTrends();
    const recentSnapshots = this.snapshots.slice(-10);

    const report = {
      timestamp: Date.now(),
      summary: {
        totalSnapshots: this.snapshots.length,
        currentHeapUsed: currentSnapshot.heapUsed,
        currentHeapTotal: currentSnapshot.heapTotal,
        heapUtilization: (currentSnapshot.heapUsed / currentSnapshot.heapTotal) * 100,
        trend: trends
      },
      detailed: {
        heapSpaces: currentSnapshot.heapSpaces,
        statistics: currentSnapshot.statistics,
        analysis: currentSnapshot.analysis
      },
      recentActivity: recentSnapshots.map(s => ({
        id: s.id,
        label: s.label,
        timestamp: s.timestamp,
        heapUsed: s.heapUsed,
        heapTotal: s.heapTotal
      })),
      comparisons: [],
      recommendations: this.generateGlobalRecommendations(currentSnapshot, trends),
      nextActions: this.getNextActions(trends)
    };

    // Ajoute des comparaisons entre snapshots consécutifs
    for (let i = 1; i < recentSnapshots.length; i++) {
      const comparison = this.compareSnapshots(recentSnapshots[i - 1].id, recentSnapshots[i].id);
      report.comparisons.push(comparison);
    }

    return report;
  }

  /**
   * Génère des recommandations globales
   */
  generateGlobalRecommendations(currentSnapshot, trends) {
    const recommendations = [];

    // Recommandations basées sur l'utilisation actuelle
    const utilization = (currentSnapshot.heapUsed / currentSnapshot.heapTotal) * 100;
    
    if (utilization > 90) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'MEMORY_PRESSURE',
        message: 'Utilisation heap critique détectée',
        action: 'Effectuer un nettoyage de mémoire immédiat et identifier les fuites',
        estimatedImpact: 'high'
      });
    } else if (utilization > 80) {
      recommendations.push({
        priority: 'HIGH',
        category: 'MEMORY_PRESSURE',
        message: 'Utilisation heap élevée',
        action: 'Surveiller et optimiser les allocations mémoire',
        estimatedImpact: 'medium'
      });
    }

    // Recommandations basées sur les tendances
    if (trends.trend === 'increasing' && trends.confidence > 0.7) {
      recommendations.push({
        priority: 'HIGH',
        category: 'MEMORY_GROWTH',
        message: 'Croissance continue de la mémoire détectée',
        action: 'Analyser les patterns d\'allocation et détecter les fuites',
        estimatedImpact: trends.riskOfOOM ? 'critical' : 'high'
      });
    }

    // Recommandations basées sur les anomalies
    if (trends.anomalies.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'MEMORY_ANOMALIES',
        message: `${trends.anomalies.length} anomalies mémoire détectées`,
        action: 'Investiguer les événements qui causent les changements soudains de mémoire',
        estimatedImpact: 'low'
      });
    }

    return recommendations;
  }

  /**
   * Définit les actions suivantes
   */
  getNextActions(trends) {
    const actions = [];

    if (trends.trend === 'increasing' && trends.confidence > 0.8) {
      actions.push('Prendre des heap dumps pour analyse approfondie');
      actions.push('Analyser les allocations récentes');
      actions.push('Vérifier les patterns de création/destruction d\'objets');
    }

    if (trends.anomalies.length > 2) {
      actions.push('Corréler les anomalies avec les événements applicatifs');
      actions.push('Vérifier les opérations qui causent des pics mémoire');
    }

    actions.push('Continuer la surveillance pour collecter plus de données');
    actions.push('Configurer des alertes pour seuils critiques');

    return actions;
  }

  /**
   * Exporte les données de profilage
   */
  exportData(format = 'json', filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const report = this.generateDetailedReport();
    
    let content;
    let fileExtension;

    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        fileExtension = '.json';
        break;
      case 'csv':
        content = this.convertToCSV(report);
        fileExtension = '.csv';
        break;
      case 'html':
        content = this.generateHTMLReport(report);
        fileExtension = '.html';
        break;
      default:
        content = JSON.stringify(report, null, 2);
        fileExtension = '.json';
    }

    if (!filename) {
      filename = `heap-analysis-${timestamp}${fileExtension}`;
    } else if (!filename.endsWith(fileExtension)) {
      filename += fileExtension;
    }

    return { filename, content, report };
  }

  convertToCSV(report) {
    const lines = [
      'Timestamp,Heap Used (MB),Heap Total (MB),Utilization %,Trend,Confidence'
    ];

    report.recentActivity.forEach(snapshot => {
      const utilization = (snapshot.heapUsed / snapshot.heapTotal) * 100;
      lines.push([
        new Date(snapshot.timestamp).toISOString(),
        (snapshot.heapUsed / 1024 / 1024).toFixed(2),
        (snapshot.heapTotal / 1024 / 1024).toFixed(2),
        utilization.toFixed(2),
        snapshot.label,
        'N/A'
      ].join(','));
    });

    return lines.join('\n');
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Rapport Profilage Mémoire - ${new Date(report.timestamp).toLocaleString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 15px; border-radius: 5px; }
        .metric { margin: 10px 0; }
        .warning { color: #ff6600; font-weight: bold; }
        .critical { color: #cc0000; font-weight: bold; }
        .good { color: #009900; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport Profilage Mémoire</h1>
        <p>Généré le: ${new Date(report.timestamp).toLocaleString()}</p>
        <p>Snapshots: ${report.summary.totalSnapshots}</p>
    </div>

    <div class="metric">
        <h2>Résumé</h2>
        <p>Heap utilisé: ${(report.summary.currentHeapUsed / 1024 / 1024).toFixed(2)} MB</p>
        <p>Heap total: ${(report.summary.currentHeapTotal / 1024 / 1024).toFixed(2)} MB</p>
        <p>Utilisation: ${report.summary.heapUtilization.toFixed(2)}%</p>
        <p>Tendance: <span class="${report.summary.trend.trend}">${report.summary.trend.trend}</span></p>
    </div>

    <div class="metric">
        <h2>Recommandations</h2>
        ${report.recommendations.map(rec => `
            <div class="${rec.priority.toLowerCase()}">
                <strong>${rec.priority}</strong> - ${rec.message}
                <br>Action: ${rec.action}
            </div>
        `).join('<br>')}
    </div>

    <div class="metric">
        <h2>Actions Suivantes</h2>
        <ul>
            ${report.nextActions.map(action => `<li>${action}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
  }
}

// Analyseur de fuites spécialisé
class LeakDetector {
  constructor() {
    this.patterns = new Map();
    this.suspectedLeaks = [];
  }

  /**
   * Détecte les patterns de fuites
   */
  detectLeakPatterns(memoryMonitor, timeWindow = 60000) { // 1 minute par défaut
    const recentHistory = memoryMonitor.memoryHistory.filter(h => 
      Date.now() - h.timestamp <= timeWindow
    );

    if (recentHistory.length < 5) {
      return { leakDetected: false, message: 'Données insuffisantes' };
    }

    const analysis = {
      leakDetected: false,
      confidence: 0,
      patterns: [],
      severity: 'low',
      recommendations: []
    };

    // Pattern 1: Croissance continue
    const growthPattern = this.analyzeContinuousGrowth(recentHistory);
    if (growthPattern.detected) {
      analysis.patterns.push(growthPattern);
      analysis.leakDetected = true;
      analysis.confidence += 0.3;
    }

    // Pattern 2: Pas de stabilisation après allocations
    const stabilizationPattern = this.analyzeStabilization(recentHistory);
    if (stabilizationPattern.detected) {
      analysis.patterns.push(stabilizationPattern);
      analysis.leakDetected = true;
      analysis.confidence += 0.4;
    }

    // Pattern 3: Croissance exponentielle
    const exponentialPattern = this.analyzeExponentialGrowth(recentHistory);
    if (exponentialPattern.detected) {
      analysis.patterns.push(exponentialPattern);
      analysis.leakDetected = true;
      analysis.confidence += 0.5;
      analysis.severity = 'high';
    }

    // Pattern 4: Accumulation de mémoire sans nettoyage
    const accumulationPattern = this.analyzeAccumulation(recentHistory);
    if (accumulationPattern.detected) {
      analysis.patterns.push(accumulationPattern);
      analysis.leakDetected = true;
      analysis.confidence += 0.3;
    }

    analysis.confidence = Math.min(analysis.confidence, 1.0);
    
    if (analysis.confidence > 0.7) {
      analysis.severity = 'critical';
    } else if (analysis.confidence > 0.5) {
      analysis.severity = 'high';
    } else if (analysis.confidence > 0.3) {
      analysis.severity = 'medium';
    }

    return analysis;
  }

  analyzeContinuousGrowth(history) {
    let isGrowing = true;
    const growthRates = [];
    
    for (let i = 1; i < history.length; i++) {
      const growth = history[i].heapUsed - history[i - 1].heapUsed;
      growthRates.push(growth);
      
      if (growth < -1024 * 1024) { // Plus de 1MB de réduction
        isGrowing = false;
        break;
      }
    }

    const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const consistentGrowth = growthRates.every(rate => rate > 0);

    return {
      type: 'CONTINUOUS_GROWTH',
      detected: isGrowing && consistentGrowth && avgGrowth > 1024 * 1024,
      details: {
        averageGrowth: avgGrowth,
        growthPoints: growthRates.length,
        isConsistent: consistentGrowth
      }
    };
  }

  analyzeStabilization(history) {
    if (history.length < 10) return { detected: false };

    const recentPoints = history.slice(-5);
    const avgRecent = recentPoints.reduce((sum, h) => sum + h.heapUsed, 0) / recentPoints.length;
    const olderPoints = history.slice(-10, -5);
    const avgOlder = olderPoints.reduce((sum, h) => sum + h.heapUsed, 0) / olderPoints.length;

    // Si la moyenne récente est significativement plus haute et il n'y a pas de nettoyage
    return {
      type: 'NO_STABILIZATION',
      detected: avgRecent > avgOlder * 1.2 && recentPoints.every(h => h.heapUsed >= avgOlder)
    };
  }

  analyzeExponentialGrowth(history) {
    if (history.length < 6) return { detected: false };

    const recentGrowth = [];
    for (let i = 1; i < history.length; i++) {
      const growth = history[i].heapUsed - history[i - 1].heapUsed;
      recentGrowth.push(growth);
    }

    // Détecte une accélération dans la croissance
    let isExponential = true;
    for (let i = 2; i < recentGrowth.length; i++) {
      if (recentGrowth[i] <= recentGrowth[i - 1]) {
        isExponential = false;
        break;
      }
    }

    return {
      type: 'EXPONENTIAL_GROWTH',
      detected: isExponential && recentGrowth[recentGrowth.length - 1] > recentGrowth[0] * 2
    };
  }

  analyzeAccumulation(history) {
    const startMemory = history[0].heapUsed;
    const endMemory = history[history.length - 1].heapUsed;
    const totalGrowth = endMemory - startMemory;

    // Détecte si plus de 10MB ont été alloués sans nettoyage
    return {
      type: 'UNSAFE_ACCUMULATION',
      detected: totalGrowth > 10 * 1024 * 1024
    };
  }
}

module.exports = {
  HeapAnalyzer,
  LeakDetector
};