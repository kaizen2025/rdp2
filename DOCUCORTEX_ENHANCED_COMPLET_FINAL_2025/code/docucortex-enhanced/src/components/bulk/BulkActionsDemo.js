// src/components/bulk/BulkActionsDemo.js
// Démonstration complète des fonctionnalités d'actions groupées

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Stack,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Extension as ExtendIcon,
    Email as EmailIcon,
    SwapHoriz as TransferIcon,
    Flag as StatusIcon,
    Download as ExportIcon,
    Delete as DeleteIcon,
    Info as InfoIcon,
    CheckCircle as SuccessIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

// Import des composants d'actions groupées
import { 
    BulkActionsManager, 
    BulkActionsEngine,
    BulkSelectionBar,
    BulkActionDialog,
    BulkProgressIndicator,
    BulkErrorHandler,
    BulkActionHistory,
    BULK_ACTIONS 
} from './';

// Données de démonstration
const DEMO_LOANS = [
    {
        id: 'LOAN001',
        documentTitle: 'Guide de l\'utilisateur DocuCortex',
        documentType: 'Manuel',
        borrowerId: 'user1',
        borrowerName: 'Jean Dupont',
        borrowerEmail: 'jean.dupont@exemple.fr',
        loanDate: '2024-01-15T10:30:00.000Z',
        returnDate: '2024-01-22T10:30:00.000Z',
        status: 'active',
        extended: 0
    },
    {
        id: 'LOAN002',
        documentTitle: 'Procédures d\'administration système',
        documentType: 'Documentation',
        borrowerId: 'user2',
        borrowerName: 'Marie Martin',
        borrowerEmail: 'marie.martin@exemple.fr',
        loanDate: '2024-01-10T14:15:00.000Z',
        returnDate: '2024-01-17T14:15:00.000Z',
        status: 'active',
        extended: 1
    },
    {
        id: 'LOAN003',
        documentTitle: 'Manuel de formation équipe',
        documentType: 'Formation',
        borrowerId: 'user1',
        borrowerName: 'Jean Dupont',
        borrowerEmail: 'jean.dupont@exemple.fr',
        loanDate: '2024-01-12T09:00:00.000Z',
        returnDate: '2024-01-19T09:00:00.000Z',
        status: 'overdue',
        extended: 0
    },
    {
        id: 'LOAN004',
        documentTitle: 'Spécifications techniques v2.1',
        documentType: 'Spécification',
        borrowerId: 'user3',
        borrowerName: 'Pierre Durand',
        borrowerEmail: 'pierre.durand@exemple.fr',
        loanDate: '2024-01-08T16:45:00.000Z',
        returnDate: '2024-01-15T16:45:00.000Z',
        status: 'critical',
        extended: 2
    },
    {
        id: 'LOAN005',
        documentTitle: 'Guide de déploiement',
        documentType: 'Manuel',
        borrowerId: 'user2',
        borrowerName: 'Marie Martin',
        borrowerEmail: 'marie.martin@exemple.fr',
        loanDate: '2024-01-20T11:20:00.000Z',
        returnDate: '2024-01-21T11:20:00.000Z',
        status: 'active',
        extended: 0
    }
];

const DEMO_USERS = [
    { id: 'user1', name: 'Jean Dupont', email: 'jean.dupont@exemple.fr', role: 'manager' },
    { id: 'user2', name: 'Marie Martin', email: 'marie.martin@exemple.fr', role: 'user' },
    { id: 'user3', name: 'Pierre Durand', email: 'pierre.durand@exemple.fr', role: 'admin' }
];

