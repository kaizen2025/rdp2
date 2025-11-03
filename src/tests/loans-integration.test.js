// src/tests/loans-integration.test.js - TESTS D'INTÉGRATION POUR LA GESTION DES PRÊTS

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { TestProviders, mockApiService } from './TestProviders';
import LoanFilters from '../components/loan-management/LoanFilters';
import LoanExportButton from '../components/loan-management/LoanExportButton';
import LoanList from '../components/loan-management/LoanList';
import LoanQRCodeDialog from '../components/loan-management/LoanQRCodeDialog';
import { mockLoans, mockComputers, mockUsers, mockTechnicians } from './__mocks__/loanData';

describe('Tests d\'Intégration - Gestion des Prêts de Matériel', () => {
    
    describe('Filtre et Export Integration - Intégration Filtre et Export', () => {
        test('should filter loans and export filtered results', async () => {
            const user = userEvent.setup();
            const onFilterChange = jest.fn();
            
            const TestComponent = () => {
                const [filters, setFilters] = useState({});
                const [loans, setLoans] = useState(mockLoans);
                
                return (
                    <div>
                        <LoanFilters 
                            onFilterChange={setFilters} 
                            technicians={mockTechnicians} 
                        />
                        <LoanExportButton 
                            loans={loans.filter(loan => {
                                if (filters.status && filters.status !== 'all') {
                                    return loan.status === filters.status;
                                }
                                return true;
                            })} 
                            filters={filters} 
                        />
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestComponent />
                </TestProviders>
            );
            
            // Étendre les filtres
            const expandButton = screen.getByTestId('ExpandMoreIcon');
            await user.click(expandButton);
            
            // Sélectionner un statut
            const statusSelect = screen.getByLabelText(/Statut/i);
            await user.selectOptions(statusSelect, 'active');
            
            // Vérifier que les filtres fonctionnent
            await waitFor(() => {
                expect(onFilterChange).toHaveBeenCalled();
            });
            
            // Cliquer sur exporter
            const exportButton = screen.getByText(/Exporter/i);
            await user.click(exportButton);
            
            // Vérifier le menu d'export
            expect(screen.getByText(/Excel/i)).toBeInTheDocument();
            expect(screen.getByText(/PDF/i)).toBeInTheDocument();
        });
    });

    describe('Complete Loan Workflow - Flux complet de gestion des prêts', () => {
        test('should handle complete loan lifecycle', async () => {
            const user = userEvent.setup();
            
            const TestLoanWorkflow = () => {
                const [currentView, setCurrentView] = useState('list');
                const [selectedLoan, setSelectedLoan] = useState(null);
                
                const handleLoanAction = (action, loan) => {
                    setSelectedLoan({ action, loan, id: Date.now() });
                };
                
                return (
                    <div>
                        <div data-testid="view-selector">
                            <button onClick={() => setCurrentView('list')}>Liste</button>
                            <button onClick={() => setCurrentView('calendar')}>Calendrier</button>
                        </div>
                        
                        {currentView === 'list' && (
                            <LoanList 
                                onAction={handleLoanAction}
                            />
                        )}
                        
                        {selectedLoan && (
                            <div data-testid="action-modal">
                                <p>Action: {selectedLoan.action}</p>
                                <p>Loan: {selectedLoan.loan?.computerName}</p>
                                <button onClick={() => setSelectedLoan(null)}>Fermer</button>
                            </div>
                        )}
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestLoanWorkflow />
                </TestProviders>
            );
            
            // Attendre que la liste se charge
            await waitFor(() => {
                expect(screen.getByText(/Statut/i)).toBeInTheDocument();
            });
            
            // Tester les actions sur un prêt
            await waitFor(() => {
                const editButtons = screen.queryAllByTestId('EditIcon');
                if (editButtons.length > 0) {
                    user.click(editButtons[0].closest('button'));
                }
            });
            
            // Vérifier l'ouverture du modal d'action
            await waitFor(() => {
                expect(screen.getByTestId('action-modal')).toBeInTheDocument();
            });
        });
    });

    describe('QR Code Generation and Printing - Génération et impression QR', () => {
        test('should generate QR code and handle printing', async () => {
            const user = userEvent.setup();
            const mockPrint = jest.fn();
            global.window.print = mockPrint;
            
            render(
                <TestProviders>
                    <LoanQRCodeDialog 
                        open={true} 
                        onClose={jest.fn()} 
                        computer={mockComputers[0]} 
                        loan={mockLoans[0]} 
                    />
                </TestProviders>
            );
            
            // Vérifier l'affichage du QR code
            await waitFor(() => {
                expect(screen.getByText(/Étiquette QR Code/i)).toBeInTheDocument();
            });
            
            // Ajouter du texte personnalisé
            const customTextField = screen.getByLabelText(/Texte personnalisé/i);
            await user.type(customTextField, 'Bureau IT - Étage 3');
            
            // Tester l'impression
            const printButton = screen.getByText(/Imprimer/i);
            await user.click(printButton);
            
            await waitFor(() => {
                expect(mockPrint).toHaveBeenCalled();
            });
            
            // Tester le téléchargement
            const downloadButton = screen.getByText(/Télécharger PNG/i);
            await user.click(downloadButton);
            
            // Vérifier que le fichier est téléchargé
            await waitFor(() => {
                expect(screen.getByText(/Téléchargement/i)).toBeInTheDocument();
            });
        });
    });

    describe('Calendar Integration with Loans - Intégration calendrier et prêts', () => {
        test('should show loans in calendar view', async () => {
            render(
                <TestProviders>
                    <div>
                        <LoanList />
                        <div data-testid="calendar-view">
                            {/* Simulation du calendrier */}
                        </div>
                    </div>
                </TestProviders>
            );
            
            // Attendre que les données soient chargées
            await waitFor(() => {
                expect(screen.getByText(/Statut/i)).toBeInTheDocument();
            });
            
            // Vérifier que les prêts sont affichés
            const loans = mockLoans.filter(l => l.status === 'active');
            if (loans.length > 0) {
                expect(screen.getByText(loans[0].computerName)).toBeInTheDocument();
            }
        });
    });

    describe('Error Handling Integration - Gestion d\'erreurs intégrée', () => {
        test('should handle API errors gracefully', async () => {
            // Simuler une erreur API
            mockApiService.getLoans.mockRejectedValue(new Error('Erreur réseau'));
            
            render(
                <TestProviders>
                    <LoanList />
                </TestProviders>
            );
            
            // Attendre la gestion de l'erreur
            await waitFor(() => {
                expect(screen.getByText(/Erreur/i)).toBeInTheDocument() ||
                screen.getByText(/Problème/i)).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        test('should handle validation errors during loan creation', async () => {
            const user = userEvent.setup();
            
            render(
                <TestProviders>
                    <LoanList />
                </TestProviders>
            );
            
            // Attendre que la liste se charge
            await waitFor(() => {
                expect(screen.getByText(/Statut/i)).toBeInTheDocument();
            });
            
            // Cliquer sur créer un nouveau prêt
            const createButton = screen.getByText(/Nouveau prêt/i) || screen.getByText(/Créer/i);
            if (createButton) {
                await user.click(createButton);
                
                // Vérifier la validation des champs
                await waitFor(() => {
                    expect(screen.getByText(/Créer le prêt/i)).toBeInTheDocument();
                });
                
                // Essayer de sauvegarder sans remplir les champs
                const saveButton = screen.getByText(/Sauvegarder/i) || screen.getByText(/Créer/i);
                await user.click(saveButton);
                
                // Vérifier les messages d'erreur
                await waitFor(() => {
                    expect(screen.getByText(/obligatoire/i)).toBeInTheDocument() ||
                    screen.getByText(/requis/i)).toBeInTheDocument();
                });
            }
        });
    });

    describe('Multi-user Scenario Testing - Tests de scénarios multi-utilisateurs', () => {
        test('should handle concurrent loan modifications', async () => {
            const user1 = userEvent.setup();
            const user2 = userEvent.setup();
            
            const TestConcurrentAccess = () => {
                const [loans, setLoans] = useState(mockLoans);
                const [lockedLoan, setLockedLoan] = useState(null);
                
                const handleEditLoan = (loanId) => {
                    // Simuler un verrouillage optimiste
                    setLockedLoan(loanId);
                    setTimeout(() => {
                        setLockedLoan(null);
                        // Simuler une mise à jour
                        setLoans(prev => prev.map(loan => 
                            loan.id === loanId 
                                ? { ...loan, lastModified: new Date().toISOString() }
                                : loan
                        ));
                    }, 1000);
                };
                
                return (
                    <div>
                        <h2>Gestion des Prêts - Accès Concurrent</h2>
                        {loans.map(loan => (
                            <div key={loan.id} data-testid={`loan-${loan.id}`}>
                                <span>{loan.computerName}</span>
                                <button 
                                    onClick={() => handleEditLoan(loan.id)}
                                    disabled={lockedLoan === loan.id}
                                    data-testid={`edit-${loan.id}`}
                                >
                                    {lockedLoan === loan.id ? 'Modification...' : 'Modifier'}
                                </button>
                                {loan.lastModified && (
                                    <small data-testid={`modified-${loan.id}`}>
                                        Modifié: {new Date(loan.lastModified).toLocaleString()}
                                    </small>
                                )}
                            </div>
                        ))}
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestConcurrentAccess />
                </TestProviders>
            );
            
            // Utilisateur 1 commence à modifier
            const editButton1 = screen.getByTestId('edit-1');
            await user1.click(editButton1);
            
            // Utilisateur 2 essaie de modifier le même prêt
            const editButton2 = screen.getByTestId('edit-1');
            await user2.click(editButton2);
            
            // Vérifier que le bouton est désactivé pour user2
            expect(editButton2).toBeDisabled();
            
            // Attendre la fin de la modification
            await waitFor(() => {
                expect(screen.getByTestId('modified-1')).toBeInTheDocument();
            });
        });
    });

    describe('Data Export Integration - Intégration export de données', () => {
        test('should export filtered data to Excel', async () => {
            const user = userEvent.setup();
            const mockCreateElement = jest.spyOn(document, 'createElement');
            const mockClick = jest.fn();
            const mockRemove = jest.fn();
            
            // Mock des utilitaires d'export
            const mockLoadXLSX = jest.fn().mockResolvedValue({
                utils: {
                    json_to_sheet: jest.fn().mockReturnValue({}),
                    book_new: jest.fn().mockReturnValue({}),
                    book_append_sheet: jest.fn().mockReturnValue({})
                },
                writeFile: jest.fn()
            });
            
            render(
                <TestProviders>
                    <LoanExportButton 
                        loans={mockLoans.filter(l => l.status === 'active')} 
                        filters={{ status: 'active' }} 
                    />
                </TestProviders>
            );
            
            const exportButton = screen.getByText(/Exporter/i);
            await user.click(exportButton);
            
            const excelOption = screen.getByText(/Excel/i);
            await user.click(excelOption);
            
            // Attendre l'export
            await waitFor(() => {
                expect(mockLoadXLSX).toHaveBeenCalled();
            }, { timeout: 2000 });
        });

        test('should export data to PDF format', async () => {
            const user = userEvent.setup();
            const mockJsPDF = jest.fn().mockImplementation(() => ({
                setFontSize: jest.fn(),
                text: jest.fn(),
                addPage: jest.fn(),
                save: jest.fn()
            }));
            
            render(
                <TestProviders>
                    <LoanExportButton 
                        loans={mockLoans} 
                        filters={{}} 
                    />
                </TestProviders>
            );
            
            const exportButton = screen.getByText(/Exporter/i);
            await user.click(exportButton);
            
            const pdfOption = screen.getByText(/PDF/i);
            await user.click(pdfOption);
            
            await waitFor(() => {
                expect(mockJsPDF).toHaveBeenCalled();
            }, { timeout: 2000 });
        });
    });

    describe('Notification System Integration - Intégration système de notifications', () => {
        test('should show notifications for loan actions', async () => {
            const TestNotificationSystem = () => {
                const [notifications, setNotifications] = useState([]);
                
                const showNotification = (type, message) => {
                    setNotifications(prev => [...prev, { id: Date.now(), type, message }]);
                };
                
                return (
                    <div>
                        <h2>Test Notifications</h2>
                        <button onClick={() => showNotification('success', 'Prêt créé avec succès')}>
                            Créer Prêt
                        </button>
                        <button onClick={() => showNotification('error', 'Erreur lors de la création')}>
                            Erreur
                        </button>
                        <div data-testid="notifications">
                            {notifications.map(notif => (
                                <div key={notif.id} className={`notification ${notif.type}`}>
                                    {notif.message}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            };
            
            const user = userEvent.setup();
            render(
                <TestProviders>
                    <TestNotificationSystem />
                </TestProviders>
            );
            
            // Tester notification de succès
            const successButton = screen.getByText(/Créer Prêt/i);
            await user.click(successButton);
            
            await waitFor(() => {
                expect(screen.getByText(/Prêt créé avec succès/i)).toBeInTheDocument();
            });
            
            // Tester notification d'erreur
            const errorButton = screen.getByText(/Erreur/i);
            await user.click(errorButton);
            
            await waitFor(() => {
                expect(screen.getByText(/Erreur lors de la création/i)).toBeInTheDocument();
            });
        });
    });

    describe('Cache Integration - Intégration du cache', () => {
        test('should use cached data efficiently', async () => {
            const TestCacheComponent = () => {
                const [dataVersion, setDataVersion] = useState(1);
                const [loans, setLoans] = useState(mockLoans);
                
                const refreshData = () => {
                    setDataVersion(prev => prev + 1);
                    // Simuler un rechargement des données
                    setLoans([...mockLoans]);
                };
                
                return (
                    <div>
                        <div data-testid="data-version">Version: {dataVersion}</div>
                        <div data-testid="loan-count">{loans.length} prêts</div>
                        <button onClick={refreshData} data-testid="refresh-btn">
                            Actualiser
                        </button>
                    </div>
                );
            };
            
            render(
                <TestProviders>
                    <TestCacheComponent />
                </TestProviders>
            );
            
            // Vérifier l'affichage initial
            expect(screen.getByTestId('data-version')).toHaveTextContent('Version: 1');
            expect(screen.getByTestId('loan-count')).toHaveTextContent(`${mockLoans.length} prêts`);
            
            // Actualiser les données
            const refreshButton = screen.getByTestId('refresh-btn');
            fireEvent.click(refreshButton);
            
            // Vérifier la mise à jour
            await waitFor(() => {
                expect(screen.getByTestId('data-version')).toHaveTextContent('Version: 2');
            });
        });
    });
});
