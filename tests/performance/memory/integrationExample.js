/**
 * Exemple d'intégration du système de tests de mémoire
 * Montre comment intégrer la surveillance mémoire dans l'application RDP
 */

const MemoryMonitor = require('./memoryMonitor');
const { HeapAnalyzer, LeakDetector } = require('./heapProfiler');
const path = require('path');

// Configuration d'intégration pour l'application RDP
class RDPMemoryIntegration {
  constructor(app) {
    this.app = app;
    this.monitor = new MemoryMonitor();
    this.analyzer = new HeapAnalyzer();
    this.leakDetector = new LeakDetector();
    this.isMonitoring = false;
    this.reportInterval = null;
    
    this.configure();
  }

  configure() {
    // Configuration pour l'application RDP
    this.config = {
      reportDirectory: path.join(__dirname, '../../logs/memory'),
      autoSaveInterval: 60000, // 1 minute
      leakDetectionThreshold: 10 * 1024 * 1024, // 10MB
      snapshotOnEvents: true,
      integration: {
        electron: true,
        react: true,
        websocket: true,
        ged: true
      }
    };
  }

  // Initialise la surveillance mémoire pour l'application RDP
  initialize() {
    console.log('🧠 Initialisation de la surveillance mémoire RDP...');
    
    // Démarre la surveillance continue
    this.monitor.startMonitoring();
    this.isMonitoring = true;

    // Configure les événements de surveillance
    this.setupEventListeners();
    
    // Enregistre les hooks d'application
    this.registerAppHooks();
    
    // Configure le rapport automatique
    this.setupAutoReporting();

    console.log('✅ Surveillance mémoire RDP initialisée');
  }

  setupEventListeners() {
    // Écoute les alertes mémoire
    this.monitor.on('memoryAlert', (alert) => {
      this.handleMemoryAlert(alert);
    });

    // Écoute les mises à jour mémoire
    this.monitor.on('memoryUpdate', (stats) => {
      this.handleMemoryUpdate(stats);
    });

    // Écoute les snapshots
    this.monitor.on('snapshot', (snapshot) => {
      this.handleHeapSnapshot(snapshot);
    });
  }

  registerAppHooks() {
    // Hooks Electron pour la surveillance des fenêtres
    if (this.config.integration.electron && this.app) {
      this.setupElectronHooks();
    }

    // Hooks pour les services GED
    if (this.config.integration.ged) {
      this.setupGEDHooks();
    }

    // Hooks pour les WebSocket
    if (this.config.integration.websocket) {
      this.setupWebSocketHooks();
    }
  }

  setupElectronHooks() {
    // Surveille la création de fenêtres
    this.app?.on('browser-window-created', (event, window) => {
      console.log(`🪟 Fenêtre créée: ${window.id}`);
      this.monitor.takeHeapSnapshot(`window-created-${window.id}`);
      
      // Surveille la fermeture
      window.on('closed', () => {
        console.log(`🪟 Fenêtre fermée: ${window.id}`);
        setTimeout(() => {
          this.monitor.takeHeapSnapshot(`window-closed-${window.id}`);
        }, 1000);
      });
    });

    // Surveille l'IPC
    this.app?.on('ready', () => {
      console.log('📡 Surveillance IPC activée');
    });
  }

  setupGEDHooks() {
    // Surveille les opérations GED
    const gedService = require('../../backend/services/ged-service');
    if (gedService) {
      const originalUpload = gedService.uploadDocument;
      gedService.uploadDocument = async (...args) => {
        const snapshot = this.monitor.takeHeapSnapshot('ged-upload-start');
        try {
          const result = await originalUpload.apply(gedService, args);
          this.monitor.takeHeapSnapshot('ged-upload-end');
          return result;
        } catch (error) {
          this.monitor.takeHeapSnapshot('ged-upload-error');
          throw error;
        }
      };
    }
  }

