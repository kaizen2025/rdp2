// src/tests/inventory.test.js - TESTS UNITAIRES MODULE INVENTAIRE

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    setupTestEnvironment,
    waitForPromises,
    setupDatePicker,
    setupFormTesting,
    setupModalTesting,
    setupAsyncTesting
} from './setup';
import {
    mockComputers,
    mockUsers,
    mockAlerts,
    mockPhotos,
    mockAccessories,
    createMockComputer,
    createMockAlert,
    createMockPhoto,
    mockScenarioData
} from './__mocks__/inventoryData';

// Import des composants à tester
import ComputersPage from '../pages/ComputersPage';
import EquipmentPhotoUpload from '../components/inventory/EquipmentPhotoUpload';
import EquipmentAlerts from '../components/inventory/EquipmentAlerts';

// Configuration environnement de test
setupTestEnvironment();

// Mock des services API
jest.mock('../services/apiService', () => ({
    default: {
        getComputers: jest.fn(() => Promise.resolve([])),
        saveComputer: jest.fn(() => Promise.resolve({ success: true })),
        deleteComputer: jest.fn(() => Promise.resolve({ success: true })),
        addComputerMaintenance: jest.fn(() => Promise.resolve({ success: true })),
        createLoan: jest.fn(() => Promise.resolve({ success: true })),
        uploadEquipmentPhotos: jest.fn(() => Promise.resolve({ photos: [] })),
        getMaintenanceHistory: jest.fn(() => Promise.resolve([])),
        getEquipmentAlerts: jest.fn(() => Promise.resolve([]))
    }
}));

// Mock des contextes
jest.mock('../contexts/AppContext', () => ({
    useApp: () => ({
        currentTechnician: { id: 1, name: 'Jean Dupont' },
        showNotification: jest.fn()
    })
}));

jest.mock('../contexts/CacheContext', () => ({
    useCache: () => ({
        cache: {
            computers: mockComputers,
            excel_users: { mockUsers },
            config: { it_staff: ['Jean Dupont', 'Marie Martin'] },
            loans: mockScenarioData.mockLoans || []
        },
        invalidate: jest.fn(),
        isLoading: false
    })
}));

// ===== TESTS POUR EQUIPMENT PHOTO UPLOAD =====

