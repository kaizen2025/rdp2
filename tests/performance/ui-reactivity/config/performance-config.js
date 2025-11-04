// Configuration globale pour les tests de performance UI
module.exports = {
  // Seuils de performance (en millisecondes)
  performanceThresholds: {
    // Interactions utilisateur
    clickResponse: 16, // 60fps
    formInput: 50,
    filterResponse: 100,
    menuNavigation: 150,
    
    // Animations
    animationFrame: 16.67, // 60fps
    animationDuration: 300,
    transitionTime: 250,
    
    // Virtual DOM
    render1000: 50,
    render10000: 200,
    render100000: 1000,
    filter1000: 30,
    filter10000: 100,
    
    // Menus dynamiques
    menuGeneration: 100,
    menuSearch: 80,
    menuFilter: 60,
    menuNavigationVirtualized: 50,
    
    // WebSocket notifications
    websocketConnection: 100,
    notificationLatency: 50,
    notificationThroughput: 1000, // msg/sec
    notificationQueue: 200
  },

  // Configuration des benchmarks
  benchmarks: {
    // Datasets de test
    datasetSizes: [100, 500, 1000, 5000, 10000, 50000, 100000],
    userCounts: [1, 5, 10, 25, 50, 100, 200],
    durations: [1000, 5000, 10000, 30000, 60000, 300000], // 1s à 5min
    
    // Métriques à collecter
    metrics: [
      'responseTime',
      'throughput',
      'memoryUsage',
      'cpuUsage',
      'errorRate',
      'fps',
      'renderTime',
      'interactionLatency'
    ]
  },

  // Scénarios de test utilisateur
  userScenarios: {
    light: {
      users: 10,
      duration: 30000,
      actions: ['navigation', 'simpleClick', 'formInput']
    },
    moderate: {
      users: 50,
      duration: 60000,
      actions: ['navigation', 'menuNavigation', 'listInteraction', 'formInteraction']
    },
    heavy: {
      users: 100,
      duration: 120000,
      actions: ['navigation', 'menuNavigation', 'listInteraction', 'formInteraction', 'realtimeUpdates']
    },
    extreme: {
      users: 200,
      duration: 300000,
      actions: ['navigation', 'menuNavigation', 'listInteraction', 'formInteraction', 'realtimeUpdates', 'concurrentEditing']
    }
  },

  // Configuration des mocks
  mocks: {
    webSocket: {
      connectionDelay: 50,
      messageLatency: 20,
      errorRate: 0.01, // 1%
      reconnectAttempts: 3
    },
    api: {
      responseDelay: 100,
      errorRate: 0.02, // 2%
      rateLimit: 1000 // requests/minute
    },
    animation: {
      frameDuration: 16.67,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    }
  },

  // Configuration de reporting
  reporting: {
    formats: ['json', 'html', 'csv'],
    outputDirectory: './results',
    includeCharts: true,
    includeTimeline: true,
    includeErrorDetails: true,
    includePerformanceMetrics: true
  }
};