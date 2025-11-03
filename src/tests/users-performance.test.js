// src/tests/users-performance.test.js - Tests de performance pour la gestion des utilisateurs
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '../contexts/CacheContext';
import { AppProvider } from '../contexts/AppContext';

// Import des composants à tester
import UsersManagementPage from '../pages/UsersManagementPage';
import UserBulkImport from '../components/user-management/UserBulkImport';
import UserBulkActions from '../components/user-management/UserBulkActions';
import UserPasswordGenerator from '../components/user-management/UserPasswordGenerator';

// Configuration de Jest pour les tests de performance
jest.setTimeout(30000); // 30 secondes pour les tests de performance

// Mock des services avec délais simulés
const mockApiService = {
  refreshExcelUsers: jest.fn(() => new Promise(resolve => setTimeout(resolve, 100))),
  saveUserToExcel: jest.fn(() => new Promise(resolve => setTimeout(resolve, 150))),
  deleteUserFromExcel: jest.fn(() => new Promise(resolve => setTimeout(resolve, 120))),
  addUserToGroup: jest.fn(() => new Promise(resolve => setTimeout(resolve, 80))),
  removeUserFromGroup: jest.fn(() => new Promise(resolve => setTimeout(resolve, 90))),
  getAdUsersInOU: jest.fn(() => new Promise(resolve => setTimeout(resolve, 200))),
  launchRdp: jest.fn(() => new Promise(resolve => setTimeout(resolve, 50)))
};

jest.mock('../services/apiService', () => mockApiService);

// Configuration des contextes avec caches de différentes tailles
const createMockCache = (userCount) => {
  const excel_users = {};
  const ad_groups = { 'VPN': [], 'Sortants_responsables': [] };
  
  for (let i = 0; i < userCount; i++) {
    const username = `user${i}`;
    excel_users[username] = [{
      username,
      displayName: `Utilisateur Test ${i}`,
      email: `user${i}@anecoop.com`,
      department: i % 3 === 0 ? 'IT' : i % 3 === 1 ? 'RH' : 'Finance',
      server: `srv${i % 5 + 1}`,
      password: `password${i}`,
      officePassword: `office${i}`,
      adEnabled: i % 2
    }];
    
    // Simuler l'appartenance aux groupes
    if (i % 2 === 0) {
      ad_groups['VPN'].push({ SamAccountName: username });
    }
    if (i % 3 === 0) {
      ad_groups['Sortants_responsables'].push({ SamAccountName: username });
    }
  }
  
  return {
    excel_users,
    'ad_groups:VPN': ad_groups['VPN'],
    'ad_groups:Sortants_responsables': ad_groups['Sortants_responsables']
  };
};

const mockNotifications = {
  showNotification: jest.fn()
};

const mockCache = (userCount) => ({
  cache: createMockCache(userCount),
  isLoading: false,
  invalidate: jest.fn()
});

jest.mock('../contexts/CacheContext', () => ({
  CacheProvider: ({ children }) => children,
  useCache: () => mockCache(10) // Défaut 10 utilisateurs
}));

jest.mock('../contexts/AppContext', () => ({
  AppProvider: ({ children }) => children,
  useApp: () => mockNotifications
}));

// Helpers pour mesurer les performances
const measurePerformance = async (testFunction, iterations = 1) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await testFunction();
    const end = performance.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return { avgTime, minTime, maxTime, times };
};

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