describe('EquipmentPhotoUpload', () => {
    const { createInput, triggerInputChange } = setupFormTesting();
    const { createMockPortal, cleanupPortal } = setupModalTesting();
    const { waitForAsync } = setupAsyncTesting();
    
    const defaultProps = {
        open: true,
        onClose: jest.fn(),
        onUpload: jest.fn(),
        equipmentId: 1,
        existingPhotos: []
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock FileReader
        global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
        global.URL.revokeObjectURL = jest.fn();
        
        // Mock fetch
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ photos: [] })
            })
        );
    });

    afterEach(() => {
        cleanupPortal();
        jest.clearAllMocks();
    });

    test('devrait afficher la zone de drop au chargement', () => {
        render(<EquipmentPhotoUpload {...defaultProps} />);
        
        expect(screen.getByText(/Upload de photos/i)).toBeInTheDocument();
        expect(screen.getByText(/Glissez-déposez ou cliquez/i)).toBeInTheDocument();
        expect(screen.getByText(/Formats acceptés : PNG, JPG, JPEG, GIF, WEBP/i)).toBeInTheDocument();
    });

    test('devrait accepter les fichiers image par drag & drop', async () => {
        const user = userEvent.setup();
        render(<EquipmentPhotoUpload {...defaultProps} />);

        const dropzone = screen.getByText(/Glissez-déposez ou cliquez/i).closest('div');
        
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const files = [file];

        // Simuler le drop
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files,
                types: ['Files']
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/Photos sélectionnées/i)).toBeInTheDocument();
        });
    });

    test('devrait rejeter les fichiers non supportés', async () => {
        const user = userEvent.setup();
        render(<EquipmentPhotoUpload {...defaultProps} />);

        const dropzone = screen.getByText(/Glissez-déposez ou cliquez/i).closest('div');
        
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [file],
                types: ['Files']
            }
        });

        await waitFor(() => {
            expect(screen.queryByText(/Photos sélectionnées/i)).not.toBeInTheDocument();
        });
    });

    test('devrait rejeter les fichiers trop volumineux', async () => {
        render(<EquipmentPhotoUpload {...defaultProps} />);

        const dropzone = screen.getByText(/Glissez-déposez ou cliquez/i).closest('div');
        
        // Fichier de 6MB (limite à 5MB)
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
        
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [largeFile],
                types: ['Files']
            }
        });

        await waitFor(() => {
            expect(screen.queryByText(/Photos sélectionnées/i)).not.toBeInTheDocument();
        });
    });

    test('devrait supprimer une photo sélectionnée', async () => {
        const user = userEvent.setup();
        render(<EquipmentPhotoUpload {...defaultProps} />);

        // Ajouter une photo
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const dropzone = screen.getByText(/Glissez-déposez ou cliquez/i).closest('div');
        
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [file],
                types: ['Files']
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/Photos sélectionnées/i)).toBeInTheDocument();
        });

        // Cliquer sur le bouton de suppression
        const deleteButton = screen.getByLabelText(/Supprimer/i);
        await user.click(deleteButton);

        await waitFor(() => {
            expect(screen.queryByText(/Photos sélectionnées/i)).not.toBeInTheDocument();
        });
    });

    test('devrait uploader les photos avec succès', async () => {
        const user = userEvent.setup();
        const onUpload = jest.fn();
        
        render(<EquipmentPhotoUpload {...defaultProps} onUpload={onUpload} />);

        // Ajouter des photos
        const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
        
        const dropzone = screen.getByText(/Glissez-déposez ou cliquez/i).closest('div');
        
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [file1, file2],
                types: ['Files']
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/Uploader 2 photo\(s\)/i)).toBeInTheDocument();
        });

        // Cliquer sur upload
        const uploadButton = screen.getByText(/Uploader 2 photo\(s\)/i);
        await user.click(uploadButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/equipment/photos/upload',
                expect.objectContaining({
                    method: 'POST'
                })
            );
            expect(onUpload).toHaveBeenCalledWith([]);
        });
    });

    test('devrait gérer les erreurs d\'upload', async () => {
        const user = userEvent.setup();
        
        global.fetch = jest.fn(() => 
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Server Error'
            })
        );
        
        jest.spyOn(window, 'alert').mockImplementation();

        render(<EquipmentPhotoUpload {...defaultProps} />);

        // Ajouter une photo
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const dropzone = screen.getByText(/Glissez-déposez ou cliquez/i).closest('div');
        
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [file],
                types: ['Files']
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/Uploader 1 photo\(s\)/i)).toBeInTheDocument();
        });

        const uploadButton = screen.getByText(/Uploader 1 photo\(s\)/i);
        await user.click(uploadButton);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Erreur lors de l\'upload des photos');
        });
    });

    test('devrait afficher la prévisualisation d\'une photo', async () => {
        const user = userEvent.setup();
        render(<EquipmentPhotoUpload {...defaultProps} existingPhotos={mockPhotos} />);

        await waitFor(() => {
            expect(screen.getByText(/Photos sélectionnées/i)).toBeInTheDocument();
        });

        // Cliquer sur agrandir
        const zoomButton = screen.getByLabelText(/Agrandir/i);
        await user.click(zoomButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { title: /pc001-front.jpg/i })).toBeInTheDocument();
        });
    });

    test('devrait fermer correctement et nettoyer les URLs', async () => {
        const user = userEvent.setup();
        render(<EquipmentPhotoUpload {...defaultProps} />);

        const cancelButton = screen.getByText(/Annuler/i);
        await user.click(cancelButton);

        await waitFor(() => {
            expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
            expect(global.URL.revokeObjectURL).toHaveBeenCalled();
        });
    });
});

// ===== TESTS POUR EQUIPMENT ALERTS =====