  setupWebSocketHooks() {
    // Surveille les connexions WebSocket
    const WebSocket = require('ws');
    const originalServer = WebSocket.Server;
    
    WebSocket.Server = function(options) {
      const server = new originalServer(options);
      
      server.on('connection', (ws) => {
        const connectionId = `ws-${Date.now()}-${Math.random()}`;
        console.log(`🔌 Connexion WebSocket: ${connectionId}`);
        
        ws.on('message', (message) => {
          // Surveille les gros messages
          if (message.length > 1024 * 1024) { // 1MB
            this.monitor.takeHeapSnapshot(`ws-large-message-${connectionId}`);
          }
        });
        
        ws.on('close', () => {
          console.log(`🔌 Déconnexion WebSocket: ${connectionId}`);
        });
      });
      
      return server;
    };
  }

  handleMemoryAlert(alert) {
    const timestamp = new Date().toLocaleString();
    
    console.log(`🚨 ALERTE MÉMOIRE [${timestamp}]: ${alert.message}`);
    
    // Log l'alerte
    this.logAlert(alert);
    
    // Actions basées sur le type d'alerte
    if (alert.type === 'CRITICAL') {
      this.handleCriticalMemoryAlert(alert);
    }
  }

  handleCriticalMemoryAlert(alert) {
    console.log('🆘 Alerte critique - Tentative de nettoyage mémoire...');
    
    // Force le GC
    if (global.gc) {
      global.gc();
    }
    
    // Prend un snapshot d'urgence
    const emergencySnapshot = this.monitor.takeHeapSnapshot('emergency-gc');
    
    // Envoie une notification (vous pouvez intégrer avec votre système de notification)
    this.sendMemoryAlertNotification(alert);
  }

  handleMemoryUpdate(stats) {
    // Analyse en temps réel
    const leakAnalysis = this.leakDetector.detectLeakPatterns(this.monitor);
    
    if (leakAnalysis.leakDetected && leakAnalysis.confidence > 0.7) {
      console.warn(`🚨 Fuite mémoire détectée (confiance: ${(leakAnalysis.confidence * 100).toFixed(1)}%)`);
      this.handleDetectedLeak(leakAnalysis);
    }
  }

  handleHeapSnapshot(snapshot) {
    console.log(`📸 Heap snapshot ${snapshot.id}: ${snapshot.heapUsed.toFixed(2)}MB`);
    
    // Analyse chaque snapshot pour les tendances
    if (this.monitor.heapSnapshots.length > 1) {
      const recentTrends = this.analyzer.analyzeTrends(300000); // 5 minutes
      if (recentTrends.trend === 'increasing' && recentTrends.confidence > 0.8) {
        console.warn('📈 Tendance croissante détectée dans l\'utilisation mémoire');
      }
    }
  }

  handleDetectedLeak(leakAnalysis) {
    console.log('🔍 Analyse des patterns de fuite...');
    
    leakAnalysis.patterns.forEach(pattern => {
      console.log(`   Pattern détecté: ${pattern.type}`);
    });
    
    // Génère un rapport d'urgence
    const emergencyReport = this.generateEmergencyReport(leakAnalysis);
    this.saveEmergencyReport(emergencyReport);
  }

  setupAutoReporting() {
    // Rapport automatique périodique
    this.reportInterval = setInterval(() => {
      if (this.isMonitoring) {
        this.generatePeriodicReport();
      }
    }, this.config.autoSaveInterval);
  }

  generatePeriodicReport() {
    const report = this.monitor.exportReport();
    const analysis = this.analyzer.generateDetailedReport();
    const leakAnalysis = this.leakDetector.detectLeakPatterns(this.monitor);
    
    const periodicReport = {
      timestamp: new Date().toISOString(),
      application: 'RDP',
      summary: {
        monitoringDuration: Date.now() - this.startTime,
        totalSnapshots: report.snapshots.length,
        currentMemory: report.current,
        leakStatus: leakAnalysis.leakDetected ? 'DETECTED' : 'CLEAN'
      },
      memory: report,
      analysis: analysis,
      leaks: leakAnalysis
    };
    
    const filename = `periodic-report-${Date.now()}.json`;
    const filepath = path.join(this.config.reportDirectory, 'periodic', filename);
    
    require('fs').writeFileSync(filepath, JSON.stringify(periodicReport, null, 2));
    console.log(`📊 Rapport périodique sauvegardé: ${filename}`);
  }

