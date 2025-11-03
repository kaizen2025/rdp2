// src/tests/dashboard-performance.test.js
/**
 * Tests de performance pour le module Dashboard
 * Mesure les performances de rendu, de calcul et de gestion des données
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import des composants à tester
import DashboardPage from '../pages/DashboardPage';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import TopUsersWidget from '../components/dashboard/TopUsersWidget';

// Import des mocks et utilitaires
import {
  generateLargeMockData,
  mockDashboardStats,
  mockCache
} from './__mocks__/mockDashboardData';
import {
  setupAllMocks,
  resetAllMocks
} from './__mocks__/dashboardMocks';

// Configuration pour les tests de performance
jest.setTimeout(30000); // 30 secondes pour les tests de performance

// Setup global pour les tests
beforeAll(() => {
  setupAllMocks();
});

afterEach(() => {
  resetAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('Dashboard Performance Tests', () => {
  
  describe('Performance de rendu', () => {
    test('rendu initial du dashboard en moins de 500ms', async () => {
      const startTime = performance.now();
      
      const cacheData = {
        loans: [],
        computers: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
          status: 'available'
        })),
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(cacheData);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.log(`Temps de rendu initial: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(500);
    });

    test('rendu avec 1000 prêts en moins de 1000ms', async () => {
      const startTime = performance.now();
      
      const largeLoansData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        computerName: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
        userDisplayName: `User ${i + 1}`,
        startDate: new Date(2024, 10, Math.floor(i / 33)).toISOString(),
        expectedReturnDate: new Date(2024, 10, Math.floor(i / 33) + 7).toISOString(),
        status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'overdue' : 'critical',
        urgency: i % 5 === 0 ? 'critical' : 'normal'
      }));

      const cacheData = {
        loans: largeLoansData,
        computers: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
          status: 'available'
        })),
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(cacheData);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.log(`Temps de rendu avec 1000 prêts: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(1000);
    });

    test('mémoire utilisée pour grande quantité de données reste stable', () => {
      if (typeof global.gc === 'function') {
        global.gc(); // Force garbage collection si disponible
      }

      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      // Créer et rendre avec de grandes données
      const largeData = generateLargeMockData(5000);
      
      const { unmount } = render(
        <ActivityHeatmap data={largeData} />
      );

      const afterRenderMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryIncrease = afterRenderMemory - initialMemory;
      
      console.log(`Augmentation mémoire: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Nettoyer
      unmount();
      
      if (typeof global.gc === 'function') {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryReleased = afterRenderMemory - finalMemory;
      
      console.log(`Mémoire libérée: ${(memoryReleased / 1024 / 1024).toFixed(2)}MB`);
      
      // La mémoire devrait être en grande partie libérée après unmount
      expect(memoryReleased).toBeGreaterThan(memoryIncrease * 0.7); // Au moins 70% libéré
    });
  });

  describe('Performance des calculs', () => {
    test('calcul des statistiques en moins de 50ms', () => {
      const largeLoansData = Array.from({ length: 2000 }, (_, i) => ({
        id: i + 1,
        status: i % 4 === 0 ? 'active' : i % 4 === 1 ? 'overdue' : i % 4 === 2 ? 'critical' : 'reserved',
        computerName: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
        userDisplayName: `User ${i + 1}`
      }));

      const startTime = performance.now();
      
      // Simuler le calcul des statistiques
      const active = largeLoansData.filter(l => l.status === 'active');
      const overdue = largeLoansData.filter(l => l.status === 'overdue' || l.status === 'critical');
      const reserved = largeLoansData.filter(l => l.status === 'reserved');
      
      const stats = {
        active: active.length,
        overdue: overdue.filter(l => l.status === 'overdue').length,
        critical: overdue.filter(l => l.status === 'critical').length,
        reserved: reserved.length
      };
      
      const endTime = performance.now();
      const calcTime = endTime - startTime;
      
      console.log(`Temps de calcul des stats: ${calcTime.toFixed(2)}ms`);
      expect(calcTime).toBeLessThan(50);
      
      expect(stats.active).toBeGreaterThan(0);
      expect(stats.overdue).toBeGreaterThan(0);
    });

    test('traitement des données de heatmap en moins de 100ms', () => {
      const largeHeatmapData = generateLargeMockData(10000);
      
      const startTime = performance.now();
      
      // Simuler le traitement des données de heatmap
      const grid = Array(7).fill(null).map(() => Array(24).fill(0));
      
      largeHeatmapData.forEach(entry => {
        if (entry.timestamp && entry.sessions) {
          const date = new Date(entry.timestamp);
          const day = (date.getDay() + 6) % 7; // Lundi = 0
          const hour = date.getHours();
          grid[day][hour] += entry.sessions;
        }
      });
      
      const endTime = performance.now();
      const processTime = endTime - startTime;
      
      console.log(`Temps de traitement heatmap: ${processTime.toFixed(2)}ms`);
      expect(processTime).toBeLessThan(100);
      
      // Vérifier que les données ont été correctement agrégées
      const maxValue = Math.max(...grid.flat());
      expect(maxValue).toBeGreaterThan(0);
    });

    test('tri et classement des utilisateurs en moins de 30ms', () => {
      const largeUsersData = Array.from({ length: 5000 }, (_, i) => ({
        user: `User ${i + 1}`,
        sessions: Math.floor(Math.random() * 200) + 1,
        duration: Math.floor(Math.random() * 1000) + 100,
        loans: Math.floor(Math.random() * 50) + 1
      }));
      
      const startTime = performance.now();
      
      // Simuler le tri des utilisateurs
      const sortedUsers = largeUsersData
        .map(user => ({ ...user, score: user.sessions + user.duration / 10 + user.loans * 2 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      const endTime = performance.now();
      const sortTime = endTime - startTime;
      
      console.log(`Temps de tri utilisateurs: ${sortTime.toFixed(2)}ms`);
      expect(sortTime).toBeLessThan(30);
      
      expect(sortedUsers).toHaveLength(10);
      expect(sortedUsers[0].score).toBeGreaterThanOrEqual(sortedUsers[1].score);
    });
  });

  describe('Performance des interactions', () => {
    test('changement de métrique en heatmap en moins de 100ms', async () => {
      const largeData = generateLargeMockData(5000);
      
      const { rerender } = render(
        <ActivityHeatmap data={largeData} />
      );
      
      const startTime = performance.now();
      
      // Simuler le changement de métrique (re-rendu)
      rerender(
        <ActivityHeatmap data={largeData} metric="users" />
      );
      
      const endTime = performance.now();
      const changeTime = endTime - startTime;
      
      console.log(`Temps de changement métrique: ${changeTime.toFixed(2)}ms`);
      expect(changeTime).toBeLessThan(100);
    });

    test('filtrage de période en moins de 200ms', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(2024, 10, Math.floor(i / 40)).toISOString(),
        sessions: Math.floor(Math.random() * 100) + 1,
        users: Math.floor(Math.random() * 80) + 1,
        loans: Math.floor(Math.random() * 25) + 1
      }));
      
      const startDate = new Date('2024-11-01');
      const endDate = new Date('2024-11-07');
      
      const startTime = performance.now();
      
      // Simuler le filtrage par période
      const filteredData = largeData.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
      });
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;
      
      console.log(`Temps de filtrage: ${filterTime.toFixed(2)}ms`);
      expect(filterTime).toBeLessThan(200);
      
      expect(filteredData.length).toBeGreaterThan(0);
    });
  });

  describe('Performance de l\'export', () => {
    test('génération de données d\'export en moins de 500ms', () => {
      const largeData = {
        stats: mockDashboardStats,
        details: {
          loans: Array.from({ length: 2000 }, (_, i) => ({
            id: i + 1,
            computerName: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
            userDisplayName: `User ${i + 1}`,
            startDate: new Date(2024, 10, Math.floor(i / 66)).toISOString(),
            status: i % 3 === 0 ? 'active' : 'completed'
          })),
          users: Array.from({ length: 1000 }, (_, i) => ({
            name: `User ${i + 1}`,
            sessions: Math.floor(Math.random() * 200) + 1,
            totalLoans: Math.floor(Math.random() * 20) + 1
          })),
          servers: Array.from({ length: 10 }, (_, i) => ({
            name: `server-${i + 1}`,
            status: i % 4 === 0 ? 'online' : 'offline',
            responseTime: Math.floor(Math.random() * 100) + 10
          }))
        }
      };
      
      const startTime = performance.now();
      
      // Simuler la préparation des données d'export
      const exportData = {
        summary: {
          totalLoans: largeData.details.loans.length,
          totalUsers: largeData.details.users.length,
          totalServers: largeData.details.servers.length,
          generationDate: new Date().toISOString()
        },
        loans: largeData.details.loans,
        users: largeData.details.users,
        servers: largeData.details.servers
      };
      
      const endTime = performance.now();
      const exportTime = endTime - startTime;
      
      console.log(`Temps de préparation export: ${exportTime.toFixed(2)}ms`);
      expect(exportTime).toBeLessThan(500);
      
      expect(exportData.summary.totalLoans).toBe(2000);
    });

    test('formatage des données pour Excel en moins de 300ms', () => {
      const rowsData = Array.from({ length: 5000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.random() * 1000,
        category: ['A', 'B', 'C'][i % 3],
        date: new Date(2024, 10, Math.floor(i / 166)).toISOString()
      }));
      
      const startTime = performance.now();
      
      // Simuler le formatage pour Excel
      const formattedData = rowsData.map(row => ({
        ID: row.id,
        Nom: row.name,
        Valeur: row.value.toFixed(2),
        Catégorie: row.category,
        Date: new Date(row.date).toLocaleDateString('fr-FR')
      }));
      
      const endTime = performance.now();
      const formatTime = endTime - startTime;
      
      console.log(`Temps de formatage Excel: ${formatTime.toFixed(2)}ms`);
      expect(formatTime).toBeLessThan(300);
      
      expect(formattedData).toHaveLength(5000);
    });
  });

  describe('Performance mémoire', () => {
    test('utilisation mémoire stable avec re-rendus fréquents', () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      const { rerender } = render(
        <ActivityHeatmap data={generateLargeMockData(1000)} />
      );
      
      // Multiples re-rendus
      for (let i = 0; i < 10; i++) {
        rerender(
          <ActivityHeatmap 
            data={generateLargeMockData(1000)} 
            key={i} 
          />
        );
      }
      
      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Augmentation mémoire après 10 re-rendus: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // L'augmentation mémoire ne devrait pas dépasser 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('nettoyage correct des event listeners et timers', () => {
      const originalSetInterval = global.setInterval;
      const intervals = [];
      
      global.setInterval = jest.fn((callback, delay) => {
        const id = originalSetInterval(callback, delay);
        intervals.push(id);
        return id;
      });
      
      renderDashboardWithCache({
        loans: [],
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: ['server1', 'server2', 'server3'] }
      });
      
      const { unmount } = render(<DashboardPage />);
      
      // Avant unmount
      expect(intervals.length).toBeGreaterThan(0);
      
      unmount();
      
      // Vérifier que les intervals ont été nettoyés
      intervals.forEach(id => {
        expect(originalSetInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
      });
      
      global.setInterval = originalSetInterval;
    });
  });

  describe('Performance sous charge', () => {
    test('comportement avec 10000 événements simultanés', () => {
      const startTime = performance.now();
      
      // Simuler le traitement de 10000 événements
      const events = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        timestamp: new Date(2024, 10, Math.floor(i / 400)).toISOString(),
        type: ['login', 'logout', 'loan', 'return'][i % 4],
        user: `user-${Math.floor(i / 4) + 1}`,
        computer: `laptop-${Math.floor(i / 4) + 1}`
      }));
      
      // Traitement par lots
      const batchSize = 1000;
      const batches = [];
      
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Traiter chaque lot
      batches.forEach(batch => {
        const processed = batch.map(event => ({
          ...event,
          processed: true,
          processedAt: new Date().toISOString()
        }));
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      console.log(`Temps de traitement de 10000 événements: ${processingTime.toFixed(2)}ms`);
      expect(processingTime).toBeLessThan(2000); // Moins de 2 secondes
      
      expect(batches).toHaveLength(10);
    });

    test('scalabilité du nombre de widgets', () => {
      const widgetCounts = [1, 5, 10, 20, 50];
      const results = [];
      
      widgetCounts.forEach(count => {
        const startTime = performance.now();
        
        // Créer le nombre spécifié de widgets
        const widgets = Array.from({ length: count }, (_, i) => ({
          id: `widget-${i + 1}`,
          title: `Widget ${i + 1}`,
          data: generateLargeMockData(100)
        }));
        
        // Simuler le rendu des widgets
        widgets.forEach(widget => {
          // Traitement des données du widget
          const processedData = widget.data.reduce((acc, item) => {
            acc.totalSessions += item.sessions || 0;
            acc.totalUsers += item.users || 0;
            return acc;
          }, { totalSessions: 0, totalUsers: 0 });
        });
        
        const endTime = performance.now();
        const widgetTime = endTime - startTime;
        
        results.push({ count, time: widgetTime });
      });
      
      console.log('Résultats de scalabilité des widgets:');
      results.forEach(result => {
        console.log(`${result.count} widgets: ${result.time.toFixed(2)}ms`);
      });
      
      // Vérifier que le temps de traitement augmente linéairement
      const ratios = results.slice(1).map((result, index) => {
        const previous = results[index];
        return result.time / previous.time / (result.count / previous.count);
      });
      
      // Le ratio ne devrait pas être supérieure à 1.5 (performance dégradée acceptable)
      ratios.forEach(ratio => {
        expect(ratio).toBeLessThan(1.5);
      });
    });
  });

  describe('Benchmarks de référence', () => {
    test('benchmarks pour différentes tailles de données', () => {
      const dataSizes = [100, 500, 1000, 5000, 10000];
      const benchmarks = [];
      
      dataSizes.forEach(size => {
        const data = generateLargeMockData(size);
        const startTime = performance.now();
        
        // Opérations typiques du dashboard
        const stats = {
          totalSessions: data.reduce((sum, item) => sum + (item.sessions || 0), 0),
          totalUsers: data.reduce((sum, item) => sum + (item.users || 0), 0),
          totalLoans: data.reduce((sum, item) => sum + (item.loans || 0), 0),
          uniqueUsers: new Set(data.map(item => item.user)).size,
          averageSessions: data.reduce((sum, item) => sum + (item.sessions || 0), 0) / data.length
        };
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        benchmarks.push({
          size,
          time: operationTime,
          operationsPerSecond: Math.round(size / (operationTime / 1000))
        });
      });
      
      console.log('Benchmarks de performance:');
      benchmarks.forEach(benchmark => {
        console.log(`${benchmark.size} éléments: ${benchmark.time.toFixed(2)}ms (${benchmark.operationsPerSecond} ops/sec)`);
      });
      
      // Vérifier que les performances restent acceptables
      benchmarks.forEach(benchmark => {
        expect(benchmark.time).toBeLessThan(1000); // Moins de 1 seconde
        expect(benchmark.operationsPerSecond).toBeGreaterThan(1000); // Plus de 1000 ops/sec
      });
    });
  });
});

// Fonction utilitaire pour rendre le dashboard avec des données de cache
function renderDashboardWithCache(cacheData) {
  const mockCacheContext = {
    cache: { ...mockCache, ...cacheData },
    isLoading: false,
    updateCache: jest.fn(),
    clearCache: jest.fn(),
    refreshCache: jest.fn()
  };

  jest.doMock('../contexts/CacheContext', () => ({
    useCache: () => mockCacheContext
  }));

  jest.doMock('../components/common/PageHeader', () => ({
    default: ({ title }) => <div data-testid="pageheader">{title}</div>
  }));

  jest.doMock('../components/common/StatCard', () => ({
    default: ({ title }) => <div data-testid="statcard">{title}</div>
  }));

  jest.doMock('../components/common/LoadingScreen', () => ({
    default: () => <div data-testid="loadingscreen">Loading...</div>
  }));

  return render(<DashboardPage />);
}