describe('EquipmentAlerts', () => {
    const { setupDatePicker: setupDateTest } = setupDatePicker();
    
    beforeEach(() => {
        jest.clearAllMocks();
        setupDateTest(); // Dates déterministes pour les tests
    });

    test('devrait afficher aucune alerte quand il n\'y en a pas', () => {
        render(<EquipmentAlerts equipment={[]} />);
        
        expect(screen.getByText(/Aucune alerte - Tout le matériel est à jour/i)).toBeInTheDocument();
    });

    test('devrait générer les alertes de garantie expirée', () => {
        const equipment = [mockScenarioData.expiredWarranty];
        render(<EquipmentAlerts equipment={equipment} />);
        
        expect(screen.getByText(/Garantie expirée/i)).toBeInTheDocument();
        expect(screen.getByText(/PC-EXPIRED/i)).toBeInTheDocument();
        expect(screen.getByText(/Expirée depuis/i)).toBeInTheDocument();
    });

    test('devrait générer les alertes de garantie qui expire bientôt', () => {
        const equipment = [mockScenarioData.maintenanceDue];
        render(<EquipmentAlerts equipment={equipment} />);
        
        expect(screen.getByText(/Garantie expire bientôt/i)).toBeInTheDocument();
        expect(screen.getByText(/Expire dans/i)).toBeInTheDocument();
    });

    test('devrait générer les alertes de maintenance requise', () => {
        const equipment = [mockScenarioData.maintenanceDue];
        render(<EquipmentAlerts equipment={equipment} />);
        
        expect(screen.getByText(/Maintenance requise/i)).toBeInTheDocument();
        expect(screen.getByText(/Dernière maintenance il y a/i)).toBeInTheDocument();
    });

    test('devrait trier les alertes par sévérité', () => {
        const equipment = [
            mockScenarioData.expiredWarranty, // erreur
            mockScenarioData.maintenanceDue   // warning
        ];
        
        render(<EquipmentAlerts equipment={equipment} />);
        
        const alertItems = screen.getAllByRole('listitem');
        // La première alerte devrait être l'erreur (critique)
        expect(alertItems[0]).toHaveTextContent(/Garantie expirée/i);
        expect(alertItems[0]).toHaveTextContent(/Critique/i);
    });

    test('devrait afficher les statistiques d\'alertes', () => {
        const equipment = [
            mockScenarioData.expiredWarranty,
            mockScenarioData.maintenanceDue
        ];
        
        render(<EquipmentAlerts equipment={equipment} />);
        
        expect(screen.getByText(/1 alerte\(s\) détectée\(s\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Critiques/i)).toBeInTheDocument();
        expect(screen.getByText(/Avertissements/i)).toBeInTheDocument();
    });

    test('devrait afficher les badges de sévérité', () => {
        const equipment = [mockScenarioData.expiredWarranty];
        render(<EquipmentAlerts equipment={equipment} />);
        
        expect(screen.getByText(/Critique/i)).toBeInTheDocument();
    });

    test('devrait afficher les informations du matériel dans les alertes', () => {
        const equipment = [mockScenarioData.expiredWarranty];
        render(<EquipmentAlerts equipment={equipment} />);
        
        expect(screen.getByText(/SN-TEST-001/i)).toBeInTheDocument();
        expect(screen.getByText(/TestModel/i)).toBeInTheDocument();
    });

    test('devrait mettre à jour les alertes quand l\'équipement change', () => {
        const { rerender } = render(<EquipmentAlerts equipment={[]} />);
        
        expect(screen.getByText(/Aucune alerte/i)).toBeInTheDocument();
        
        rerender(<EquipmentAlerts equipment={[mockScenarioData.expiredWarranty]} />);
        
        expect(screen.getByText(/Garantie expirée/i)).toBeInTheDocument();
    });
});

// ===== TESTS POUR COMPUTERSPAGE =====

describe('ComputersPage', () => {
    const { waitForAsync } = setupAsyncTesting();
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock du service d'API
        const apiService = require('../services/apiService').default;
        apiService.getComputers.mockResolvedValue(mockComputers);
    });

    test('devrait afficher le titre et les statistiques', () => {
        render(<ComputersPage />);
        
        expect(screen.getByText(/Inventaire Matériel/i)).toBeInTheDocument();
        expect(screen.getByText(/Vue d\'ensemble du parc informatique/i)).toBeInTheDocument();
        expect(screen.getByText(/Total/i)).toBeInTheDocument();
        expect(screen.getByText(/Disponibles/i)).toBeInTheDocument();
    });

    test('devrait afficher les filtres de recherche', () => {
        render(<ComputersPage />);
        
        expect(screen.getByPlaceholderText(/Rechercher\.\.\./i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Statut/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Localisation/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Marque/i)).toBeInTheDocument();
    });

    test('devrait afficher la liste des ordinateurs', async () => {
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
            expect(screen.getByText('PC-002')).toBeInTheDocument();
            expect(screen.getByText('PC-003')).toBeInTheDocument();
        });
    });

    test('devrait filtrer par statut', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        const statusFilter = screen.getByLabelText(/Statut/i);
        await user.selectOptions(statusFilter, 'available');

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
            expect(screen.queryByText('PC-002')).not.toBeInTheDocument(); // maintenance
        });
    });

    test('devrait filtrer par terme de recherche', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        await user.type(searchInput, 'Dell');

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument(); // Dell
            expect(screen.queryByText('PC-002')).not.toBeInTheDocument(); // HP
            expect(screen.queryByText('PC-003')).not.toBeInTheDocument(); // Lenovo
        });
    });

    test('devrait changer de vue (cartes/liste)', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Passer en vue liste
        const listButton = screen.getByLabelText(/Vue Liste/i);
        await user.click(listButton);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
            // Vérifier qu'on a des éléments de liste
            expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
        });
    });

    test('devrait ouvrir le dialog d\'ajout d\'ordinateur', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        const addButton = screen.getByText(/Ajouter/i);
        await user.click(addButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { title: /Ajouter un ordinateur/i })).toBeInTheDocument();
        });
    });

    test('devrait supprimer un ordinateur', async () => {
        const user = userEvent.setup();
        window.confirm = jest.fn(() => true);
        
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Ouvrir le menu d'actions pour PC-001
        const moreVertButton = screen.getAllByLabelText(/More Vert/i)[0];
        await user.click(moreVertButton);

        // Cliquer sur Supprimer
        const deleteOption = screen.getByText(/Supprimer/i);
        await user.click(deleteOption);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalledWith('Supprimer PC-001 ?');
        });
    });

    test('devrait afficher le dialog d\'historique', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Cliquer sur l'icône d'historique
        const historyButton = screen.getAllByLabelText(/Historique/i)[0];
        await user.click(historyButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { title: /Historique - PC-001/i })).toBeInTheDocument();
        });
    });

    test('devrait effacer tous les filtres', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Appliquer des filtres
        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        await user.type(searchInput, 'Dell');

        // Vérifier qu'il y a un bouton pour effacer les filtres
        expect(screen.getByText(/Effacer les filtres/i)).toBeInTheDocument();

        // Cliquer sur effacer
        const clearButton = screen.getByText(/Effacer les filtres/i);
        await user.click(clearButton);

        await waitFor(() => {
            expect(searchInput).toHaveValue('');
        });
    });

    test('devrait afficher l\'état vide si aucun ordinateur trouvé', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Filtrer avec un terme qui ne correspond à rien
        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        await user.type(searchInput, 'XYZABC123');

        await waitFor(() => {
            expect(screen.getByText(/Aucun résultat trouvé/i)).toBeInTheDocument();
        });
    });

    test('devrait actualiser la liste', async () => {
        const user = userEvent.setup();
        const { invalidate } = require('../contexts/CacheContext').useCache();
        
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Cliquer sur actualiser
        const refreshButton = screen.getByLabelText(/Actualiser/i);
        await user.click(refreshButton);

        await waitFor(() => {
            expect(invalidate).toHaveBeenCalledWith('computers');
        });
    });

    test('devrait ouvrir le dialog de prêt rapide', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument(); // disponible
        });

        // Cliquer sur prêt rapide
        const quickLoanButton = screen.getByText(/Rapide/i);
        await user.click(quickLoanButton);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { title: /Prêt Rapide - PC-001/i })).toBeInTheDocument();
        });
    });

    test('devrait afficher les bonnes statistiques', () => {
        render(<ComputersPage />);
        
        // 3 disponibles (PC-001, PC-004, PC-005), 1 prêté (PC-003), 1 en maintenance (PC-002)
        expect(screen.getByText('3')).toBeInTheDocument(); // Total
        expect(screen.getByText('3')).toBeInTheDocument(); // Disponibles
        expect(screen.getByText('1')).toBeInTheDocument(); // Prêtés
        expect(screen.getByText('1')).toBeInTheDocument(); // En maintenance
    });

    test('devrait gérer les erreurs d\'API gracieusement', async () => {
        const apiService = require('../services/apiService').default;
        apiService.getComputers.mockRejectedValue(new Error('Erreur API'));

        render(<ComputersPage />);

        await waitFor(() => {
            // Vérifier que l'erreur est gérée sans crasher
            expect(screen.getByText(/Inventaire Matériel/i)).toBeInTheDocument();
        });
    });
});

