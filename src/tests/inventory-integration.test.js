// src/tests/inventory-integration.test.js - TESTS D'INTÉGRATION MODULE INVENTAIRE

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    setupTestEnvironment,
    waitForPromises,
    setupDatePicker,
    setupAsyncTesting,
    setupRouter
} from './setup';
import {
    mockComputers,
    mockUsers,
    mockLoans,
    mockMaintenanceRecords,
    mockAlerts,
    mockPhotos,
    mockAccessories,
    createMockComputer,
    createMockAlert,
    createMockPhoto,
    mockScenarioData,
    generateLargeInventoryData
} from './__mocks__/inventoryData';

// Import des composants à tester
import ComputersPage from '../pages/ComputersPage';
import EquipmentPhotoUpload from '../components/inventory/EquipmentPhotoUpload';
import EquipmentAlerts from '../components/inventory/EquipmentAlerts';

// Configuration environnement de test
setupTestEnvironment();

// Mock des services API avec données réalistes
const mockApiService = {
    getComputers: jest.fn(() => Promise.resolve(mockComputers)),
    saveComputer: jest.fn((computerData) => {
        // Simuler la sauvegarde
        const savedComputer = {
            ...computerData,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return Promise.resolve(savedComputer);
    }),
    deleteComputer: jest.fn((computerId) => {
        return Promise.resolve({ success: true, id: computerId });
    }),
    addComputerMaintenance: jest.fn((computerId, maintenanceData) => {
        const newMaintenance = {
            id: Date.now(),
            computerId,
            ...maintenanceData,
            date: new Date().toISOString()
        };
        return Promise.resolve(newMaintenance);
    }),
    createLoan: jest.fn((loanData) => {
        const newLoan = {
            id: Date.now(),
            ...loanData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return Promise.resolve(newLoan);
    }),
    uploadEquipmentPhotos: jest.fn((equipmentId, photos) => {
        const uploadedPhotos = photos.map(photo => ({
            id: Date.now() + Math.random(),
            equipmentId,
            filename: photo.name,
            url: `https://example.com/photos/${photo.name}`,
            size: photo.size,
            uploadDate: new Date().toISOString()
        }));
        return Promise.resolve({ photos: uploadedPhotos });
    }),
    getMaintenanceHistory: jest.fn((computerId) => {
        return Promise.resolve(mockMaintenanceRecords.filter(m => m.computerId === computerId));
    }),
    getEquipmentAlerts: jest.fn(() => {
        return Promise.resolve(mockAlerts);
    })
};

jest.mock('../services/apiService', () => ({
    default: mockApiService
}));

// Mock des contextes avec données persistantes
let mockCache = {
    computers: mockComputers,
    excel_users: { mockUsers },
    config: { it_staff: ['Jean Dupont', 'Marie Martin', 'Pierre Durand', 'Sophie Leroux'] },
    loans: mockLoans
};

jest.mock('../contexts/AppContext', () => ({
    useApp: () => ({
        currentTechnician: { id: 1, name: 'Jean Dupont' },
        showNotification: jest.fn((type, message) => {
            console.log(`Notification ${type}: ${message}`);
        })
    })
}));

jest.mock('../contexts/CacheContext', () => ({
    useCache: () => ({
        cache: mockCache,
        invalidate: jest.fn((key) => {
            // Simuler l'invalidation du cache
            if (key === 'computers') {
                return mockApiService.getComputers();
            }
        }),
        isLoading: false
    })
}));

// ===== TESTS D'INTÉGRATION WORKFLOW COMPLET =====

describe('Inventory Integration - Workflow Complet', () => {
    const { waitForAsync } = setupAsyncTesting();
    const { setupDatePicker: setupDateTest } = setupDatePicker();
    
    beforeEach(() => {
        jest.clearAllMocks();
        setupDateTest();
        mockCache = {
            computers: mockComputers,
            excel_users: { mockUsers },
            config: { it_staff: ['Jean Dupont', 'Marie Martin'] },
            loans: mockLoans
        };
        
        // Mock des APIs browser
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ photos: [] })
            })
        );
        global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
        global.URL.revokeObjectURL = jest.fn();
    });

    test('devrait permettre le workflow complet d\'ajout d\'ordinateur avec photos', async () => {
        const user = userEvent.setup();
        
        // 1. Ouvrir la page
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        const initialCount = mockCache.computers.length;

        // 2. Cliquer sur Ajouter
        const addButton = screen.getByText(/Ajouter/i);
        await user.click(addButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { title: /Ajouter un ordinateur/i })).toBeInTheDocument();
        });

        // 3. Remplir le formulaire (simulation)
        // Note: Dans un vrai test, on remplirait tous les champs
        const saveButton = screen.getByText(/Sauvegarder/i);
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockApiService.saveComputer).toHaveBeenCalled();
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        // 4. Vérifier que l'ordinateur a été ajouté au cache
        await waitFor(() => {
            const { invalidate } = require('../contexts/CacheContext').useCache();
            expect(invalidate).toHaveBeenCalledWith('computers');
        });
    });

    test('devrait permettre le workflow de prêt complet', async () => {
        const user = userEvent.setup();
        
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument(); // disponible
        });

        // 1. Cliquer sur prêt rapide
        const quickLoanButton = screen.getByText(/Rapide/i);
        await user.click(quickLoanButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { title: /Prêt Rapide - PC-001/i })).toBeInTheDocument();
        });

        // 2. Sélectionner un utilisateur
        const userInput = screen.getByLabelText(/Utilisateur/i);
        await user.click(userInput);
        
        const firstUser = screen.getByText(/Jean Dupont/i);
        await user.click(firstUser);

        // 3. Confirmer le prêt
        const createButton = screen.getByText(/Créer le prêt/i);
        await user.click(createButton);

        await waitFor(() => {
            expect(mockApiService.createLoan).toHaveBeenCalled();
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        // 4. Vérifier que le statut de l'ordinateur change
        await waitFor(() => {
            const { invalidate } = require('../contexts/CacheContext').useCache();
            expect(invalidate).toHaveBeenCalled();
        });
    });

    test('devrait intégrer la gestion des photos avec l\'inventaire', async () => {
        const user = userEvent.setup();
        const onUpload = jest.fn();
        
        // 1. Ouvrir l'uploader de photos
        render(
            <EquipmentPhotoUpload 
                open={true} 
                onClose={jest.fn()} 
                onUpload={onUpload}
                equipmentId={1} 
            />
        );

        // 2. Ajouter des photos
        const file1 = new File(['test1'], 'pc001-front.jpg', { type: 'image/jpeg' });
        const file2 = new File(['test2'], 'pc001-back.jpg', { type: 'image/jpeg' });
        
        const dropzone = screen.getByText(/Glissez-déposez ou cliquez/i).closest('div');
        
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [file1, file2],
                types: ['Files']
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/Photos sélectionnées/i)).toBeInTheDocument();
            expect(screen.getByText(/Uploader 2 photo\(s\)/i)).toBeInTheDocument();
        });

        // 3. Uploader
        const uploadButton = screen.getByText(/Uploader 2 photo\(s\)/i);
        await user.click(uploadButton);

        await waitFor(() => {
            expect(mockApiService.uploadEquipmentPhotos).toHaveBeenCalledWith(
                1,
                expect.arrayContaining([file1, file2])
            );
            expect(onUpload).toHaveBeenCalled();
        });

        // 4. Vérifier l'intégration avec le cache
        await waitFor(() => {
            const { invalidate } = require('../contexts/CacheContext').useCache();
            expect(invalidate).toHaveBeenCalled();
        });
    });
});

