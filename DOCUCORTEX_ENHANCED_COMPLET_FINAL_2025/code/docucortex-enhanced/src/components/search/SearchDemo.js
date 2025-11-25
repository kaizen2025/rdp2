// src/components/search/SearchDemo.js - DÉMONSTRATION COMPLÈTE DU SYSTÈME DE RECHERCHE
// Page de démonstration pour tester toutes les fonctionnalités

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    PlayArrow as DemoIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    History as HistoryIcon,
    Analytics as AnalyticsIcon,
    Speed as SpeedIcon,
    Code as CodeIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Import des composants de recherche
import { 
    AdvancedSearchContainer, 
    SearchBar, 
    SearchFilters, 
    SearchResults, 
    SearchHistory,
    SearchDemo as SearchDemoComponent,
    useSmartSearch,
    searchService 
} from './index';

// Données de démonstration réalistes
const DEMO_DATA = [
    {
        id: 'loan-001',
        documentTitle: 'Contrat de Location - Bureau Principal',
        documentType: 'Contrat',
        borrowerName: 'Jean Dupont',
        borrowerEmail: 'jean.dupont@entreprise.com',
        borrowerId: 'user-001',
        status: 'active',
        loanDate: '2025-11-01T09:00:00Z',
        returnDate: '2025-11-15T18:00:00Z',
        notes: 'Contrat urgent pour nouvelle succursale - Traitement prioritaire',
        alertLevel: 'medium'
    },
    {
        id: 'loan-002',
        documentTitle: 'Facture Maintenance Serveur Dell',
        documentType: 'Facture',
        borrowerName: 'Marie Martin',
        borrowerEmail: 'marie.martin@techcorp.fr',
        borrowerId: 'user-002',
        status: 'overdue',
        loanDate: '2025-10-25T14:30:00Z',
        returnDate: '2025-11-08T17:00:00Z',
        notes: 'Facture critique à transmettre en comptabilité',
        alertLevel: 'high'
    },
    {
        id: 'loan-003',
        documentTitle: 'Manuel Utilisateur - Logiciel CRM',
        documentType: 'Manuel',
        borrowerName: 'Pierre Dubois',
        borrowerEmail: 'pierre.dubois@startup.io',
        borrowerId: 'user-003',
        status: 'returned',
        loanDate: '2025-10-20T10:15:00Z',
        returnDate: '2025-11-03T16:00:00Z',
        notes: 'Document technique pour formation équipe',
        alertLevel: 'low'
    },
    {
        id: 'loan-004',
        documentTitle: 'Rapport Annuel 2024',
        documentType: 'Rapport',
        borrowerName: 'Sophie Leroy',
        borrowerEmail: 'sophie.leroy@finance.fr',
        borrowerId: 'user-004',
        status: 'critical',
        loanDate: '2025-11-10T08:00:00Z',
        returnDate: '2025-11-12T12:00:00Z',
        notes: 'URGENT: Présentation conseil d\'administration demain',
        alertLevel: 'critical'
    },
    {
        id: 'loan-005',
        documentTitle: 'Cahier des Charges - Refonte Site Web',
        documentType: 'Spécification',
        borrowerName: 'Antoine Moreau',
        borrowerEmail: 'antoine.moreau@agence.com',
        borrowerId: 'user-005',
        status: 'reserved',
        loanDate: '2025-11-12T11:00:00Z',
        returnDate: '2025-11-20T17:00:00Z',
        notes: 'Spécifications détaillées pour développement',
        alertLevel: 'medium'
    },
    {
        id: 'loan-006',
        documentTitle: 'Guide Sécurité - Protocoles GDPR',
        documentType: 'Guide',
        borrowerName: 'Claire Bernard',
        borrowerEmail: 'claire.bernard@legal.com',
        borrowerId: 'user-006',
        status: 'active',
        loanDate: '2025-11-08T13:45:00Z',
        returnDate: '2025-11-25T18:00:00Z',
        notes: 'Mise en conformité RGPD à finaliser',
        alertLevel: 'low'
    },
    {
        id: 'loan-007',
        documentTitle: 'Devis - Installation Réseau',
        documentType: 'Devis',
        borrowerName: 'Thomas Petit',
        borrowerEmail: 'thomas.petit@networks.fr',
        borrowerId: 'user-007',
        status: 'overdue',
        loanDate: '2025-10-28T15:20:00Z',
        returnDate: '2025-11-05T16:30:00Z',
        notes: 'Devis à valider pour budget Q4',
        alertLevel: 'high'
    },
    {
        id: 'loan-008',
        documentTitle: 'Convention Partenariat - Société ABC',
        documentType: 'Convention',
        borrowerName: 'Isabelle Roux',
        borrowerEmail: 'isabelle.roux@partnerships.eu',
        borrowerId: 'user-008',
        status: 'active',
        loanDate: '2025-11-05T09:30:00Z',
        returnDate: '2025-11-18T17:00:00Z',
        notes: 'Partenariat stratégique en cours de négociation',
        alertLevel: 'medium'
    }
];

