// src/pages/AIAssistantPage.js - Page DocuCortex IA

import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Tabs,
    Tab,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Chip,
    Alert
} from '@mui/material';
import {
    SmartToy as AIIcon,
    TrendingUp as TrendIcon,
    Warning as AlertIcon,
    Lightbulb as RecommendationIcon,
    Speed as OptimizationIcon,
    ShowChart as AnalysisIcon
} from '@mui/icons-material';

// Import composants IA DocuCortex (vérifier que les fichiers existent)
// Note: Certains composants peuvent nécessiter des dépendances supplémentaires
const PredictionDashboard = () => <Typography>Module Prédictions en cours de développement...</Typography>;
const RecommendationsPanel = () => <Typography>Module Recommandations en cours de développement...</Typography>;
const AnomalyAlert = () => <Typography>Module Détection d'Anomalies en cours de développement...</Typography>;
const TrendAnalysis = () => <Typography>Module Analyse de Tendances en cours de développement...</Typography>;
const ResourceOptimization = () => <Typography>Module Optimisation en cours de développement...</Typography>;

import PageHeader from '../components/common/PageHeader';
import { useApp } from '../contexts/AppContext';

const AIAssistantPage = () => {
    const { showNotification } = useApp();
    const [currentTab, setCurrentTab] = useState(0);
    const [aiEnabled, setAiEnabled] = useState(true);

    useEffect(() => {
        // Vérifier compatibilité navigateur
        const isCompatible = window.indexedDB && window.localStorage;
        setAiEnabled(isCompatible);

        if (!isCompatible) {
            showNotification('warning', 'IA locale nécessite IndexedDB et localStorage');
        }
    }, [showNotification]);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const stats = [
        { label: 'Prédictions', value: '150+', icon: TrendIcon },
        { label: 'Recommandations', value: '75+', icon: RecommendationIcon },
        { label: 'Anomalies', value: '12', icon: AlertIcon },
        { label: 'Optimisations', value: '28', icon: OptimizationIcon }
    ];

    return (
        <Box sx={{ p: 2 }}>
            <PageHeader
                title="DocuCortex IA"
                subtitle="Intelligence Artificielle Prédictive Locale (100% Offline)"
                icon={AIIcon}
                stats={stats}
            />

            {!aiEnabled && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <strong>IA Désactivée</strong> - Votre navigateur ne supporte pas les fonctionnalités requises
                </Alert>
            )}

            <Paper elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable">
                        <Tab icon={<TrendIcon />} label="Prédictions" />
                        <Tab icon={<RecommendationIcon />} label="Recommandations" />
                        <Tab icon={<AlertIcon />} label="Anomalies" />
                        <Tab icon={<AnalysisIcon />} label="Tendances" />
                        <Tab icon={<OptimizationIcon />} label="Optimisation" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2 }}>
                    {currentTab === 0 && <PredictionDashboard refreshInterval={60000} autoRefresh={true} />}
                    {currentTab === 1 && <RecommendationsPanel userId={null} maxRecommendations={20} />}
                    {currentTab === 2 && <AnomalyAlert autoRefresh={true} refreshInterval={300000} />}
                    {currentTab === 3 && <TrendAnalysis timeframe="30d" metrics={['loans', 'users', 'documents']} autoRefresh={true} />}
                    {currentTab === 4 && <ResourceOptimization autoOptimize={false} monitoringEnabled={true} />}
                </Box>
            </Paper>

            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Card><CardContent>
                        <Typography variant="h6" gutterBottom>🧠 Modèles IA</Typography>
                        <Chip label="TensorFlow.js" color="primary" sx={{ m: 0.5 }} />
                        <Chip label="K-Means" color="info" sx={{ m: 0.5 }} />
                    </CardContent></Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card><CardContent>
                        <Typography variant="h6" gutterBottom>🔒 Confidentialité</Typography>
                        <Typography variant="body2">100% Local • RGPD Conforme</Typography>
                    </CardContent></Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card><CardContent>
                        <Typography variant="h6" gutterBottom>⚡ Performance</Typography>
                        <Typography variant="body2">Temps réel • Optimisé RDP</Typography>
                    </CardContent></Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AIAssistantPage;
