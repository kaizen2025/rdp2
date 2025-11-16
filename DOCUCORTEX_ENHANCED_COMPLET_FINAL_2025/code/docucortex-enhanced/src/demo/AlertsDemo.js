// src/demo/AlertsDemo.js - DÉMONSTRATION DU SYSTÈME D'ALERTES
// Exemple d'utilisation complète du système d'alertes préventives

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Button,
    Paper,
    Box,
    Alert,
    Stack,
    Divider,
    Chip
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';

// Imports des composants d'alertes
import AlertSystem from '../components/alerts/AlertSystem';
import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import LoanList from '../components/loan-management/LoanList';
import alertsService from '../services/alertsService';
import apiService from '../services/apiService';

// 🎯 DONNÉES DE DÉMONSTRATION
const DEMO_LOANS = [
    {
        id: '1',
        documentId: 'doc-001',
        documentTitle: 'Contrat de Société ABC',
        documentType: 'PDF',
        borrowerId: 'user-001',
        borrowerName: 'Jean Dupont',
        borrowerEmail: 'jean.dupont@example.com',
        loanDate: '2025-11-10T09:00:00Z',
        returnDate: '2025-11-16T09:00:00Z', // Expire dans 1 jour (alerte 24h)
        status: 'active',
        createdAt: '2025-11-10T09:00:00Z',
        updatedAt: '2025-11-15T14:30:00Z'
    },
    {
        id: '2',
        documentId: 'doc-002',
        documentTitle: 'Rapport Financier Q3',
        documentType: 'Excel',
        borrowerId: 'user-002',
        borrowerName: 'Marie Martin',
        borrowerEmail: 'marie.martin@example.com',
        loanDate: '2025-11-08T14:00:00Z',
        returnDate: '2025-11-17T14:00:00Z', // Expire dans 2 jours (alerte 48h)
        status: 'active',
        createdAt: '2025-11-08T14:00:00Z',
        updatedAt: '2025-11-15T10:15:00Z'
    },
    {
        id: '3',
        documentId: 'doc-003',
        documentTitle: 'Cahier des Charges',
        documentType: 'Word',
        borrowerId: 'user-003',
        borrowerName: 'Pierre Durand',
        borrowerEmail: 'pierre.durand@example.com',
        loanDate: '2025-11-05T11:30:00Z',
        returnDate: '2025-11-12T11:30:00Z', // En retard de 3 jours (alerte critique)
        status: 'overdue',
        createdAt: '2025-11-05T11:30:00Z',
        updatedAt: '2025-11-15T16:45:00Z'
    },
    {
        id: '4',
        documentId: 'doc-004',
        documentTitle: 'Manuel Utilisateur v2.1',
        documentType: 'PDF',
        borrowerId: 'user-004',
        borrowerName: 'Sophie Leroy',
        borrowerEmail: 'sophie.leroy@example.com',
        loanDate: '2025-11-12T08:00:00Z',
        returnDate: '2025-11-20T08:00:00Z', // Expire dans 5 jours (normal)
        status: 'active',
        createdAt: '2025-11-12T08:00:00Z',
        updatedAt: '2025-11-15T12:00:00Z'
    },
    {
        id: '5',
        documentId: 'doc-005',
        documentTitle: 'Specification API',
        documentType: 'JSON',
        borrowerId: 'user-005',
        borrowerName: 'Lucas Moreau',
        borrowerEmail: 'lucas.moreau@example.com',
        loanDate: '2025-11-01T13:15:00Z',
        returnDate: '2025-11-14T13:15:00Z', // En retard d'1 jour (alerte critique)
        status: 'overdue',
        createdAt: '2025-11-01T13:15:00Z',
        updatedAt: '2025-11-15T09:30:00Z'
    }
];

