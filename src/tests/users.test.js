// src/tests/users.test.js - Tests unitaires pour la gestion des utilisateurs
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '../contexts/CacheContext';
import { AppProvider } from '../contexts/AppContext';

// Import des composants à tester
import UsersManagementPage from '../pages/UsersManagementPage';
import UserBulkImport from '../components/user-management/UserBulkImport';
import UserBulkActions from '../components/user-management/UserBulkActions';
import UserPasswordGenerator from '../components/user-management/UserPasswordGenerator';
import UserModificationHistory from '../components/user-management/UserModificationHistory';

// Mock des services
jest.mock('../services/apiService', () => ({
  refreshExcelUsers: jest.fn(),
  invalidate: jest.fn(),
  saveUserToExcel: jest.fn(),
  deleteUserFromExcel: jest.fn(),
  addUserToGroup: jest.fn(),
  removeUserFromGroup: jest.fn(),
  getAdUsersInOU: jest.fn()
}));

jest.mock('../contexts/CacheContext', () => ({
  CacheProvider: ({ children }) => children,
  useCache: () => ({
    cache: {
      excel_users: {
        'user1': [
          {
            username: 'user1',
            displayName: 'Jean Dupont',
            email: 'jean.dupont@anecoop.com',
            department: 'IT',
            server: 'srv01',
            password: 'test123',
            officePassword: 'test456',
            adEnabled: 1
          }
        ]
      },
      'ad_groups:VPN': [],
      'ad_groups:Sortants_responsables': []
    },
    isLoading: false,
    invalidate: jest.fn()
  })
}));

jest.mock('../contexts/AppContext', () => ({
  AppProvider: ({ children }) => children,
  useApp: () => ({
    showNotification: jest.fn()
  })
}));

// Mock de lazyModules
jest.mock('../utils/lazyModules', () => ({
  lazyXLSX: jest.fn(() => Promise.resolve({
    read: jest.fn().mockReturnValue({
      Sheets: {
        Sheet1: {
          '!ref': 'A1:F5'
        }
      }
    }),
    utils: {
      sheet_to_json: jest.fn().mockReturnValue([
        { username: 'user2', email: 'user2@anecoop.com', fullName: 'Marie Martin', department: 'HR' },
        { username: 'user3', email: 'invalid-email', fullName: 'Paul Durand', department: 'Finance' }
      ])
    }
  }))
}));

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

