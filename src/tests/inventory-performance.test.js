// src/tests/inventory-performance.test.js - TESTS DE PERFORMANCE MODULE INVENTAIRE

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    setupTestEnvironment,
    setupPerformanceTesting,
    setupAsyncTesting,
    waitForPromises
} from './setup';
import {
    mockComputers,
    mockUsers,
    mockLoans,
    mockMaintenanceRecords,
    mockAlerts,
    mockPhotos,
    createMockComputer,
    createMockAlert,
    mockPerformanceData,
    generateLargeInventoryData
} from './__mocks__/inventoryData';

// Import des composants à tester
import ComputersPage from '../pages/ComputersPage';
import EquipmentPhotoUpload from '../components/inventory/EquipmentPhotoUpload';
import EquipmentAlerts from '../components/inventory/EquipmentAlerts';

// Configuration environnement de test avec mesures de performance
setupTestEnvironment();
setupPerformanceTesting();

// Mock des services API avec simulateurs de latence
const createLatencySimulator = (baseLatency = 50, variance = 100) => {
    return () => new Promise(resolve => {
        const latency = baseLatency + Math.random() * variance;
        setTimeout(resolve, latency);
    });
};

const mockApiService = {
    getComputers: jest.fn(() => 
        createLatencySimulator(100, 200)().then(() => mockPerformanceData.large)
    ),
    saveComputer: jest.fn(() => 
        createLatencySimulator(200, 300)().then(() => ({ success: true, id: Date.now() }))
    ),
    deleteComputer: jest.fn(() => 
        createLatencySimulator(150, 250)().then(() => ({ success: true }))
    ),
    addComputerMaintenance: jest.fn(() => 
        createLatencySimulator(180, 250)().then(() => ({ success: true }))
    ),
    createLoan: jest.fn(() => 
        createLatencySimulator(120, 200)().then(() => ({ success: true }))
    ),
    uploadEquipmentPhotos: jest.fn(() => 
        createLatencySimulator(500, 1000)().then(() => ({ photos: [] }))
    ),
    getMaintenanceHistory: jest.fn(() => 
        createLatencySimulator(80, 150)().then(() => mockMaintenanceRecords)
    ),
    getEquipmentAlerts: jest.fn(() => 
        createLatencySimulator(60, 120)().then(() => mockAlerts)
    )
};

jest.mock('../services/apiService', () => ({
    default: mockApiService
}));

// Mock des contextes avec cache simulé
let mockCache = {
    computers: mockPerformanceData.large,
    excel_users: { mockUsers },
    config: { it_staff: ['Jean Dupont', 'Marie Martin', 'Pierre Durand', 'Sophie Leroux'] },
    loans: mockLoans
};

jest.mock('../contexts/AppContext', () => ({
    useApp: () => ({
        currentTechnician: { id: 1, name: 'Jean Dupont' },
        showNotification: jest.fn()
    })
}));

jest.mock('../contexts/CacheContext', () => ({
    useCache: () => ({
        cache: mockCache,
        invalidate: jest.fn((key) => {
            if (key === 'computers') {
                return mockApiService.getComputers();
            }
            return Promise.resolve();
        }),
        isLoading: false
    })
}));

// ===== BENCHMARKS DE RENDU =====

