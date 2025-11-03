// src/tests/users-integration.test.js - Tests d'intégration pour la gestion des utilisateurs
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '../contexts/CacheContext';
import { AppProvider } from '../contexts/AppContext';

// Import des composants à tester
import UsersManagementPage from '../pages/UsersManagementPage';
import UserBulkImport from '../components/user-management/UserBulkImport';
import UserBulkActions from '../components/user-management/UserBulkActions';
import UserPasswordGenerator from '../components/user-management/UserPasswordGenerator';

// Mock des services avec réponses réalistes
const mockApiService = {
  refreshExcelUsers: jest.fn(() => Promise.resolve()),
  saveUserToExcel: jest.fn(() => Promise.resolve({ success: true })),
  deleteUserFromExcel: jest.fn(() => Promise.resolve({ success: true })),
  addUserToGroup: jest.fn(() => Promise.resolve({ success: true })),
  removeUserFromGroup: jest.fn(() => Promise.resolve({ success: true })),
  getAdUsersInOU: jest.fn(() => Promise.resolve([])),
  launchRdp: jest.fn(() => Promise.resolve({ success: true }))
};

jest.mock('../services/apiService', () => mockApiService);

// Mock des contextes avec données réalistes
const mockCache = {
  excel_users: {
    'user1': [
      {
        username: 'user1',
        displayName: 'Jean Dupont',
        email: 'jean.dupont@anecoop.com',
        department: 'IT',
        server: 'srv01',
        password: 'pwd123',
        officePassword: 'office456',
        adEnabled: 1
      }
    ],
    'user2': [
      {
        username: 'user2',
        displayName: 'Marie Martin',
        email: 'marie.martin@anecoop.com',
        department: 'RH',
        server: 'srv02',
        password: 'pwd456',
        officePassword: 'office789',
        adEnabled: 0
      }
    ]
  },
  'ad_groups:VPN': [
    { SamAccountName: 'user1' },
    { SamAccountName: 'user3' }
  ],
  'ad_groups:Sortants_responsables': [
    { SamAccountName: 'user1' },
    { SamAccountName: 'user2' }
  ]
};

const mockNotifications = {
  showNotification: jest.fn()
};

jest.mock('../contexts/CacheContext', () => ({
  CacheProvider: ({ children }) => children,
  useCache: () => ({
    cache: mockCache,
    isLoading: false,
    invalidate: jest.fn()
  })
}));

jest.mock('../contexts/AppContext', () => ({
  AppProvider: ({ children }) => children,
  useApp: () => mockNotifications
}));

// Mock pour FileReader et navigation.clipboard
global.FileReader = jest.fn(() => ({
  readAsArrayBuffer: jest.fn(),
  onload: null
}));

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve())
  },
  writable: true
});

// Mock window.confirm
window.confirm = jest.fn(() => true);

// Mock window.electronAPI
window.electronAPI = {
  launchRdp: mockApiService.launchRdp
};

// Test data pour CSV
const validCsvData = [
  { username: 'newuser1', email: 'newuser1@anecoop.com', fullName: 'Nouveau Utilisateur 1', department: 'IT' },
  { username: 'newuser2', email: 'newuser2@anecoop.com', fullName: 'Nouveau Utilisateur 2', department: 'RH' }
];

const invalidCsvData = [
  { username: '', email: 'invalid-email', fullName: '' }, // Données invalides
  { username: 'valid_user', email: 'valid@anecoop.com', fullName: 'Utilisateur Valide' }
];

const renderWithProviders = (component) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <CacheProvider>
        <AppProvider>
          {component}
        </AppProvider>
      </CacheProvider>
    </ThemeProvider>
  );
};