const BulkActionsDemo = () => {
    // États pour la démonstration
    const [loans, setLoans] = useState(DEMO_LOANS);
    const [selectedLoans, setSelectedLoans] = useState(new Set());
    const [currentUser, setCurrentUser] = useState(DEMO_USERS[0]); // Jean Dupont (manager)
    const [demoStep, setDemoStep] = useState(0);
    const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
    
    // États pour les composants spécialisés
    const [showProgress, setShowProgress] = useState(false);
    const [progressValue, setProgressValue] = useState(0);
    const [progressStep, setProgressStep] = useState('');
    
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);
    
    const [showHistory, setShowHistory] = useState(false);
    
    // Hooks
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Gestionnaires d'événements pour la démo
    const handleSelectionChange = useCallback((newSelection) => {
        setSelectedLoans(newSelection);
    }, []);

    const handleLoansUpdate = useCallback((updatedLoans) => {
        setLoans(updatedLoans);
        setSelectedLoans(new Set());
    }, []);

    const handleActionExecute = useCallback(async (actionId, parameters) => {
        console.log(`Exécution de l'action: ${actionId}`, parameters);
        
        // Simulation de progression
        setShowProgress(true);
        setProgressValue(0);
        setProgressStep('Initialisation...');
        
        for (let i = 0; i <= 100; i += 10) {
            setProgressValue(i);
            setProgressStep(`Traitement ${i}%...`);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        setShowProgress(false);
        
        // Simulation d'un résultat
        const mockResult = {
            successful: Math.floor(Math.random() * selectedLoans.size) + 1,
            failed: selectedLoans.size - Math.floor(Math.random() * selectedLoans.size),
            updatedLoans: loans.filter(loan => selectedLoans.has(loan.id)),
            errors: [],
            warnings: [],
            timestamp: new Date().toISOString(),
            successRate: Math.round(Math.random() * 30) + 70
        };
        
        return mockResult;
    }, [selectedLoans, loans]);

    // Fonction de démonstration d'erreur
    const handleDemoError = useCallback(() => {
        setErrorDetails({
            message: 'Erreur de démonstration: Connexion timeout',
            failedLoans: [
                { loanId: 'LOAN001', error: 'Timeout de connexion', canRetry: true },
                { loanId: 'LOAN003', error: 'Erreur de validation', canRetry: false }
            ],
            actionId: 'EXTEND'
        });
        setShowErrorDialog(true);
    }, []);

    // Actions de démonstration
    const demoActions = [
        {
            title: 'Sélection Intelligente',
            description: 'Découvrez les filtres rapides et la sélection par critères',
            icon: <InfoIcon />,
            action: () => {
                setSelectedLoans(new Set(['LOAN001', 'LOAN003']));
                setDemoStep(1);
            }
        },
        {
            title: 'Prolongation en Lot',
            description: 'Prolongez plusieurs prêts en une seule opération',
            icon: <ExtendIcon color="primary" />,
            action: () => {
                setSelectedLoans(new Set(['LOAN001', 'LOAN002', 'LOAN005']));
                setDemoStep(2);
            }
        },
        {
            title: 'Rappels Multiples',
            description: 'Envoyez des rappels par email à plusieurs emprunteurs',
            icon: <EmailIcon color="warning" />,
            action: () => {
                setSelectedLoans(new Set(['LOAN003', 'LOAN004']));
                setDemoStep(3);
            }
        },
        {
            title: 'Transfert Groupé',
            description: 'Transférez des prêts vers un autre utilisateur',
            icon: <TransferIcon color="info" />,
            action: () => {
                setSelectedLoans(new Set(['LOAN001', 'LOAN002']));
                setDemoStep(4);
            }
        },
        {
            title: 'Gestion d\'Erreurs',
            description: 'Voyez comment le système gère les erreurs',
            icon: <ErrorIcon color="error" />,
            action: handleDemoError
        },
        {
            title: 'Historique Complet',
            description: 'Consultez l\'historique des actions groupées',
            icon: <InfoIcon color="primary" />,
            action: () => setShowHistory(true)
        }
    ];

    return (
        <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
            {/* En-tête de démonstration */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h4" gutterBottom>
                    🎯 Démonstration du Système d'Actions Groupées
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Explorez les fonctionnalités avancées de gestion des actions groupées avec validation intelligente, 
                    gestion d'erreurs et audit trail complet.
                </Typography>
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Chip 
                        label={`${loans.length} prêts disponibles`}
                        color="inherit"
                        variant="filled"
                    />
                    <Chip 
                        label={`${selectedLoans.size} sélectionnés`}
                        color={selectedLoans.size > 0 ? 'secondary' : 'default'}
                        variant={selectedLoans.size > 0 ? 'filled' : 'outlined'}
                    />
                    <Chip 
                        label={`Utilisateur: ${currentUser.name}`}
                        color="inherit"
                        variant="outlined"
                    />
                </Stack>

                {/* Contrôles de démonstration */}
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                        startIcon={<ExpandMoreIcon />}
                    >
                        {showAdvancedFeatures ? 'Masquer' : 'Afficher'} les fonctionnalités avancées
                    </Button>
                    
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setSelectedLoans(new Set());
                            setDemoStep(0);
                        }}
                    >
                        Réinitialiser la démonstration
                    </Button>
                </Stack>
            </Paper>

            {/* Composants principaux de la démo */}
            <Grid container spacing={3}>
                {/* Colonne principale */}
                <Grid item xs={12} lg={8}>
                    {/* Démonstrations des composants */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                                🎮 Démonstrations Interactives
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                {demoActions.map((demo, index) => (
                                    <Grid item xs={12} md={6} key={index}>
                                        <Card 
                                            variant="outlined" 
                                            sx={{ 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': { 
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: 2
                                                }
                                            }}
                                            onClick={demo.action}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    {demo.icon}
                                                    <Typography variant="h6">
                                                        {demo.title}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {demo.description}
                                                </Typography>
                                            </CardContent>
                                            <CardActions>
                                                <Button size="small" startIcon={<PlayIcon />}>
                                                    Essayer
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Guide d'utilisation */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                                📖 Guide d'Utilisation Détaillé
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List>
                                <ListItem>
                                    <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                                    <ListItemText 
                                        primary="1. Sélectionnez les prêts"
                                        secondary="Utilisez les checkboxes ou les filtres rapides pour sélectionner plusieurs prêts"
                                    />
                                </ListItem>
                                
                                <ListItem>
                                    <ListItemIcon><ExtendIcon color="primary" /></ListItemIcon>
                                    <ListItemText 
                                        primary="2. Choisissez une action groupée"
                                        secondary="Cliquez sur l'action désirée (Prolonger, Rappeler, Transférer, etc.)"
                                    />
                                </ListItem>
                                
                                <ListItem>
                                    <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                                    <ListItemText 
                                        primary="3. Configurez les paramètres"
                                        secondary="Saisissez les paramètres spécifiques à votre action dans le dialogue"
                                    />
                                </ListItem>
                                
                                <ListItem>
                                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                                    <ListItemText 
                                        primary="4. Confirmez et surveillez"
                                        secondary="Validez l'action et suivez la progression en temps réel"
                                    />
                                </ListItem>
                                
                                <ListItem>
                                    <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                                    <ListItemText 
                                        primary="5. Gérez les erreurs si nécessaire"
                                        secondary="Le système vous propose des solutions en cas d'erreur"
                                    />
                                </ListItem>
                            </List>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                {/* Colonne latérale */}
                <Grid item xs={12} lg={4}>
                    {/* Informations utilisateur */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            👤 Utilisateur Actuel
                        </Typography>
                        <Stack spacing={1}>
                            <Typography variant="body2">
                                <strong>Nom:</strong> {currentUser.name}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Email:</strong> {currentUser.email}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Rôle:</strong> 
                                <Chip 
                                    label={currentUser.role} 
                                    size="small" 
                                    color={currentUser.role === 'admin' ? 'error' : 
                                           currentUser.role === 'manager' ? 'primary' : 'default'}
                                    sx={{ ml: 1 }}
                                />
                            </Typography>
                        </Stack>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                            Changer d'utilisateur:
                        </Typography>
                        <Stack spacing={1}>
                            {DEMO_USERS.map(user => (
                                <Button
                                    key={user.id}
                                    size="small"
                                    variant={currentUser.id === user.id ? 'contained' : 'outlined'}
                                    onClick={() => setCurrentUser(user)}
                                >
                                    {user.name} ({user.role})
                                </Button>
                            ))}
                        </Stack>
                    </Paper>

                    {/* Statistiques rapides */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            📊 Statistiques
                        </Typography>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Prêts totaux:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {loans.length}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Sélectionnés:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {selectedLoans.size}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">En retard:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                    {loans.filter(l => l.status === 'overdue' || l.status === 'critical').length}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* Actions rapides */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            ⚡ Actions Rapides
                        </Typography>
                        <Stack spacing={1}>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                fullWidth
                                onClick={() => setSelectedLoans(new Set(loans.map(l => l.id)))}
                            >
                                Tout sélectionner
                            </Button>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                fullWidth
                                onClick={() => setSelectedLoans(new Set())}
                            >
                                Effacer la sélection
                            </Button>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                fullWidth
                                onClick={() => {
                                    const overdueIds = loans
                                        .filter(l => l.status === 'overdue' || l.status === 'critical')
                                        .map(l => l.id);
                                    setSelectedLoans(new Set(overdueIds));
                                }}
                            >
                                Sélectionner les retards
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            {/* Système d'actions groupées complet */}
            <Box sx={{ mt: 4 }} data-bulk-actions-manager>
                <BulkActionsManager
                    loans={loans}
                    selectedLoans={selectedLoans}
                    onSelectionChange={handleSelectionChange}
                    onLoansUpdate={handleLoansUpdate}
                    maxBulkActions={100}
                    currentUser={currentUser}
                />
            </Box>

            {/* Indicateur de progression */}
            <BulkProgressIndicator
                progress={progressValue}
                step={progressStep}
                isProcessing={showProgress}
                showDetails={true}
            />

            {/* Gestionnaire d'erreurs */}
            <BulkErrorHandler
                open={showErrorDialog}
                error={errorDetails}
                onClose={() => setShowErrorDialog(false)}
                onRetry={() => {
                    setShowErrorDialog(false);
                    console.log('Retry demandé');
                }}
                failedLoans={errorDetails?.failedLoans || []}
                totalProcessed={selectedLoans.size}
                successfulCount={errorDetails ? Math.floor(selectedLoans.size * 0.7) : 0}
                failedCount={errorDetails ? Math.floor(selectedLoans.size * 0.3) : 0}
            />

            {/* Historique */}
            <BulkActionHistory
                open={showHistory}
                onClose={() => setShowHistory(false)}
                loans={loans}
                currentUser={currentUser}
                onExportHistory={(data, format) => {
                    console.log('Export demandé:', format, data);
                }}
            />
        </Box>
    );
};

export default React.memo(BulkActionsDemo);