// 🎮 COMPOSANT DE DÉMONSTRATION PRINCIPAL
const AlertsDemo = () => {
    const [currentView, setCurrentView] = useState('overview');
    const [loans, setLoans] = useState(DEMO_LOANS);
    const [selectedLoans, setSelectedLoans] = useState(new Set());
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Charger les notifications au démarrage
    useEffect(() => {
        setNotifications(alertsService.getStoredNotifications());
    }, []);

    // Écouter les nouvelles alertes
    useEffect(() => {
        const handleNewAlert = (event) => {
            setNotifications(prev => [event.detail, ...prev]);
        };

        window.addEventListener('docucortex-new-alert', handleNewAlert);
        
        return () => {
            window.removeEventListener('docucortex-new-alert', handleNewAlert);
        };
    }, []);

    // Générer des alertes pour la démo
    const generateDemoAlerts = useCallback(async () => {
        setLoading(true);
        try {
            console.log('🔄 Génération des alertes de démonstration...');
            
            // Traiter tous les prêts pour générer des alertes
            await alertsService.processLoansForAlerts(loans);
            
            // Actualiser les notifications
            setNotifications(alertsService.getStoredNotifications());
            
            console.log('✅ Alertes de démonstration générées');
        } catch (error) {
            console.error('❌ Erreur lors de la génération des alertes:', error);
        } finally {
            setLoading(false);
        }
    }, [loans]);

    // Effacer toutes les alertes de démo
    const clearDemoAlerts = useCallback(() => {
        const demoNotifications = notifications.filter(n => 
            n.id.includes('_') && parseInt(n.id.split('_')[0]) > 1000000000000
        );
        
        demoNotifications.forEach(notification => {
            alertsService.deleteNotification(notification.id);
        });
        
        setNotifications(alertsService.getStoredNotifications());
        console.log('🧹 Alertes de démonstration effacées');
    }, [notifications]);

    // Actions de gestion des prêts
    const handleLoanAction = useCallback((action, loanId) => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return;

        switch (action) {
            case 'view':
                alert(`📋 Affichage des détails du prêt: ${loan.documentTitle}\nEmprunteur: ${loan.borrowerName}`);
                break;
                
            case 'extend':
                const newReturnDate = new Date(loan.returnDate);
                newReturnDate.setDate(newReturnDate.getDate() + 7); // Prolonger de 7 jours
                
                setLoans(prev => prev.map(l => 
                    l.id === loanId 
                        ? { ...l, returnDate: newReturnDate.toISOString() }
                        : l
                ));
                
                alert(`⏰ Prêt prolongé de 7 jours:\n${loan.documentTitle}`);
                break;
                
            case 'recall':
                alert(`📢 Rappel envoyé à ${loan.borrowerName}\nPour le document: ${loan.documentTitle}`);
                break;
                
            case 'return':
                setLoans(prev => prev.map(l => 
                    l.id === loanId 
                        ? { ...l, status: 'returned', updatedAt: new Date().toISOString() }
                        : l
                ));
                
                alert(`✅ Prêt marqué comme retourné:\n${loan.documentTitle}`);
                break;
                
            case 'edit':
                alert(`✏️ Modification du prêt:\n${loan.documentTitle}\n(Fonctionnalité à implémenter)`);
                break;
                
            case 'history':
                alert(`📚 Historique du prêt:\n${loan.documentTitle}\n(Fonctionnalité à implémenter)`);
                break;
                
            case 'cancel':
                if (confirm(`Êtes-vous sûr de vouloir annuler le prêt de:\n${loan.documentTitle}?`)) {
                    setLoans(prev => prev.map(l => 
                        l.id === loanId 
                            ? { ...l, status: 'cancelled', updatedAt: new Date().toISOString() }
                            : l
                    ));
                }
                break;
                
            default:
                console.log('Action non gérée:', action, loanId);
        }
    }, [loans]);

    // Gestionnaires de sélection
    const handleSelectLoan = useCallback((loanOrSet, isSelected) => {
        if (loanOrSet instanceof Set) {
            setSelectedLoans(loanOrSet);
        } else {
            const newSelected = new Set(selectedLoans);
            if (isSelected) {
                newSelected.add(loanOrSet.id);
            } else {
                newSelected.delete(loanOrSet.id);
            }
            setSelectedLoans(newSelected);
        }
    }, [selectedLoans]);

    // Navigation entre les vues
    const views = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
        { id: 'dashboard', label: 'Dashboard complet', icon: '📈' },
        { id: 'list', label: 'Liste des prêts', icon: '📋' },
        { id: 'alerts', label: 'Système d\'alertes', icon: '🔔' }
    ];

    const renderCurrentView = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <DashboardAlerts
                        loans={loans}
                        onLoanAction={handleLoanAction}
                        refreshInterval={60000} // 1 minute pour la démo
                    />
                );
                
            case 'list':
                return (
                    <LoanList
                        loans={loans}
                        selectedLoans={selectedLoans}
                        onSelectLoan={handleSelectLoan}
                        onReturn={(loan) => handleLoanAction('return', loan.id)}
                        onEdit={(loan) => handleLoanAction('edit', loan.id)}
                        onExtend={(loan) => handleLoanAction('extend', loan.id)}
                        onHistory={(loan) => handleLoanAction('history', loan.id)}
                        onCancel={(loan) => handleLoanAction('cancel', loan.id)}
                        showAlerts={true}
                        showStatistics={true}
                        compact={false}
                    />
                );
                
            case 'alerts':
                return (
                    <AlertSystem
                        loans={loans}
                        embedded={false}
                        showStatistics={true}
                        onLoanAction={handleLoanAction}
                    />
                );
                
            default:
                return (
                    <Stack spacing={3}>
                        {/* Métriques rapides */}
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                📊 Métriques de Démonstration
                            </Typography>
                            
                            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                                <Chip label={`${loans.length} prêts`} color="primary" />
                                <Chip label={`${selectedLoans.size} sélectionnés`} color="secondary" />
                                <Chip label={`${notifications.length} notifications`} color="info" />
                                <Chip 
                                    label={`${loans.filter(l => l.status === 'overdue').length} en retard`} 
                                    color="error" 
                                />
                            </Stack>

                            <Alert severity="info" sx={{ mb: 2 }}>
                                Cette vue d'ensemble combine les éléments clés du système d'alertes.
                                Utilisez les boutons ci-dessous pour naviguer entre les différentes interfaces.
                            </Alert>

                            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<PlayIcon />}
                                    onClick={generateDemoAlerts}
                                    disabled={loading}
                                >
                                    {loading ? 'Génération...' : 'Générer Alertes Démo'}
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={() => setNotifications(alertsService.getStoredNotifications())}
                                >
                                    Actualiser
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<SettingsIcon />}
                                    onClick={() => alert('Préférences d\'alertes (demo)')}
                                >
                                    Préférences
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={clearDemoAlerts}
                                >
                                    Effacer Démo
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Système d'alertes intégré */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                🔔 Système d'Alertes Intégré
                            </Typography>
                            
                            <AlertSystem
                                loans={loans}
                                embedded={true}
                                showStatistics={false}
                                onLoanAction={handleLoanAction}
                            />
                        </Paper>

                        {/* Liste compacte */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                📋 Aperçu des Prêts
                            </Typography>
                            
                            <LoanList
                                loans={loans}
                                selectedLoans={selectedLoans}
                                onSelectLoan={handleSelectLoan}
                                onReturn={(loan) => handleLoanAction('return', loan.id)}
                                onEdit={(loan) => handleLoanAction('edit', loan.id)}
                                onExtend={(loan) => handleLoanAction('extend', loan.id)}
                                onHistory={(loan) => handleLoanAction('history', loan.id)}
                                onCancel={(loan) => handleLoanAction('cancel', loan.id)}
                                showAlerts={false}
                                showStatistics={false}
                                compact={true}
                            />
                        </Paper>
                    </Stack>
                );
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* En-tête */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" gutterBottom>
                    🚀 Démonstration Système d'Alertes DocuCortex
                </Typography>
                
                <Typography variant="body1" color="text.secondary" paragraph>
                    Cette démonstration présente toutes les fonctionnalités du système d'alertes préventives :
                    notifications automatiques, gestion des prêts, dashboard de surveillance et actions en masse.
                </Typography>

                {/* Navigation */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Navigation
                    </Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {views.map((view) => (
                            <Button
                                key={view.id}
                                variant={currentView === view.id ? 'contained' : 'outlined'}
                                onClick={() => setCurrentView(view.id)}
                                startIcon={<span>{view.icon}</span>}
                                size="small"
                            >
                                {view.label}
                            </Button>
                        ))}
                    </Stack>
                </Paper>
            </Box>

            {/* Contenu principal */}
            {renderCurrentView()}

            {/* Instructions */}
            <Paper sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    📖 Instructions de Démonstration
                </Typography>
                
                <Typography variant="body2" paragraph>
                    <strong>1. Génération d'alertes :</strong> Cliquez sur "Générer Alertes Démo" pour créer 
                    automatiquement des notifications basées sur les dates d'expiration des prêts de démonstration.
                </Typography>
                
                <Typography variant="body2" paragraph>
                    <strong>2. Types d'alertes :</strong> La démonstration inclut différents niveaux d'alertes :
                    prêts en retard (critiques), qui expirent dans 24h et 48h, et prêts normaux.
                </Typography>
                
                <Typography variant="body2" paragraph>
                    <strong>3. Actions disponibles :</strong> Cliquez sur les indicateurs d'alerte pour accéder 
                    aux actions rapides : prolonger, rappeler, ou voir les détails.
                </Typography>
                
                <Typography variant="body2" paragraph>
                    <strong>4. Vues multiples :</strong> Testez les différentes interfaces pour voir comment 
                    les alertes s'intègrent dans chaque contexte (liste, dashboard, système dédié).
                </Typography>

                <Alert severity="warning" sx={{ mt: 2 }}>
                    <strong>Note :</strong> Cette démonstration utilise des données fictives et stockage local 
                    pour simuler le comportement du système d'alertes.
                </Alert>
            </Paper>
        </Container>
    );
};

export default AlertsDemo;