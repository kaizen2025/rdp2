/**
 * Fixtures et données de test pour les tests de performance UI
 */

const { TestDataGenerator } = require('../utils/performance-utils');

// Configuration des fixtures
const FIXTURE_CONFIG = {
  // Tailles de datasets standard
  standardSizes: {
    small: 100,
    medium: 1000,
    large: 5000,
    xlarge: 10000,
    xxlarge: 50000
  },

  // Scénarios de test avec données réalistes
  realisticScenarios: {
    dashboard: {
      name: 'Dashboard',
      description: 'Interface de tableau de bord avec métriques et graphiques',
      dataSize: 'medium',
      interactions: ['click', 'scroll', 'filter', 'drillDown']
    },
    
    userManagement: {
      name: 'Gestion Utilisateurs',
      description: 'Interface de gestion avec liste paginée et filtres',
      dataSize: 'large',
      interactions: ['search', 'filter', 'sort', 'bulkActions', 'pagination']
    },
    
    dataTable: {
      name: 'Table de Données',
      description: 'Grande table avec virtualisation et tri',
      dataSize: 'xxlarge',
      interactions: ['virtualScroll', 'sort', 'filter', 'columnResize']
    },
    
    realtimeChat: {
      name: 'Chat en Temps Réel',
      description: 'Interface de messagerie avec notifications WebSocket',
      dataSize: 'medium',
      interactions: ['websocket', 'notifications', 'typing', 'emoji']
    },
    
    formWizard: {
      name: 'Assistant de Formulaire',
      description: 'Formulaire multi-étapes avec validation',
      dataSize: 'small',
      interactions: ['validation', 'navigation', 'autosave', 'progress']
    }
  }
};

// Classe pour gérer les fixtures de test
class TestFixtures {
  constructor() {
    this.cache = new Map();
    this.generators = {
      listItems: new TestDataGenerator(),
      notifications: new TestDataGenerator(),
      menuItems: new TestDataGenerator()
    };
  }

  // Générer des données de liste pour différents scénarios
  generateListData(scenario, size = 'medium') {
    const cacheKey = `list_${scenario}_${size}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const itemCount = FIXTURE_CONFIG.standardSizes[size];
    let data = [];

    switch (scenario) {
      case 'dashboard':
        data = this.generators.listItems.generateListItems(itemCount, {
          includeChildren: false,
          includeMetadata: true,
          categories: ['Sales', 'Marketing', 'Support', 'Development'],
          minScore: 0,
          maxScore: 1000
        }).map(item => ({
          ...item,
          type: 'metric',
          unit: item.category === 'Sales' ? '€' : 
                item.category === 'Marketing' ? 'campaigns' :
                item.category === 'Support' ? 'tickets' : 'commits',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          trendValue: Math.floor(Math.random() * 20) - 10
        }));
        break;

      case 'userManagement':
        data = this.generators.listItems.generateListItems(itemCount, {
          includeChildren: false,
          includeMetadata: true,
          categories: ['Admin', 'User', 'Guest', 'Manager'],
          minScore: 1,
          maxScore: 10
        }).map(item => ({
          ...item,
          type: 'user',
          email: `user${item.id}@example.com`,
          status: item.score > 5 ? 'active' : 'inactive',
          lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          permissions: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => 
            `permission${i}`
          )
        }));
        break;

      case 'dataTable':
        data = this.generators.listItems.generateListItems(itemCount, {
          includeChildren: false,
          includeMetadata: false,
          categories: ['Pending', 'Processing', 'Completed', 'Failed'],
          minScore: 0,
          maxScore: 100
        }).map(item => ({
          ...item,
          type: 'data',
          status: item.category.toLowerCase(),
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          priority: Math.floor(Math.random() * 5) + 1
        }));
        break;

      default:
        data = this.generators.listItems.generateListItems(itemCount);
    }

    this.cache.set(cacheKey, data);
    return data;
  }

  // Générer des notifications pour différents scénarios
  generateNotificationData(scenario, size = 'medium') {
    const cacheKey = `notifications_${scenario}_${size}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const notificationCount = FIXTURE_CONFIG.standardSizes[size];
    let data = [];

    switch (scenario) {
      case 'realtimeChat':
        data = this.generators.notifications.generateNotifications(notificationCount, {
          severities: ['info', 'success', 'warning'],
          types: ['message', 'mention', 'reaction', 'system']
        }).map(item => ({
          ...item,
          user: `user${item.userId % 50}`,
          channel: `channel${item.userId % 10}`,
          messageId: `msg_${item.id}`,
          ...(item.severity === 'warning' ? {
            actions: [{ label: 'Reply', action: 'reply' }]
          } : {})
        }));
        break;

      case 'dashboard':
        data = this.generators.notifications.generateNotifications(notificationCount, {
          severities: ['info', 'success', 'warning', 'error'],
          types: ['alert', 'update', 'system', 'notification']
        }).map(item => ({
          ...item,
          category: item.type === 'alert' ? 'critical' : 'normal',
          component: `component${item.id % 8}`,
          ...(item.severity === 'error' ? {
            stackTrace: `Error at line ${item.id} in component${item.id % 8}.js`
          } : {})
        }));
        break;

      default:
        data = this.generators.notifications.generateNotifications(notificationCount);
    }

    this.cache.set(cacheKey, data);
    return data;
  }

