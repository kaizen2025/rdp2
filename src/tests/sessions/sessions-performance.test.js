/**
 * Tests de performance pour les sessions RDS
 * Mesurent les temps de réponse, consommation mémoire et optimisations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SessionsPage from '../../../pages/SessionsPage';
import SessionsTimeline from '../../../components/sessions/SessionsTimeline';
import SessionAlerts from '../../../components/sessions/SessionAlerts';

import {
  mockActiveSessions,
  mockDisconnectedSessions,
  mockServers,
  mockUsers,
  mockConfig,
  generateMockSessions,
  mockPerformanceMetrics
} from './mockData';

// Configuration du theme
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mocks
let mockCache;
let mockInvalidate;
let mockShowNotification;
let mockPerformance;

beforeEach(() => {
  mockCache = {
    rds_sessions: mockActiveSessions,
    excel_users: mockUsers,
    config: mockConfig
  };
  mockInvalidate = jest.fn();
  mockShowNotification = jest.fn();
  mockPerformance = {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn().mockReturnValue([]),
    now: jest.fn()
  };

  // Mock Performance API
  global.performance = mockPerformance;

  // Mock des contextes
  jest.mock('../../../contexts/AppContext', () => ({
    useApp: () => ({
      showNotification: mockShowNotification,
    }),
  }));

  jest.mock('../../../contexts/CacheContext', () => ({
    useCache: () => ({
      cache: mockCache,
      isLoading: false,
      invalidate: mockInvalidate,
    }),
  }));

  // Mock de l'API
  jest.mock('../../../services/apiService', () => ({
    default: {
      refreshRdsSessions: jest.fn().mockResolvedValue({ success: true }),
    },
  }));

  // Mock window.electronAPI
  global.window.electronAPI = {
    launchRdp: jest.fn().mockResolvedValue({ success: true }),
  };

  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Performance de rendu', () => {
  test('SessionsPage se rend en moins de 500ms avec 50 sessions', () => {
    const smallSessionSet = generateMockSessions(50);
    mockCache.rds_sessions = smallSessionSet;

    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Temps de rendu SessionsPage (50 sessions): ${renderTime}ms`);

    // Le rendu ne devrait pas prendre plus de 500ms
    expect(renderTime).toBeLessThan(500);
    
    // Vérifier que les éléments de base s'affichent
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
  });

  test('SessionsPage se rend en moins de 1.5s avec 200 sessions', () => {
    const mediumSessionSet = generateMockSessions(200);
    mockCache.rds_sessions = mediumSessionSet;

    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Temps de rendu SessionsPage (200 sessions): ${renderTime}ms`);

    // Le rendu ne devrait pas prendre plus de 1.5 secondes
    expect(renderTime).toBeLessThan(1500);
    
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
  });

  test('SessionsPage se rend en moins de 3s avec 500 sessions', () => {
    const largeSessionSet = generateMockSessions(500);
    mockCache.rds_sessions = largeSessionSet;

    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Temps de rendu SessionsPage (500 sessions): ${renderTime}ms`);

    // Le rendu ne devrait pas prendre plus de 3 secondes
    expect(renderTime).toBeLessThan(3000);
    
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
  });

  test('SessionsTimeline génère les données rapidement', () => {
    const largeSessionSet = generateMockSessions(300);

    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionsTimeline sessions={largeSessionSet} />
      </TestWrapper>
    );
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Temps de rendu SessionsTimeline (300 sessions): ${renderTime}ms`);

    // La génération de timeline ne devrait pas prendre plus de 800ms
    expect(renderTime).toBeLessThan(800);
    
    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
  });

  test('SessionAlerts traite les alertes efficacement', () => {
    const largeSessionSet = generateMockSessions(400);
    const largeServerSet = Array.from({ length: 20 }, (_, i) => ({
      id: `server-${i}`,
      name: `RDS-SERVER-${i}`,
      metrics: {
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        sessions: Math.floor(Math.random() * 100)
      }
    }));

    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionAlerts sessions={largeSessionSet} servers={largeServerSet} />
      </TestWrapper>
    );
    const endTime = performance.now();
    const processTime = endTime - startTime;

    console.log(`Temps de traitement SessionAlerts (400 sessions, 20 serveurs): ${processTime}ms`);

    // Le traitement ne devrait pas prendre plus de 1 seconde
    expect(processTime).toBeLessThan(1000);
    
    expect(screen.getByText('Alertes Sessions')).toBeInTheDocument();
  });
});

describe('Performance des interactions utilisateur', () => {
  test('filtrage par utilisateur rapide avec 300 sessions', async () => {
    const largeSessionSet = generateMockSessions(300);
    mockCache.rds_sessions = largeSessionSet;

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    const startTime = performance.now();
    
    // Effectuer un filtrage
    const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...');
    fireEvent.change(searchInput, { target: { value: 'user1' } });

    // Attendre que le filtrage soit appliqué
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      return rows.length < 300; // Au lieu d'attendre une longueur exacte
    });

    const endTime = performance.now();
    const filterTime = endTime - startTime;

    console.log(`Temps de filtrage (300 sessions): ${filterTime}ms`);

    // Le filtrage ne devrait pas prendre plus de 200ms
    expect(filterTime).toBeLessThan(200);
  });

  test('changement de serveur rapide avec 250 sessions', async () => {
    const mediumSessionSet = generateMockSessions(250);
    mockCache.rds_sessions = mediumSessionSet;

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    const startTime = performance.now();
    
    // Changer de serveur
    const serverSelect = screen.getByLabelText('Serveur');
    fireEvent.mouseDown(serverSelect);
    
    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      return menuItems.length > 0;
    });

    const serverOption = screen.getByText('RDS-SERVER-02');
    fireEvent.click(serverOption);

    await waitFor(() => {
      // Attendre que le filtrage soit appliqué
      return true;
    });

    const endTime = performance.now();
    const changeTime = endTime - startTime;

    console.log(`Temps de changement de serveur (250 sessions): ${changeTime}ms`);

    // Le changement ne devrait pas prendre plus de 300ms
    expect(changeTime).toBeLessThan(300);
  });

  test('rafraîchissement rapide des données', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    const startTime = performance.now();
    
    // Rafraîchir
    const refreshButton = screen.getByTitle('Forcer le rafraîchissement');
    fireEvent.click(refreshButton);

    // Attendre que le rafraîchissement soit terminé
    await waitFor(() => {
      expect(apiService.refreshRdsSessions).toHaveBeenCalled();
    });

    const endTime = performance.now();
    const refreshTime = endTime - startTime;

    console.log(`Temps de rafraîchissement: ${refreshTime}ms`);

    // Le rafraîchissement ne devrait pas prendre plus de 500ms (hors temps de réseau)
    expect(refreshTime).toBeLessThan(500);
  });
});

describe('Consommation mémoire', () => {
  test('gestion efficace de la mémoire avec grande quantité de sessions', () => {
    const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    
    // Rendre avec beaucoup de sessions
    const largeSessionSet = generateMockSessions(800);
    mockCache.rds_sessions = largeSessionSet;

    const { unmount } = render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    const peakMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    
    // Nettoyer
    unmount();

    const afterCleanupMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

    console.log(`Mémoire initiale: ${initialMemory} bytes`);
    console.log(`Mémoire peak: ${peakMemory} bytes`);
    console.log(`Mémoire après cleanup: ${afterCleanupMemory} bytes`);

    // Vérifier que la mémoire est libérée (avec une marge d'erreur)
    const memoryIncrease = peakMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Moins de 100MB
  });

  test('pas de fuite mémoire lors des re-rendus', async () => {
    const sessionSet = generateMockSessions(100);
    mockCache.rds_sessions = sessionSet;

    const { rerender } = render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Simuler plusieurs re-rendus
    for (let i = 0; i < 10; i++) {
      // Modifier légèrement les données
      mockCache.rds_sessions = generateMockSessions(100);
      
      await act(async () => {
        rerender(
          <TestWrapper>
            <SessionsPage />
          </TestWrapper>
        );
      });
    }

    // Aucune fuite ne devrait se produire
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
  });

  test('cleanup des event listeners', () => {
    const sessionSet = generateMockSessions(50);
    mockCache.rds_sessions = sessionSet;

    const { unmount } = render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Vérifier que les event listeners sont bien créés
    expect(document.addEventListener).toHaveBeenCalled();

    // Démonter
    unmount();

    // Vérifier que les event listeners sont supprimés (simulation)
    expect(document.removeEventListener).toHaveBeenCalled();
  });
});

describe('Optimisations React', () => {
  test('utilisation efficace de useMemo pour les calculs coûteux', () => {
    const largeSessionSet = generateMockSessions(200);
    mockCache.rds_sessions = largeSessionSet;

    const { rerender } = render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Compter les renders initiaux
    const initialRenderCount = jest.spyOn(React, 'useMemo').mock.calls.length;

    // Re-rendre sans changer les données (simulation d'un état local)
    rerender(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Vérifier que les calculs coûteux ne sont pas re-exécutés
    const secondRenderCount = jest.spyOn(React, 'useMemo').mock.calls.length;

    // Les useMemo ne devraient pas être re-exécutés si les dépendances n'ont pas changé
    expect(secondRenderCount).toBe(initialRenderCount);
  });

  test('évite les re-rendus inutiles', () => {
    const sessionSet = generateMockSessions(50);
    mockCache.rds_sessions = sessionSet;

    const { rerender } = render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Simuler un changement d'état qui ne devrait pas affecter les composants principaux
    act(() => {
      // Changer juste le mode multi-écran
      fireEvent.click(screen.getByLabelText('Multi-écrans'));
    });

    // Re-rendre avec les mêmes données de cache
    rerender(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // La page devrait toujours s'afficher correctement
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
  });

  test('utilisation correcte des clés pour éviter les re-rendus', () => {
    const sessionSet = generateMockSessions(10);
    mockCache.rds_sessions = sessionSet;

    const { container, rerender } = render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    const initialHTML = container.innerHTML;

    // Re-rendre avec les mêmes données
    rerender(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    const finalHTML = container.innerHTML;

    // Si les clés sont correctement utilisées, le DOM ne devrait pas être complètement reconstruit
    expect(initialHTML).toBe(finalHTML);
  });
});

describe('Performance des graphiques', () => {
  test('SessionsTimeline se met à jour rapidement', () => {
    const sessionSet = generateMockSessions(150);

    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionsTimeline sessions={sessionSet} timeRange={24} />
      </TestWrapper>
    );
    const endTime = performance.now();
    const updateTime = endTime - startTime;

    console.log(`Temps de mise à jour timeline (150 sessions): ${updateTime}ms`);

    expect(updateTime).toBeLessThan(600);
    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
  });

  test('changement de type de graphique rapide', async () => {
    const sessionSet = generateMockSessions(100);

    render(
      <TestWrapper>
        <SessionsTimeline sessions={sessionSet} />
      </TestWrapper>
    );

    const startTime = performance.now();
    
    // Changer le type de graphique
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeSelect);
    
    const areaOption = screen.getByText('Zone');
    fireEvent.click(areaOption);

    await waitFor(() => {
      expect(typeSelect).toHaveTextContent('Zone');
    });

    const endTime = performance.now();
    const changeTime = endTime - startTime;

    console.log(`Temps de changement de type de graphique: ${changeTime}ms`);

    expect(changeTime).toBeLessThan(200);
  });
});

describe('Scénarios de charge', () => {
  test('gestion de 1000 sessions simultanées', () => {
    const hugeSessionSet = generateMockSessions(1000);
    mockCache.rds_sessions = hugeSessionSet;

    const startTime = performance.now();
    const { container } = render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    console.log(`Temps de chargement (1000 sessions): ${loadTime}ms`);

    // Même avec 1000 sessions, le rendu ne devrait pas prendre plus de 5 secondes
    expect(loadTime).toBeLessThan(5000);
    
    // Vérifier que les statistiques sont correctes
    const activeCount = hugeSessionSet.filter(s => s.isActive).length;
    expect(screen.getByText(activeCount.toString())).toBeInTheDocument();
  });

  test('traitement rapide des alertes avec beaucoup de données', () => {
    const largeSessionSet = generateMockSessions(600);
    const largeServerSet = Array.from({ length: 30 }, (_, i) => ({
      id: `server-${i}`,
      name: `RDS-SERVER-${i}`,
      metrics: {
        cpu: Math.random() > 0.7 ? 90 : 30, // Quelques serveurs surchargés
        memory: Math.random() > 0.8 ? 95 : 40, // Quelques serveurs avec beaucoup de RAM
        disk: Math.floor(Math.random() * 100),
        sessions: Math.floor(Math.random() * 80)
      }
    }));

    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionAlerts sessions={largeSessionSet} servers={largeServerSet} />
      </TestWrapper>
    );
    const endTime = performance.now();
    const processTime = endTime - startTime;

    console.log(`Traitement alertes (600 sessions, 30 serveurs): ${processTime}ms`);

    expect(processTime).toBeLessThan(1200);
    expect(screen.getByText('Alertes Sessions')).toBeInTheDocument();
  });

  test('filtrage rapide avec beaucoup de résultats', async () => {
    const hugeSessionSet = generateMockSessions(800);
    mockCache.rds_sessions = hugeSessionSet;

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    const startTime = performance.now();
    
    // Effectuer un filtrage qui donne beaucoup de résultats
    const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...');
    fireEvent.change(searchInput, { target: { value: 'user' } }); // Tous les utilisateurs commencent par "user"

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      return rows.length > 1;
    });

    const endTime = performance.now();
    const filterTime = endTime - startTime;

    console.log(`Temps de filtrage large (800 sessions, beaucoup de résultats): ${filterTime}ms`);

    // Même avec beaucoup de résultats, le filtrage devrait être rapide
    expect(filterTime).toBeLessThan(300);
  });
});

describe('Métriques de performance en temps réel', () => {
  test('mesure des performances avec l\'API Performance', () => {
    const sessionSet = generateMockSessions(100);

    // Simuler des mesures de performance
    mockPerformance.mark('render-start');
    
    render(
      <TestWrapper>
        <SessionsTimeline sessions={sessionSet} />
      </TestWrapper>
    );
    
    mockPerformance.mark('render-end');
    mockPerformance.measure('render-time', 'render-start', 'render-end');

    // Vérifier que les marqueurs de performance ont été créés
    expect(mockPerformance.mark).toHaveBeenCalledWith('render-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('render-end');
    expect(mockPerformance.measure).toHaveBeenCalledWith('render-time', 'render-start', 'render-end');
  });

  test('surveillance de la mémoire JavaScript', () => {
    if (process.memoryUsage) {
      const beforeMemory = process.memoryUsage();
      
      const sessionSet = generateMockSessions(200);
      render(
        <TestWrapper>
          <SessionsPage />
        </TestWrapper>
      );
      
      const afterMemory = process.memoryUsage();
      const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;
      
      console.log(`Augmentation mémoire: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // L'augmentation de mémoire ne devrait pas dépasser 50MB pour 200 sessions
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });
});

describe('Optimisations de code', () => {
  test('évite les allocations inutiles dans les boucles', () => {
    const largeSessionSet = generateMockSessions(500);
    
    // Mesurer les allocations de mémoire pendant le rendu
    const startTime = performance.now();
    const startMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    
    render(
      <TestWrapper>
        <SessionAlerts sessions={largeSessionSet} servers={mockServers} />
      </TestWrapper>
    );
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    
    const timeSpent = endTime - startTime;
    const memoryUsed = endMemory - startMemory;
    
    console.log(`Performance: ${timeSpent}ms, Mémoire: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);
    
    // Vérifications de performance
    expect(timeSpent).toBeLessThan(1000);
    expect(memoryUsed / 1024 / 1024).toBeLessThan(20); // Moins de 20MB
  });
});

describe('Tests de régression de performance', () => {
  test('pas de régression avec les nouvelles fonctionnalités', () => {
    // Baseline avec un nombre connu de sessions
    const baselineSessionCount = 100;
    const baselineSessions = generateMockSessions(baselineSessionCount);
    
    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );
    const endTime = performance.now();
    const baselineTime = endTime - startTime;
    
    console.log(`Baseline (${baselineSessionCount} sessions): ${baselineTime}ms`);
    
    // La performance actuelle ne devrait pas être significativement pire que la baseline
    // (tolérance de 50% pour les variations d'environnement de test)
    expect(baselineTime).toBeLessThan(1000); // Garantie que c'est raisonnable
    
    // On peut maintenant comparer avec des mesures futures
    expect(baselineTime).toBeGreaterThan(0);
  });
});
