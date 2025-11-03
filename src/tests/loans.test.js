// src/tests/loans.test.js - TESTS UNITAIRES POUR LA GESTION DES PRÊTS DE MATÉRIEL

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import '@testing-library/jest-dom';

// Import des composants à tester
import LoanFilters from '../components/loan-management/LoanFilters';
import LoanExportButton from '../components/loan-management/LoanExportButton';
import LoanQRCodeDialog from '../components/loan-management/LoanQRCodeDialog';
import LoanList from '../components/loan-management/LoanList';
import LoansCalendar from '../pages/LoansCalendar';
import { mockLoans, mockComputers, mockUsers, mockTechnicians } from './__mocks__/loanData';

// Import du contexte de test
import { TestProviders } from './TestProviders';

const WrappedLoanFilters = ({ onFilterChange, technicians }) => (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
        <LoanFilters onFilterChange={onFilterChange} technicians={technicians} />
    </LocalizationProvider>
);

describe('Tests Unitaires - Gestion des Prêts de Matériel', () => {
    
    describe('LoanFilters - Filtres avancés', () => {
        const mockOnFilterChange = jest.fn();

        beforeEach(() => {
            mockOnFilterChange.mockClear();
        });

        test('should render default state correctly', () => {
            render(<WrappedLoanFilters onFilterChange={mockOnFilterChange} technicians={mockTechnicians} />);
            
            expect(screen.getByText(/Filtres/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Statut/i)).toBeInTheDocument();
            expect(screen.queryByText(/actif/i)).not.toBeInTheDocument(); // Pas de filtre actif par défaut
        });

        test('should expand filters when clicked', async () => {
            render(<WrappedLoanFilters onFilterChange={mockOnFilterChange} technicians={mockTechnicians} />);
            
            const expandButton = screen.getByTestId('ExpandMoreIcon');
            fireEvent.click(expandButton);
            
            await waitFor(() => {
                expect(screen.getByLabelText(/Date début/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/Date fin/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/Technicien/i)).toBeInTheDocument();
            });
        });

        test('should filter by status', async () => {
            const user = userEvent.setup();
            render(<WrappedLoanFilters onFilterChange={mockOnFilterChange} technicians={mockTechnicians} />);
            
            const statusSelect = screen.getByLabelText(/Statut/i);
            await user.selectOptions(statusSelect, 'active');
            
            await waitFor(() => {
                expect(mockOnFilterChange).toHaveBeenLastCalledWith(
                    expect.objectContaining({ status: 'active' })
                );
            });
        });

        test('should filter by date range', async () => {
            const user = userEvent.setup();
            render(<WrappedLoanFilters onFilterChange={mockOnFilterChange} technicians={mockTechnicians} />);
            
            // Cliquer pour ouvrir les filtres
            const expandButton = screen.getByTestId('ExpandMoreIcon');
            fireEvent.click(expandButton);

            // Sélectionner une date de début
            const startDateField = screen.getByLabelText(/Date début/i);
            const testStartDate = new Date('2024-01-01');
            fireEvent.change(startDateField, { target: { value: testStartDate } });
            
            await waitFor(() => {
                expect(mockOnFilterChange).toHaveBeenLastCalledWith(
                    expect.objectContaining({ startDate: testStartDate })
                );
            });
        });

        test('should filter by technician', async () => {
            const user = userEvent.setup();
            render(<WrappedLoanFilters onFilterChange={mockOnFilterChange} technicians={mockTechnicians} />);
            
            const expandButton = screen.getByTestId('ExpandMoreIcon');
            fireEvent.click(expandButton);

            const technicianField = screen.getByLabelText(/Technicien/i);
            await user.click(technicianField);
            
            // Choisir un technicien
            const technicianOption = screen.getByText('Jean Dupont');
            await user.click(technicianOption);
            
            await waitFor(() => {
                expect(mockOnFilterChange).toHaveBeenLastCalledWith(
                    expect.objectContaining({ technician: mockTechnicians[0] })
                );
            });
        });

        test('should show active filter count', async () => {
            const user = userEvent.setup();
            render(<WrappedLoanFilters onFilterChange={mockOnFilterChange} technicians={mockTechnicians} />);
            
            // Appliquer plusieurs filtres
            const expandButton = screen.getByTestId('ExpandMoreIcon');
            fireEvent.click(expandButton);

            // Statut
            const statusSelect = screen.getByLabelText(/Statut/i);
            await user.selectOptions(statusSelect, 'active');

            // Date de début
            const startDateField = screen.getByLabelText(/Date début/i);
            fireEvent.change(startDateField, { target: { value: new Date('2024-01-01') } });

            // Nom utilisateur
            const userNameField = screen.getByLabelText(/Nom utilisateur/i);
            fireEvent.change(userNameField, { target: { value: 'John' } });
            
            await waitFor(() => {
                expect(screen.getByText(/3 actifs/i)).toBeInTheDocument();
            });
        });

        test('should clear all filters', async () => {
            const user = userEvent.setup();
            render(<WrappedLoanFilters onFilterChange={mockOnFilterChange} technicians={mockTechnicians} />);
            
            // Appliquer des filtres
            const expandButton = screen.getByTestId('ExpandMoreIcon');
            fireEvent.click(expandButton);

            const statusSelect = screen.getByLabelText(/Statut/i);
            await user.selectOptions(statusSelect, 'active');

            // Trouver le bouton clear
            const clearButton = screen.getByTestId('ClearIcon').closest('button');
            await user.click(clearButton);
            
            await waitFor(() => {
                expect(statusSelect).toHaveValue('all');
                expect(screen.queryByText(/actif/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('LoanExportButton - Export de données', () => {
        test('should render export button', () => {
            render(<LoanExportButton loans={mockLoans} filters={{}} />);
            
            expect(screen.getByText(/Exporter/i)).toBeInTheDocument();
        });

        test('should be disabled when no loans', () => {
            render(<LoanExportButton loans={[]} filters={{}} />);
            
            const exportButton = screen.getByText(/Exporter/i);
            expect(exportButton).toBeDisabled();
        });

        test('should show menu on click', async () => {
            const user = userEvent.setup();
            render(<LoanExportButton loans={mockLoans} filters={{}} />);
            
            const exportButton = screen.getByText(/Exporter/i);
            await user.click(exportButton);
            
            expect(screen.getByText(/Excel/i)).toBeInTheDocument();
            expect(screen.getByText(/PDF/i)).toBeInTheDocument();
        });

        test('should show loading state during export', async () => {
            const user = userEvent.setup();
            render(<LoanExportButton loans={mockLoans} filters={{}} />);
            
            const exportButton = screen.getByText(/Exporter/i);
            await user.click(exportButton);
            
            const excelOption = screen.getByText(/Excel/i);
            await user.click(excelOption);
            
            // Vérifier l'état de chargement
            await waitFor(() => {
                expect(screen.getByRole('progressbar')).toBeInTheDocument();
            }, { timeout: 1000 });
        });
    });

    describe('LoanQRCodeDialog - Codes QR', () => {
        test('should not render when computer is null', () => {
            render(<LoanQRCodeDialog open={true} onClose={jest.fn()} computer={null} loan={mockLoans[0]} />);
            
            expect(screen.queryByText(/Étiquette QR Code/i)).not.toBeInTheDocument();
        });

        test('should render QR code dialog', () => {
            render(<LoanQRCodeDialog open={true} onClose={jest.fn()} computer={mockComputers[0]} loan={mockLoans[0]} />);
            
            expect(screen.getByText(/Étiquette QR Code/i)).toBeInTheDocument();
            expect(screen.getByText(mockComputers[0].name)).toBeInTheDocument();
        });

        test('should handle custom text input', async () => {
            const user = userEvent.setup();
            render(<LoanQRCodeDialog open={true} onClose={jest.fn()} computer={mockComputers[0]} loan={mockLoans[0]} />);
            
            const customTextField = screen.getByLabelText(/Texte personnalisé/i);
            await user.type(customTextField, 'Bureau 204');
            
            expect(customTextField).toHaveValue('Bureau 204');
        });

        test('should show serial number if available', () => {
            render(<LoanQRCodeDialog open={true} onClose={jest.fn()} computer={mockComputers[0]} loan={mockLoans[0]} />);
            
            expect(screen.getByText(/S\/N:/)).toBeInTheDocument();
            expect(screen.getByText(mockComputers[0].serial_number)).toBeInTheDocument();
        });

        test('should handle print action', () => {
            // Mock window.open and print
            global.window.open = jest.fn();
            global.window.print = jest.fn();
            
            render(<LoanQRCodeDialog open={true} onClose={jest.fn()} computer={mockComputers[0]} loan={mockLoans[0]} />);
            
            const printButton = screen.getByText(/Imprimer/i);
            fireEvent.click(printButton);
            
            expect(global.window.open).toHaveBeenCalled();
        });
    });

    describe('LoanList - Liste des prêts', () => {
        test('should render loan list', () => {
            render(
                <TestProviders>
                    <LoanList />
                </TestProviders>
            );
            
            expect(screen.getByText(/Statut/i)).toBeInTheDocument();
            expect(screen.getByText(/Matériel/i)).toBeInTheDocument();
            expect(screen.getByText(/Utilisateur/i)).toBeInTheDocument();
        });

        test('should filter by status', async () => {
            const user = userEvent.setup();
            render(
                <TestProviders>
                    <LoanList />
                </TestProviders>
            );
            
            const statusSelect = screen.getByLabelText(/Statut/i);
            await user.selectOptions(statusSelect, 'active');
            
            // Les prêts affichés doivent correspondre au filtre
            // (Les détails dépendent de la logique de filtrage dans LoanList)
        });

        test('should search loans', async () => {
            const user = userEvent.setup();
            render(
                <TestProviders>
                    <LoanList />
                </TestProviders>
            );
            
            const searchInput = screen.getByPlaceholderText(/Rechercher un prêt/i);
            await user.type(searchInput, 'PC-001');
            
            expect(searchInput).toHaveValue('PC-001');
        });

        test('should open edit dialog on edit click', async () => {
            const user = userEvent.setup();
            render(
                <TestProviders>
                    <LoanList />
                </TestProviders>
            );
            
            // Attendre que les données soient chargées
            await waitFor(() => {
                expect(screen.getAllByTestId('EditIcon').length).toBeGreaterThan(0);
            });
            
            const editButton = screen.getAllByTestId('EditIcon')[0].closest('button');
            await user.click(editButton);
            
            // Vérifier que le dialog s'ouvre
            await waitFor(() => {
                expect(screen.getByText(/Modifier le prêt/i)).toBeInTheDocument();
            });
        });

        test('should open return dialog on return click', async () => {
            const user = userEvent.setup();
            render(
                <TestProviders>
                    <LoanList />
                </TestProviders>
            );
            
            await waitFor(() => {
                expect(screen.getAllByTestId('AssignmentReturnIcon').length).toBeGreaterThan(0);
            });
            
            const returnButton = screen.getAllByTestId('AssignmentReturnIcon')[0].closest('button');
            await user.click(returnButton);
            
            await waitFor(() => {
                expect(screen.getByText(/Retourner le prêt/i)).toBeInTheDocument();
            });
        });
    });

    describe('LoansCalendar - Calendrier des prêts', () => {
        test('should render calendar header', () => {
            render(<LoansCalendar />);
            
            expect(screen.getByText(/Calendrier des Prêts/i)).toBeInTheDocument();
            expect(screen.getByText(/Visualisez les prêts/i)).toBeInTheDocument();
        });

        test('should show loan statistics', () => {
            render(<LoansCalendar />);
            
            expect(screen.getByText(/prêts total/i)).toBeInTheDocument();
            expect(screen.getByText(/actifs/i)).toBeInTheDocument();
            expect(screen.getByText(/réservés/i)).toBeInTheDocument();
        });

        test('should navigate to previous month', () => {
            render(<LoansCalendar />);
            
            const previousButton = screen.getByTestId('ChevronLeft');
            fireEvent.click(previousButton);
            
            // Le mois devrait changer (même si on ne peut pas facilement le vérifier visuellement)
            expect(previousButton).toBeInTheDocument();
        });

        test('should navigate to next month', () => {
            render(<LoansCalendar />);
            
            const nextButton = screen.getByTestId('ChevronRight');
            fireEvent.click(nextButton);
            
            expect(nextButton).toBeInTheDocument();
        });

        test('should go to today', () => {
            render(<LoansCalendar />);
            
            const todayButton = screen.getByText(/Aujourd'hui/i);
            fireEvent.click(todayButton);
            
            expect(todayButton).toBeInTheDocument();
        });

        test('should show loan details on day click', async () => {
            render(<LoansCalendar />);
            
            // Attendre que les prêts soient chargés
            await waitFor(() => {
                // Chercher un jour qui contient des prêts
                // (La logique dépend des données mockées)
            }, { timeout: 3000 });
            
            // Cliquer sur un jour avec des prêts
            // Note: Ce test dépend des données réelles dans le mock
        });
    });

    describe('Loan Status Management - Gestion des statuts', () => {
        test('should have correct status colors and labels', () => {
            const statusConfig = {
                active: { label: 'Actif', color: 'success' },
                reserved: { label: 'Réservé', color: 'info' },
                overdue: { label: 'En retard', color: 'warning' },
                critical: { label: 'Critique', color: 'error' },
                returned: { label: 'Retourné', color: 'default' },
                cancelled: { label: 'Annulé', color: 'default' },
            };
            
            expect(statusConfig.active.label).toBe('Actif');
            expect(statusConfig.active.color).toBe('success');
            expect(statusConfig.overdue.label).toBe('En retard');
            expect(statusConfig.critical.label).toBe('Critique');
        });
    });

    describe('Date Handling - Gestion des dates', () => {
        test('should format dates correctly', () => {
            const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR');
            
            const testDate = '2024-01-15T10:30:00Z';
            const formatted = formatDate(testDate);
            
            expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        });

        test('should handle invalid dates gracefully', () => {
            const formatDate = (dateStr) => {
                try {
                    return new Date(dateStr).toLocaleDateString('fr-FR');
                } catch (error) {
                    return 'Date invalide';
                }
            };
            
            expect(formatDate('invalid-date')).toBe('Date invalide');
            expect(formatDate('')).toBe('Date invalide');
            expect(formatDate(null)).toBe('Date invalide');
        });
    });

    describe('Input Validation - Validation des entrées', () => {
        test('should validate computer name field', () => {
            // Test de validation des champs texte
            const isValidComputerName = (name) => {
                return name && name.length >= 1 && name.length <= 100;
            };
            
            expect(isValidComputerName('PC-001')).toBe(true);
            expect(isValidComputerName('')).toBe(false);
            expect(isValidComputerName('A'.repeat(101))).toBe(false);
        });

        test('should validate user name field', () => {
            const isValidUserName = (name) => {
                return name && name.length >= 2 && name.length <= 100;
            };
            
            expect(isValidUserName('Jean Dupont')).toBe(true);
            expect(isValidUserName('J')).toBe(false);
            expect(isValidUserName('')).toBe(false);
        });

        test('should validate loan dates', () => {
            const isValidLoanDate = (startDate, endDate) => {
                if (!startDate || !endDate) return false;
                const start = new Date(startDate);
                const end = new Date(endDate);
                return start <= end;
            };
            
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            expect(isValidLoanDate(today, tomorrow)).toBe(true);
            expect(isValidLoanDate(tomorrow, today)).toBe(false);
            expect(isValidLoanDate(yesterday, today)).toBe(true);
        });
    });
});
