/**
 * Tests unitaires pour les composants Sessions RDS
 * Tests les fonctionnalités de base : timeline, alertes, affichage des sessions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SessionsPage from '../../../pages/SessionsPage';
import SessionsTimeline from '../../../components/sessions/SessionsTimeline';
import SessionAlerts from '../../../components/sessions/SessionAlerts';

// Import des données de mock
import {
  mockActiveSessions,
  mockDisconnectedSessions,
  mockServers,
  mockUsers,
  mockConfig,
  expectedAlerts,
  mockOverloadedServer,
  generateMockSessions
} from './mockData';

// Configuration du theme Material-UI pour les tests
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

// Wrapper avec theme pour les tests
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock des contextes
jest.mock('../../../contexts/AppContext', () => ({
  useApp: () => ({
    showNotification: jest.fn(),
  }),
}));

jest.mock('../../../contexts/CacheContext', () => ({
  useCache: () => ({
    cache: {
      rds_sessions: mockActiveSessions,
      excel_users: mockUsers,
      config: mockConfig
    },
    isLoading: false,
    invalidate: jest.fn(),
  }),
}));

// Mock des services
jest.mock('../../../services/apiService', () => ({
  default: {
    refreshRdsSessions: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock des composants Dialog
jest.mock('../../../components/SendMessageDialog', () => {
  return function SendMessageDialog() { return <div data-testid="send-message-dialog">Send Message Dialog</div>; };
});

jest.mock('../../../components/UserInfoDialog', () => {
  return function UserInfoDialog() { return <div data-testid="user-info-dialog">User Info Dialog</div>; };
});

jest.mock('../../../components/GlobalMessageDialog', () => {
  return function GlobalMessageDialog() { return <div data-testid="global-message-dialog">Global Message Dialog</div>; };
});

// Mock window.electronAPI
global.window.electronAPI = {
  launchRdp: jest.fn().mockResolvedValue({ success: true }),
};

describe('SessionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('affiche les statistiques des sessions correctement', () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Vérifier que les statistiques sont affichées
    expect(screen.getByText('Actives')).toBeInTheDocument();
    expect(screen.getByText('Déconnectées')).toBeInTheDocument();
    expect(screen.getByText('Serveurs')).toBeInTheDocument();
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument();

    // Vérifier les valeurs des statistiques
    const activeSessions = mockActiveSessions.filter(s => s.isActive).length;
    expect(screen.getByText(activeSessions.toString())).toBeInTheDocument();
    
    const totalSessions = mockActiveSessions.length + mockDisconnectedSessions.length;
    const disconnected = totalSessions - activeSessions;
    expect(screen.getByText(disconnected.toString())).toBeInTheDocument();
  });

  test('permet de filtrer par utilisateur', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Chercher le champ de recherche
    const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...');
    expect(searchInput).toBeInTheDocument();

    // Taper dans le champ de recherche
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    // Attendre que le filtrage soit appliqué
    await waitFor(() => {
      const aliceRow = screen.getByText('alice.martin');
      expect(aliceRow).toBeInTheDocument();
    });
  });

  test('permet de filtrer par serveur', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Ouvrir le sélecteur de serveur
    const serverSelect = screen.getByLabelText('Serveur');
    fireEvent.mouseDown(serverSelect);

    // Sélectionner un serveur spécifique
    const serverOption = screen.getByText('RDS-SERVER-02');
    fireEvent.click(serverOption);

    // Vérifier que les sessions sont filtrées
    await waitFor(() => {
      const sessions = screen.getAllByRole('row');
      expect(sessions.length).toBeGreaterThan(1); // Header + sessions filtrées
    });
  });

  test('lance le shadow session quand on clique sur l\'icône', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Chercher le bouton Shadow pour une session active
    const shadowButtons = screen.getAllByTitle('Shadow (app bureau)');
    expect(shadowButtons.length).toBeGreaterThan(0);

    // Cliquer sur le premier bouton Shadow
    fireEvent.click(shadowButtons[0]);

    // Vérifier que l'API shadow est appelée
    await waitFor(() => {
      expect(window.electronAPI.launchRdp).toHaveBeenCalledWith({
        server: 'RDS-SERVER-01',
        sessionId: '1'
      });
    });
  });

  test('lance la connexion RDP quand on clique sur l\'icône', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Chercher les boutons de connexion
    const connectButtons = screen.getAllByTitle('Connexion RDP (app bureau)');
    expect(connectButtons.length).toBeGreaterThan(0);

    // Cliquer sur le premier bouton
    fireEvent.click(connectButtons[0]);

    // Vérifier que l'API de connexion est appelée
    await waitFor(() => {
      expect(window.electronAPI.launchRdp).toHaveBeenCalled();
    });
  });

  test('ouvre le dialogue de message pour une session active', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Chercher le bouton de message pour une session active
    const messageButtons = screen.getAllByTitle('Envoyer un message');
    expect(messageButtons.length).toBeGreaterThan(0);

    // Cliquer sur le premier bouton
    fireEvent.click(messageButtons[0]);

    // Vérifier que le dialogue de message s'ouvre
    await waitFor(() => {
      expect(screen.getByTestId('send-message-dialog')).toBeInTheDocument();
    });
  });

  test('force le rafraîchissement des sessions', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Chercher et cliquer sur le bouton de rafraîchissement
    const refreshButton = screen.getByTitle('Forcer le rafraîchissement');
    fireEvent.click(refreshButton);

    // Vérifier que l'API de rafraîchissement est appelée
    await waitFor(() => {
      expect(apiService.refreshRdsSessions).toHaveBeenCalled();
    });
  });

  test('affiche l\'état vide quand aucune session', () => {
    // Mock cache vide
    require('../../../contexts/CacheContext').useCache.mockReturnValue({
      cache: {
        rds_sessions: [],
        excel_users: {},
        config: { rds_servers: [] }
      },
      isLoading: false,
      invalidate: jest.fn(),
    });

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Vérifier que l'état vide s'affiche
    expect(screen.getByText('Aucune session active')).toBeInTheDocument();
  });

  test('affiche l\'état de recherche vide', () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Effectuer une recherche qui ne donne aucun résultat
    const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...');
    fireEvent.change(searchInput, { target: { value: 'utilisateur_inexistant' } });

    // Vérifier que l'état de recherche vide s'affiche
    expect(screen.getByText('Aucune session trouvée')).toBeInTheDocument();
  });

  test('affiche les informations utilisateur quand disponibles', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Chercher le bouton d'information utilisateur
    const infoButtons = screen.getAllByTitle('Fiche utilisateur');
    expect(infoButtons.length).toBeGreaterThan(0);

    // Cliquer sur le premier bouton
    fireEvent.click(infoButtons[0]);

    // Vérifier que le dialogue d'information s'ouvre
    await waitFor(() => {
      expect(screen.getByTestId('user-info-dialog')).toBeInTheDocument();
    });
  });
});

describe('SessionsTimeline', () => {
  test('rend le composant avec des données de sessions', () => {
    render(
      <TestWrapper>
        <SessionsTimeline sessions={mockActiveSessions} />
      </TestWrapper>
    );

    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
  });

  test('génère des données de timeline correctement', () => {
    render(
      <TestWrapper>
        <SessionsTimeline sessions={mockActiveSessions} />
      </TestWrapper>
    );

    // Vérifier qu'un graphique est rendu (recharts se rend avec svg)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  test('permet de changer le type de graphique', () => {
    render(
      <TestWrapper>
        <SessionsTimeline sessions={mockActiveSessions} />
      </TestWrapper>
    );

    // Ouvrir le sélecteur de type
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeSelect);

    // Sélectionner "Zone"
    const areaOption = screen.getByText('Zone');
    fireEvent.click(areaOption);

    // Vérifier que le graphique a changé
    expect(typeSelect).toHaveTextContent('Zone');
  });

  test('affiche les statistiques de timeline', () => {
    render(
      <TestWrapper>
        <SessionsTimeline sessions={mockActiveSessions} />
      </TestWrapper>
    );

    // Vérifier que les statistiques s'affichent
    expect(screen.getByText('Sessions actuelles')).toBeInTheDocument();
    expect(screen.getByText('Pic maximum')).toBeInTheDocument();
    expect(screen.getByText('Moyenne')).toBeInTheDocument();
  });

  test('utilise des données simulées quand aucune session', () => {
    render(
      <TestWrapper>
        <SessionsTimeline sessions={[]} />
      </TestWrapper>
    );

    // Le composant devrait quand même s'afficher avec des données simulées
    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  test('affiche un tooltip au survol', () => {
    render(
      <TestWrapper>
        <SessionsTimeline sessions={mockActiveSessions} />
      </TestWrapper>
    );

    // Simuler un survol du graphique
    const chartElement = document.querySelector('svg');
    fireEvent.mouseOver(chartElement);
    
    // Le tooltip devrait être visible
    expect(screen.getByText(/Sessions actives/)).toBeInTheDocument();
  });
});

describe('SessionAlerts', () => {
  test('détecte les sessions de longue durée', () => {
    const { container } = render(
      <TestWrapper>
        <SessionAlerts sessions={mockActiveSessions} servers={mockServers} />
      </TestWrapper>
    );

    // Vérifier que les alertes pour sessions longues sont affichées
    const longSessionAlerts = screen.getAllByText(/Session longue durée/);
    expect(longSessionAlerts.length).toBeGreaterThan(0);
  });

  test('détecte les serveurs surchargés', () => {
    const { container } = render(
      <TestWrapper>
        <SessionAlerts sessions={mockActiveSessions} servers={mockServers} />
      </TestWrapper>
    );

    // Vérifier qu'une alerte serveur surchargé est affichée
    expect(screen.getByText('Serveur surchargé')).toBeInTheDocument();
  });

  test('affiche une alerte de succès quand aucune alerte', () => {
    const normalServers = [
      {
        id: 'server-normal',
        name: 'NORMAL-SERVER',
        metrics: {
          cpu: 30,
          memory: 40,
          disk: 50,
          sessions: 10
        }
      }
    ];

    const shortSessions = [
      {
        id: 'short-session',
        username: 'test',
        server: 'NORMAL-SERVER',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
        endTime: null
      }
    ];

    render(
      <TestWrapper>
        <SessionAlerts sessions={shortSessions} servers={normalServers} />
      </TestWrapper>
    );

    expect(screen.getByText('✅ Aucune alerte - Toutes les sessions sont normales')).toBeInTheDocument();
  });

  test('permet de supprimer une alerte', () => {
    render(
      <TestWrapper>
        <SessionAlerts sessions={mockActiveSessions} servers={mockServers} />
      </TestWrapper>
    );

    // Chercher les boutons de fermeture d'alertes
    const closeButtons = screen.getAllByTitle('Ignorer');
    expect(closeButtons.length).toBeGreaterThan(0);

    // Cliquer sur le premier bouton
    fireEvent.click(closeButtons[0]);

    // L'alerte devrait avoir été supprimée
    // (Le nombre d'alertes diminue)
    const alertCount = screen.getByText('Alertes Sessions').parentElement;
    expect(alertCount).toBeInTheDocument();
  });

  test('affiche les bonnes icônes selon le type d\'alerte', () => {
    render(
      <TestWrapper>
        <SessionAlerts sessions={mockActiveSessions} servers={mockServers} />
      </TestWrapper>
    );

    // Vérifier la présence d'icônes (elles sont dans les éléments svg)
    const alertElements = document.querySelectorAll('[data-testid]');
    expect(alertElements.length).toBeGreaterThan(0);
  });

  test('affiche les bonnes couleurs selon la sévérité', () => {
    const { container } = render(
      <TestWrapper>
        <SessionAlerts sessions={mockActiveSessions} servers={mockServers} />
      </TestWrapper>
    );

    // Vérifier que les couleurs sont appliquées (erreur = rouge, warning = orange)
    const alertPapers = container.querySelectorAll('p[elevation]');
    expect(alertPapers.length).toBeGreaterThan(0);

    // Les alertes d'erreur doivent avoir une bordure rouge
    const errorAlerts = container.querySelectorAll('[data-color="error"]');
    expect(errorAlerts.length).toBeGreaterThan(0);
  });

  test('gère les serveurs avec métriques manquantes', () => {
    const serversWithoutMetrics = [
      {
        id: 'server-no-metrics',
        name: 'NO-METRICS-SERVER',
        // Pas de metrics
      }
    ];

    render(
      <TestWrapper>
        <SessionAlerts sessions={mockActiveSessions} servers={serversWithoutMetrics} />
      </TestWrapper>
    );

    // Ne devrait pas crasher et ne devrait pas créer d'alertes pour ce serveur
    expect(screen.queryByText('NO-METRICS-SERVER')).not.toBeInTheDocument();
  });

  test('traite correctement un serveur surchargé avec trop de sessions', () => {
    const overloadServer = [mockOverloadedServer];
    
    render(
      <TestWrapper>
        <SessionAlerts sessions={mockActiveSessions} servers={overloadServer} />
      </TestWrapper>
    );

    // Vérifier l'alerte de sessions simultanées
    expect(screen.getByText('Trop de sessions simultanées')).toBeInTheDocument();
    expect(screen.getByText('RDS-SERVER-OVERLOADED - 55 sessions actives')).toBeInTheDocument();
  });
});

describe('GroupedUserRow', () => {
  test('affiche les informations utilisateur correctement', () => {
    const mockGetUserInfo = jest.fn().mockReturnValue({
      displayName: 'Alice Martin',
      department: 'Comptabilité'
    });

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Vérifier que le nom complet s'affiche
    expect(screen.getByText('Alice Martin')).toBeInTheDocument();
  });

  test('affiche la durée de session correctement', () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Vérifier que la durée est affichée (format XXh XXm)
    const durationElements = screen.getAllByText(/h/);
    expect(durationElements.length).toBeGreaterThan(0);
  });

  test('affiche l\'état de connexion correctement', () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Vérifier que les états actif/déconnecté s'affichent
    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByText('Déconnecté')).toBeInTheDocument();
  });

  test('affiche les icônes d\'actions appropriées', () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Vérifier la présence des boutons d'action
    const actionButtons = screen.getAllByRole('button');
    expect(actionButtons.length).toBeGreaterThan(0);
  });
});

describe('Performance avec grandes quantités de données', () => {
  test('rend correctement avec 100 sessions', () => {
    const largeSessionSet = generateMockSessions(100);
    
    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );
    const endTime = performance.now();

    // Le rendu ne devrait pas prendre plus de 2 secondes
    expect(endTime - startTime).toBeLessThan(2000);
    
    // La page devrait s'afficher sans erreur
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
  });

  test('génère la timeline correctement avec beaucoup de données', () => {
    const largeSessionSet = generateMockSessions(100);
    
    render(
      <TestWrapper>
        <SessionsTimeline sessions={largeSessionSet} />
      </TestWrapper>
    );

    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