  generateEmergencyReport(leakAnalysis) {
    const currentStats = this.monitor.getMemoryStats();
    const trends = this.analyzer.analyzeTrends();
    
    return {
      timestamp: new Date().toISOString(),
      type: 'EMERGENCY_MEMORY_LEAK_DETECTED',
      severity: leakAnalysis.severity,
      confidence: leakAnalysis.confidence,
      currentStats: currentStats,
      trends: trends,
      patterns: leakAnalysis.patterns,
      recommendations: this.getEmergencyRecommendations(leakAnalysis),
      actionRequired: true
    };
  }

  getEmergencyRecommendations(leakAnalysis) {
    const recommendations = [];
    
    if (leakAnalysis.severity === 'critical') {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Redémarrer l\'application pour libérer la mémoire',
        timeframe: 'Maintenant'
      });
    }
    
    if (leakAnalysis.patterns.some(p => p.type === 'CONTINUOUS_GROWTH')) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Analyser les allocations récentes et identifier les fuites',
        timeframe: 'Dans l\'heure'
      });
    }
    
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Vérifier les cycles de vie des composants React',
      timeframe: 'Dans la journée'
    });
    
    return recommendations;
  }

  logAlert(alert) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      alert: alert
    };
    
    const logPath = path.join(this.config.reportDirectory, 'alerts.log');
    require('fs').appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }

  saveEmergencyReport(report) {
    const filename = `emergency-leak-${Date.now()}.json`;
    const filepath = path.join(this.config.reportDirectory, 'emergencies', filename);
    const dir = require('path').dirname(filepath);
    
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
    
    require('fs').writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`🆘 Rapport d'urgence sauvegardé: ${filename}`);
  }

  sendMemoryAlertNotification(alert) {
    // Intégration avec votre système de notification
    console.log('📢 Notification alerte mémoire envoyée');
    
    // Exemples d'intégration:
    // - Email
    // - Slack
    // - Teams
    // - Système de monitoring externe
  }

  // API publique pour l'application RDP
  getCurrentMemoryStatus() {
    return {
      isMonitoring: this.isMonitoring,
      current: this.monitor.getMemoryStats(),
      snapshots: this.monitor.heapSnapshots.slice(-10),
      leaks: this.leakDetector.detectLeakPatterns(this.monitor)
    };
  }

  takeManualSnapshot(label) {
    return this.monitor.takeHeapSnapshot(`manual-${label}`);
  }

  stop() {
    console.log('🛑 Arrêt de la surveillance mémoire...');
    
    this.isMonitoring = false;
    this.monitor.stopMonitoring();
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    // Génère un rapport final
    const finalReport = this.monitor.exportReport();
    const filepath = path.join(this.config.reportDirectory, `final-report-${Date.now()}.json`);
    require('fs').writeFileSync(filepath, JSON.stringify(finalReport, null, 2));
    
    console.log('✅ Surveillance mémoire arrêtée');
  }
}

// Exemple d'utilisation dans votre application principale
function integrateMemoryMonitoring(app) {
  const memoryIntegration = new RDPMemoryIntegration(app);
  memoryIntegration.initialize();
  
  // Expose l'API pour l'utilisation dans l'application
  global.rdpMemoryMonitor = memoryIntegration;
  
  return memoryIntegration;
}

// Pour utilisation standalone
if (require.main === module) {
  console.log('🔬 Exemple d\'intégration de la surveillance mémoire RDP');
  
  // Simule une application Electron
  const mockApp = {
    on: () => mockApp,
    ready: () => mockApp
  };
  
  const integration = integrateMemoryMonitoring(mockApp);
  
  console.log('📊 Statut actuel:', integration.getCurrentMemoryStatus());
  
  // Exemple de prise de snapshot manuel
  setTimeout(() => {
    integration.takeManualSnapshot('test-manual');
    console.log('📸 Snapshot manuel pris');
  }, 2000);
  
  // Arrêt propre après 10 secondes
  setTimeout(() => {
    integration.stop();
    process.exit(0);
  }, 10000);
}

module.exports = {
  RDPMemoryIntegration,
  integrateMemoryMonitoring
};