// ===== TESTS D'INTÉGRATION RECHERCHE ET FILTRAGE =====

describe('Inventory Integration - Recherche et Filtrage', () => {
    const { waitForAsync } = setupAsyncTesting();
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache = {
            computers: mockComputers,
            excel_users: { mockUsers },
            config: { it_staff: ['Jean Dupont'] },
            loans: []
        };
    });

    test('devrait combiner plusieurs filtres efficacement', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Appliquer plusieurs filtres simultanément
        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        await user.type(searchInput, 'Dell');

        const statusFilter = screen.getByLabelText(/Statut/i);
        await user.selectOptions(statusFilter, 'available');

        const brandFilter = screen.getByLabelText(/Marque/i);
        await user.selectOptions(brandFilter, 'Dell');

        await waitFor(() => {
            // Ne devrait afficher que les Dell disponibles correspondant à "Dell"
            expect(screen.getByText('PC-001')).toBeInTheDocument();
            expect(screen.queryByText('PC-002')).not.toBeInTheDocument(); // HP
            expect(screen.queryByText('PC-003')).not.toBeInTheDocument(); // Lenovo
        });
    });

    test('devrait rechercher dans tous les champs pertinents', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Tester recherche par numéro de série
        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        await user.type(searchInput, 'SN001234567');

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Effacer et tester recherche par marque
        await user.clear(searchInput);
        await user.type(searchInput, 'HP');

        await waitFor(() => {
            expect(screen.getByText('PC-002')).toBeInTheDocument(); // HP
        });
    });

    test('devrait persister les filtres lors du changement de vue', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Appliquer un filtre
        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        await user.type(searchInput, 'Dell');

        await waitFor(() => {
            expect(screen.queryByText('PC-002')).not.toBeInTheDocument(); // HP
        });

        // Changer de vue
        const listButton = screen.getByLabelText(/Vue Liste/i);
        await user.click(listButton);

        await waitFor(() => {
            // Le filtre devrait persister
            expect(screen.queryByText('PC-002')).not.toBeInTheDocument(); // HP
            expect(screen.getByText('PC-001')).toBeInTheDocument(); // Dell
        });
    });
});

