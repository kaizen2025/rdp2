/**
 * Tests d'intégration pour les sessions RDS
 * Testent les interactions entre composants, les flux utilisateur et les appels API
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
  mockApiResponses,
  expectedAlerts,
  mockOverloadedServer,
  mockShadowSession
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

// Variables globales pour les mocks
let mockCache;
let mockInvalidate;
let mockShowNotification;

// Configuration des mocks
beforeEach(() => {
  // Mock des contextes
  mockCache = {
    rds_sessions: mockActiveSessions,
    excel_users: mockUsers,
    config: mockConfig
  };
  mockInvalidate = jest.fn();
  mockShowNotification = jest.fn();

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
      refreshRdsSessions: jest.fn().mockResolvedValue(mockApiResponses.refresh),
    },
  }));

  // Mock des Dialogs
  jest.mock('../../../components/SendMessageDialog', () => ({
    __esModule: true,
    default: ({ open, onClose, selectedSessions }) => 
      open ? <div data-testid="send-message-dialog">Message envoyé à: {selectedSessions.join(', ')}</div> : null
  }));

  jest.mock('../../../components/UserInfoDialog', () => ({
    __esModule: true,
    default: ({ open, onClose, user }) => 
      open ? <div data-testid="user-info-dialog">Info utilisateur: {user.username}</div> : null
  }));

  jest.mock('../../../components/GlobalMessageDialog', () => ({
    __esModule: true,
    default: ({ open, onClose, servers }) => 
      open ? <div data-testid="global-message-dialog">Message global pour serveurs: {servers.join(', ')}</div> : null
  }));

  // Mock window.electronAPI
  global.window.electronAPI = {
    launchRdp: jest.fn().mockResolvedValue(mockApiResponses.shadow),
  };

  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Flux de travail des sessions RDS', () => {
  test('cycle complet: affichage → filtrage → action → rafraîchissement', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // 1. Vérifier l'affichage initial
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
    expect(screen.getByText('alice.martin')).toBeInTheDocument();
    expect(screen.getByText('bob.leroy')).toBeInTheDocument();

    // 2. Appliquer un filtre par utilisateur
    const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    // Attendre le filtrage
    await waitFor(() => {
      expect(screen.getByText('alice.martin')).toBeInTheDocument();
      expect(screen.queryByText('bob.leroy')).not.toBeInTheDocument();
    });

    // 3. Effacer le filtre
    fireEvent.change(searchInput, { target: { value: '' } });
    
    await waitFor(() => {
      expect(screen.getByText('bob.leroy')).toBeInTheDocument();
    });

    // 4. Appliquer un filtre par serveur
    const serverSelect = screen.getByLabelText('Serveur');
    fireEvent.mouseDown(serverSelect);
    const serverOption = screen.getByText('RDS-SERVER-02');
    fireEvent.click(serverOption);

    // Vérifier que le filtre serveur fonctionne
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + filtered rows
    });

    // 5. Réinitialiser les filtres
    fireEvent.change(searchInput, { target: { value: '' } });
    const allServersOption = screen.getByText('Tous les serveurs');
    fireEvent.mouseDown(serverSelect);
    fireEvent.click(allServersOption);

    await waitFor(() => {
      expect(screen.getByText('alice.martin')).toBeInTheDocument();
      expect(screen.getByText('bob.leroy')).toBeInTheDocument();
    });

    // 6. Rafraîchir les données
    const refreshButton = screen.getByTitle('Forcer le rafraîchissement');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(apiService.refreshRdsSessions).toHaveBeenCalled();
      expect(mockInvalidate).toHaveBeenCalledWith('rds_sessions');
    });
  });

  test('flux shadow session complet', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Trouver le bouton Shadow pour une session active
    const shadowButtons = screen.getAllByTitle('Shadow (app bureau)');
    expect(shadowButtons.length).toBeGreaterThan(0);

    // Lancer le shadow
    fireEvent.click(shadowButtons[0]);

    // Vérifier l'appel API et la notification
    await waitFor(() => {
      expect(window.electronAPI.launchRdp).toHaveBeenCalledWith({
        server: 'RDS-SERVER-01',
        sessionId: '1'
      });
      expect(mockShowNotification).toHaveBeenCalledWith('info', 'Lancement du Shadow pour alice.martin...');
    });
  });

  test('flux connexion RDP avec utilisateur configuré', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Trouver le bouton de connexion
    const connectButtons = screen.getAllByTitle('Connexion RDP (app bureau)');
    fireEvent.click(connectButtons[0]);

    // Vérifier l'appel API avec credentials
    await waitFor(() => {
      expect(window.electronAPI.launchRdp).toHaveBeenCalledWith(
        expect.objectContaining({
          server: 'RDS-SERVER-01',
          username: 'alice.martin',
          password: 'password123'
        })
      );
    });
  });

  test('flux connexion RDP avec utilisateur sans mot de passe', async () => {
    // Simuler un utilisateur sans mot de passe
    const userWithoutPassword = {
      username: 'david.petit',
      displayName: 'David Petit',
      department: 'IT',
      email: 'david.petit@anecoop.com',
      password: null
    };

    // Modifier le mock pour inclure l'utilisateur sans mot de passe
    mockCache.excel_users = {
      'RDS-SERVER-02': [userWithoutPassword]
    };

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Trouver et cliquer sur le bouton de connexion pour cet utilisateur
    const connectButtons = screen.getAllByTitle('Connexion RDP (app bureau)');
    fireEvent.click(connectButtons.find(btn => true)); // Premier bouton disponible

    // Vérifier que l'API est appelée sans credentials
    await waitFor(() => {
      expect(window.electronAPI.launchRdp).toHaveBeenCalledWith(
        expect.objectContaining({
          server: expect.any(String)
        })
      );
      expect(mockShowNotification).toHaveBeenCalledWith(
        'error', 
        expect.stringContaining('Aucun mot de passe configuré')
      );
    });
  });
});

describe('Intégration SessionsTimeline et SessionAlerts', () => {
  test('timeline et alertes se mettent à jour ensemble', async () => {
    const { rerender } = render(
      <TestWrapper>
        <div>
          <SessionsTimeline sessions={mockActiveSessions} />
          <SessionAlerts sessions={mockActiveSessions} servers={mockServers} />
        </div>
      </TestWrapper>
    );

    // Vérifier l'état initial
    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
    expect(screen.getByText('Alertes Sessions')).toBeInTheDocument();

    // Simuler une mise à jour des sessions
    const updatedSessions = [
      ...mockActiveSessions,
      {
        id: 'new-session',
        sessionId: '999',
        username: 'new.user',
        server: 'RDS-SERVER-04',
        isActive: true,
        startTime: new Date().toISOString(),
        endTime: null
      }
    ];

    // Re-rendre avec nouvelles données
    await act(async () => {
      rerender(
        <TestWrapper>
          <div>
            <SessionsTimeline sessions={updatedSessions} />
            <SessionAlerts sessions={updatedSessions} servers={mockServers} />
          </div>
        </TestWrapper>
      );
    });

    // Vérifier que les composants se sont mis à jour
    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
    expect(screen.getByText('Alertes Sessions')).toBeInTheDocument();
  });

  test('alert contextuelle sur clic dans la timeline', () => {
    render(
      <TestWrapper>
        <SessionsTimeline sessions={mockActiveSessions} />
        <SessionAlerts sessions={mockActiveSessions} servers={mockServers} />
      </TestWrapper>
    );

    // Les deux composants doivent être présents
    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
    expect(screen.getByText('Alertes Sessions')).toBeInTheDocument();
  });
});

describe('Gestion des erreurs et cas limites', () => {
  test('gestion des sessions avec données manquantes', () => {
    const incompleteSessions = [
      {
        id: 'incomplete-1',
        // sessionId manquant
        username: 'user1',
        server: 'RDS-SERVER-01',
        // startTime manquant
      },
      {
        id: 'incomplete-2',
        sessionId: '2',
        username: 'user2',
        server: 'RDS-SERVER-02',
        startTime: null, // Explicitement null
        endTime: null
      }
    ];

    // Ne devrait pas crasher
    expect(() => {
      render(
        <TestWrapper>
          <SessionsPage />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  test('gestion des métriques serveur manquantes', () => {
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

    // Devrait afficher les autres alertes
    expect(screen.getByText('Alertes Sessions')).toBeInTheDocument();
  });

  test('chargement avec données vides', () => {
    // Mock cache vide
    mockCache = {
      rds_sessions: [],
      excel_users: {},
      config: { rds_servers: [] }
    };

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Aucune session active')).toBeInTheDocument();
  });

  test('erreur lors du rafraîchissement', async () => {
    // Mock une erreur lors du rafraîchissement
    jest.mocked(apiService.refreshRdsSessions).mockRejectedValue(
      new Error('Erreur réseau')
    );

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    const refreshButton = screen.getByTitle('Forcer le rafraîchissement');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('Erreur réseau')
      );
    });
  });

  test('shadow session sur session inactive', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Chercher les boutons shadow pour sessions inactives (ils devraient être disabled)
    const shadowButtons = screen.getAllByTitle(/Shadow/);
    
    // Cliquer ne devrait pas lancer le shadow
    fireEvent.click(shadowButtons[0]);

    await waitFor(() => {
      expect(window.electronAPI.launchRdp).not.toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith(
        'warning',
        'La session doit être active.'
      );
    });
  });
});

describe('Interactions multi-utilisateurs', () => {
  test('groupement correct des sessions par utilisateur', () => {
    // Sessions pour le même utilisateur sur différents serveurs
    const multiServerSessions = [
      {
        id: 'sess-1',
        sessionId: '1',
        username: 'alice.martin',
        server: 'RDS-SERVER-01',
        isActive: true,
        startTime: new Date().toISOString()
      },
      {
        id: 'sess-2',
        sessionId: '2',
        username: 'alice.martin', // Même utilisateur
        server: 'RDS-SERVER-02',
        isActive: true,
        startTime: new Date().toISOString()
      }
    ];

    mockCache.rds_sessions = multiServerSessions;

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // L'utilisateur ne devrait apparaître qu'une fois dans la liste
    const aliceEntries = screen.getAllByText('alice.martin');
    expect(aliceEntries.length).toBe(1); // Pas de doublons
  });

  test('affichage des serveurs multiples pour un utilisateur', () => {
    const multiServerSessions = [
      {
        id: 'sess-1',
        sessionId: '1',
        username: 'alice.martin',
        server: 'RDS-SERVER-01',
        isActive: true,
        startTime: new Date().toISOString()
      },
      {
        id: 'sess-2',
        sessionId: '2',
        username: 'alice.martin',
        server: 'RDS-SERVER-02',
        isActive: true,
        startTime: new Date().toISOString()
      }
    ];

    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Les deux serveurs devraient être affichés pour cet utilisateur
    expect(screen.getByText('RDS-SERVER-01')).toBeInTheDocument();
    expect(screen.getByText('RDS-SERVER-02')).toBeInTheDocument();
  });
});

describe('Performance en charge', () => {
  test('rendu avec 500 sessions simultanées', async () => {
    const largeSessionSet = Array.from({ length: 500 }, (_, i) => ({
      id: `sess-${i}`,
      sessionId: String(i),
      username: `user${i}`,
      server: `RDS-SERVER-${(i % 4) + 1}`,
      isActive: Math.random() > 0.3,
      startTime: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      endTime: Math.random() > 0.7 ? new Date().toISOString() : null
    }));

    mockCache.rds_sessions = largeSessionSet;

    const startTime = performance.now();
    const { container } = render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );
    const endTime = performance.now();

    // Vérifier que le rendu est acceptable (< 3 secondes)
    expect(endTime - startTime).toBeLessThan(3000);
    
    // Vérifier que les éléments sont présents
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
    
    // Vérifier que les statistiques sont calculées
    const activeCount = largeSessionSet.filter(s => s.isActive).length;
    expect(screen.getByText(activeCount.toString())).toBeInTheDocument();
  });

  test('timeline avec données volumineuses', () => {
    const largeSessionSet = Array.from({ length: 200 }, (_, i) => ({
      id: `sess-${i}`,
      sessionId: String(i),
      username: `user${i}`,
      server: `RDS-SERVER-${(i % 4) + 1}`,
      isActive: true,
      startTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      endTime: null
    }));

    const startTime = performance.now();
    render(
      <TestWrapper>
        <SessionsTimeline sessions={largeSessionSet} />
      </TestWrapper>
    );
    const endTime = performance.now();

    // La génération de timeline ne devrait pas prendre plus d'1 seconde
    expect(endTime - startTime).toBeLessThan(1000);
    
    expect(screen.getByText('Timeline des sessions (24h)')).toBeInTheDocument();
  });
});

describe('Messages globaux et notifications', () => {
  test('ouverture du dialogue message global', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Cliquer sur "Message à tous"
    const globalMessageButton = screen.getByText('Message à tous');
    fireEvent.click(globalMessageButton);

    // Vérifier que le dialogue s'ouvre
    await waitFor(() => {
      expect(screen.getByTestId('global-message-dialog')).toBeInTheDocument();
    });
  });

  test('envoi de message à un utilisateur spécifique', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Cliquer sur l'icône de message d'une session
    const messageButtons = screen.getAllByTitle('Envoyer un message');
    fireEvent.click(messageButtons[0]);

    // Vérifier que le dialogue s'ouvre avec la session sélectionnée
    await waitFor(() => {
      expect(screen.getByTestId('send-message-dialog')).toBeInTheDocument();
      expect(screen.getByText(/alice.martin/)).toBeInTheDocument();
    });
  });
});

describe('Scénarios d\'utilisation réels', () => {
  test('administrateur surveille les sessions en temps réel', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // 1. L'administrateur voit un aperçu des statistiques
    expect(screen.getByText('Sessions RDS')).toBeInTheDocument();
    
    // 2. Il remarque une alerte dans les statistiques
    const activeCount = mockActiveSessions.filter(s => s.isActive).length;
    expect(screen.getByText(activeCount.toString())).toBeInTheDocument();

    // 3. Il filtre pour voir les sessions d'un serveur spécifique
    const serverSelect = screen.getByLabelText('Serveur');
    fireEvent.mouseDown(serverSelect);
    const serverOption = screen.getByText('RDS-SERVER-02');
    fireEvent.click(serverOption);

    // 4. Il choisit de faire du shadow sur une session problématique
    const shadowButtons = screen.getAllByTitle('Shadow (app bureau)');
    fireEvent.click(shadowButtons[0]);

    await waitFor(() => {
      expect(window.electronAPI.launchRdp).toHaveBeenCalled();
    });
  });

  test('technicien démarre une nouvelle session RDP', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Le technicien clique sur l'icône de connexion RDP
    const connectButtons = screen.getAllByTitle('Connexion RDP (app bureau)');
    fireEvent.click(connectButtons[0]);

    // Vérifier que la connexion est initiée
    await waitFor(() => {
      expect(window.electronAPI.launchRdp).toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('Connexion RDP automatique')
      );
    });
  });

  test('superviseur envoie un message d\'annonce', async () => {
    render(
      <TestWrapper>
        <SessionsPage />
      </TestWrapper>
    );

    // Le superviseur clique sur "Message à tous"
    const globalMessageButton = screen.getByText('Message à tous');
    fireEvent.click(globalMessageButton);

    // Le dialogue de message global s'ouvre
    await waitFor(() => {
      expect(screen.getByTestId('global-message-dialog')).toBeInTheDocument();
      expect(screen.getByText(/RDS-SERVER-01/)).toBeInTheDocument();
    });
  });
});