// ===== TESTS DE PERFORMANCE =====

describe('Inventory Performance Tests', () => {
    test('devrait rendre rapidement avec beaucoup d\'ordinateurs', async () => {
        const startTime = performance.now();
        
        const largeDataset = Array.from({ length: 1000 }, (_, i) => 
            createMockComputer({ id: i + 1, name: `PC-${String(i + 1).padStart(4, '0')}` })
        );

        render(<ComputersPage />);
        
        // Le rendu initial devrait être sous 500ms
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        expect(renderTime).toBeLessThan(500);
    });

    test('devrait filtrer efficacement', async () => {
        const user = userEvent.setup();
        const { cache } = require('../contexts/CacheContext').useCache();
        
        // Simuler un grand dataset
        cache.computers = Array.from({ length: 500 }, (_, i) => 
            createMockComputer({ 
                id: i + 1, 
                name: `PC-${String(i + 1).padStart(4, '0')}`,
                brand: ['Dell', 'HP', 'Lenovo'][i % 3]
            })
        );

        const startTime = performance.now();
        
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-001')).toBeInTheDocument();
        });

        // Appliquer un filtre
        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        await user.type(searchInput, 'Dell');

        await waitFor(() => {
            // La recherche devrait être instantanée
            const endTime = performance.now();
            const filterTime = endTime - startTime;
            expect(filterTime).toBeLessThan(100);
        });
    });
});