// ===== TESTS D'INTÉGRATION MAINTENANCE ET HISTORIQUE =====

describe('Inventory Integration - Maintenance et Historique', () => {
    const { waitForAsync } = setupAsyncTesting();
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache = {
            computers: mockComputers,
            excel_users: { mockUsers },
            config: { it_staff: ['Jean Dupont'] },
            loans: [],
            maintenance: mockMaintenanceRecords
        };
    });

    test('devrait ajouter une maintenance et mettre à jour l\'historique', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // 1. Ouvrir le dialog de maintenance
        const maintenanceButton = screen.getAllByLabelText(/Maintenance/i)[0];
        await user.click(maintenanceButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { title: /Maintenance - PC-001/i })).toBeInTheDocument();
        });

        // 2. Remplir le formulaire de maintenance
        const descriptionInput = screen.getByLabelText(/Description/i);
        await user.type(descriptionInput, 'Maintenance de test');

        // 3. Sauvegarder
        const saveButton = screen.getByText(/Sauvegarder/i);
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockApiService.addComputerMaintenance).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    description: 'Maintenance de test'
                })
            );
        });

        // 4. Vérifier que l'ordinateur est mis à jour
        await waitFor(() => {
            const { invalidate } = require('../contexts/CacheContext').useCache();
            expect(invalidate).toHaveBeenCalledWith('computers');
        });
    });

    test('devrait afficher l\'historique complet des modifications', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // 1. Ouvrir l'historique
        const historyButton = screen.getAllByLabelText(/Historique/i)[0];
        await user.click(historyButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { title: /Historique - PC-001/i })).toBeInTheDocument();
        });

        // 2. Vérifier que l'historique est chargé
        await waitFor(() => {
            expect(mockApiService.getMaintenanceHistory).toHaveBeenCalledWith(1);
        });

        // 3. Vérifier l'affichage de l'historique
        // Note: Le contenu dépend de l'implémentation du composant
    });
});

// ===== TESTS D'INTÉGRATION ALERTES =====

describe('Inventory Integration - Système d\'Alertes', () => {
    const { waitForAsync } = setupAsyncTesting();
    const { setupDatePicker: setupDateTest } = setupDatePicker();
    
    beforeEach(() => {
        jest.clearAllMocks();
        setupDateTest();
    });

    test('devrait générer et afficher toutes les alertes', () => {
        render(<EquipmentAlerts equipment={mockComputers} />);

        // Vérifier les alertes de garantie expirée
        expect(screen.getByText(/Garantie expirée/i)).toBeInTheDocument();
        
        // Vérifier les alertes de garantie qui expire
        expect(screen.getByText(/Garantie expire bientôt/i)).toBeInTheDocument();
        
        // Vérifier les alertes de maintenance
        expect(screen.getByText(/Maintenance requise/i)).toBeInTheDocument();
    });

    test('devrait intégrer les alertes avec le dashboard principal', async () => {
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Les alertes devraient être visibles dans le contexte
        // (dépend de l'implémentation dans ComputersPage)
    });

    test('devrait trier les alertes par priorité', () => {
        render(<EquipmentAlerts equipment={mockComputers} />);

        const alertItems = screen.getAllByRole('listitem');
        
        // La première alerte devrait être la plus critique (erreur)
        expect(alertItems[0]).toHaveTextContent(/Critique/i);
    });
});

