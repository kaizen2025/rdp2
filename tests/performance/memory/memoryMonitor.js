/**
 * Utilitaires de surveillance mémoire
 * Fournit des fonctions pour surveiller et profiler l'utilisation mémoire
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const { MEMORY_THRESHOLDS, PROFILING_CONFIG } = require('./memory.config');

class MemoryMonitor extends EventEmitter {
  constructor() {
    super();
    this.heapSnapshots = [];
    this.memoryHistory = [];
    this.gcAttempts = 0;
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Récupère les statistiques mémoire actuelles
   */
  getMemoryStats() {
    const usage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    return {
      heapUsed: usage.heapUsed / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024, // MB
      external: usage.external / 1024 / 1024, // MB
      rss: usage.rss / 1024 / 1024, // MB
      arrayBuffers: usage.arrayBuffers / 1024 / 1024, // MB
      heapLimit: heapStats.heap_space_limit_size / 1024 / 1024, // MB
      heapSpaces: (heapStats.heap_space_stats || []).map(space => ({
        name: space.name,
        usedSize: space.used_size / 1024 / 1024,
        totalSize: space.total_size / 1024 / 1024,
        sizeLimit: space.size_limit / 1024 / 1024
      }))
    };
  }

  /**
   * Vérifie si les seuils de mémoire sont dépassés
   */
  checkThresholds(memoryStats) {
    const alerts = [];
    
    if (memoryStats.heapUsed > MEMORY_THRESHOLDS.HEAP_USED.CRITICAL) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'heapUsed',
        value: memoryStats.heapUsed,
        threshold: MEMORY_THRESHOLDS.HEAP_USED.CRITICAL,
        message: `Usage heap critique: ${memoryStats.heapUsed.toFixed(2)}MB`
      });
    } else if (memoryStats.heapUsed > MEMORY_THRESHOLDS.HEAP_USED.WARNING) {
      alerts.push({
        type: 'WARNING',
        metric: 'heapUsed',
        value: memoryStats.heapUsed,
        threshold: MEMORY_THRESHOLDS.HEAP_USED.WARNING,
        message: `Usage heap élevé: ${memoryStats.heapUsed.toFixed(2)}MB`
      });
    }

    if (memoryStats.rss > MEMORY_THRESHOLDS.RSS.CRITICAL) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'rss',
        value: memoryStats.rss,
        threshold: MEMORY_THRESHOLDS.RSS.CRITICAL,
        message: `RSS critique: ${memoryStats.rss.toFixed(2)}MB`
      });
    }

    return alerts;
  }

  /**
   * Prend un snapshot du heap
   */
  takeHeapSnapshot(label = 'snapshot') {
    try {
      const heapUsed = v8.getHeapStatistics().used_heap_size;
      const heapTotal = v8.getHeapStatistics().total_heap_size;
      
      const snapshot = {
        id: this.heapSnapshots.length + 1,
        label,
        timestamp: Date.now(),
        heapUsed: heapUsed / 1024 / 1024,
        heapTotal: heapTotal / 1024 / 1024,
        diffFromPrevious: 0
      };

      if (this.heapSnapshots.length > 0) {
        const previous = this.heapSnapshots[this.heapSnapshots.length - 1];
        snapshot.diffFromPrevious = snapshot.heapUsed - previous.heapUsed;
      }

      this.heapSnapshots.push(snapshot);

      // Limite le nombre de snapshots conservés
      if (this.heapSnapshots.length > PROFILING_CONFIG.HEAP_SAMPLES) {
        this.heapSnapshots.shift();
      }

      this.emit('snapshot', snapshot);
      return snapshot;
    } catch (error) {
      console.error('Erreur lors du snapshot heap:', error);
      return null;
    }
  }

  /**
   * Force le garbage collection si disponible
   */
  forceGarbageCollection() {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  }

  /**
   * Démarre la surveillance continue
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      const alerts = this.checkThresholds(stats);
      
      // Ajoute aux historiques
      this.memoryHistory.push({
        timestamp: Date.now(),
        ...stats
      });

      // Limite l'historique
      if (this.memoryHistory.length > 1000) {
        this.memoryHistory.shift();
      }

      // Émet les alertes
      alerts.forEach(alert => this.emit('memoryAlert', alert));

      // Prend des snapshots périodiques
      if (this.heapSnapshots.length === 0 || 
          Date.now() - this.heapSnapshots[this.heapSnapshots.length - 1].timestamp > PROFILING_CONFIG.SNAPSHOT_INTERVAL) {
        this.takeHeapSnapshot('auto');
      }

      this.emit('memoryUpdate', stats);
    }, PROFILING_CONFIG.SNAPSHOT_INTERVAL);
  }

  /**
   * Arrête la surveillance
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Détecte les fuites potentielles
   */
  detectLeaks() {
    if (this.heapSnapshots.length < 3) {
      return null;
    }

    const leaks = [];
    const recentSnapshots = this.heapSnapshots.slice(-10); // 10 derniers snapshots
    
    // Détecte une croissance continue
    for (let i = 1; i < recentSnapshots.length; i++) {
      const current = recentSnapshots[i];
      const previous = recentSnapshots[i - 1];
      const growth = current.heapUsed - previous.heapUsed;
      
      if (growth > PROFILING_CONFIG.LEak_DETECTION_THRESHOLD / 1024 / 1024) {
        leaks.push({
          type: 'CONTINUOUS_GROWTH',
          snapshot: current,
          growth: growth,
          message: `Croissance continue détectée: +${growth.toFixed(2)}MB`
        });
      }
    }

    // Détecte les fuites par comparaison de snapshots
    if (this.heapSnapshots.length >= 5) {
      const first = this.heapSnapshots[0];
      const last = this.heapSnapshots[this.heapSnapshots.length - 1];
      const totalGrowth = last.heapUsed - first.heapUsed;
      
      if (totalGrowth > PROFILING_CONFIG.LEak_DETECTION_THRESHOLD / 1024 / 1024) {
        leaks.push({
          type: 'TOTAL_GROWTH',
          firstSnapshot: first,
          lastSnapshot: last,
          totalGrowth: totalGrowth,
          message: `Croissance totale: +${totalGrowth.toFixed(2)}MB`
        });
      }
    }

    return leaks;
  }

  /**
   * Exporte un rapport de mémoire
   */
  exportReport() {
    const currentStats = this.getMemoryStats();
    const leaks = this.detectLeaks();
    const alerts = this.checkThresholds(currentStats);

    const report = {
      timestamp: Date.now(),
      current: currentStats,
      alerts,
      leaks: leaks || [],
      snapshots: this.heapSnapshots,
      history: this.memoryHistory.slice(-50) // 50 derniers points
    };

    return report;
  }

  /**
   * Sauvegarde un rapport dans un fichier
   */
  saveReport(filename) {
    const report = this.exportReport();
    const reportPath = path.join(__dirname, 'reports', filename);
    
    // Crée le dossier s'il n'existe pas
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }

  /**
   * Mesure l'utilisation mémoire d'une fonction
   */
  async measureFunctionMemory(fn, label = 'function') {
    // Force le GC avant la mesure
    this.forceGarbageCollection();
    await new Promise(resolve => setTimeout(resolve, 100));

    const before = this.getMemoryStats();
    const beforeHeapUsed = before.heapUsed;

    try {
      const result = await fn();
      
      // Attend que la mémoire se stabilise
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const after = this.getMemoryStats();
      const afterHeapUsed = after.heapUsed;
      const memoryIncrease = afterHeapUsed - beforeHeapUsed;

      return {
        result,
        memory: {
          before: beforeHeapUsed,
          after: afterHeapUsed,
          increase: memoryIncrease,
          increaseFormatted: `${memoryIncrease.toFixed(2)}MB`
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MemoryMonitor;