const SearchDemo = () => {
    const [currentView, setCurrentView] = useState('overview');
    const [demoData] = useState(DEMO_DATA);
    const [searchStats, setSearchStats] = useState(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Initialisation du service de recherche pour la démo
    useEffect(() => {
        const initializeDemo = async () => {
            try {
                await searchService.initialize(demoData);
                const stats = searchService.getServiceStats();
                setSearchStats(stats);
                console.log('Service de recherche de démonstration initialisé');
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de la démo:', error);
            }
        };

        initializeDemo();
    }, [demoData]);

    // Composant de vue d'ensemble
    const OverviewView = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Typography variant="h3" gutterBottom align="center" color="primary">
                🔍 Système de Recherche Intelligente DocuCortex
            </Typography>
            
            <Typography variant="h6" align="center" color="text.secondary" paragraph>
                Découvrez toutes les fonctionnalités avancées de recherche pour naviguer efficacement 
                dans vos milliers de prêts et documents
            </Typography>

            <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SearchIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                                <Typography variant="h5">Recherche Intelligente</Typography>
                            </Box>
                            <Typography variant="body1" paragraph>
                                Recherche full-text avec autocomplétion, fuzzy search et suggestions contextuelles.
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Recherche floue tolérante aux fautes" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Autocomplétion prédictive" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Score de pertinence en temps réel" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <FilterIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                                <Typography variant="h5">Filtres Avancés</Typography>
                            </Box>
                            <Typography variant="body1" paragraph>
                                Filtres intelligents avec sauvegarde et combinaisons puissantes.
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Filtres par date, statut, utilisateur" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Filtres sauvegardés et nommés" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Reset rapide et contextuel" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <HistoryIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                                <Typography variant="h5">Historique Persistant</Typography>
                            </Box>
                            <Typography variant="body1" paragraph>
                                Historique intelligent avec analytics et actions rapides.
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Historique persistant en localStorage" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Statistiques de recherche" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Recherches fréquemment utilisées" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SpeedIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                                <Typography variant="h5">Performance Optimisée</Typography>
                            </Box>
                            <Typography variant="body1" paragraph>
                                Cache intelligent, indexation optimisée et recherche en temps réel.
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Cache avec TTL configurable" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Index Fuse.js + Lunr.js" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Métriques de performance" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<DemoIcon />}
                    onClick={() => setCurrentView('demo')}
                    sx={{ mr: 2, mb: isMobile ? 2 : 0 }}
                >
                    Tester la Démonstration
                </Button>
                
                <Button
                    variant="outlined"
                    size="large"
                    startIcon={<CodeIcon />}
                    onClick={() => setCurrentView('implementation')}
                >
                    Voir l'Implémentation
                </Button>
            </Box>

            {searchStats && (
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>Service initialisé :</strong> {searchStats.index.documentsIndexed} documents indexés 
                        en {searchStats.index.buildTime.toFixed(2)}ms 
                        | Cache: {searchStats.cache.hitRate}% de hits 
                        | Historique: {searchStats.history.count} recherches
                    </Typography>
                </Alert>
            )}
        </motion.div>
    );

    // Composant de démonstration interactive
    const DemoView = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <Box sx={{ mb: 3 }}>
                <Button 
                    variant="outlined" 
                    onClick={() => setCurrentView('overview')}
                    sx={{ mb: 2 }}
                >
                    ← Retour à la vue d'ensemble
                </Button>
            </Box>

            <AdvancedSearchContainer
                data={demoData}
                drawerPosition="right"
                drawerWidth={isMobile ? '100vw' : 700}
                showHistory={true}
                showFilters={true}
                showAnalytics={true}
                autoOpen={true}
                className="demo-search-container"
            />
        </motion.div>
    );

    // Composant de vue implémentation
    const ImplementationView = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Typography variant="h3" gutterBottom>
                💻 Guide d'Implémentation
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">1. Installation et Setup</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography paragraph>
                                Ajoutez les dépendances nécessaires à votre projet :
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace' }}>
                                npm install fuse.js lunr react-highlight-words
                            </Paper>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                <Grid item xs={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">2. Intégration de Base</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography paragraph>
                                Utilisez le container principal de recherche :
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                {`import { AdvancedSearchContainer } from './components/search';

function MyComponent() {
  return (
    <AdvancedSearchContainer
      data={loans}
      onResultSelect={(result) => console.log(result)}
      drawerPosition="right"
      showHistory={true}
      showFilters={true}
    />
  );
}`}
                            </Paper>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                <Grid item xs={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">3. Hook de Recherche Avancée</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography paragraph>
                                Pour un contrôle plus granulaire, utilisez le hook useSmartSearch :
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                {`const smartSearch = useSmartSearch(data, {
  enableFuzzySearch: true,
  enableAutoComplete: true,
  enableHistory: true,
  debounceMs: 300,
  maxResults: 200
});

// Utilisation
smartSearch.search('terme de recherche');
smartSearch.updateFilters({ status: 'active' });`}
                            </Paper>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                <Grid item xs={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">4. Configuration Avancée</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography paragraph>
                                Personnalisez le comportement du système :
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                {`// Configuration du service
await searchService.initialize(data, {
  cacheSize: 1000,
  cacheTTL: 600000,
  enableMetrics: true
});

// Personnalisation des composants
<SearchBar 
  placeholder="Recherche personnalisée..."
  suggestions={customSuggestions}
  recentSearches={customHistory}
/>`}
                            </Paper>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                <Grid item xs={12}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">5. Performance et Optimisation</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography paragraph>
                                Conseils pour optimiser les performances :
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                    <ListItemText primary="Augmentez le debounce pour réduire les requêtes" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                    <ListItemText primary="Configurez une taille de cache appropriée" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                    <ListItemText primary="Utilisez la pagination pour de gros datasets" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                    <ListItemText primary="Monitorez les métriques de performance" />
                                </ListItem>
                            </List>
                        </AccordionDetails>
                    </Accordion>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button 
                    variant="contained" 
                    onClick={() => setCurrentView('demo')}
                    size="large"
                >
                    Retour à la Démonstration
                </Button>
            </Box>
        </motion.div>
    );

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {currentView === 'overview' && <OverviewView />}
            {currentView === 'demo' && <DemoView />}
            {currentView === 'implementation' && <ImplementationView />}
        </Container>
    );
};

export default SearchDemo;