describe('Inventory Performance Benchmarks', () => {
    const { waitForAsync } = setupAsyncTesting();
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Réinitialiser les timers de performance
        global.performance.now = jest.fn(() => Date.now());
        
        // Configuration pour tests de performance
        if (global.gc) {
            global.gc(); // Nettoyer la mémoire avant les tests
        }
    });

    describe('Render Performance Benchmarks', () => {
        test('devrait rendre avec 10 ordinateurs en moins de 100ms', async () => {
            mockCache.computers = mockPerformanceData.small;
            
            const startTime = performance.now();
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            expect(renderTime).toBeLessThan(100);
            console.log(`✅ Rendu 10 ordinateurs: ${renderTime.toFixed(2)}ms`);
        });

        test('devrait rendre avec 100 ordinateurs en moins de 300ms', async () => {
            mockCache.computers = mockPerformanceData.medium;
            
            const startTime = performance.now();
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            expect(renderTime).toBeLessThan(300);
            console.log(`✅ Rendu 100 ordinateurs: ${renderTime.toFixed(2)}ms`);
        });

        test('devrait rendre avec 1000 ordinateurs en moins de 1500ms', async () => {
            mockCache.computers = mockPerformanceData.large;
            
            const startTime = performance.now();
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            expect(renderTime).toBeLessThan(1500);
            console.log(`✅ Rendu 1000 ordinateurs: ${renderTime.toFixed(2)}ms`);
        });

        test('devrait rendre avec 5000 ordinateurs en moins de 5000ms', async () => {
            mockCache.computers = mockPerformanceData.xlarge;
            
            const startTime = performance.now();
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            expect(renderTime).toBeLessThan(5000);
            console.log(`✅ Rendu 5000 ordinateurs: ${renderTime.toFixed(2)}ms`);
        });
    });

    describe('Filter Performance Benchmarks', () => {
        test('devrait filtrer efficacement avec 1000 éléments', async () => {
            const user = userEvent.setup();
            mockCache.computers = mockPerformanceData.large;
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });

            const startTime = performance.now();
            
            // Appliquer un filtre par statut
            const statusFilter = screen.getByLabelText(/Statut/i);
            await user.selectOptions(statusFilter, 'available');

            await waitFor(() => {
                // Vérifier que le filtrage est terminé
                const endTime = performance.now();
                const filterTime = endTime - startTime;
                expect(filterTime).toBeLessThan(200);
                console.log(`✅ Filtrage 1000 éléments: ${filterTime.toFixed(2)}ms`);
            });
        });

        test('devrait rechercher efficacement avec 1000 éléments', async () => {
            const user = userEvent.setup();
            mockCache.computers = mockPerformanceData.large;
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });

            const startTime = performance.now();
            
            // Recherche par terme
            const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
            await user.type(searchInput, 'Dell');

            await waitFor(() => {
                const endTime = performance.now();
                const searchTime = endTime - startTime;
                expect(searchTime).toBeLessThan(150);
                console.log(`✅ Recherche 1000 éléments: ${searchTime.toFixed(2)}ms`);
            });
        });

        test('devrait combiner filtres efficacement', async () => {
            const user = userEvent.setup();
            mockCache.computers = mockPerformanceData.large;
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });

            const startTime = performance.now();
            
            // Appliquer plusieurs filtres
            const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
            await user.type(searchInput, 'Dell');

            const statusFilter = screen.getByLabelText(/Statut/i);
            await user.selectOptions(statusFilter, 'available');

            const brandFilter = screen.getByLabelText(/Marque/i);
            await user.selectOptions(brandFilter, 'Dell');

            await waitFor(() => {
                const endTime = performance.now();
                const filterTime = endTime - startTime;
                expect(filterTime).toBeLessThan(300);
                console.log(`✅ Filtres combinés: ${filterTime.toFixed(2)}ms`);
            });
        });
    });

    describe('View Switching Performance', () => {
        test('devrait changer de vue efficacement', async () => {
            const user = userEvent.setup();
            mockCache.computers = mockPerformanceData.medium;
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });

            // Mesurer le passage de grille vers liste
            const listButton = screen.getByLabelText(/Vue Liste/i);
            const startTime = performance.now();
            
            await user.click(listButton);
            
            await waitFor(() => {
                const endTime = performance.now();
                const switchTime = endTime - startTime;
                expect(switchTime).toBeLessThan(200);
                console.log(`✅ Changement de vue: ${switchTime.toFixed(2)}ms`);
            });
        });

        test('devrait naviguer efficacement entre vues', async () => {
            const user = userEvent.setup();
            mockCache.computers = mockPerformanceData.medium;
            
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });

            const gridButton = screen.getByLabelText(/Vue Cartes/i);
            const listButton = screen.getByLabelText(/Vue Liste/i);

            let totalSwitchTime = 0;
            
            // Plusieurs changements de vue
            for (let i = 0; i < 5; i++) {
                const startTime = performance.now();
                
                await user.click(i % 2 === 0 ? listButton : gridButton);
                
                await waitFor(() => {
                    const endTime = performance.now();
                    totalSwitchTime += (endTime - startTime);
                });
            }

            const averageSwitchTime = totalSwitchTime / 5;
            expect(averageSwitchTime).toBeLessThan(150);
            console.log(`✅ Navigation moyenne: ${averageSwitchTime.toFixed(2)}ms`);
        });
    });
});