describe('Tests de Performance - Gestion des Utilisateurs', () => {
  
  describe('Performance de Rendu', () => {
    test('rendu avec 10 utilisateurs (scénario normal)', async () => {
      jest.mocked(useCache).mockReturnValue(mockCache(10));
      
      const { avgTime } = await measurePerformance(async () => {
        await act(async () => {
          renderWithProviders(<UsersManagementPage />);
        });
      });
      
      expect(avgTime).toBeLessThan(500); // Moins de 500ms
      console.log(`Performance rendu 10 utilisateurs: ${avgTime.toFixed(2)}ms`);
    });

    test('rendu avec 100 utilisateurs (charge moyenne)', async () => {
      jest.mocked(useCache).mockReturnValue(mockCache(100));
      
      const { avgTime } = await measurePerformance(async () => {
        await act(async () => {
          renderWithProviders(<UsersManagementPage />);
        });
      });
      
      expect(avgTime).toBeLessThan(1500); // Moins de 1.5s
      console.log(`Performance rendu 100 utilisateurs: ${avgTime.toFixed(2)}ms`);
    });

    test('rendu avec 1000 utilisateurs (charge élevée)', async () => {
      jest.mocked(useCache).mockReturnValue(mockCache(1000));
      
      const { avgTime } = await measurePerformance(async () => {
        await act(async () => {
          renderWithProviders(<UsersManagementPage />);
        });
      });
      
      expect(avgTime).toBeLessThan(5000); // Moins de 5s
      console.log(`Performance rendu 1000 utilisateurs: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Performance du Filtrage et Recherche', () => {
    beforeEach(() => {
      jest.mocked(useCache).mockReturnValue(mockCache(1000));
    });

    test('performance de la recherche textuelle', async () => {
      renderWithProviders(<UsersManagementPage />);
      
      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      
      const { avgTime, minTime, maxTime } = await measurePerformance(async () => {
        fireEvent.change(searchInput, { target: { value: 'test' } });
        // Attendre que React traite les changements
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }, 10);
      
      expect(avgTime).toBeLessThan(50); // Recherche en moins de 50ms
      console.log(`Performance recherche textuelle: min=${minTime.toFixed(2)}ms, avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`);
    });

    test('performance du filtrage par serveur', async () => {
      renderWithProviders(<UsersManagementPage />);
      
      const serverFilter = screen.getByLabelText(/serveur/i);
      
      const { avgTime } = await measurePerformance(async () => {
        fireEvent.change(serverFilter, { target: { value: 'srv01' } });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }, 10);
      
      expect(avgTime).toBeLessThan(30); // Filtrage en moins de 30ms
      console.log(`Performance filtrage serveur: ${avgTime.toFixed(2)}ms`);
    });

    test('performance du filtrage par département', async () => {
      renderWithProviders(<UsersManagementPage />);
      
      const departmentFilter = screen.getByLabelText(/service/i);
      
      const { avgTime } = await measurePerformance(async () => {
        fireEvent.change(departmentFilter, { target: { value: 'IT' } });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }, 10);
      
      expect(avgTime).toBeLessThan(30);
      console.log(`Performance filtrage département: ${avgTime.toFixed(2)}ms`);
    });

    test('performance de la sélection multiple', async () => {
      renderWithProviders(<UsersManagementPage />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      
      const { avgTime } = await measurePerformance(async () => {
        // Sélectionner 50 utilisateurs
        for (let i = 1; i < Math.min(51, checkboxes.length); i++) {
          fireEvent.click(checkboxes[i]);
        }
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      }, 5);
      
      expect(avgTime).toBeLessThan(100); // Sélection multiple en moins de 100ms
      console.log(`Performance sélection multiple: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Performance des Actions en Masse', () => {
    test('ouverture du menu d\'actions avec beaucoup d\'utilisateurs sélectionnés', async () => {
      const testUsers = Array.from({ length: 500 }, (_, i) => ({
        username: `user${i}`,
        fullName: `Utilisateur ${i}`,
        email: `user${i}@anecoop.com`
      }));
      
      const { avgTime } = await measurePerformance(async () => {
        renderWithProviders(
          <UserBulkActions 
            selectedUsers={testUsers}
            onAction={jest.fn()}
            onClearSelection={jest.fn()}
          />
        );
        
        // Ouvrir le menu
        const menuButton = screen.getByText(/actions en masse/i);
        fireEvent.click(menuButton);
      });
      
      expect(avgTime).toBeLessThan(200);
      console.log(`Performance menu actions (500 users): ${avgTime.toFixed(2)}ms`);
    });

    test('performance de l\'action de suppression en masse', async () => {
      const testUsers = Array.from({ length: 100 }, (_, i) => ({
        username: `user${i}`,
        fullName: `Utilisateur ${i}`,
        email: `user${i}@anecoop.com`
      }));
      
      renderWithProviders(
        <UserBulkActions 
          selectedUsers={testUsers}
          onAction={mockApiService.deleteUserFromExcel}
          onClearSelection={jest.fn()}
        />
      );
      
      // Ouvrir le menu et sélectionner suppression
      fireEvent.click(screen.getByText(/actions en masse/i));
      fireEvent.click(screen.getByText('Supprimer les comptes'));
      
      // Taper confirmation
      const confirmInput = screen.getByPlaceholderText('CONFIRMER');
      fireEvent.change(confirmInput, { target: { value: 'CONFIRMER' } });
      
      const { avgTime } = await measurePerformance(async () => {
        fireEvent.click(screen.getByText('Confirmer'));
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 20));
        });
      });
      
      expect(avgTime).toBeLessThan(500); // Délai acceptable pour 100 suppressions
      console.log(`Performance suppression en masse (100 users): ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Performance Import/Export', () => {
    test('performance de validation de gros fichiers CSV', async () => {
      // Créer un gros dataset
      const largeCsvData = Array.from({ length: 10000 }, (_, i) => ({
        username: `user${i}`,
        email: `user${i}@anecoop.com`,
        fullName: `Utilisateur Test ${i}`,
        department: i % 3 === 0 ? 'IT' : 'RH'
      }));
      
      const { validateImportData } = require('../components/user-management/UserBulkImport');
      
      const { avgTime } = await measurePerformance(async () => {
        validateImportData(largeCsvData);
      }, 5);
      
      expect(avgTime).toBeLessThan(200); // Validation de 10k lignes en moins de 200ms
      console.log(`Performance validation CSV (10k lignes): ${avgTime.toFixed(2)}ms`);
    });

    test('performance de génération de mots de passe en lot', async () => {
      const { generateRdsPassword, generateOfficePassword } = require('../components/user-management/UserPasswordGenerator');
      
      const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Michel'];
      const lastNames = ['Dupont', 'Martin', 'Durand', 'Bernard', 'Thomas'];
      
      const { avgTime: rdsTime } = await measurePerformance(async () => {
        for (let i = 0; i < 1000; i++) {
          const firstName = firstNames[i % firstNames.length];
          const lastName = lastNames[i % lastNames.length];
          generateRdsPassword(firstName, lastName);
        }
      }, 3);
      
      const { avgTime: officeTime } = await measurePerformance(async () => {
        for (let i = 0; i < 1000; i++) {
          generateOfficePassword();
        }
      }, 3);
      
      expect(rdsTime).toBeLessThan(50); // Génération RDS rapide
      expect(officeTime).toBeLessThan(100); // Génération Office acceptable
      
      console.log(`Performance génération RDS (1000 mots): ${rdsTime.toFixed(2)}ms`);
      console.log(`Performance génération Office (1000 mots): ${officeTime.toFixed(2)}ms`);
    });
  });

  describe('Performance de l\'Intégration AD', () => {
    test('performance de récupération des utilisateurs AD par OU', async () => {
      // Simuler une grande OU avec beaucoup d'utilisateurs
      const mockAdUsers = Array.from({ length: 2000 }, (_, i) => ({
        SamAccountName: `aduser${i}`,
        DisplayName: `Utilisateur AD ${i}`,
        EmailAddress: `aduser${i}@anecoop.com`,
        Enabled: i % 2 === 0
      }));
      
      mockApiService.getAdUsersInOU.mockResolvedValueOnce(mockAdUsers);
      
      renderWithProviders(<UsersManagementPage />);
      
      // Simuler la sélection d'une OU (cela déclencherait l'appel API)
      const { avgTime } = await measurePerformance(async () => {
        await mockApiService.getAdUsersInOU('OU=Test,DC=domain,DC=com');
      });
      
      expect(avgTime).toBeLessThan(300); // API mock avec 200ms de délai + traitement
      console.log(`Performance récupération AD (2000 users): ${avgTime.toFixed(2)}ms`);
    });

    test('performance des opérations de groupe sur beaucoup d\'utilisateurs', async () => {
      renderWithProviders(<UsersManagementPage />);
      
      // Simuler l'ajout de 100 utilisateurs au groupe VPN
      const { avgTime } = await measurePerformance(async () => {
        for (let i = 0; i < 100; i++) {
          mockApiService.addUserToGroup(`user${i}`, 'VPN');
        }
      }, 5);
      
      expect(avgTime).toBeLessThan(100); // 80ms par appel + overhead
      console.log(`Performance opérations groupe (100 users): ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Performance Mémoire', () => {
    test('vérification de l\'absence de fuites mémoire lors du filtrage répété', async () => {
      if (typeof global.gc !== 'function') {
        console.log('GC non disponible, test de mémoire ignoré');
        return;
      }
      
      global.gc(); // Forcer GC avant le test
      
      const memoryBefore = process.memoryUsage().heapUsed;
      
      // Effectuer 1000 opérations de filtrage
      renderWithProviders(<UsersManagementPage />);
      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      
      for (let i = 0; i < 1000; i++) {
        fireEvent.change(searchInput, { target: { value: `search${i}` } });
        if (i % 100 === 0) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
          });
        }
      }
      
      global.gc(); // Forcer GC après le test
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      // L'augmentation mémoire ne devrait pas dépasser 10MB pour 1000 opérations
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      console.log(`Augmentation mémoire après 1000 filtrages: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    test('nettoyage mémoire lors de la fermeture des dialogues', async () => {
      if (typeof global.gc !== 'function') {
        console.log('GC non disponible, test de mémoire ignoré');
        return;
      }
      
      global.gc();
      const memoryBefore = process.memoryUsage().heapUsed;
      
      // Ouvrir et fermer 100 fois le générateur de mots de passe
      for (let i = 0; i < 100; i++) {
        renderWithProviders(
          <UserPasswordGenerator 
            open={true}
            onClose={jest.fn()}
            onGenerate={jest.fn()}
            user={{ firstName: 'Jean', lastName: 'Dupont' }}
          />
        );
        
        // Simuler la fermeture
        const dialog = screen.getByRole('dialog');
        fireEvent.click(dialog.querySelector('[aria-label="Close"]') || dialog);
        
        if (i % 10 === 0) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
          });
        }
      }
      
      global.gc();
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Moins de 5MB
      
      console.log(`Augmentation mémoire après 100 ouverture/fermeture dialogues: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Performance Scénarios Réels', () => {
    test('scénario complet: import, validation et traitement', async () => {
      // Simuler un scénario complet d'import avec 5000 utilisateurs
      const csvData = Array.from({ length: 5000 }, (_, i) => ({
        username: `imported_user${i}`,
        email: `imported_user${i}@anecoop.com`,
        fullName: `Utilisateur Importé ${i}`,
        department: i % 4 === 0 ? 'IT' : i % 4 === 1 ? 'RH' : i % 4 === 2 ? 'Finance' : 'Marketing'
      }));
      
      const startTime = performance.now();
      
      // Étape 1: Validation
      const { validateImportData } = require('../components/user-management/UserBulkImport');
      const validationResult = validateImportData(csvData);
      
      // Étape 2: Simulation du traitement
      const validUsers = validationResult.data;
      for (let i = 0; i < validUsers.length; i += 100) {
        // Traiter par lots de 100
        const batch = validUsers.slice(i, i + 100);
        await Promise.all(batch.map(user => 
          mockApiService.saveUserToExcel(user)
        ));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(10000); // Moins de 10s pour 5000 utilisateurs
      console.log(`Performance scénario complet (5000 users): ${totalTime.toFixed(2)}ms`);
      console.log(`Validation: ${validationResult.results.length} lignes`);
      console.log(`Utilisateurs valides: ${validationResult.data.length}`);
    });

    test('charge de travail simultanée: rafraîchissement + opérations AD', async () => {
      const startTime = performance.now();
      
      // Lancer plusieurs opérations en parallèle
      const operations = [
        mockApiService.refreshExcelUsers(),
        mockApiService.getAdUsersInOU('OU=IT,DC=domain,DC=com'),
        mockApiService.addUserToGroup('testuser', 'VPN'),
        mockApiService.saveUserToExcel({ username: 'newuser', email: 'new@test.com' })
      ];
      
      await Promise.all(operations);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(500); // Moins de 500ms pour les opérations parallèles
      console.log(`Performance opérations parallèles: ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Benchmarks de Performance', () => {
    test('benchmarks de référence pour différents volumes', async () => {
      const volumes = [10, 50, 100, 500, 1000, 2000];
      const results = [];
      
      for (const volume of volumes) {
        jest.mocked(useCache).mockReturnValue(mockCache(volume));
        
        const { avgTime } = await measurePerformance(async () => {
          await act(async () => {
            renderWithProviders(<UsersManagementPage />);
          });
        }, 3);
        
        results.push({ volume, avgTime });
        console.log(`Volume ${volume} utilisateurs: ${avgTime.toFixed(2)}ms`);
      }
      
      // Vérifier la scalabilité (croissance logarithmique attendue)
      for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const previous = results[i - 1];
        const ratio = current.avgTime / previous.avgTime;
        const volumeRatio = current.volume / previous.volume;
        
        // Le ratio de performance ne devrait pas dépasser le ratio de volume
        expect(ratio).toBeLessThan(volumeRatio * 2);
      }
    });
  });
});