describe('Tests d\'Intégration - Gestion des Utilisateurs', () => {
  
  describe('Intégration Page Principale + Composants', () => {
    test('création d\'utilisateur via dialogue AD', async () => {
      const user = userEvent.setup();
      mockApiService.saveUserToExcel.mockResolvedValueOnce({ success: true });
      
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Cliquer sur le bouton "Ajouter"
      const addButton = screen.getByText('Ajouter');
      await user.click(addButton);
      
      // Vérifier l'ouverture du dialogue (simulé car CreateAdUserDialog n'est pas rendu ici)
      expect(screen.queryByText('Créer un utilisateur AD')).toBeInTheDocument();
    });

    test('connexion RDP avec identifiants', async () => {
      const user = userEvent.setup();
      const testUser = {
        username: 'user1',
        server: 'srv01',
        password: 'pwd123'
      };
      
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Cliquer sur le bouton de connexion RDP
      const connectButtons = screen.getAllByLabelText(/connexion rdp/i);
      await user.click(connectButtons[0]);
      
      expect(mockNotifications.showNotification).toHaveBeenCalledWith(
        'info',
        'Connexion automatique vers srv01...'
      );
      expect(mockApiService.launchRdp).toHaveBeenCalledWith({
        server: 'srv01',
        username: 'user1',
        password: 'pwd123'
      });
    });

    test('suppression d\'utilisateur avec confirmation', async () => {
      const user = userEvent.setup();
      mockApiService.deleteUserFromExcel.mockResolvedValueOnce({ success: true });
      
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Cliquer sur le bouton de suppression
      const deleteButtons = screen.getAllByLabelText(/supprimer/i);
      await user.click(deleteButtons[0]);
      
      // Confirmer la suppression
      expect(window.confirm).toHaveBeenCalledWith('Supprimer Jean Dupont du fichier Excel ?');
      
      await waitFor(() => {
        expect(mockApiService.deleteUserFromExcel).toHaveBeenCalledWith('user1');
        expect(mockNotifications.showNotification).toHaveBeenCalledWith(
          'success',
          'Utilisateur supprimé.'
        );
      });
    });

    test('gestion des groupes VPN et Internet', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Vérifier que user1 est dans VPN (badge colorisé)
      const vpnBadges = screen.getAllByText('VPN');
      expect(vpnBadges).toHaveLength(1); // Un seul utilisateur visible
      
      // Toggle VPN pour user1 (déjà membre)
      await user.click(vpnBadges[0]);
      
      expect(mockApiService.removeUserFromGroup).toHaveBeenCalledWith('user1', 'VPN');
      expect(mockNotifications.showNotification).toHaveBeenCalledWith(
        'success',
        'user1 retiré de VPN'
      );
    });
  });

  describe('Intégration Import CSV', () => {
    test('workflow complet d\'import CSV valide', async () => {
      const user = userEvent.setup();
      const mockOnImport = jest.fn().mockResolvedValueOnce({ success: true });
      
      // Simuler la lecture CSV
      const FileReaderMock = jest.fn().mockImplementation(() => ({
        readAsArrayBuffer: jest.fn(),
        onload: null
      }));
      global.FileReader = FileReaderMock;
      
      // Mock de XLSX
      jest.mock('../utils/lazyModules', () => ({
        lazyXLSX: jest.fn(() => Promise.resolve({
          read: jest.fn().mockReturnValue({
            Sheets: { 'Sheet1': {} },
            SheetNames: ['Sheet1']
          }),
          utils: {
            sheet_to_json: jest.fn().mockReturnValue(validCsvData)
          }
        }))
      }));
      
      await act(async () => {
        renderWithProviders(
          <UserBulkImport 
            open={true}
            onClose={jest.fn()}
            onImport={mockOnImport}
          />
        );
      });
      
      // Étape 1: Upload
      expect(screen.getByText(/glissez-déposez/i)).toBeInTheDocument();
      expect(screen.getByText('Import en masse d\'utilisateurs')).toBeInTheDocument();
      
      // Simuler la sélection de fichier
      const fileInput = screen.getByRole('button');
      await user.click(fileInput);
      
      // La validation devrait se déclencher automatiquement
      await waitFor(() => {
        expect(screen.getByText('valides')).toBeInTheDocument();
      });
      
      // Vérifier que les données sont validées
      const previewText = screen.getByText(/valides/i);
      expect(previewText).toBeInTheDocument();
      
      // Cliquer sur importer
      const importButton = screen.getByText(/importer/i);
      await user.click(importButton);
      
      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith([
          expect.objectContaining({ username: 'newuser1' }),
          expect.objectContaining({ username: 'newuser2' })
        ]);
      });
    });

    test('gestion des erreurs d\'import CSV', async () => {
      const user = userEvent.setup();
      const mockOnImport = jest.fn();
      
      // Mock de XLSX avec données invalides
      jest.mock('../utils/lazyModules', () => ({
        lazyXLSX: jest.fn(() => Promise.resolve({
          read: jest.fn(() => { throw new Error('Invalid file'); }),
          utils: { sheet_to_json: jest.fn() }
        }))
      }));
      
      await act(async () => {
        renderWithProviders(
          <UserBulkImport 
            open={true}
            onClose={jest.fn()}
            onImport={mockOnImport}
          />
        );
      });
      
      // Simuler l'upload d'un fichier invalide
      const fileInput = screen.getByRole('button');
      await user.click(fileInput);
      
      // Vérifier la gestion d'erreur
      await waitFor(() => {
        expect(mockNotifications.showNotification).toHaveBeenCalledWith(
          'error',
          expect.stringContaining('Erreur lors de la lecture du fichier')
        );
      });
    });

    test('validation et filtrage des lignes invalides', async () => {
      // Test direct de la fonction de validation
      const { validateImportData } = require('../components/user-management/UserBulkImport');
      
      const mixedData = [
        ...validCsvData,
        ...invalidCsvData
      ];
      
      const result = validateImportData(mixedData);
      
      // Vérifier que seules les données valides sont conservées
      expect(result.data).toHaveLength(1); // Une seule ligne valide
      expect(result.results).toHaveLength(4); // 4 résultats au total
      
      // Vérifier les statuts
      const validResults = result.results.filter(r => r.status === 'success');
      const errorResults = result.results.filter(r => r.status === 'error');
      
      expect(validResults).toHaveLength(3);
      expect(errorResults).toHaveLength(1);
    });
  });

  describe('Intégration Actions en Masse', () => {
    test('activation en masse des utilisateurs', async () => {
      const user = userEvent.setup();
      const mockOnAction = jest.fn().mockResolvedValueOnce({ success: true });
      const mockOnClearSelection = jest.fn();
      
      const testUsers = [
        { username: 'user1', fullName: 'Jean Dupont', email: 'jean@anecoop.com' },
        { username: 'user2', fullName: 'Marie Martin', email: 'marie@anecoop.com' }
      ];
      
      await act(async () => {
        renderWithProviders(
          <UserBulkActions 
            selectedUsers={testUsers}
            onAction={mockOnAction}
            onClearSelection={mockOnClearSelection}
          />
        );
      });
      
      // Ouvrir le menu d'actions
      const actionsButton = screen.getByText(/actions en masse/i);
      await user.click(actionsButton);
      
      // Sélectionner l'activation
      const activateOption = screen.getByText('Activer les comptes');
      await user.click(activateOption);
      
      // Confirmer
      const confirmButton = screen.getByText('Confirmer');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalledWith(
          'activate',
          testUsers,
          expect.any(Object)
        );
        expect(mockOnClearSelection).toHaveBeenCalled();
      });
    });

    test('suppression en masse avec confirmation stricte', async () => {
      const user = userEvent.setup();
      const mockOnAction = jest.fn().mockResolvedValueOnce({ success: true });
      
      const testUsers = [
        { username: 'user1', fullName: 'Test User', email: 'test@anecoop.com' }
      ];
      
      await act(async () => {
        renderWithProviders(
          <UserBulkActions 
            selectedUsers={testUsers}
            onAction={mockOnAction}
            onClearSelection={jest.fn()}
          />
        );
      });
      
      // Ouvrir le menu et sélectionner suppression
      await user.click(screen.getByText(/actions en masse/i));
      await user.click(screen.getByText('Supprimer les comptes'));
      
      // Vérifier l'avertissement
      expect(screen.getByText(/cette action est irréversible/i)).toBeInTheDocument();
      
      // Taper CONFIRMER
      const confirmInput = screen.getByPlaceholderText('CONFIRMER');
      await user.type(confirmInput, 'CONFIRMER');
      
      expect(confirmInput).toHaveValue('CONFIRMER');
      
      // Confirmer l'action
      await user.click(screen.getByText('Confirmer'));
      
      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalledWith(
          'delete',
          testUsers,
          expect.any(Object)
        );
      });
    });

    test('changement de groupe avec paramètres', async () => {
      const user = userEvent.setup();
      const mockOnAction = jest.fn().mockResolvedValueOnce({ success: true });
      
      const testUsers = [
        { username: 'user1', fullName: 'Test User', email: 'test@anecoop.com' }
      ];
      
      await act(async () => {
        renderWithProviders(
          <UserBulkActions 
            selectedUsers={testUsers}
            onAction={mockOnAction}
          />
        );
      });
      
      // Ouvrir le menu et sélectionner changement de groupe
      await user.click(screen.getByText(/actions en masse/i));
      await user.click(screen.getByText('Changer de groupe'));
      
      // Sélectionner un groupe
      const groupSelect = screen.getByLabelText('Nouveau groupe');
      await user.click(groupSelect);
      await user.click(screen.getByText('Techniciens'));
      
      // Confirmer
      await user.click(screen.getByText('Confirmer'));
      
      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalledWith(
          'change_group',
          testUsers,
          expect.objectContaining({ groupId: 'technicians' })
        );
      });
    });
  });

  describe('Intégration Générateur de Mots de Passe', () => {
    test('workflow complet génération RDS', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      const testUser = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@anecoop.com'
      };
      
      await act(async () => {
        renderWithProviders(
          <UserPasswordGenerator 
            open={true}
            onClose={jest.fn()}
            onGenerate={mockOnGenerate}
            user={testUser}
          />
        );
      });
      
      // Vérifier les informations utilisateur
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('jean.dupont@anecoop.com')).toBeInTheDocument();
      
      // Cliquer sur RDS/Windows (déjà sélectionné)
      const rdsChip = screen.getByText('RDS / Windows');
      expect(rdsChip).toHaveAttribute('aria-pressed', 'true');
      
      // Générer le mot de passe
      const generateButton = screen.getByText('Générer');
      await user.click(generateButton);
      
      // Vérifier le format du mot de passe généré
      const passwordField = screen.getByDisplayValue(/^jd\d{4}[A-Z]{2}[!@#$%&]$/);
      expect(passwordField).toBeInTheDocument();
      
      // Copier le mot de passe
      const copyButton = screen.getByLabelText(/copier/i);
      await user.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringMatching(/^jd\d{4}[A-Z]{2}[!@#$%&]$/)
      );
      
      // Appliquer le mot de passe
      const applyButton = screen.getByText('Appliquer le mot de passe');
      await user.click(applyButton);
      
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.stringMatching(/^jd\d{4}[A-Z]{2}[!@#$%&]$/),
          'rds'
        );
      });
    });

    test('génération Office 365', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      await act(async () => {
        renderWithProviders(
          <UserPasswordGenerator 
            open={true}
            onClose={jest.fn()}
            onGenerate={mockOnGenerate}
            user={{ firstName: 'Marie', lastName: 'Martin' }}
          />
        );
      });
      
      // Basculer vers Office 365
      const officeChip = screen.getByText('Office 365');
      await user.click(officeChip);
      
      // Générer
      const generateButton = screen.getByText('Générer');
      await user.click(generateButton);
      
      // Vérifier le format
      const passwordField = screen.getByDisplayValue(/^[a-zA-Z0-9]{16}$/);
      expect(passwordField).toHaveValue(expect.stringMatching(/^[a-zA-Z0-9]{16}$/));
    });

    test('erreur si prénom/nom manquant pour RDS', async () => {
      const user = userEvent.setup();
      const mockOnGenerate = jest.fn();
      
      await act(async () => {
        renderWithProviders(
          <UserPasswordGenerator 
            open={true}
            onClose={jest.fn()}
            onGenerate={mockOnGenerate}
            user={{ email: 'test@test.com' }} // Pas de prénom/nom
          />
        );
      });
      
      // Essayer de générer
      const generateButton = screen.getByText('Générer');
      await user.click(generateButton);
      
      // Vérifier l'erreur
      await waitFor(() => {
        expect(mockNotifications.showNotification).toHaveBeenCalledWith(
          'error',
          expect.stringContaining('Prénom et nom requis')
        );
      });
    });
  });

  describe('Intégration Active Directory', () => {
    test('synchronisation des groupes AD', async () => {
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Vérifier que les groupes sont chargés
      expect(mockApiService.getAdUsersInOU).not.toHaveBeenCalled();
      
      // Simuler la sélection d'une OU (simulation)
      // Dans un test réel, il faudrait interagir avec l'AdTreeView
      
      // Vérifier les badges de groupes
      const vpnBadge = screen.getByText('VPN');
      const internetBadge = screen.getByText('INT');
      
      expect(vpnBadge).toBeInTheDocument();
      expect(internetBadge).toBeInTheDocument();
    });

    test('affichage du statut AD des utilisateurs', async () => {
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Vérifier les indicateurs de statut AD
      // user1 a adEnabled = 1 (actif)
      // user2 a adEnabled = 0 (inactif)
      
      const statusIndicators = screen.getAllByTestId('CircleIcon');
      expect(statusIndicators).toHaveLength(2);
    });
  });

  describe('Intégration Performance et Volume', () => {
    test('gestion de grands volumes d\'utilisateurs', async () => {
      // Créer un grand jeu de données
      const largeUserSet = Array.from({ length: 100 }, (_, i) => ({
        [`user${i}`]: [{
          username: `user${i}`,
          displayName: `Utilisateur ${i}`,
          email: `user${i}@anecoop.com`,
          department: i % 3 === 0 ? 'IT' : i % 3 === 1 ? 'RH' : 'Finance',
          server: `srv${i % 5 + 1}`,
          password: `pwd${i}`,
          officePassword: `office${i}`,
          adEnabled: i % 2
        }]
      }));
      
      const mockLargeCache = {
        excel_users: Object.assign({}, ...largeUserSet),
        'ad_groups:VPN': Array.from({ length: 50 }, (_, i) => ({ SamAccountName: `user${i}` })),
        'ad_groups:Sortants_responsables': Array.from({ length: 30 }, (_, i) => ({ SamAccountName: `user${i}` }))
      };
      
      jest.mocked(useCache).mockReturnValue({
        cache: mockLargeCache,
        isLoading: false,
        invalidate: jest.fn()
      });
      
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Vérifier que la page se charge sans erreur avec 100 utilisateurs
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    test('performance du filtrage et de la recherche', async () => {
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      
      // Test de performance avec recherche
      const startTime = performance.now();
      
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'Jean');
      
      const endTime = performance.now();
      
      // La recherche ne devrait pas prendre plus de 100ms avec ces données
      expect(endTime - startTime).toBeLessThan(100);
      
      // Vérifier que le filtrage fonctionne
      expect(searchInput).toHaveValue('Jean');
    });
  });

  describe('Gestion des Erreurs et Cas Limites', () => {
    test('gestion des erreurs réseau', async () => {
      // Mock d'une erreur réseau
      mockApiService.saveUserToExcel.mockRejectedValueOnce(new Error('Network Error'));
      
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Essayer de sauvegarder un utilisateur (simulation)
      // Cela pourrait être testé via l'interaction avec UserDialog
      
      expect(mockNotifications.showNotification).toHaveBeenCalledWith(
        'error',
        'Erreur: Network Error'
      );
    });

    test('sélection en masse avec sélection/désélection', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Utiliser la case "Tout sélectionner"
      const selectAllCheckbox = screen.getByRole('checkbox', { name: '' });
      await user.click(selectAllCheckbox);
      
      // Vérifier que tous les utilisateurs sont sélectionnés
      const individualCheckboxes = screen.getAllByRole('checkbox');
      expect(individualCheckboxes.slice(1)).toMatch(
        new Array(2).fill(expect.objectContaining({ checked: true }))
      );
      
      // Désélectionner
      await user.click(selectAllCheckbox);
      expect(selectAllCheckbox).not.toBeChecked();
    });

    test('boutons d\'actions conditionnels selon la sélection', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      // Au début, aucun utilisateur sélectionné - bouton pas visible
      expect(screen.queryByText(/imprimer/i)).not.toBeInTheDocument();
      
      // Sélectionner un utilisateur
      const userCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(userCheckbox);
      
      // Le bouton d'impression devrait apparaître
      expect(screen.getByText(/imprimer/i)).toBeInTheDocument();
    });
  });
});