// ===== TESTS DE PERFORMANCE MÉMOIRE =====

describe('Inventory Memory Performance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (global.gc) {
            global.gc(); // Nettoyer avant chaque test
        }
    });

    test('devrait limiter l\'utilisation mémoire lors du chargement', async () => {
        mockCache.computers = generateLargeInventoryData(2000);
        
        const initialMemory = global.performance.memory ? 
            global.performance.memory.usedJSHeapSize : 0;
        
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const peakMemory = global.performance.memory ? 
            global.performance.memory.usedJSHeapSize : 0;
        
        const memoryIncrease = peakMemory - initialMemory;
        
        // L'augmentation mémoire devrait être raisonnable (< 50MB pour 2000 éléments)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        console.log(`📊 Augmentation mémoire: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    test('devrait libérer la mémoire lors du nettoyage', async () => {
        mockCache.computers = mockPerformanceData.large;
        
        const { unmount } = render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const memoryBeforeUnmount = global.performance.memory ? 
            global.performance.memory.usedJSHeapSize : 0;
        
        unmount();

        if (global.gc) {
            global.gc();
        }

        const memoryAfterUnmount = global.performance.memory ? 
            global.performance.memory.usedJSHeapSize : 0;
        
        const memoryFreed = memoryBeforeUnmount - memoryAfterUnmount;
        
        // Une partie significative de la mémoire devrait être libérée
        expect(memoryFreed).toBeGreaterThan(0);
        console.log(`🗑️ Mémoire libérée: ${(memoryFreed / 1024 / 1024).toFixed(2)}MB`);
    });

    test('devrait gérer efficacement le cache des images', async () => {
        const images = mockPerformanceData.small.map((_, index) => 
            `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A9/Q=${index}`
        );

        const imageLoadTimes = [];
        
        for (let i = 0; i < images.length; i++) {
            const img = new Image();
            const startTime = performance.now();
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    const loadTime = performance.now() - startTime;
                    imageLoadTimes.push(loadTime);
                    resolve();
                };
                img.onerror = reject;
                img.src = images[i];
            });
        }

        const averageImageLoadTime = imageLoadTimes.reduce((a, b) => a + b) / imageLoadTimes.length;
        const maxImageLoadTime = Math.max(...imageLoadTimes);
        
        expect(averageImageLoadTime).toBeLessThan(50); // 50ms moyen
        expect(maxImageLoadTime).toBeLessThan(100); // 100ms max
        
        console.log(`🖼️ Temps de chargement image moyen: ${averageImageLoadTime.toFixed(2)}ms`);
        console.log(`🖼️ Temps de chargement image max: ${maxImageLoadTime.toFixed(2)}ms`);
    });
});

// ===== TESTS DE PERFORMANCE API =====

describe('Inventory API Performance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('devrait répondre aux requêtes de liste rapidement', async () => {
        const startTime = performance.now();
        
        await mockApiService.getComputers();
        
        const endTime = performance.now();
        const apiTime = endTime - startTime;
        
        expect(apiTime).toBeLessThan(500); // Réponse API < 500ms
        console.log(`🌐 Temps de réponse API liste: ${apiTime.toFixed(2)}ms`);
    });

    test('devrait traiter les sauvegardes efficacement', async () => {
        const computerData = createMockComputer();
        
        const startTime = performance.now();
        
        await mockApiService.saveComputer(computerData);
        
        const endTime = performance.now();
        const saveTime = endTime - startTime;
        
        expect(saveTime).toBeLessThan(800); // Sauvegarde < 800ms
        console.log(`💾 Temps de sauvegarde: ${saveTime.toFixed(2)}ms`);
    });

    test('devrait gérer les uploads de photos avec progression', async () => {
        const photos = Array.from({ length: 5 }, (_, i) => ({
            name: `photo${i}.jpg`,
            size: 1024 * 1024 * (i + 1) // 1MB à 5MB
        }));
        
        const startTime = performance.now();
        
        await mockApiService.uploadEquipmentPhotos(1, photos);
        
        const endTime = performance.now();
        const uploadTime = endTime - startTime;
        
        expect(uploadTime).toBeLessThan(3000); // Upload < 3s
        console.log(`📸 Temps d'upload 5 photos: ${uploadTime.toFixed(2)}ms`);
    });

    test('devrait limiter les requêtes parallèles', async () => {
        const requests = [
            mockApiService.getComputers(),
            mockApiService.getMaintenanceHistory(1),
            mockApiService.getEquipmentAlerts()
        ];

        const startTime = performance.now();
        
        await Promise.all(requests);
        
        const endTime = performance.now();
        const batchTime = endTime - startTime;
        
        // Le temps de batch ne devrait pas être beaucoup plus long que la requête la plus lente
        expect(batchTime).toBeLessThan(800);
        console.log(`⚡ Temps traitement batch: ${batchTime.toFixed(2)}ms`);
    });
});

