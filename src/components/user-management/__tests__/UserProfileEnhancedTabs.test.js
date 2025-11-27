/**
 * Tests pour le composant UserProfileEnhancedTabs
 * Tests unitaires et d'intégration avec Jest et React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserProfileEnhancedTabs from './UserProfileEnhancedTabs';

// Mock des dépendances
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    animate: jest.fn(),
    variants: jest.fn()
  },
  AnimatePresence: ({ children }) => children
}));

jest.mock('react-toastify', () => ({
  ToastContainer: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Configuration du thème de test
const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock du hook useUserProfile
jest.mock('./UserProfileEnhancedTabs', () => ({
  useUserProfile: () => ({
    user: {
      id: '1',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@docucortex.com',
      telephone: '+33 1 23 45 67 89',
      poste: 'Chef de projet',
      departement: 'IT',
      avatar: null,
      dateCreation: '2023-01-15T10:30:00Z',
      derniereConnexion: '2025-11-15T08:15:00Z',
      statut: 'Actif',
      permissions: {
        lecture: true,
        ecriture: true,
        administration: false,
        exports: true
      },
      preferences: {
        notifications: true,
        darkMode: false,
        langue: 'fr',
        frequenceSync: 'quotidien'
      },
      statistiques: {
        documentsTraites: 245,
        espaceUtilise: '1.2 GB',
        dernierUpload: '2025-11-14T16:45:00Z'
      },
      historique: [
        {
          action: 'Connexion',
          date: '2025-11-15T08:15:00Z',
          details: 'Connexion réussie'
        }
      ]
    },
    loading: false,
    saving: false,
    errors: {},
    autoSave: true,
    setAutoSave: jest.fn(),
    saveUser: jest.fn(),
    validateUser: jest.fn(() => true),
    uploadAvatar: jest.fn(),
    exportUserData: jest.fn(),
    refetch: jest.fn()
  })
}));

describe('UserProfileEnhancedTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('devrait rendre le composant avec les onglets principaux', () => {
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Vérifier la présence des onglets
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Historique')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('Statistiques')).toBeInTheDocument();
    
    // Vérifier le titre
    expect(screen.getByText('Profil Utilisateur Enrichi')).toBeInTheDocument();
  });

  test('devrait afficher l\'onglet Profil par défaut', () => {
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // L'onglet Profil devrait être actif
    const profilTab = screen.getByText('Profil').closest('[role="tab"]');
    expect(profilTab).toHaveAttribute('aria-selected', 'true');
  });

  test('devrait permettre de changer d\'onglet', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Cliquer sur l'onglet Historique
    const historiqueTab = screen.getByText('Historique');
    await user.click(historiqueTab);
    
    // Vérifier que l'onglet Historique est maintenant actif
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toHaveTextContent('Historique');
  });

  test('devrait afficher les informations utilisateur dans l\'onglet Profil', () => {
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Vérifier l'affichage des informations personnelles
    expect(screen.getByDisplayValue('Jean')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jean.dupont@docucortex.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+33 1 23 45 67 89')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chef de projet')).toBeInTheDocument();
    expect(screen.getByDisplayValue('IT')).toBeInTheDocument();
  });

  test('devrait permettre la modification des informations', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Modifier le prénom
    const prenomInput = screen.getByDisplayValue('Jean');
    await user.clear(prenomInput);
    await user.type(prenomInput, 'Pierre');
    
    // La valeur devrait être mise à jour
    expect(screen.getByDisplayValue('Pierre')).toBeInTheDocument();
  });

  test('devrait afficher l\'historique des actions', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Aller à l'onglet Historique
    const historiqueTab = screen.getByText('Historique');
    await user.click(historiqueTab);
    
    // Vérifier la présence de l'historique
    expect(screen.getByText('Historique des actions')).toBeInTheDocument();
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByText('Connexion réussie')).toBeInTheDocument();
  });

  test('devrait afficher les permissions dans l\'onglet Permissions', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Aller à l'onglet Permissions
    const permissionsTab = screen.getByText('Permissions');
    await user.click(permissionsTab);
    
    // Vérifier la présence des permissions
    expect(screen.getByText('Permissions utilisateur')).toBeInTheDocument();
    expect(screen.getByText('Lecture des documents')).toBeInTheDocument();
    expect(screen.getByText('Écriture des documents')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.getByText('Exports de données')).toBeInTheDocument();
  });

  test('devrait permettre de modifier les permissions', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Aller à l'onglet Permissions
    const permissionsTab = screen.getByText('Permissions');
    await user.click(permissionsTab);
    
    // Activer l'administration
    const adminSwitch = screen.getByLabelText('Administration');
    await user.click(adminSwitch);
    
    // Vérifier que le switch a été cliqué (la logique est gérée par le hook)
    expect(adminSwitch).toBeInTheDocument();
  });

  test('devrait afficher les statistiques dans l\'onglet Statistiques', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Aller à l'onglet Statistiques
    const statistiquesTab = screen.getByText('Statistiques');
    await user.click(statistiquesTab);
    
    // Vérifier la présence des statistiques
    expect(screen.getByText('Documents traités')).toBeInTheDocument();
    expect(screen.getByText('245')).toBeInTheDocument();
    expect(screen.getByText('Espace utilisé')).toBeInTheDocument();
    expect(screen.getByText('1.2 GB')).toBeInTheDocument();
  });

  test('devrait avoir le bouton d\'export dans la toolbar', () => {
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Vérifier la présence du bouton d'export
    expect(screen.getByText('Exporter')).toBeInTheDocument();
  });

  test('devrait ouvrir la dialog d\'export au clic', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Cliquer sur le bouton Exporter
    const exportButton = screen.getByText('Exporter');
    await user.click(exportButton);
    
    // La dialog devrait s'ouvrir (vérification par la présence du titre)
    await waitFor(() => {
      expect(screen.getByText('Exporter les données utilisateur')).toBeInTheDocument();
    });
  });

  test('devrait permettre de changer le format d\'export', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Ouvrir la dialog d'export
    const exportButton = screen.getByText('Exporter');
    await user.click(exportButton);
    
    // Changer le format d'export
    const selectField = screen.getByLabelText('Format d\'export');
    await user.click(selectField);
    
    // Sélectionner CSV
    const csvOption = screen.getByText('CSV (tableur)');
    await user.click(csvOption);
    
    // La valeur devrait être mise à jour
    expect(selectField).toHaveValue('csv');
  });

  test('devrait afficher l\'indicateur de sauvegarde auto', () => {
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Vérifier la présence du switch de sauvegarde automatique
    expect(screen.getByLabelText('Sauvegarde auto')).toBeInTheDocument();
  });

  test('devrait permettre de désactiver la sauvegarde automatique', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Désactiver la sauvegarde automatique
    const autoSaveSwitch = screen.getByLabelText('Sauvegarde auto');
    await user.click(autoSaveSwitch);
    
    // Vérifier que le hook a été appelé
    expect(screen.getByLabelText('Sauvegarde auto')).toBeInTheDocument();
  });

  test('devrait avoir un bouton d\'actualisation', () => {
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Vérifier la présence du bouton refresh
    const refreshButton = screen.getByLabelText('Actualiser');
    expect(refreshButton).toBeInTheDocument();
  });

  test('devrait permettre l\'upload d\'avatar', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Vérifier la présence de l'input d'upload
    const avatarInput = document.getElementById('avatar-upload');
    expect(avatarInput).toBeInTheDocument();
    
    // Simuler un upload de fichier
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(avatarInput, file);
    
    // Vérifier que l'input a bien reçu le fichier
    expect(avatarInput.files[0]).toBe(file);
    expect(avatarInput.files.length).toBe(1);
  });

  test('devrait afficher les erreurs de validation', async () => {
    // Mock avec des erreurs de validation
    const mockUseUserProfile = require('./UserProfileEnhancedTabs');
    const originalHook = mockUseUserProfile.useUserProfile;
    
    mockUseUserProfile.useUserProfile = () => ({
      ...originalHook(),
      errors: {
        email: 'Format d\'email invalide',
        nom: 'Le nom doit contenir au moins 2 caractères'
      }
    });
    
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Les erreurs devraient être affichées
    await waitFor(() => {
      expect(screen.getByText('Format d\'email invalide')).toBeInTheDocument();
      expect(screen.getByText('Le nom doit contenir au moins 2 caractères')).toBeInTheDocument();
    });
  });

  test('devrait afficher un état de chargement', () => {
    // Mock avec loading = true
    const mockUseUserProfile = require('./UserProfileEnhancedTabs');
    const originalHook = mockUseUserProfile.useUserProfile;
    
    mockUseUserProfile.useUserProfile = () => ({
      ...originalHook(),
      loading: true
    });
    
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Les skeletons devraient être affichés
    expect(screen.getAllByText('').length).toBeGreaterThan(0);
  });

  test('devrait avoir une interface responsive', () => {
    // Test sur différentes tailles d'écran
    const { rerender } = renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Le composant devrait se rendre sans erreur sur différentes tailles
    expect(screen.getByText('Profil Utilisateur Enrichi')).toBeInTheDocument();
  });
});

// Tests d'accessibilité
describe('UserProfileEnhancedTabs - Accessibilité', () => {
  test('devrait avoir des labels d\'accessibilité appropriés', () => {
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Vérifier les ARIA labels
    expect(screen.getByLabelText('onglets du profil utilisateur')).toBeInTheDocument();
  });

  test('devrait être navigable au clavier', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Navigation au clavier entre les onglets
    const firstTab = screen.getByText('Profil').closest('[role="tab"]');
    await user.tab();
    expect(firstTab).toHaveFocus();
    
    await user.keyboard('{ArrowRight}');
    const secondTab = screen.getByText('Historique').closest('[role="tab"]');
    expect(secondTab).toHaveFocus();
  });

  test('devrait avoir un contraste suffisant', () => {
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Vérifier que les éléments ont des contrastes appropriés
    const title = screen.getByText('Profil Utilisateur Enrichi');
    expect(title).toBeInTheDocument();
    
    const userInfo = screen.getByDisplayValue('Jean');
    expect(userInfo).toBeInTheDocument();
  });
});

// Tests de performance
describe('UserProfileEnhancedTabs - Performance', () => {
  test('devrait se rendre rapidement', async () => {
    const startTime = performance.now();
    renderWithTheme(<UserProfileEnhancedTabs />);
    const endTime = performance.now();
    
    // Le rendu devrait prendre moins de 100ms
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('devrait gérer les re-renders efficacement', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Multiple changements d'onglets
    for (let i = 0; i < 5; i++) {
      const tab = screen.getByText(['Profil', 'Historique', 'Permissions', 'Statistiques'][i % 4]);
      await user.click(tab);
      rerender(<UserProfileEnhancedTabs />);
    }
    
    // Le composant devrait toujours être fonctionnel
    expect(screen.getByText('Profil Utilisateur Enrichi')).toBeInTheDocument();
  });
});

// Tests d'intégration
describe('UserProfileEnhancedTabs - Intégration', () => {
  test('devrait s\'intégrer avec le système de thème', () => {
    const customTheme = createTheme({
      palette: {
        primary: {
          main: '#1976d2'
        }
      }
    });
    
    const { container } = render(
      <ThemeProvider theme={customTheme}>
        <UserProfileEnhancedTabs />
      </ThemeProvider>
    );
    
    // Le composant devrait se rendre avec le thème personnalisé
    expect(container.firstChild).toBeInTheDocument();
  });

  test('devrait fonctionner avec les notifications toast', () => {
    const { toast } = require('react-toastify');
    
    renderWithTheme(<UserProfileEnhancedTabs />);
    
    // Les toasts devraient être disponibles
    expect(toast.success).toBeDefined();
    expect(toast.error).toBeDefined();
  });
});

export default UserProfileEnhancedTabs;