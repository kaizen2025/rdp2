// src/components/loan-management/LoanListWithBulkActions.js
// Intégration du système d'actions groupées amélioré dans l'interface existante

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Button,
    Fab,
    Tooltip,
    useMediaQuery,
    useTheme,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Group as BulkIcon,
    Add as AddIcon
} from '@mui/icons-material';

// Import du système d'actions groupées
import { BulkActionsManager } from '../bulk';

// Import de l'interface existante
import LoanList from './LoanList';

// Hook personnalisé pour la gestion des prêts avec actions groupées
const useLoanBulkActions = (initialLoans = []) => {
    const [loans, setLoans] = useState(initialLoans);
    const [selectedLoans, setSelectedLoans] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Actions de gestion des prêts
    const handleLoanAction = useCallback(async (actionType, loanData, parameters = {}) => {
        setIsLoading(true);
        try {
            // Ici, vous feriez l'appel à votre API
            // Pour la démo, nous simulons les opérations
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            let updatedLoans;
            switch (actionType) {
                case 'RETURN':
                    updatedLoans = loans.map(loan => 
                        loan.id === loanData.id 
                            ? { ...loan, status: 'returned', returnedAt: new Date().toISOString() }
                            : loan
                    );
                    break;
                
                case 'EXTEND':
                    updatedLoans = loans.map(loan => 
                        loan.id === loanData.id 
                            ? { 
                                ...loan, 
                                returnDate: new Date(Date.now() + parameters.days * 24 * 60 * 60 * 1000).toISOString(),
                                extended: (loan.extended || 0) + 1
                            }
                            : loan
                    );
                    break;
                
                case 'EDIT':
                    // Logique d'édition
                    updatedLoans = loans;
                    break;
                
                default:
                    updatedLoans = loans;
            }
            
            setLoans(updatedLoans);
            setNotification({
                type: 'success',
                message: `Prêt ${loanData.id} ${actionType.toLowerCase()} avec succès`
            });
            
        } catch (error) {
            setNotification({
                type: 'error',
                message: `Erreur lors de l'action: ${error.message}`
            });
        } finally {
            setIsLoading(false);
        }
    }, [loans]);

    // Mise à jour après action groupée
    const handleBulkLoansUpdate = useCallback((updatedLoans) => {
        setLoans(updatedLoans);
        setNotification({
            type: 'success',
            message: 'Actions groupées appliquées avec succès'
        });
    }, []);

    // Fermeture de notification
    const handleCloseNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return {
        loans,
        selectedLoans,
        setSelectedLoans,
        isLoading,
        notification,
        handleLoanAction,
        handleBulkLoansUpdate,
        handleCloseNotification
    };
};

// Composant principal avec actions groupées
const LoanListWithBulkActions = ({
    showBulkActions = true,
    maxBulkActions = 100,
    currentUser = { id: 'current-user', role: 'admin' },
    enableFloatingAction = true,
    ...loanListProps
}) => {
    // Hooks
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // Gestion des prêts avec actions groupées
    const {
        loans,
        selectedLoans,
        setSelectedLoans,
        isLoading,
        notification,
        handleLoanAction,
        handleBulkLoansUpdate,
        handleCloseNotification
    } = useLoanBulkActions(loanListProps.loans || []);

    // Gestionnaires d'actions individuelles
    const handleReturn = useCallback((loan) => {
        handleLoanAction('RETURN', loan);
    }, [handleLoanAction]);

    const handleEdit = useCallback((loan) => {
        handleLoanAction('EDIT', loan);
    }, [handleLoanAction]);

    const handleExtend = useCallback((loan) => {
        // Ouvrir un dialogue de prolongation pour un seul prêt
        const days = prompt('Nombre de jours de prolongation:', '7');
        if (days && !isNaN(days)) {
            handleLoanAction('EXTEND', loan, { days: parseInt(days) });
        }
    }, [handleLoanAction]);

    const handleHistory = useCallback((loan) => {
        console.log('Voir l\'historique du prêt:', loan.id);
        // Implémentation de l'historique
    }, []);

    const handleCancel = useCallback((loan) => {
        if (confirm('Êtes-vous sûr de vouloir annuler ce prêt ?')) {
            handleLoanAction('CANCEL', loan);
        }
    }, [handleLoanAction]);

    // Calcul des couleurs utilisateur
    const getUserColor = useCallback((userId) => {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
        ];
        const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    }, []);

    // Configuration du tri
    const [sortConfig, setSortConfig] = useState({ field: 'loanDate', direction: 'desc' });

    const handleSort = useCallback((newConfig) => {
        setSortConfig(newConfig);
    }, []);

    // Indicateur d'actions groupées disponibles
    const bulkActionsAvailable = selectedLoans.size > 1 && selectedLoans.size <= maxBulkActions;

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            {/* Interface de gestion des prêts */}
            <LoanList
                {...loanListProps}
                loans={loans}
                selectedLoans={selectedLoans}
                onSelectLoan={setSelectedLoans}
                onReturn={handleReturn}
                onEdit={handleEdit}
                onExtend={handleExtend}
                onHistory={handleHistory}
                onCancel={handleCancel}
                sortConfig={sortConfig}
                onSort={handleSort}
                getUserColor={getUserColor}
                compact={isMobile}
            />

            {/* Système d'actions groupées */}
            {showBulkActions && (
                <Box sx={{ mt: 3 }}>
                    <BulkActionsManager
                        loans={loans}
                        selectedLoans={selectedLoans}
                        onSelectionChange={setSelectedLoans}
                        onLoansUpdate={handleBulkLoansUpdate}
                        getUserColor={getUserColor}
                        maxBulkActions={maxBulkActions}
                        currentUser={currentUser}
                    />
                </Box>
            )}

            {/* Bouton d'action flottant pour actions groupées */}
            {enableFloatingAction && bulkActionsAvailable && (
                <Tooltip 
                    title={`Actions groupées (${selectedLoans.size} prêts sélectionnés)`}
                    placement="left"
                >
                    <Fab
                        color="primary"
                        sx={{
                            position: 'fixed',
                            bottom: 16,
                            right: 16,
                            zIndex: theme.zIndex.drawer + 1
                        }}
                        onClick={() => {
                            // Scroll vers le gestionnaire d'actions groupées
                            const bulkManager = document.querySelector('[data-bulk-actions-manager]');
                            if (bulkManager) {
                                bulkManager.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                    >
                        <BulkIcon />
                    </Fab>
                </Tooltip>
            )}

            {/* Badge d'indication sur le bouton flottant */}
            {bulkActionsAvailable && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 60,
                        right: 60,
                        zIndex: theme.zIndex.drawer,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: 2
                    }}
                >
                    {selectedLoans.size > 9 ? '9+' : selectedLoans.size}
                </Box>
            )}

            {/* Notification de statut */}
            <Snackbar
                open={!!notification}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {notification && (
                    <Alert 
                        onClose={handleCloseNotification} 
                        severity={notification.type}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                )}
            </Snackbar>

            {/* Indicateur de chargement global */}
            {isLoading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2
                    }}
                >
                    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SettingsIcon className="spin" sx={{ animation: 'spin 2s linear infinite' }} />
                        <span>Traitement en cours...</span>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

// Style CSS pour l'animation de rotation
const styles = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .spin {
        animation: spin 2s linear infinite;
    }
    
    [data-bulk-actions-manager] {
        scroll-margin-top: 100px;
    }
`;

// Injection des styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

export default React.memo(LoanListWithBulkActions);

// Export du composant avec toutes les fonctionnalités avancées
export { 
    LoanListWithBulkActions as default,
    useLoanBulkActions 
};