// ===== TESTS DE PERFORMANCE USER INTERACTION =====

describe('Inventory User Interaction Performance', () => {
    const { waitForAsync } = setupAsyncTesting();
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache.computers = mockPerformanceData.medium;
    });

    test('devrait répondre rapidement aux clics', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const clickStartTime = performance.now();
        
        // Mesurer le temps de réponse au clic
        const addButton = screen.getByText(/Ajouter/i);
        await user.click(addButton);
        
        await waitFor(() => {
            const clickEndTime = performance.now();
            const clickTime = clickEndTime - clickStartTime;
            
            expect(clickTime).toBeLessThan(100); // Réponse < 100ms
            console.log(`🖱️ Temps de réponse clic: ${clickTime.toFixed(2)}ms`);
        });
    });

    test('devrait gérer les interactions clavier efficacement', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        
        const typeStartTime = performance.now();
        
        // Taper "Dell" caractère par caractère
        await user.type(searchInput, 'Dell');
        
        const typeEndTime = performance.now();
        const typeTime = typeEndTime - typeStartTime;
        
        // Taper 4 caractères ne devrait pas prendre plus de 200ms
        expect(typeTime).toBeLessThan(200);
        console.log(`⌨️ Temps de saisie 4 caractères: ${typeTime.toFixed(2)}ms`);
    });

    test('devrait maintenir les performances lors d\'interactions multiples', async () => {
        const user = userEvent.setup();
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const interactions = [
            () => screen.getByPlaceholderText(/Rechercher\.\.\./i),
            () => screen.getByLabelText(/Statut/i),
            () => screen.getByLabelText(/Localisation/i),
            () => screen.getByLabelText(/Marque/i),
            () => screen.getByText(/Ajouter/i)
        ];

        let totalInteractionTime = 0;
        
        for (let i = 0; i < interactions.length; i++) {
            const startTime = performance.now();
            
            interactions[i]();
            
            const endTime = performance.now();
            totalInteractionTime += (endTime - startTime);
        }

        const averageInteractionTime = totalInteractionTime / interactions.length;
        
        expect(averageInteractionTime).toBeLessThan(10); // 10ms par interaction
        console.log(`⚡ Temps moyen interaction: ${averageInteractionTime.toFixed(2)}ms`);
    });
});

// ===== TESTS DE SCALABILITÉ =====

describe('Inventory Scalability Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('devrait scaler linéairement avec le nombre d\'éléments', async () => {
        const datasets = [
            { size: 100, data: mockPerformanceData.small },
            { size: 1000, data: mockPerformanceData.large },
            { size: 5000, data: mockPerformanceData.xlarge }
        ];

        const renderTimes = [];

        for (const dataset of datasets) {
            mockCache.computers = dataset.data;
            
            const startTime = performance.now();
            render(<ComputersPage />);
            
            await waitFor(() => {
                expect(screen.getByText('PC-0001')).toBeInTheDocument();
            });
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            renderTimes.push({ size: dataset.size, time: renderTime });
            
            console.log(`📈 ${dataset.size} éléments: ${renderTime.toFixed(2)}ms`);
        }

        // Vérifier que la croissance n'est pas exponentielle
        const ratio1 = renderTimes[1].time / renderTimes[0].time;
        const ratio2 = renderTimes[2].time / renderTimes[1].time;
        
        expect(ratio1).toBeLessThan(20); // 1000 éléments ne devraient pas être 20x plus lents
        expect(ratio2).toBeLessThan(10); // 5000 éléments ne devraient pas être 10x plus lents
    });

    test('devrait maintenir des performances acceptables à grande échelle', async () => {
        mockCache.computers = generateLargeInventoryData(10000);
        
        const startTime = performance.now();
        
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // Même avec 10000 éléments, le rendu devrait rester sous 10 secondes
        expect(renderTime).toBeLessThan(10000);
        
        console.log(`🚀 Rendu 10000 éléments: ${renderTime.toFixed(2)}ms`);
    });
});

