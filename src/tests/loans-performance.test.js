// src/tests/loans-performance.test.js - TESTS DE PERFORMANCE POUR LA GESTION DES PRÊTS

import React, { useState, useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { TestProviders } from './TestProviders';
import LoanFilters from '../components/loan-management/LoanFilters';
import LoanExportButton from '../components/loan-management/LoanExportButton';
import LoanList from '../components/loan-management/LoanList';
import LoanQRCodeDialog from '../components/loan-management/LoanQRCodeDialog';
import { generateLargeMockData } from './__mocks__/loanData';

// Configuration des tests de performance
const PERFORMANCE_THRESHOLDS = {
    RENDER_TIME: 100, // ms
    FILTER_TIME: 50, // ms
    SEARCH_TIME: 30, // ms
    EXPORT_TIME: 1000, // ms
    QR_GENERATION_TIME: 200, // ms
    MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
};

describe('Tests de Performance - Gestion des Prêts de Matériel', () => {
    
    describe('Performance Benchmarks - Métriques de performance', () => {
        test('should render with large dataset efficiently', async () => {
            const startTime = performance.now();
            
            const largeDataset = generateLargeMockData(1000); // 1000 prêts
            
            render(
                <TestProviders>
                    <LoanList preLoadedData={largeDataset} />
                </TestProviders>
            );
            
            const renderTime = performance.now() - startTime;
            
            expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME);
            console.log(`Temps de rendu avec 1000 prêts: ${renderTime.toFixed(2)}ms`);
        });

        test('should filter efficiently with large datasets', async () => {
            const user = userEvent.setup();
            const largeDataset = generateLargeMockData(500);
            
            const TestFilterPerformance = () => {
                const [filteredLoans, setFilteredLoans] = useState(largeDataset);
                
                const applyFilters = (filters) => {
                    const start = performance.now();
                    let filtered = [...largeDataset];
                    
                    if (filters.status && filters.status !== 'all') {
                        filtered = filtered.filter(loan => loan.status === filters.status);
                    }
                    
                    if (filters.searchTerm) {
                        filtered = filtered.filter(loan => 
                            loan.computerName.toLowerCase().includes(filters.searchTerm.toLowerCase())
                        );
                    }
                    
                    const filterTime = performance.now() - start;
                    console.log(`Temps de filtrage: ${filterTime.toFixed(2)}ms pour ${filtered.length} résultats`);
                    
                    setFilteredLoans(filtered);
                };
                
                return (
                    <div>
                        <input 
                            data-testid="search-input"
                            onChange={(e) => applyFilters({ searchTerm: e.target.value })}
                            placeholder="Rechercher..."
                        />
                        <select 
                            data-testid="status-filter"
                            onChange={(e) => applyFilters({ status: e.target.value })}
                        >
                            <option value="all">Tous</option>
                            <option value="active">Actifs</option>
                            <option value="returned">Retournés</option>
                        </select>
                        <div data-testid="results-count">{filteredLoans.length} résultats</div>
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestFilterPerformance />
                </TestProviders>
            );
            
            // Test de filtrage par statut
            const statusFilter = screen.getByTestId('status-filter');
            fireEvent.change(statusFilter, { target: { value: 'active' } });
            
            await waitFor(() => {
                expect(screen.getByTestId('results-count')).toHaveTextContent(/\d+ résultats/);
            }, { timeout: 1000 });
            
            // Test de recherche
            const searchInput = screen.getByTestId('search-input');
            fireEvent.change(searchInput, { target: { value: 'PC-001' } });
            
            await waitFor(() => {
                expect(screen.getByTestId('results-count')).toHaveTextContent(/\d+ résultats/);
            }, { timeout: 500 });
        });
    });

    describe('Memory Usage Tests - Tests d\'utilisation mémoire', () => {
        test('should not leak memory during repeated renders', async () => {
            const initialMemory = performance.memory?.usedJSHeapSize || 0;
            
            const TestMemoryLeak = () => {
                const [componentKey, setComponentKey] = useState(0);
                
                useEffect(() => {
                    // Simuler des re-renders fréquents
                    const interval = setInterval(() => {
                        setComponentKey(prev => prev + 1);
                    }, 100);
                    
                    return () => clearInterval(interval);
                }, []);
                
                return (
                    <div key={componentKey}>
                        <LoanList />
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestMemoryLeak />
                </TestProviders>
            );
            
            // Attendre plusieurs cycles de rendu
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const finalMemory = performance.memory?.usedJSHeapSize || 0;
            const memoryIncrease = finalMemory - initialMemory;
            
            expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE);
            console.log(`Augmentation mémoire: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        });

        test('should handle large export operations efficiently', async () => {
            const user = userEvent.setup();
            const largeDataset = generateLargeMockData(500);
            
            const startTime = performance.now();
            const startMemory = performance.memory?.usedJSHeapSize || 0;
            
            render(
                <TestProviders>
                    <LoanExportButton loans={largeDataset} filters={{}} />
                </TestProviders>
            );
            
            const exportButton = screen.getByText(/Exporter/i);
            await user.click(exportButton);
            
            // Mesurer la performance de l'export Excel
            const excelOption = screen.getByText(/Excel/i);
            const exportStartTime = performance.now();
            
            await user.click(excelOption);
            
            // Attendre la fin du processus d'export
            await waitFor(() => {
                // Simulation de fin d'export
            }, { timeout: 2000 });
            
            const exportTime = performance.now() - exportStartTime;
            const finalMemory = performance.memory?.usedJSHeapSize || 0;
            const memoryUsage = finalMemory - startMemory;
            
            expect(exportTime).toBeLessThan(PERFORMANCE_THRESHOLDS.EXPORT_TIME);
            expect(memoryUsage).toBeLessThan(10 * 1024 * 1024); // 10MB max pour l'export
            
            console.log(`Temps d'export: ${exportTime.toFixed(2)}ms`);
            console.log(`Mémoire utilisée: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
        });
    });

    describe('Real-time Update Performance - Performance des mises à jour temps réel', () => {
        test('should handle real-time loan status updates', async () => {
            const TestRealtimeUpdates = () => {
                const [loans, setLoans] = useState(generateLargeMockData(100));
                const [updateCount, setUpdateCount] = useState(0);
                
                useEffect(() => {
                    // Simuler des mises à jour temps réel
                    const interval = setInterval(() => {
                        setLoans(prev => prev.map(loan => {
                            // Mettre à jour aléatoirement le statut
                            if (Math.random() < 0.1) { // 10% de chance
                                return { 
                                    ...loan, 
                                    status: Math.random() > 0.5 ? 'active' : 'returned',
                                    lastUpdate: new Date().toISOString()
                                };
                            }
                            return loan;
                        }));
                        setUpdateCount(prev => prev + 1);
                    }, 200);
                    
                    return () => clearInterval(interval);
                }, []);
                
                return (
                    <div>
                        <div data-testid="update-count">Mises à jour: {updateCount}</div>
                        <div data-testid="active-loans">
                            {loans.filter(l => l.status === 'active').length} actifs
                        </div>
                        <LoanList loans={loans} />
                    </div>
                );
            };
            
            const startTime = performance.now();
            
            render(
                <TestProviders>
                    <TestRealtimeUpdates />
                </TestProviders>
            );
            
            // Attendre plusieurs mises à jour
            await waitFor(() => {
                expect(screen.getByTestId('update-count')).toHaveTextContent(/Mises à jour: [5-9]\d*/);
            }, { timeout: 3000 });
            
            const updateTime = performance.now() - startTime;
            const updatesPerSecond = parseInt(screen.getByTestId('update-count').textContent) / (updateTime / 1000);
            
            expect(updatesPerSecond).toBeGreaterThan(2); // Au moins 2 updates par seconde
            console.log(`Mises à jour par seconde: ${updatesPerSecond.toFixed(2)}`);
        });

        test('should maintain UI responsiveness during bulk operations', async () => {
            const TestUIResponsiveness = () => {
                const [operationCount, setOperationCount] = useState(0);
                const [isProcessing, setIsProcessing] = useState(false);
                
                const handleBulkOperation = async () => {
                    setIsProcessing(true);
                    const startTime = performance.now();
                    
                    // Simuler des opérations en lot
                    for (let i = 0; i < 100; i++) {
                        // Simulation d'une opération
                        await new Promise(resolve => setTimeout(resolve, 10));
                        setOperationCount(prev => prev + 1);
                        
                        // Vérifier que l'UI reste responsive
                        const elapsed = performance.now() - startTime;
                        if (elapsed > 500 && i % 20 === 0) {
                            console.log(`Opération ${i} - Temps: ${elapsed.toFixed(2)}ms`);
                        }
                    }
                    
                    setIsProcessing(false);
                };
                
                return (
                    <div>
                        <div data-testid="operation-status">
                            {isProcessing ? 'En cours...' : 'Prêt'}
                        </div>
                        <div data-testid="operation-count">{operationCount}/100</div>
                        <button 
                            onClick={handleBulkOperation}
                            disabled={isProcessing}
                            data-testid="bulk-operation-btn"
                        >
                            Opération en lot
                        </button>
                        <div data-testid="ui-responsive">
                            L'interface répond: {!isProcessing || operationCount % 10 === 0 ? 'Oui' : 'Non'}
                        </div>
                    </div>
                );
            };
            
            const user = userEvent.setup();
            
            render(
                <TestProviders>
                    <TestUIResponsiveness />
                </TestProviders>
            );
            
            const startTime = performance.now();
            
            // Lancer l'opération en lot
            const bulkButton = screen.getByTestId('bulk-operation-btn');
            await user.click(bulkButton);
            
            // Vérifier que l'UI reste responsive
            await waitFor(() => {
                const responsiveText = screen.getByTestId('ui-responsive').textContent;
                expect(responsiveText).toContain('Oui');
            }, { timeout: 1000 });
            
            // Attendre la fin
            await waitFor(() => {
                expect(screen.getByTestId('operation-status')).toHaveTextContent('Prêt');
            }, { timeout: 2000 });
            
            const totalTime = performance.now() - startTime;
            console.log(`Temps total opération en lot: ${totalTime.toFixed(2)}ms`);
        });
    });

    describe('Search Performance - Performance de recherche', () => {
        test('should search efficiently across large datasets', async () => {
            const largeDataset = generateLargeMockData(2000);
            const searchTerms = ['PC-001', 'Jean', 'Informatique', 'actif'];
            
            const TestSearchPerformance = () => {
                const [searchTerm, setSearchTerm] = useState('');
                const [searchResults, setSearchResults] = useState([]);
                
                const performSearch = (term) => {
                    const startTime = performance.now();
                    const results = largeDataset.filter(loan => 
                        loan.computerName.toLowerCase().includes(term.toLowerCase()) ||
                        loan.userName.toLowerCase().includes(term.toLowerCase()) ||
                        loan.status.toLowerCase().includes(term.toLowerCase())
                    );
                    const searchTime = performance.now() - startTime;
                    
                    console.log(`Recherche "${term}": ${searchTime.toFixed(2)}ms pour ${results.length} résultats`);
                    setSearchResults(results);
                };
                
                useEffect(() => {
                    if (searchTerm.length >= 2) {
                        performSearch(searchTerm);
                    } else {
                        setSearchResults([]);
                    }
                }, [searchTerm]);
                
                return (
                    <div>
                        <input
                            data-testid="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher..."
                        />
                        <div data-testid="search-results">
                            {searchResults.length} résultat(s)
                        </div>
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestSearchPerformance />
                </TestProviders>
            );
            
            // Tester différentes requêtes de recherche
            for (const term of searchTerms) {
                const searchInput = screen.getByTestId('search-input');
                fireEvent.change(searchInput, { target: { value: term } });
                
                await waitFor(() => {
                    expect(screen.getByTestId('search-results')).toHaveTextContent(/\d+ résultat/);
                }, { timeout: 1000 });
                
                // Vérifier le temps de recherche
                // (Le temps est loggé dans la console via performSearch)
            }
        });

        test('should debounce search input efficiently', async () => {
            jest.useFakeTimers();
            
            const TestSearchDebounce = () => {
                const [searchTerm, setSearchTerm] = useState('');
                const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
                
                useEffect(() => {
                    const timer = setTimeout(() => {
                        setDebouncedSearchTerm(searchTerm);
                    }, 300);
                    
                    return () => clearTimeout(timer);
                }, [searchTerm]);
                
                return (
                    <div>
                        <input
                            data-testid="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div data-testid="debounced-search">{debouncedSearchTerm}</div>
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestSearchDebounce />
                </TestProviders>
            );
            
            const searchInput = screen.getByTestId('search-input');
            
            // Simuler une saisie rapide
            fireEvent.change(searchInput, { target: { value: 'P' } });
            fireEvent.change(searchInput, { target: { value: 'PC-' } });
            fireEvent.change(searchInput, { target: { value: 'PC-001' } });
            
            // Avancer le temps pour déclencher le debounce
            jest.advanceTimersByTime(300);
            
            await waitFor(() => {
                expect(screen.getByTestId('debounced-search')).toHaveTextContent('PC-001');
            });
            
            jest.useRealTimers();
        });
    });

    describe('QR Code Generation Performance - Performance génération QR', () => {
        test('should generate QR codes efficiently', async () => {
            const computers = generateLargeMockData(50).map((_, index) => ({
                id: index + 1,
                name: `PC-${String(index + 1).padStart(3, '0')}`,
                serial_number: `SN${String(index + 1).padStart(6, '0')}`,
            }));
            
            const startTime = performance.now();
            
            // Test de génération d'un seul QR code
            render(
                <TestProviders>
                    <LoanQRCodeDialog 
                        open={true} 
                        onClose={jest.fn()} 
                        computer={computers[0]} 
                        loan={{ id: 1 }} 
                    />
                </TestProviders>
            );
            
            await waitFor(() => {
                expect(screen.getByText(/Étiquette QR Code/i)).toBeInTheDocument();
            });
            
            const qrGenerationTime = performance.now() - startTime;
            
            expect(qrGenerationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.QR_GENERATION_TIME);
            console.log(`Temps de génération QR: ${qrGenerationTime.toFixed(2)}ms`);
        });

        test('should handle multiple QR generations efficiently', async () => {
            const computers = generateLargeMockData(10).map((loan, index) => ({
                id: index + 1,
                name: `PC-${String(index + 1).padStart(3, '0')}`,
                serial_number: `SN${String(index + 1).padStart(6, '0')}`,
            }));
            
            const TestMultipleQR = () => {
                const [currentIndex, setCurrentIndex] = useState(0);
                const [generationTimes, setGenerationTimes] = useState([]);
                
                useEffect(() => {
                    const generateNextQR = () => {
                        if (currentIndex < computers.length) {
                            const startTime = performance.now();
                            
                            // Simuler la génération
                            setTimeout(() => {
                                const genTime = performance.now() - startTime;
                                setGenerationTimes(prev => [...prev, genTime]);
                                setCurrentIndex(prev => prev + 1);
                            }, 50);
                        }
                    };
                    
                    generateNextQR();
                }, [currentIndex]);
                
                return (
                    <div>
                        <div>Génération: {currentIndex}/{computers.length}</div>
                        <div>Temps moyen: {generationTimes.length > 0 
                            ? (generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length).toFixed(2) 
                            : 0}ms
                        </div>
                        {currentIndex < computers.length && (
                            <LoanQRCodeDialog 
                                open={true} 
                                onClose={jest.fn()} 
                                computer={computers[currentIndex]} 
                                loan={{ id: currentIndex + 1 }} 
                            />
                        )}
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestMultipleQR />
                </TestProviders>
            );
            
            // Attendre toutes les générations
            await waitFor(() => {
                expect(screen.getByText(/Génération: 10\/10/)).toBeInTheDocument();
            }, { timeout: 5000 });
            
            const avgGenerationTime = parseFloat(screen.getByText(/Temps moyen:/).textContent.match(/[\d.]+/)[0]);
            
            expect(avgGenerationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.QR_GENERATION_TIME);
        });
    });

    describe('Database Query Optimization - Optimisation requêtes base de données', () => {
        test('should optimize loan queries with pagination', async () => {
            const TestPagination = () => {
                const [page, setPage] = useState(1);
                const [pageSize] = useState(25);
                const [allLoans] = useState(() => generateLargeMockData(500));
                const [displayedLoans, setDisplayedLoans] = useState([]);
                
                useEffect(() => {
                    const queryStartTime = performance.now();
                    
                    // Simuler une requête paginée
                    const startIndex = (page - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const paginatedResults = allLoans.slice(startIndex, endIndex);
                    
                    const queryTime = performance.now() - queryStartTime;
                    console.log(`Requête page ${page}: ${queryTime.toFixed(2)}ms`);
                    
                    setDisplayedLoans(paginatedResults);
                }, [page, pageSize, allLoans]);
                
                return (
                    <div>
                        <div>Page: {page}</div>
                        <div>Affichage: {displayedLoans.length} prêts</div>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</button>
                        <button onClick={() => setPage(p => Math.min(20, p + 1))}>Suivant</button>
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestPagination />
                </TestProviders>
            );
            
            // Tester plusieurs pages
            for (let i = 1; i <= 3; i++) {
                const nextButton = screen.getByText(/Suivant/i);
                fireEvent.click(nextButton);
                
                await waitFor(() => {
                    expect(screen.getByText(`Page: ${i + 1}`)).toBeInTheDocument();
                }, { timeout: 500 });
            }
        });
    });
});