  // Générer des données de menu pour différents scénarios
  generateMenuData(scenario, size = 'medium') {
    const cacheKey = `menu_${scenario}_${size}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const menuItemCount = Math.floor(FIXTURE_CONFIG.standardSizes[size] / 10);
    let data = [];

    switch (scenario) {
      case 'userManagement':
        data = this.generators.menuItems.generateMenuItems(menuItemCount, {
          maxDepth: 3,
          includeIcons: true,
          includeBadges: true,
          categories: ['Users', 'Roles', 'Permissions', 'Groups', 'Settings']
        }).map(item => ({
          ...item,
          route: `/admin/${item.id}`,
          permissions: Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => 
            `perm${i}`
          ),
          recentUsage: Math.floor(Math.random() * 100)
        }));
        break;

      case 'dashboard':
        data = this.generators.menuItems.generateMenuItems(menuItemCount, {
          maxDepth: 2,
          includeIcons: true,
          includeBadges: true,
          categories: ['Overview', 'Analytics', 'Reports', 'Settings']
        }).map(item => ({
          ...item,
          route: `/dashboard/${item.id}`,
          widgetType: ['chart', 'metric', 'list', 'map'][item.id % 4],
          refreshInterval: [30, 60, 300, 600][item.id % 4]
        }));
        break;

      default:
        data = this.generators.menuItems.generateMenuItems(menuItemCount);
    }

    this.cache.set(cacheKey, data);
    return data;
  }

  // Générer des données d'animation pour les tests
  generateAnimationData(scenario) {
    const animations = {
      basic: {
        name: 'Fade In',
        duration: 300,
        easing: 'ease-in-out',
        properties: ['opacity', 'transform'],
        testElements: Array.from({ length: 10 }, (_, i) => ({
          id: i,
          finalStyle: {
            opacity: 1,
            transform: 'translateY(0)'
          },
          initialStyle: {
            opacity: 0,
            transform: 'translateY(20px)'
          }
        }))
      },

      complex: {
        name: 'Multi-Property Animation',
        duration: 500,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        properties: ['transform', 'opacity', 'background-color', 'border-radius'],
        testElements: Array.from({ length: 5 }, (_, i) => ({
          id: i,
          finalStyle: {
            opacity: 1,
            transform: 'scale(1) rotate(0deg)',
            backgroundColor: '#2196f3',
            borderRadius: '8px'
          },
          initialStyle: {
            opacity: 0.3,
            transform: 'scale(0.8) rotate(5deg)',
            backgroundColor: '#f5f5f5',
            borderRadius: '0px'
          }
        }))
      },

      staggered: {
        name: 'Staggered Animation',
        duration: 200,
        stagger: 50,
        easing: 'ease-out',
        properties: ['transform', 'opacity'],
        testElements: Array.from({ length: 8 }, (_, i) => ({
          id: i,
          finalStyle: {
            opacity: 1,
            transform: 'translateX(0)'
          },
          initialStyle: {
            opacity: 0,
            transform: 'translateX(-20px)'
          },
          delay: i * 50
        }))
      }
    };

    return animations[scenario] || animations.basic;
  }

  // Générer des données WebSocket pour les tests
  generateWebSocketData(scenario) {
    const data = {
      connectionEvents: [],
      messageEvents: [],
      errorEvents: []
    };

    switch (scenario) {
      case 'realtimeChat':
        // Simuler les événements de connexion
        data.connectionEvents = [
          { type: 'connect', timestamp: Date.now() - 300000 },
          { type: 'heartbeat', interval: 30000 },
          { type: 'disconnect', timestamp: Date.now() - 120000 },
          { type: 'reconnect', timestamp: Date.now() - 118000 }
        ];

        // Simuler les messages
        for (let i = 0; i < 100; i++) {
          data.messageEvents.push({
            id: i,
            type: i % 10 === 0 ? 'system' : 'message',
            user: `user${Math.floor(Math.random() * 50)}`,
            content: `Message ${i}`,
            timestamp: Date.now() - Math.random() * 300000,
            channel: `channel${Math.floor(Math.random() * 10)}`
          });
        }
        break;

      case 'dashboard':
        // Événements de métriques en temps réel
        for (let i = 0; i < 200; i++) {
          data.messageEvents.push({
            id: i,
            type: 'metric',
            metric: `metric${i % 8}`,
            value: Math.random() * 100,
            timestamp: Date.now() - Math.random() * 60000,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          });
        }

        // Événements d'erreur occasionnels
        for (let i = 0; i < 5; i++) {
          data.errorEvents.push({
            id: i,
            type: 'error',
            message: `Connection timeout for metric${i}`,
            timestamp: Date.now() - Math.random() * 300000,
            severity: 'warning'
          });
        }
        break;

      default:
        // Données génériques
        data.messageEvents = Array.from({ length: 50 }, (_, i) => ({
          id: i,
          type: 'generic',
          content: `Generic message ${i}`,
          timestamp: Date.now() - Math.random() * 60000
        }));
    }

    return data;
  }

  // Nettoyer le cache
  clearCache() {
    this.cache.clear();
  }

  // Précharger des données pour des tests spécifiques
  preloadData(scenarios = Object.keys(FIXTURE_CONFIG.realisticScenarios)) {
    scenarios.forEach(scenario => {
      Object.keys(FIXTURE_CONFIG.standardSizes).forEach(size => {
        this.generateListData(scenario, size);
        this.generateNotificationData(scenario, size);
        this.generateMenuData(scenario, size);
      });
    });
  }

  // Obtenir une statistique sur les données générées
  getDataStats(dataType, scenario) {
    const cacheKeys = Array.from(this.cache.keys())
      .filter(key => key.startsWith(`${dataType}_${scenario}_`));

    const stats = {
      datasets: cacheKeys.length,
      totalItems: 0,
      size: {}
    };

    cacheKeys.forEach(key => {
      const data = this.cache.get(key);
      const size = key.split('_').pop();
      stats.totalItems += data.length;
      stats.size[size] = data.length;
    });

    return stats;
  }
}

// Instance globale des fixtures
const testFixtures = new TestFixtures();

// Précharger les données au démarrage
if (typeof window === 'undefined') {
  // Côté Node.js, précharger les données
  testFixtures.preloadData();
}

module.exports = {
  TestFixtures,
  testFixtures,
  FIXTURE_CONFIG
};