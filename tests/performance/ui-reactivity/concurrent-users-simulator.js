/**
 * Script de simulation d'utilisateurs concurrents sur l'UI
 * Génère et exécute des scénarios de test de charge utilisateur
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration des tests de charge
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  concurrentUsers: 50,
  testDuration: 60000, // 1 minute
  rampUpTime: 10000, // 10 secondes pour monter à pleine charge
  scenarios: {
    navigation: {
      weight: 30,
      actions: [
        { type: 'click', selector: '[data-testid="nav-dashboard"]', delay: 100 },
        { type: 'click', selector: '[data-testid="nav-users"]', delay: 200 },
        { type: 'click', selector: '[data-testid="nav-settings"]', delay: 150 },
        { type: 'scroll', amount: 500, delay: 300 }
      ]
    },
    formInteraction: {
      weight: 25,
      actions: [
        { type: 'input', selector: '[data-testid="search-input"]', value: 'test query', delay: 100 },
        { type: 'select', selector: '[data-testid="filter-select"]', value: 'option1', delay: 150 },
        { type: 'click', selector: '[data-testid="apply-filter"]', delay: 200 },
        { type: 'input', selector: '[data-testid="form-input"]', value: 'test data', delay: 100 }
      ]
    },
    menuNavigation: {
      weight: 20,
      actions: [
        { type: 'click', selector: '[data-testid="menu-button"]', delay: 100 },
        { type: 'hover', selector: '[data-testid="menu-item-0"]', delay: 200 },
        { type: 'click', selector: '[data-testid="menu-item-1"]', delay: 150 },
        { type: 'escape', delay: 100 }
      ]
    },
    listInteraction: {
      weight: 15,
      actions: [
        { type: 'scroll', amount: 1000, delay: 500 },
        { type: 'click', selector: '[data-testid="list-item-0"]', delay: 200 },
        { type: 'click', selector: '[data-testid="load-more"]', delay: 1000 },
        { type: 'scroll', amount: 2000, delay: 800 }
      ]
    },
    realtimeUpdates: {
      weight: 10,
      actions: [
        { type: 'click', selector: '[data-testid="notification-button"]', delay: 100 },
        { type: 'scroll', amount: 300, delay: 200 },
        { type: 'click', selector: '[data-testid="websocket-toggle"]', delay: 150 },
        { type: 'wait', duration: 2000, delay: 0 }
      ]
    }
  },
  metrics: {
    responseTime: true,
    throughput: true,
    errorRate: true,
    resourceUsage: true,
    userExperience: true
  }
};

// Classe principale pour la simulation d'utilisateurs concurrents
class ConcurrentUserSimulator {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.results = {
      users: [],
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        throughput: 0,
        errorRate: 0,
        resourceUsage: []
      },
      timeline: [],
      errors: []
    };
    this.isRunning = false;
    this.activeUsers = 0;
  }

  // Initialisation du navigateur
  async initialize() {
    console.log('🚀 Initialisation du simulateur d\'utilisateurs concurrents...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-web-security'
      ]
    });

    console.log(`✅ Navigateur initialisé avec ${this.config.concurrentUsers} utilisateurs concurrents`);
  }

  // Génération d'un utilisateur virtuel
  createVirtualUser(userId) {
    return {
      id: userId,
      sessionId: `session-${userId}-${Date.now()}`,
      startTime: null,
      endTime: null,
      actions: [],
      metrics: {
        responseTimes: [],
        errors: [],
        pageViews: 0,
        interactions: 0,
        uniqueActions: new Set()
      }
    };
  }

  // Sélection d'un scénario basé sur les poids
  selectScenario() {
    const scenarios = Object.keys(this.config.scenarios);
    const weights = scenarios.map(scenario => this.config.scenarios[scenario].weight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < scenarios.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return scenarios[i];
      }
    }
    
    return scenarios[0];
  }

  // Exécution d'une action utilisateur
  async executeAction(page, action) {
    const startTime = performance.now();
    let success = true;
    let error = null;

    try {
      switch (action.type) {
        case 'click':
          await page.click(action.selector);
          break;
        
        case 'input':
          await page.type(action.selector, action.value);
          break;
        
        case 'select':
          await page.select(action.selector, action.value);
          break;
        
        case 'scroll':
          await page.evaluate((amount) => {
            window.scrollTo(0, amount);
          }, action.amount);
          break;
        
        case 'hover':
          await page.hover(action.selector);
          break;
        
        case 'escape':
          await page.keyboard.press('Escape');
          break;
        
        case 'wait':
          await page.waitForTimeout(action.duration);
          break;
        
        default:
          console.warn(`Type d'action non supporté: ${action.type}`);
      }
    } catch (err) {
      success = false;
      error = err.message;
      console.error(`Erreur lors de l'exécution de l'action ${action.type}:`, err);
    }

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    return {
      action,
      responseTime,
      success,
      error,
      timestamp: new Date().toISOString()
    };
  }

  // Simulation d'une session utilisateur
  async simulateUserSession(userId) {
    const user = this.createVirtualUser(userId);
    user.startTime = Date.now();
    
    const page = await this.browser.newPage();
    
    // Configuration de la page pour capturer les métriques
    await page.setCacheEnabled(false);
    await page.setRequestInterception(true);
    
    const requests = [];
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        startTime: Date.now()
      });
      request.continue();
    });

    page.on('response', (response) => {
      const request = requests[requests.length - 1];
      if (request) {
        request.endTime = Date.now();
        request.status = response.status();
        request.duration = request.endTime - request.startTime;
      }
    });

    try {
      // Naviguer vers l'application
      const navigationStart = performance.now();
      await page.goto(this.config.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      const navigationTime = performance.now() - navigationStart;
      
      user.metrics.pageViews++;
      user.metrics.responseTimes.push(navigationTime);
      
      // Exécuter des scénarios pendant la durée du test
      const sessionStart = Date.now();
      let actionCount = 0;
      const maxActions = Math.floor(Math.random() * 20) + 10; // 10-30 actions par utilisateur
      
      while (Date.now() - sessionStart < this.config.testDuration && actionCount < maxActions) {
        // Sélectionner un scénario
        const scenarioName = this.selectScenario();
        const scenario = this.config.scenarios[scenarioName];
        
        // Exécuter les actions du scénario
        for (const action of scenario.actions) {
          if (Date.now() - sessionStart >= this.config.testDuration) break;
          
          const result = await this.executeAction(page, action);
          user.actions.push({
            ...result,
            scenario: scenarioName,
            actionIndex: actionCount
          });
          
          user.metrics.responseTimes.push(result.responseTime);
          if (!result.success) {
            user.metrics.errors.push(result.error);
          }
          
          actionCount++;
          user.metrics.interactions++;
          user.metrics.uniqueActions.add(result.action.type);
          
          // Attendre le délai entre les actions
          if (action.delay > 0) {
            await page.waitForTimeout(action.delay);
          }
          
          // Vérifier si l'utilisateur doit s'arrêter
          if (Date.now() - sessionStart >= this.config.testDuration) break;
        }
      }
      
    } catch (error) {
      user.metrics.errors.push(error.message);
      console.error(`Erreur dans la session utilisateur ${userId}:`, error);
    } finally {
      await page.close();
      user.endTime = Date.now();
      user.sessionDuration = user.endTime - user.startTime;
      
      // Calculer les métriques utilisateur
      user.metrics.averageResponseTime = user.metrics.responseTimes.length > 0 
        ? user.metrics.responseTimes.reduce((a, b) => a + b, 0) / user.metrics.responseTimes.length
        : 0;
      
      user.metrics.maxResponseTime = user.metrics.responseTimes.length > 0
        ? Math.max(...user.metrics.responseTimes)
        : 0;
      
      user.metrics.minResponseTime = user.metrics.responseTimes.length > 0
        ? Math.min(...user.metrics.responseTimes)
        : 0;
      
      user.metrics.uniqueActionsCount = user.metrics.uniqueActions.size;
      
      this.results.users.push(user);
      this.activeUsers--;
    }
  }

  // Démarrage progressif des utilisateurs (ramp-up)
  async startRampUp() {
    console.log('⬆️ Démarrage progressif des utilisateurs...');
    
    const usersPerInterval = Math.ceil(this.config.concurrentUsers / (this.config.rampUpTime / 1000));
    const interval = Math.floor(1000 / usersPerInterval);
    
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      setTimeout(async () => {
        if (this.isRunning) {
          this.activeUsers++;
          await this.simulateUserSession(i);
        }
      }, i * interval);
    }
  }

  // Collecte des métriques en temps réel
  collectMetrics() {
    if (!this.isRunning) return;
    
    const currentTime = Date.now();
    const activeUserCount = this.activeUsers;
    
    // Calculer les métriques globales
    const allResponseTimes = this.results.users.flatMap(user => user.metrics.responseTimes);
    const allErrors = this.results.users.flatMap(user => user.metrics.errors);
    
    const globalMetrics = {
      timestamp: currentTime,
      activeUsers: activeUserCount,
      totalRequests: allResponseTimes.length,
      successfulRequests: allResponseTimes.length - allErrors.length,
      failedRequests: allErrors.length,
      averageResponseTime: allResponseTimes.length > 0 
        ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length 
        : 0,
      maxResponseTime: allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0,
      minResponseTime: allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : Infinity,
      errorRate: allResponseTimes.length > 0 ? (allErrors.length / allResponseTimes.length) * 100 : 0
    };
    
    this.results.timeline.push(globalMetrics);
    
    // Afficher le statut en temps réel
    if (this.results.timeline.length % 10 === 0) {
      console.log(`📊 [${new Date().toLocaleTimeString()}] Utilisateurs actifs: ${activeUserCount}, Avg Response: ${globalMetrics.averageResponseTime.toFixed(2)}ms, Error Rate: ${globalMetrics.errorRate.toFixed(2)}%`);
    }
  }

  // Démarrage de la simulation
  async start() {
    if (this.isRunning) {
      console.warn('⚠️ La simulation est déjà en cours d\'exécution');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 Démarrage de la simulation d\'utilisateurs concurrents...');
    console.log(`📊 Configuration: ${this.config.concurrentUsers} utilisateurs, ${this.config.testDuration/1000}s de durée`);
    
    // Initialiser le navigateur
    await this.initialize();
    
    // Démarrer la collecte de métriques
    const metricsInterval = setInterval(() => {
      this.collectMetrics();
      
      // Arrêter si le temps est écoulé
      if (this.results.timeline.length > 0) {
        const elapsed = Date.now() - this.results.timeline[0].timestamp;
        if (elapsed >= this.config.testDuration) {
          this.stop();
        }
      }
    }, 1000);
    
    // Démarrer le ramp-up
    await this.startRampUp();
    
    return new Promise((resolve) => {
      this.metricsInterval = metricsInterval;
      this.resolve = resolve;
    });
  }

  // Arrêt de la simulation
  stop() {
    if (!this.isRunning) return;
    
    console.log('⏹️ Arrêt de la simulation...');
    this.isRunning = false;
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    setTimeout(async () => {
      if (this.browser) {
        await this.browser.close();
      }
      
      // Finaliser les métriques
      this.finalizeMetrics();
      
      // Générer le rapport
      await this.generateReport();
      
      console.log('✅ Simulation terminée');
      if (this.resolve) {
        this.resolve(this.results);
      }
    }, 2000);
  }

  // Finalisation des métriques
  finalizeMetrics() {
    const allUsers = this.results.users;
    const allResponseTimes = allUsers.flatMap(user => user.metrics.responseTimes);
    const allErrors = allUsers.flatMap(user => user.metrics.errors);
    
    this.results.metrics = {
      totalUsers: allUsers.length,
      totalRequests: allResponseTimes.length,
      successfulRequests: allResponseTimes.length - allErrors.length,
      failedRequests: allErrors.length,
      averageResponseTime: allResponseTimes.length > 0 
        ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length 
        : 0,
      maxResponseTime: allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0,
      minResponseTime: allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : Infinity,
      throughput: allResponseTimes.length / (this.config.testDuration / 1000), // requests per second
      errorRate: allResponseTimes.length > 0 ? (allErrors.length / allResponseTimes.length) * 100 : 0,
      averageSessionDuration: allUsers.length > 0 
        ? allUsers.reduce((sum, user) => sum + user.sessionDuration, 0) / allUsers.length 
        : 0,
      averageInteractionsPerUser: allUsers.length > 0
        ? allUsers.reduce((sum, user) => sum + user.metrics.interactions, 0) / allUsers.length
        : 0,
      uniqueActionsCount: allUsers.length > 0
        ? allUsers.reduce((sum, user) => sum + user.metrics.uniqueActionsCount, 0) / allUsers.length
        : 0,
      errorTypes: this.categorizeErrors(allErrors)
    };
  }

  // Catégorisation des erreurs
  categorizeErrors(errors) {
    const categories = {};
    errors.forEach(error => {
      const category = error.includes('timeout') ? 'timeout' :
                     error.includes('network') ? 'network' :
                     error.includes('selector') ? 'selector' :
                     error.includes('element') ? 'element' : 'other';
      
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  // Génération du rapport de test
  async generateReport() {
    console.log('📄 Génération du rapport de test...');
    
    const report = {
      testInfo: {
        timestamp: new Date().toISOString(),
        configuration: this.config,
        duration: this.config.testDuration,
        concurrentUsers: this.config.concurrentUsers
      },
      summary: this.results.metrics,
      timeline: this.results.timeline,
      userDetails: this.results.users.map(user => ({
        id: user.id,
        sessionDuration: user.sessionDuration,
        interactions: user.metrics.interactions,
        pageViews: user.metrics.pageViews,
        averageResponseTime: user.metrics.averageResponseTime,
        maxResponseTime: user.metrics.maxResponseTime,
        errors: user.metrics.errors.length,
        uniqueActionsCount: user.metrics.uniqueActionsCount
      })),
      performance: {
        responseTimeDistribution: this.calculateResponseTimeDistribution(),
        errorAnalysis: this.results.metrics.errorTypes,
        scenarioPerformance: this.calculateScenarioPerformance()
      }
    };
    
    // Sauvegarder le rapport JSON
    const reportPath = path.join(__dirname, 'results', `concurrent-users-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Générer un rapport HTML
    await this.generateHTMLReport(report);
    
    console.log(`📊 Rapport sauvegardé: ${reportPath}`);
  }

  // Calcul de la distribution des temps de réponse
  calculateResponseTimeDistribution() {
    const allResponseTimes = this.results.users.flatMap(user => user.metrics.responseTimes);
    const sorted = [...allResponseTimes].sort((a, b) => a - b);
    
    return {
      p50: this.percentile(sorted, 50),
      p75: this.percentile(sorted, 75),
      p90: this.percentile(sorted, 90),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99)
    };
  }

  // Calcul d'un percentile
  percentile(sortedArray, percent) {
    const index = Math.ceil((percent / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  // Calcul de la performance par scénario
  calculateScenarioPerformance() {
    const scenarioMetrics = {};
    
    this.results.users.forEach(user => {
      user.actions.forEach(action => {
        if (!scenarioMetrics[action.scenario]) {
          scenarioMetrics[action.scenario] = {
            totalActions: 0,
            successfulActions: 0,
            totalResponseTime: 0,
            responseTimes: []
          };
        }
        
        scenarioMetrics[action.scenario].totalActions++;
        if (action.success) {
          scenarioMetrics[action.scenario].successfulActions++;
        }
        scenarioMetrics[action.scenario].totalResponseTime += action.responseTime;
        scenarioMetrics[action.scenario].responseTimes.push(action.responseTime);
      });
    });
    
    // Calculer les moyennes
    Object.keys(scenarioMetrics).forEach(scenario => {
      const metrics = scenarioMetrics[scenario];
      metrics.successRate = (metrics.successfulActions / metrics.totalActions) * 100;
      metrics.averageResponseTime = metrics.totalResponseTime / metrics.totalActions;
    });
    
    return scenarioMetrics;
  }

  // Génération du rapport HTML
  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Test de Charge UI</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .chart-container { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .section { margin: 30px 0; }
        .section h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .status-success { color: #28a745; }
        .status-error { color: #dc3545; }
        .status-warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Rapport de Test de Charge UI</h1>
            <p>Simulation d'utilisateurs concurrents - ${new Date(report.testInfo.timestamp).toLocaleString('fr-FR')}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Utilisateurs Concurrents</div>
                <div class="metric-value">${report.testInfo.concurrentUsers}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Durée du Test</div>
                <div class="metric-value">${(report.testInfo.duration / 1000).toFixed(0)}s</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Requêtes Totales</div>
                <div class="metric-value">${report.summary.totalRequests.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Taux de Succès</div>
                <div class="metric-value">${(100 - report.summary.errorRate).toFixed(1)}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Temps de Réponse Moyen</div>
                <div class="metric-value">${report.summary.averageResponseTime.toFixed(2)}ms</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Throughput</div>
                <div class="metric-value">${report.summary.throughput.toFixed(1)} req/s</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>📈 Évolution du Temps de Réponse</h3>
            <canvas id="responseTimeChart" width="400" height="200"></canvas>
        </div>
        
        <div class="chart-container">
            <h3>👥 Évolution des Utilisateurs Actifs</h3>
            <canvas id="activeUsersChart" width="400" height="200"></canvas>
        </div>
        
        <div class="section">
            <h2>🎯 Performance par Scénario</h2>
            <table>
                <thead>
                    <tr>
                        <th>Scénario</th>
                        <th>Actions</th>
                        <th>Taux de Succès</th>
                        <th>Temps Moyen</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(report.performance.scenarioPerformance).map(([scenario, metrics]) => `
                        <tr>
                            <td>${scenario}</td>
                            <td>${metrics.totalActions}</td>
                            <td class="${metrics.successRate > 95 ? 'status-success' : metrics.successRate > 80 ? 'status-warning' : 'status-error'}">${metrics.successRate.toFixed(1)}%</td>
                            <td>${metrics.averageResponseTime.toFixed(2)}ms</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>⚡ Distribution des Temps de Réponse</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">50th Percentile</div>
                    <div class="metric-value">${report.performance.responseTimeDistribution.p50.toFixed(2)}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">95th Percentile</div>
                    <div class="metric-value">${report.performance.responseTimeDistribution.p95.toFixed(2)}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">99th Percentile</div>
                    <div class="metric-value">${report.performance.responseTimeDistribution.p99.toFixed(2)}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Maximum</div>
                    <div class="metric-value">${report.summary.maxResponseTime.toFixed(2)}ms</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>❌ Analyse des Erreurs</h2>
            <table>
                <thead>
                    <tr>
                        <th>Type d'Erreur</th>
                        <th>Nombre</th>
                        <th>Pourcentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(report.performance.errorAnalysis).map(([type, count]) => `
                        <tr>
                            <td>${type}</td>
                            <td>${count}</td>
                            <td>${((count / report.summary.failedRequests) * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        // Graphique du temps de réponse
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(report.timeline.map((_, i) => i + 's'))},
                datasets: [{
                    label: 'Temps de Réponse Moyen (ms)',
                    data: ${JSON.stringify(report.timeline.map(t => t.averageResponseTime))},
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Graphique des utilisateurs actifs
        const activeUsersCtx = document.getElementById('activeUsersChart').getContext('2d');
        new Chart(activeUsersCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(report.timeline.map((_, i) => i + 's'))},
                datasets: [{
                    label: 'Utilisateurs Actifs',
                    data: ${JSON.stringify(report.timeline.map(t => t.activeUsers))},
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: ${this.config.concurrentUsers}
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    
    const htmlPath = path.join(__dirname, 'results', `concurrent-users-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, html);
  }
}

// Fonction principale pour exécuter le test
async function runConcurrentUserTest(config = CONFIG) {
  console.log('🚀 Démarrage du test de charge des utilisateurs concurrents...');
  
  const simulator = new ConcurrentUserSimulator(config);
  
  try {
    const results = await simulator.start();
    console.log('✅ Test terminé avec succès!');
    return results;
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  }
}

// Fonction pour créer un script de test personnalisé
function createCustomTest(config) {
  return {
    config: { ...CONFIG, ...config },
    simulator: null,
    
    async start() {
      this.simulator = new ConcurrentUserSimulator(this.config);
      return await this.simulator.start();
    },
    
    stop() {
      if (this.simulator) {
        this.simulator.stop();
      }
    }
  };
}

// Exports pour utilisation externe
module.exports = {
  ConcurrentUserSimulator,
  runConcurrentUserTest,
  createCustomTest,
  CONFIG
};

// Exécution directe si le script est lancé directement
if (require.main === module) {
  (async () => {
    try {
      const results = await runConcurrentUserTest();
      console.log('🎉 Test de charge terminé avec succès!');
      console.log('📊 Résultats disponibles dans le dossier results/');
    } catch (error) {
      console.error('💥 Échec du test de charge:', error);
      process.exit(1);
    }
  })();
}