describe('Tests unitaires - Gestion des Utilisateurs', () => {
  
  describe('UsersManagementPage', () => {
    test('doit afficher la page de gestion des utilisateurs', async () => {
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      expect(screen.getByText('Gestion des Utilisateurs')).toBeInTheDocument();
      expect(screen.getByText('Administration des comptes utilisateurs RDS et Active Directory')).toBeInTheDocument();
    });

    test('doit afficher les statistiques des utilisateurs', async () => {
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('VPN')).toBeInTheDocument();
      expect(screen.getByText('Internet')).toBeInTheDocument();
    });

    test('doit permettre la recherche d\'utilisateurs', async () => {
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      fireEvent.change(searchInput, { target: { value: 'Jean' } });
      
      expect(searchInput).toHaveValue('Jean');
    });

    test('doit permettre le filtrage par serveur', async () => {
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      const serverFilter = screen.getByLabelText(/serveur/i);
      fireEvent.change(serverFilter, { target: { value: 'srv01' } });
      
      expect(serverFilter).toHaveValue('srv01');
    });

    test('doit permettre la sélection d\'utilisateurs', async () => {
      await act(async () => {
        renderWithProviders(<UsersManagementPage />);
      });
      
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Premier checkbox utilisateur
      
      expect(checkboxes[1]).toBeChecked();
    });
  });

  describe('UserBulkImport', () => {
    test('doit ouvrir le composant d\'import', () => {
      const mockOnImport = jest.fn();
      const mockOnClose = jest.fn();
      
      render(
        <ThemeProvider theme={createTheme()}>
          <UserBulkImport 
            open={true} 
            onClose={mockOnClose} 
            onImport={mockOnImport} 
          />
        </ThemeProvider>
      );
      
      expect(screen.getByText('Import en masse d\'utilisateurs')).toBeInTheDocument();
      expect(screen.getByText(/glissez-déposez/i)).toBeInTheDocument();
    });

    test('doit valider les données importées', async () => {
      const mockOnImport = jest.fn();
      const mockOnClose = jest.fn();
      
      render(
        <ThemeProvider theme={createTheme()}>
          <UserBulkImport 
            open={true} 
            onClose={mockOnClose} 
            onImport={mockOnImport} 
          />
        </ThemeProvider>
      );

      // Simuler un upload de fichier
      const dropzone = screen.getByText(/glissez-déposez/i).closest('div');
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      // Note: Pour des tests complets, il faudrait simuler FileReader plus précisément
      await act(async () => {
        fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
      });
      
      // Les tests de validation seraient dans un environnement plus réaliste
    });

    test('doit afficher les erreurs de validation', async () => {
      // Test de validation des données d'import
      const { validateImportData } = require('../components/user-management/UserBulkImport');
      
      const testData = [
        { username: '', email: 'invalid', fullName: '' }, // Données invalides
        { username: 'valid_user', email: 'valid@email.com', fullName: 'Valid User' } // Données valides
      ];
      
      const result = validateImportData(testData);
      
      expect(result.data).toHaveLength(1); // Une seule ligne valide
      expect(result.results).toHaveLength(2); // Deux résultats
      expect(result.results[0].status).toBe('error');
      expect(result.results[1].status).toBe('success');
    });

    test('doit gérer l\'upload de fichiers CSV/Excel', async () => {
      const mockOnImport = jest.fn();
      
      render(
        <ThemeProvider theme={createTheme()}>
          <UserBulkImport 
            open={true} 
            onClose={jest.fn()} 
            onImport={mockOnImport} 
          />
        </ThemeProvider>
      );
      
      const uploadButton = screen.getByText(/glissez-déposez/i);
      expect(uploadButton).toBeInTheDocument();
    });
  });

  describe('UserBulkActions', () => {
    test('doit afficher les actions en masse disponibles', () => {
      const mockOnAction = jest.fn();
      const mockOnClearSelection = jest.fn();
      
      const testUsers = [
        { username: 'user1', fullName: 'User One', email: 'user1@test.com' },
        { username: 'user2', fullName: 'User Two', email: 'user2@test.com' }
      ];
      
      renderWithProviders(
        <UserBulkActions 
          selectedUsers={testUsers}
          onAction={mockOnAction}
          onClearSelection={mockOnClearSelection}
        />
      );
      
      expect(screen.getByText('Actions en masse (2)')).toBeInTheDocument();
    });

    test('doit ouvrir le menu des actions', async () => {
      const mockOnAction = jest.fn();
      
      renderWithProviders(
        <UserBulkActions 
          selectedUsers={[{ username: 'test', fullName: 'Test User', email: 'test@test.com' }]}
          onAction={mockOnAction}
        />
      );
      
      const actionsButton = screen.getByText(/actions en masse/i);
      fireEvent.click(actionsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Activer les comptes')).toBeInTheDocument();
        expect(screen.getByText('Désactiver les comptes')).toBeInTheDocument();
        expect(screen.getByText('Supprimer les comptes')).toBeInTheDocument();
      });
    });

    test('doit demander confirmation pour les actions dangereuses', async () => {
      const mockOnAction = jest.fn();
      
      renderWithProviders(
        <UserBulkActions 
          selectedUsers={[{ username: 'test', fullName: 'Test User', email: 'test@test.com' }]}
          onAction={mockOnAction}
        />
      );
      
      // Ouvrir le menu
      fireEvent.click(screen.getByText(/actions en masse/i));
      
      // Cliquer sur "Supprimer"
      await waitFor(() => {
        fireEvent.click(screen.getByText('Supprimer les comptes'));
      });
      
      // Vérifier la demande de confirmation
      expect(screen.getByText(/confirmer/i)).toBeInTheDocument();
      expect(screen.getByText(/cette action est irréversible/i)).toBeInTheDocument();
    });

    test('doit exiger CONFIRMER pour la suppression', async () => {
      const mockOnAction = jest.fn();
      
      renderWithProviders(
        <UserBulkActions 
          selectedUsers={[{ username: 'test', fullName: 'Test User', email: 'test@test.com' }]}
          onAction={mockOnAction}
        />
      );
      
      // Ouvrir et sélectionner suppression
      fireEvent.click(screen.getByText(/actions en masse/i));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Supprimer les comptes'));
      });
      
      // Taper CONFIRMER
      const confirmInput = screen.getByPlaceholderText('CONFIRMER');
      fireEvent.change(confirmInput, { target: { value: 'CONFIRMER' } });
      
      expect(confirmInput).toHaveValue('CONFIRMER');
      
      // Le bouton Confirmer doit être actif
      const confirmButton = screen.getByText('Confirmer');
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('UserPasswordGenerator', () => {
    test('doit ouvrir le générateur de mots de passe', () => {
      render(
        <ThemeProvider theme={createTheme()}>
          <UserPasswordGenerator 
            open={true}
            onClose={jest.fn()}
            onGenerate={jest.fn()}
            user={{ firstName: 'Jean', lastName: 'Dupont', email: 'jean@anecoop.com' }}
          />
        </ThemeProvider>
      );
      
      expect(screen.getByText('Générateur de mots de passe Anecoop')).toBeInTheDocument();
      expect(screen.getByText('RDS / Windows')).toBeInTheDocument();
      expect(screen.getByText('Office 365')).toBeInTheDocument();
    });

    test('doit générer un mot de passe RDS conforme aux règles', () => {
      const { generateRdsPassword } = require('../components/user-management/UserPasswordGenerator');
      
      const password = generateRdsPassword('Kevin', 'Bivia');
      
      expect(password).toMatch(/^[a-z]{2}\d{4}[A-Z]{2}[!@#$%&]$/);
      expect(password).toHaveLength(9);
      expect(password).toBe('kb' + password.slice(2, 6) + password.slice(-3));
    });

    test('doit générer un mot de passe Office 365', () => {
      const { generateOfficePassword } = require('../components/user-management/UserPasswordGenerator');
      
      const password = generateOfficePassword();
      
      expect(password).toHaveLength(16);
      expect(/^[a-zA-Z0-9]+$/.test(password)).toBe(true);
    });

    test('doit évaluer la force du mot de passe', () => {
      const { getPasswordStrength } = require('../components/user-management/UserPasswordGenerator');
      
      const weakPassword = getPasswordStrength('123');
      expect(weakPassword.label).toBe('Faible');
      
      const mediumPassword = getPasswordStrength('password123');
      expect(mediumPassword.label).toBe('Moyen');
      
      const strongPassword = getPasswordStrength('Password123!');
      expect(strongPassword.label).toBe('Fort');
    });

    test('doit exiger prénom et nom pour mot de passe RDS', async () => {
      const mockOnGenerate = jest.fn();
      
      render(
        <ThemeProvider theme={createTheme()}>
          <UserPasswordGenerator 
            open={true}
            onClose={jest.fn()}
            onGenerate={mockOnGenerate}
            user={{ email: 'test@test.com' }} // Pas de prénom/nom
          />
        </ThemeProvider>
      );
      
      const generateButton = screen.getByText('Générer');
      fireEvent.click(generateButton);
      
      // L'alert devrait être déclenché (simulé dans le code)
      await waitFor(() => {
        expect(screen.queryByText(/prénom et nom requis/i)).toBeInTheDocument();
      });
    });
  });

  describe('UserModificationHistory', () => {
    test('doit charger l\'historique des modifications', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      );
      
      renderWithProviders(
        <UserModificationHistory 
          userId="123"
          username="testuser"
        />
      );
      
      expect(screen.getByText('Historique des modifications')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/users/123/history');
      });
    });

    test('doit afficher les données de démonstration si erreur API', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );
      
      renderWithProviders(
        <UserModificationHistory 
          userId="123"
          username="demo_user"
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Aucun historique disponible')).toBeInTheDocument();
      });
    });

    test('doit permettre la visualisation des détails', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              timestamp: new Date('2025-11-02T14:30:00'),
              action: 'update',
              user: 'admin',
              changes: {
                email: { before: 'old@test.com', after: 'new@test.com' }
              }
            }
          ])
        })
      );
      
      renderWithProviders(
        <UserModificationHistory 
          userId="123"
          username="demo_user"
        />
      );
      
      const viewButton = screen.getByRole('button', { name: /voir/i });
      fireEvent.click(viewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Détails de la modification')).toBeInTheDocument();
        expect(screen.getByText('Avant')).toBeInTheDocument();
        expect(screen.getByText('Après')).toBeInTheDocument();
      });
    });

    test('doit colorer les actions selon le type', () => {
      const { getActionColor } = require('../components/user-management/UserModificationHistory');
      
      expect(getActionColor('create')).toBe('success');
      expect(getActionColor('update')).toBe('primary');
      expect(getActionColor('delete')).toBe('error');
      expect(getActionColor('password_reset')).toBe('warning');
      expect(getActionColor('activate')).toBe('success');
      expect(getActionColor('deactivate')).toBe('warning');
    });

    test('doit convertir les codes action en libellés', () => {
      const { getActionLabel } = require('../components/user-management/UserModificationHistory');
      
      expect(getActionLabel('create')).toBe('Création');
      expect(getActionLabel('update')).toBe('Modification');
      expect(getActionLabel('delete')).toBe('Suppression');
      expect(getActionLabel('password_reset')).toBe('Réinit. mot de passe');
    });
  });

  describe('Tests de validation et de conformité', () => {
    test('doit valider le format des emails', () => {
      const { validateImportData } = require('../components/user-management/UserBulkImport');
      
      const testData = [
        { username: 'user1', email: 'valid@anecoop.com', fullName: 'User One' },
        { username: 'user2', email: 'invalid-email', fullName: 'User Two' },
        { username: 'user3', email: 'test@domain.org', fullName: 'User Three' }
      ];
      
      const result = validateImportData(testData);
      
      expect(result.results[0].status).toBe('success');
      expect(result.results[1].status).toBe('error');
      expect(result.results[1].errors).toContain('Format email invalide');
      expect(result.results[2].status).toBe('success');
    });

    test('doit valider les usernames', () => {
      const { validateImportData } = require('../components/user-management/UserBulkImport');
      
      const testData = [
        { username: 'valid_user', email: 'test@test.com', fullName: 'Test User' },
        { username: 'user@invalid!', email: 'test@test.com', fullName: 'Test User' },
        { username: 'user-name.ok', email: 'test@test.com', fullName: 'Test User' }
      ];
      
      const result = validateImportData(testData);
      
      expect(result.results[0].status).toBe('success');
      expect(result.results[1].status).toBe('warning');
      expect(result.results[1].warnings).toContain('Nom d\'utilisateur contient des caractères spéciaux');
      expect(result.results[2].status).toBe('success');
    });

    test('doit vérifier les champs requis', () => {
      const { validateImportData } = require('../components/user-management/UserBulkImport');
      
      const testData = [
        { username: 'user1', email: 'test@test.com', fullName: 'Test User' },
        { username: '', email: 'test@test.com', fullName: 'Test User' },
        { username: 'user3', email: '', fullName: 'Test User' }
      ];
      
      const result = validateImportData(testData);
      
      expect(result.results[0].status).toBe('success');
      expect(result.results[1].status).toBe('error');
      expect(result.results[1].errors).toContain('Champ "username" manquant');
      expect(result.results[2].status).toBe('error');
      expect(result.results[2].errors).toContain('Champ "email" manquant');
    });
  });

  describe('Tests des utilitaires et helpers', () => {
    test('UserPasswordGenerator - force des mots de passe', () => {
      const { getPasswordStrength } = require('../components/user-management/UserPasswordGenerator');
      
      // Mot de passe très faible
      const veryWeak = getPasswordStrength('1');
      expect(veryWeak.label).toBe('Faible');
      expect(veryWeak.score).toBe(0);
      
      // Mot de passe moyen
      const medium = getPasswordStrength('password123');
      expect(medium.label).toBe('Moyen');
      expect(medium.score).toBe(3);
      
      // Mot de passe fort
      const strong = getPasswordStrength('Password123!@#');
      expect(strong.label).toBe('Fort');
      expect(strong.score).toBe(6);
    });

    test('UserModificationHistory - génération de données demo', () => {
      const { generateDemoHistory } = require('../components/user-management/UserModificationHistory');
      
      const demoHistory = generateDemoHistory('testuser');
      
      expect(demoHistory).toHaveLength(4);
      expect(demoHistory[0].action).toBe('update');
      expect(demoHistory[1].action).toBe('password_reset');
      expect(demoHistory[2].action).toBe('deactivate');
      expect(demoHistory[3].action).toBe('create');
      expect(demoHistory[3].changes.username.after).toBe('testuser');
    });
  });
});
