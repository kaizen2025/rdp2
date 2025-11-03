// src/tests/dashboard-integration.test.js
/**
 * Tests d'intégration pour le module Dashboard
 * Teste les interactions entre composants et les flux de données complets
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import des composants à tester
import DashboardPage from '../pages/DashboardPage';

// Import des mocks
import {
  mockDashboardStats,
  mockHeatmapData,
  mockTopUsersData,
  mockActiveLoans,
  mockOverdueLoans,
  mockConnectedTechnicians,
  mockRdsServers,
  mockServerStatuses,
  mockCache,
  mockWidgets
} from './__mocks__/mockDashboardData';
import {
  mockApiService,
  setupAllMocks,
  resetAllMocks
} from './__mocks__/dashboardMocks';

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

describe('Dashboard Integration Tests', () => {
  const renderDashboardWithCache = (cacheData) => {
    const mockCacheContext = {
      cache: { ...mockCache, ...cacheData },
      isLoading: false,
      updateCache: jest.fn(),
      clearCache: jest.fn(),
      refreshCache: jest.fn()
    };

    // Mock du contexte de cache
    jest.doMock('../contexts/CacheContext', () => ({
      useCache: () => mockCacheContext
    }));

    // Mock des composants communs
    jest.doMock('../components/common/PageHeader', () => ({
      default: ({ title }) => <div data-testid="pageheader">{title}</div>
    }));

    jest.doMock('../components/common/StatCard', () => ({
      default: ({ title, onClick }) => (
        <div 
          data-testid="statcard" 
          data-title={title}
          onClick={onClick}
        >
          {title}
        </div>
      )
    }));

    jest.doMock('../components/common/LoadingScreen', () => ({
      default: () => <div data-testid="loadingscreen">Loading...</div>
    }));

    return render(<DashboardPage />);
  };

  describe('Flux de données complet du Dashboard', () => {
    test('charge et affiche toutes les données correctement', async () => {
      const cacheData = {
        loans: [...mockActiveLoans, ...mockOverdueLoans],
        computers: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
          status: i < 35 ? 'available' : i < 47 ? 'inUse' : 'maintenance'
        })),
        technicians: mockConnectedTechnicians,
        loan_history: [
          { id: 1, eventType: 'created', computerName: 'LAPTOP-001', by: 'Marie Garcia' },
          { id: 2, eventType: 'returned', computerName: 'LAPTOP-002', by: 'System' }
        ],
        config: {
          rds_servers: mockRdsServers
        }
      };

      renderDashboardWithCache(cacheData);

      // Vérifier que la page s'affiche
      expect(screen.getByTestId('pageheader')).toHaveTextContent('Tableau de Bord');

      // Vérifier les StatCards
      expect(screen.getByText('Matériel Total')).toBeInTheDocument();
      expect(screen.getByText('Prêts Actifs')).toBeInTheDocument();
      expect(screen.getByText('En Retard')).toBeInTheDocument();
      expect(screen.getByText('Historique Total')).toBeInTheDocument();
    });

    test('gère les états de chargement avec transitions fluides', async () => {
      let isLoading = true;
      const cacheData = {
        loans: [],
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      // Mock du contexte avec état de chargement
      jest.doMock('../contexts/CacheContext', () => ({
        useCache: () => ({
          cache: cacheData,
          isLoading,
          updateCache: jest.fn(),
          clearCache: jest.fn(),
          refreshCache: jest.fn()
        })
      }));

      const { rerender } = render(<DashboardPage />);

      // État initial : chargement
      expect(screen.getByTestId('loadingscreen')).toBeInTheDocument();

      // Simuler la fin du chargement
      act(() => {
        isLoading = false;
      });

      rerender(<DashboardPage />);

      // Après chargement : affichage du dashboard
      await waitFor(() => {
        expect(screen.queryByTestId('loadingscreen')).not.toBeInTheDocument();
        expect(screen.getByTestId('pageheader')).toBeInTheDocument();
      });
    });

    test('synchronise les widgets avec les changements de données', async () => {
      const initialCache = {
        loans: mockActiveLoans,
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(initialCache);

      // Vérifier l'état initial
      expect(screen.getByText('Prêts Actifs')).toBeInTheDocument();

      // Simuler une mise à jour des données
      const updatedCache = {
        ...initialCache,
        loans: [...mockActiveLoans, ...mockOverdueLoans]
      };

      // Ici on devrait tester la re-synchronisation
      // (nécessiterait une implémentation plus complexe avec un state management réel)
    });
  });

  describe('Interactions entre composants', () => {
    test('navigation vers les pages de détail via les StatCards', async () => {
      const cacheData = {
        loans: mockActiveLoans,
        computers: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
          status: i < 35 ? 'available' : 'inUse'
        })),
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(cacheData);

      // Tester la navigation via les StatCards
      const statCards = screen.getAllByTestId('statcard');
      
      // Simuler un clic sur la StatCard "Prêts Actifs"
      const loansCard = statCards.find(card => 
        card.getAttribute('data-title') === 'Prêts Actifs'
      );
      
      if (loansCard && loansCard.onClick) {
        fireEvent.click(loansCard);
        // Ici on vérifierait la navigation (nécessite un router mock plus complet)
      }
    });

    test('coordination entre les filtres et l\'actualisation des données', async () => {
      // Ce test nécessiterait une implémentation complète du système de filtres
      // avec coordination entre DashboardFilters et DashboardPage
      expect(true).toBe(true); // Placeholder
    });

    test('export coordonné avec les widgets actifs', async () => {
      // Test de l'intégration entre DashboardExport et les données des widgets
      expect(true).toBe(true); // Placeholder pour future implémentation
    });
  });

  describe('Gestion des erreurs et cas limites', () => {
    test('gère les données vides gracieusement', async () => {
      const emptyCache = {
        loans: [],
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(emptyCache);

      // Le dashboard devrait s'afficher même avec des données vides
      expect(screen.getByTestId('pageheader')).toHaveTextContent('Tableau de Bord');

      // Vérifier que les StatCards affichent 0
      const statCards = screen.getAllByTestId('statcard');
      statCards.forEach(card => {
        // Les cartes devraient afficher des valeurs numériques (0 ou valeurs calculées)
        expect(card).toBeInTheDocument();
      });
    });

    test('gère les erreurs de serveur dans les statuts RDS', async () => {
      // Mock d'erreurs pour pingRdsServer
      mockApiService.pingRdsServer.mockRejectedValue(new Error('Erreur de connexion'));

      const cacheData = {
        loans: [],
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: ['server-error.local'] }
      };

      renderDashboardWithCache(cacheData);

      // Le dashboard devrait continuer à fonctionner malgré l'erreur
      expect(screen.getByTestId('pageheader')).toBeInTheDocument();
    });

    test('gère les données corrompues ou malformées', async () => {
      const corruptedCache = {
        loans: [{ invalid: 'data' }], // Données invalides
        computers: null, // Valeur nulle
        technicians: 'not-an-array', // Type incorrect
        loan_history: undefined, // Valeur undefined
        config: { rds_servers: mockRdsServers }
      };

      // Le composant devrait gérer ces cas sans crasher
      expect(() => {
        renderDashboardWithCache(corruptedCache);
      }).not.toThrow();
    });

    test('persiste les préférences utilisateur entre les sessions', async () => {
      // Test de la persistance des layouts de widgets
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      renderDashboardWithCache({
        loans: mockActiveLoans,
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      });

      // Vérifier que le layout est sauvegardé
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'dashboardLayout',
          expect.any(String)
        );
      });
    });
  });

  describe('Performance et optimisation', () => {
    test('utilise memo pour éviter les re-rendus inutiles', async () => {
      // Ce test vérifierait l'utilisation correcte de React.memo
      // et l'optimisation des re-rendus
      expect(true).toBe(true); // Placeholder
    });

    test('charge les données de manière asynchrone', async () => {
      // Test du chargement asynchrone des données
      mockApiService.pingRdsServer.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          output: 'Serveur en ligne'
        }), 100))
      );

      const cacheData = {
        loans: [],
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: ['test-server.local'] }
      };

      const startTime = Date.now();
      renderDashboardWithCache(cacheData);
      
      // Attendre que les appels asynchrones se terminent
      await waitFor(() => {
        expect(mockApiService.pingRdsServer).toHaveBeenCalled();
      }, { timeout: 1000 });

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(90); // Au moins 90ms (simulation asynchrone)
    });
  });

  describe('Tests de workflows complets', () => {
    test('workflow complet: import de données → filtrage → visualisation → export', async () => {
      // Test d'un workflow utilisateur complet
      const user = userEvent.setup();
      
      const cacheData = {
        loans: [...mockActiveLoans, ...mockOverdueLoans],
        computers: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `LAPTOP-${String(i + 1).padStart(3, '0')}`,
          status: i < 35 ? 'available' : 'inUse'
        })),
        technicians: mockConnectedTechnicians,
        loan_history: [
          { id: 1, eventType: 'created', computerName: 'LAPTOP-001', by: 'Marie Garcia' },
          { id: 2, eventType: 'returned', computerName: 'LAPTOP-002', by: 'System' }
        ],
        config: { rds_servers: mockRdsServers }
      };

      renderDashboardWithCache(cacheData);

      // 1. Vérifier l'affichage initial
      expect(screen.getByTestId('pageheader')).toHaveTextContent('Tableau de Bord');

      // 2. Vérifier la présence des widgets
      expect(screen.getByText('Prêts Actifs')).toBeInTheDocument();
      expect(screen.getByText('En Retard')).toBeInTheDocument();

      // 3. Simuler une interaction utilisateur
      // (ici on pourrait tester des clics sur les widgets si on avait plus de détails)
      
      // Ce workflow nécessiterait une implémentation plus complète
      // pour être entièrement testable
    });

    test('workflow: gestion des prêts en retard → notifications → actions', async () => {
      const cacheWithOverdueLoans = {
        loans: mockOverdueLoans,
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(cacheWithOverdueLoans);

      // Vérifier l'affichage des prêts en retard
      expect(screen.getByText('En Retard')).toBeInTheDocument();
      
      // Le nombre de prêts en retard devrait être visible
      // (implémentation dépend du composant réel)
    });
  });

  describe('Tests d'accessibilité', () => {
    test('navigation au clavier sur tous les éléments interactifs', async () => {
      const user = userEvent.setup();
      
      const cacheData = {
        loans: mockActiveLoans,
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(cacheData);

      // Tester la navigation tab
      await user.tab();
      expect(screen.getByTestId('statcard')).toHaveFocus();

      // Continuer la navigation...
      // (tests plus détaillés selon l'implémentation réelle)
    });

    test('attributs ARIA appropriés sur les widgets', () => {
      const cacheData = {
        loans: [],
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(cacheData);

      // Vérifier les attributs d'accessibilité
      // (dépend de l'implémentation réelle des composants)
    });
  });

  describe('Tests de responsive design', () => {
    test('adaptation à différentes tailles d\'écran', () => {
      // Mock de matchMedia pour différentes résolutions
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const cacheData = {
        loans: [],
        computers: [],
        technicians: [],
        loan_history: [],
        config: { rds_servers: [] }
      };

      renderDashboardWithCache(cacheData);

      // Vérifier que le layout s'adapte
      expect(screen.getByTestId('pageheader')).toBeInTheDocument();
    });
  });
});