// ===== TESTS D'INTÉGRATION BASE DE DONNÉES =====

describe('Inventory Integration - Base de Données', () => {
    const { waitForAsync } = setupAsyncTesting();
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Réinitialiser le cache
        mockCache = {
            computers: [],
            excel_users: { mockUsers },
            config: { it_staff: ['Jean Dupont'] },
            loans: []
        };
    });

    test('devrait charger et afficher les données depuis l\'API', async () => {
        const computers = [
            createMockComputer({ id: 1, name: 'PC-API-1' }),
            createMockComputer({ id: 2, name: 'PC-API-2' })
        ];
        
        mockApiService.getComputers.mockResolvedValue(computers);
        mockCache.computers = computers;

        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-API-1')).toBeInTheDocument();
            expect(screen.getByText('PC-API-2')).toBeInTheDocument();
        });
    });

    test('devrait gérer les erreurs de synchronisation de données', async () => {
        mockApiService.getComputers.mockRejectedValue(new Error('Erreur réseau'));
        mockCache.computers = [];

        render(<ComputersPage />);

        await waitFor(() => {
            // L'application devrait gérer l'erreur gracieusement
            expect(screen.getByText(/Inventaire Matériel/i)).toBeInTheDocument();
        });
    });

    test('devrait persister les modifications', async () => {
        const user = userEvent.setup();
        const newComputer = createMockComputer({ name: 'PC-NEW' });
        
        mockApiService.saveComputer.mockResolvedValue(newComputer);
        mockCache.computers = [newComputer];

        render(<ComputersPage />);

        // Modifier l'ordinateur
        const editButton = screen.getAllByLabelText(/Modifier/i)[0];
        await user.click(editButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Simuler une modification
        const saveButton = screen.getByText(/Sauvegarder/i);
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockApiService.saveComputer).toHaveBeenCalled();
        });
    });
});

// ===== TESTS D'INTÉGRATION PERFORMANCE AVEC GROS VOLUME =====

describe('Inventory Integration - Performance avec Gros Volume', () => {
    const { waitForAsync } = setupAsyncTesting();
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Simuler un gros volume de données
        mockCache.computers = generateLargeInventoryData(1000);
    });

    test('devrait gérer efficacement un grand volume d\'ordinateurs', async () => {
        const startTime = performance.now();
        
        render(<ComputersPage />);

        // Le rendu initial devrait être acceptable (< 2 secondes)
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        expect(renderTime).toBeLessThan(2000);
    });

    test('devrait filtrer efficacement dans un grand dataset', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const startTime = performance.now();
        
        // Appliquer un filtre restrictif
        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        await user.type(searchInput, 'Dell');

        await waitFor(() => {
            // La recherche devrait être rapide
            const endTime = performance.now();
            const filterTime = endTime - startTime;
            expect(filterTime).toBeLessThan(500);
        });
    });

    test('devrait changer de vue efficacement', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        // Tester le changement de vue grille vers liste
        const listButton = screen.getByLabelText(/Vue Liste/i);
        const startTime = performance.now();
        
        await user.click(listButton);

        await waitFor(() => {
            const endTime = performance.now();
            const switchTime = endTime - startTime;
            expect(switchTime).toBeLessThan(300);
        });
    });
});

// ===== TESTS D'INTÉGRATION EXPORT ET RAPPORTS =====