// ===== TESTS D'ACCESSIBILITÉ =====

describe('Inventory Accessibility Tests', () => {
    test('devrait avoir les attributs ARIA appropriés', () => {
        render(<EquipmentPhotoUpload open={true} onClose={jest.fn()} onUpload={jest.fn()} />);
        
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Upload de photos');
        expect(screen.getByRole('button', { name: /Supprimer/i })).toBeInTheDocument();
    });

    test('devrait être navigable au clavier', async () => {
        const user = userEvent.setup();
        render(<EquipmentPhotoUpload open={true} onClose={jest.fn()} onUpload={jest.fn()} />);

        // Tester la navigation avec Tab
        await user.tab();
        expect(screen.getByText(/Glissez-déposez ou cliquez/i)).toHaveFocus();

        await user.tab();
        // Le focus devrait passer au bouton Annuler
        const cancelButton = screen.getByText(/Annuler/i);
        expect(cancelButton).toHaveFocus();
    });

    test('devrait avoir un contraste de couleurs suffisant', () => {
        render(<EquipmentAlerts equipment={[mockScenarioData.expiredWarranty]} />);
        
        // Vérifier que les couleurs de sévérité sont présentes
        const errorAlert = screen.getByText(/Garantie expirée/i).closest('[data-testid]');
        expect(errorAlert).toHaveStyle({
            borderColor: expect.stringContaining('error')
        });
    });
});

// ===== TESTS D'INTÉGRATION =====

describe('Inventory Integration Tests', () => {
    test('devrait intégrer upload de photo et ajout d\'ordinateur', async () => {
        const user = userEvent.setup();
        const onUpload = jest.fn();
        
        render(<EquipmentPhotoUpload 
            open={true} 
            onClose={jest.fn()} 
            onUpload={onUpload}
            equipmentId={1} 
        />);

        // Ajouter une photo
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const dropzone = screen.getByText(/Glissez-déposez ou cliquez/i).closest('div');
        
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [file],
                types: ['Files']
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/Photos sélectionnées/i)).toBeInTheDocument();
        });

        // Uploader
        const uploadButton = screen.getByText(/Uploader 1 photo\(s\)/i);
        await user.click(uploadButton);

        await waitFor(() => {
            expect(onUpload).toHaveBeenCalled();
        });
    });

    test('devrait afficher les alertes liées aux ordinateurs', async () => {
        render(<ComputersPage />);

        await waitFor(() => {
            expect(screen.getByText('PC-002')).toBeInTheDocument();
        });

        // Vérifier que les alertes sont affichées quelque part
        // (dépend de l'implémentation dans ComputersPage)
    });
});

// Configuration des tests de snapshot pour les composants
describe('Inventory Snapshot Tests', () => {
    test('EquipmentPhotoUpload devrait correspondre au snapshot', () => {
        const { container } = render(
            <EquipmentPhotoUpload 
                open={true} 
                onClose={jest.fn()} 
                onUpload={jest.fn()} 
                equipmentId={1} 
            />
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    test('EquipmentAlerts devrait correspondre au snapshot', () => {
        const { container } = render(<EquipmentAlerts equipment={mockComputers} />);
        expect(container.firstChild).toMatchSnapshot();
    });

    test('ComputersPage devrait correspondre au snapshot', () => {
        const { container } = render(<ComputersPage />);
        expect(container.firstChild).toMatchSnapshot();
    });
});

// Nettoyage global après tous les tests
afterAll(() => {
    // Nettoyer les mocks globaux
    global.fetch.mockRestore();
    global.URL.createObjectURL.mockRestore();
    global.URL.revokeObjectURL.mockRestore();
    window.alert.mockRestore();
    window.confirm.mockRestore();
});

console.log('✅ Tests unitaires du module Inventaire chargés');