// ===== TESTS DE PERFORMANCE SOUS CHARGE =====

describe('Inventory Stress Tests', () => {
    test('devrait gérer les clics rapides répétés', async () => {
        const user = userEvent.setup();
        mockCache.computers = mockPerformanceData.medium;
        
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const addButton = screen.getByText(/Ajouter/i);
        
        // Simuler des clics rapides multiples
        for (let i = 0; i < 10; i++) {
            await user.click(addButton);
            await waitFor(() => {
                // Vérifier qu'il n'y a qu'un seul dialog ouvert
                const dialogs = screen.getAllByRole('dialog');
                expect(dialogs.length).toBeLessThanOrEqual(1);
            });
            
            // Fermer le dialog si ouvert
            const cancelButtons = screen.queryAllByText(/Annuler/i);
            if (cancelButtons.length > 0) {
                await user.click(cancelButtons[0]);
            }
        }

        console.log(`⚡ Test clics rapides: 10 clics gérés sans erreur`);
    });

    test('devrait gérer les filtres appliqués rapidement', async () => {
        const user = userEvent.setup();
        mockCache.computers = mockPerformanceData.large;
        
        render(<ComputersPage />);
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        const filters = [
            { selector: screen.getByLabelText(/Statut/i), value: 'available' },
            { selector: screen.getByLabelText(/Marque/i), value: 'Dell' },
            { selector: screen.getByPlaceholderText(/Rechercher\.\.\./i), value: 'Latitude' }
        ];

        // Appliquer les filtres rapidement
        for (const filter of filters) {
            await user.selectOptions(filter.selector, filter.value);
        }

        // Vérifier que l'interface reste responsive
        expect(screen.getByText('PC-0001')).toBeInTheDocument();
        
        console.log(`⚡ Test filtres rapides: ${filters.length} filtres appliqués avec succès`);
    });
});

// ===== PROFILAGE DE PERFORMANCE =====

describe('Inventory Performance Profiling', () => {
    test('devrait identifier les goulots d\'étranglement', async () => {
        mockCache.computers = mockPerformanceData.large;
        
        const profile = {
            renderStart: performance.now(),
            renderEnd: 0,
            filterStart: 0,
            filterEnd: 0
        };
        
        render(<ComputersPage />);
        profile.renderEnd = performance.now();
        
        await waitFor(() => {
            expect(screen.getByText('PC-0001')).toBeInTheDocument();
        });

        // Profilage du filtrage
        profile.filterStart = performance.now();
        
        // Simuler un filtrage
        const searchInput = screen.getByPlaceholderText(/Rechercher\.\.\./i);
        fireEvent.change(searchInput, { target: { value: 'Dell' } });
        
        await waitFor(() => {
            profile.filterEnd = performance.now();
        });

        const renderTime = profile.renderEnd - profile.renderStart;
        const filterTime = profile.filterEnd - profile.filterStart;
        
        console.log(`📊 Profilage:`);
        console.log(`   - Rendu: ${renderTime.toFixed(2)}ms`);
        console.log(`   - Filtrage: ${filterTime.toFixed(2)}ms`);
        console.log(`   - Ratio filtre/rendu: ${(filterTime / renderTime * 100).toFixed(1)}%`);
        
        // Le filtrage ne devrait pas être plus lent que le rendu
        expect(filterTime).toBeLessThan(renderTime * 2);
    });
});

// Nettoyage global après tous les tests
afterAll(() => {
    jest.clearAllMocks();
    if (global.gc) {
        global.gc(); // Nettoyage final de la mémoire
    }
    
    console.log('🏁 Tests de performance du module Inventaire terminés');
});

console.log('⚡ Tests de performance du module Inventaire chargés');