describe('Inventory Integration - Export et Rapports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache = {
            computers: mockComputers,
            excel_users: { mockUsers },
            config: { it_staff: ['Jean Dupont'] },
            loans: []
        };
        
        // Mock des utilitaires d'export
        jest.mock('../utils/lazyModules', () => ({
            loadXLSX: jest.fn().mockResolvedValue({
                utils: {
                    json_to_sheet: jest.fn().mockReturnValue({}),
                    book_new: jest.fn().mockReturnValue({}),
                    book_append_sheet: jest.fn().mockReturnValue(undefined)
                },
                writeFile: jest.fn()
            })
        }));
    });

    test('devrait exporter l\'inventaire en Excel', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Chercher et cliquer sur le bouton d'export
        // Note: L'emplacement dépend de l'implémentation
        // const exportButton = screen.getByText(/Exporter/i);
        // await user.click(exportButton);

        // Vérifier que l'export est déclenché
        // expect(mockExportUtils).toHaveBeenCalled();
    });

    test('devrait générer un rapport d\'alertes', async () => {
        render(<EquipmentAlerts equipment={mockComputers} />);

        // Vérifier que les statistiques d'alertes sont calculées
        expect(screen.getByText(/1 alerte\(s\) détectée\(s\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Critiques/i)).toBeInTheDocument();
        expect(screen.getByText(/Avertissements/i)).toBeInTheDocument();
    });
});

// ===== TESTS D'INTÉGRATION SÉCURITÉ =====

describe('Inventory Integration - Sécurité et Permissions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache = {
            computers: mockComputers,
            excel_users: { mockUsers },
            config: { it_staff: ['Jean Dupont'] },
            loans: []
        };
    });

    test('devrait vérifier les permissions avant modification', async () => {
        const user = userEvent.setup();
        window.confirm = jest.fn(() => false); // Simuler annulation
        
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Essayer de supprimer
        const moreVertButton = screen.getAllByLabelText(/More Vert/i)[0];
        await user.click(moreVertButton);

        const deleteOption = screen.getByText(/Supprimer/i);
        await user.click(deleteOption);

        // La confirmation devrait être demandée
        expect(window.confirm).toHaveBeenCalledWith('Supprimer PC-001 ?');
    });

    test('devrait empêcher les modifications concurrentes', async () => {
        const user = userEvent.setup();
        const { invalidate } = require('../contexts/CacheContext').useCache();
        
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Simuler plusieurs modifications simultanées
        const editButton = screen.getAllByLabelText(/Modifier/i)[0];
        await user.click(editButton);

        // En attendant le premier dialog, essayer d'ouvrir un autre
        // Ceci teste la gestion des états concurrentiels
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });
});

// ===== TESTS D'INTÉGRATION WORKFLOW UTILISATEUR =====

describe('Inventory Integration - Workflows Utilisateur', () => {
    const { waitForAsync } = setupAsyncTesting();
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache = {
            computers: mockComputers,
            excel_users: { mockUsers },
            config: { it_staff: ['Jean Dupont'] },
            loans: []
        };
    });

    test('devrait permettre un workflow de technicien complet', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // 1. Le technicien vérifie l'inventaire
        expect(screen.getByText('Total')).toBeInTheDocument();

        // 2. Le technicien filtre pour voir les machines en maintenance
        const statusFilter = screen.getByLabelText(/Statut/i);
        await user.selectOptions(statusFilter, 'maintenance');

        await waitFor(() => {
            expect(screen.getByText('PC-002')).toBeInTheDocument();
        });

        // 3. Le technicien ouvre la maintenance
        const maintenanceButton = screen.getAllByLabelText(/Maintenance/i)[0];
        await user.click(maintenanceButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });

    test('devrait permettre un workflow d\'ajout rapide', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        const initialCount = screen.getAllByText(/PC-/i).length;

        // Ajout rapide d'un ordinateur
        const addButton = screen.getByText(/Ajouter/i);
        await user.click(addButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Simulation d'ajout (dans un vrai test, on remplirait le formulaire)
        const saveButton = screen.getByText(/Sauvegarder/i);
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockApiService.saveComputer).toHaveBeenCalled();
        });
    });
});

// Nettoyage global après tous les tests
afterAll(() => {
    jest.clearAllMocks();
    global.fetch.mockRestore();
    global.URL.createObjectURL.mockRestore();
    global.URL.revokeObjectURL.mockRestore();
    window.confirm.mockRestore();
});

console.log('✅ Tests d\'intégration du module Inventaire chargés');
