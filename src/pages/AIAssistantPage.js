/**
 * Page principale de l'Assistant IA - DocuCortex
 * VERSION SIMPLIFIÉE ET PROFESSIONNELLE
 * ✅ Interface unique focalisée sur le chat avec Ollama/Llama
 * ✅ Upload de documents intégré dans le chat (à venir)
 * ✅ Statistiques simples en haut
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Grid,
    Alert
} from '@mui/material';
import {
    SmartToy as BotIcon,
    Description as DocumentIcon,
    Chat as ChatIcon,
    Analytics as AnalyticsIcon
} from '@mui/icons-material';

// Composant principal
import ChatInterfaceDocuCortex from '../components/AI/ChatInterfaceDocuCortex';
import apiService from '../services/apiService';

const AIAssistantPage = () => {
    // États simplifiés
    const [statistics, setStatistics] = useState(null);
    const [error, setError] = useState(null);

    // Session de chat unique
    const [docuSessionId] = useState(() => {
        const stored = localStorage.getItem('docucortex_session_id');
        if (stored) return stored;
        const newId = `docu_${Date.now()}`;
        localStorage.setItem('docucortex_session_id', newId);
        return newId;
    });

    // Charger les statistiques au démarrage
    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            const data = await apiService.getAIStatistics();
            if (data.success) {
                setStatistics(data);
            }
        } catch (error) {
            console.error('Erreur chargement statistiques:', error);
            // Ne pas afficher d'erreur si les stats ne chargent pas
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3, overflow: 'hidden' }}>
            {/* En-tête DocuCortex - Design épuré et professionnel */}
            <Box sx={{
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BotIcon sx={{ fontSize: 56, mr: 2, opacity: 0.9 }} />
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            DocuCortex IA
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AnalyticsIcon sx={{ fontSize: 16 }} />
                            Assistant documentaire intelligent • Powered by Ollama/Llama 3.2 3B
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Affichage des erreurs */}
            {error && (
                <Alert
                    severity="error"
                    onClose={() => setError(null)}
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

            {/* Statistiques rapides - Compactes et élégantes */}
            {statistics && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={2} sx={{
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)' }
                        }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <DocumentIcon sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                                    {statistics.database?.totalDocuments || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Documents Indexés
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={2} sx={{
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)' }
                        }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <ChatIcon sx={{ fontSize: 32, color: '#764ba2', mb: 1 }} />
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#764ba2' }}>
                                    {statistics.database?.totalConversations || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Conversations
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={2} sx={{
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)' }
                        }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <AnalyticsIcon sx={{ fontSize: 32, color: '#f59e0b', mb: 1 }} />
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f59e0b' }}>
                                    {statistics.database?.totalChunks || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Chunks de Texte
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={2} sx={{
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)' }
                        }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <BotIcon sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                                    {statistics.sessions?.activeSessions || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Sessions Actives
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Interface de Chat - Pleine hauteur disponible */}
            <Paper
                elevation={3}
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: 2
                }}
            >
                <ChatInterfaceDocuCortex
                    sessionId={docuSessionId}
                    onMessageSent={(data) => {
                        // Rafraîchir les statistiques après un message
                        loadStatistics();
                    }}
                />
            </Paper>
        </Box>
    );
};

export default AIAssistantPage;
