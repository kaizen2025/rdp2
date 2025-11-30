// src/components/users/UserProfileEnhancedDemo.js - Démonstration du composant UserProfileEnhanced

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Paper,
    Alert,
    Chip,
    useTheme,
    alpha
} from '@mui/material';
import {
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    Group as GroupIcon,
    Analytics as AnalyticsIcon
} from '@mui/icons-material';

// Composants à démontrer
import UserProfileEnhanced from './UserProfileEnhanced';
import { ModernButton, ModernIconButton } from '../ui/ModernUIComponents';

// Données de démonstration
const DEMO_USERS = [
    {
        id: 1,
        username: 'martin.dupont',
        displayName: 'Martin Dupont',
        email: 'martin.dupont@docucortex.fr',
        phone: '01 23 45 67 89',
        mobile: '06 12 34 56 78',
        department: 'Informatique',
        title: 'Développeur Senior',
        officeLocation: 'Bureau 201 - Site Paris',
        manager: 'Sophie Martin',
        hireDate: '2020-03-15',
        lastLogin: '2025-11-15T08:30:00Z',
        adEnabled: 1,
        server: 'SRV-RDS-01',
        password: 'TempPass123!',
        officePassword: 'OfficePass456!',
        photo: null,
        adGroups: [
            { id: 1, name: 'IT-Admins', description: 'Administrateurs IT', type: 'security' },
            { id: 5, name: 'Tech-Support', description: 'Support Technique', type: 'security' }
        ],
        preferences: {
            language: 'fr',
            timezone: 'Europe/Paris',
            notifications: {
                email: true,
                push: true,
                sms: false
            },
            theme: 'auto',
            compactMode: false
        }
    },
    {
        id: 2,
        username: 'sophie.martin',
        displayName: 'Sophie Martin',
        email: 'sophie.martin@docucortex.fr',
        phone: '01 23 45 67 90',
        mobile: '06 23 45 67 89',
        department: 'Direction',
        title: 'Directrice IT',
        officeLocation: 'Bureau 101 - Direction',
        manager: '',
        hireDate: '2018-01-10',
        lastLogin: '2025-11-15T09:15:00Z',
        adEnabled: 1,
        server: 'SRV-RDS-01',
        password: 'AdminPass789!',
        officePassword: 'AdminOffice123!',
        photo: null,
        adGroups: [
            { id: 1, name: 'IT-Admins', description: 'Administrateurs IT', type: 'security' },
            { id: 2, name: 'Finance-Users', description: 'Utilisateurs Finance', type: 'distribution' }
        ],
        preferences: {
            language: 'fr',
            timezone: 'Europe/Paris',
            notifications: {
                email: true,
                push: true,
                sms: true
            },
            theme: 'dark',
            compactMode: true
        }
    },
    {
        id: 3,
        username: 'jean.bernard',
        displayName: 'Jean Bernard',
        email: 'jean.bernard@docucortex.fr',
        phone: '01 23 45 67 91',
        mobile: '06 34 56 78 90',
        department: 'Finance',
        title: 'Comptable',
        officeLocation: 'Bureau 305 - Site Lyon',
        manager: 'Pierre Dubois',
        hireDate: '2019-06-20',
        lastLogin: '2025-11-14T17:45:00Z',
        adEnabled: 1,
        server: 'SRV-RDS-02',
        password: 'UserPass111!',
        officePassword: 'UserOffice222!',
        photo: null,
        adGroups: [
            { id: 2, name: 'Finance-Users', description: 'Utilisateurs Finance', type: 'distribution' }
        ],
        preferences: {
            language: 'fr',
            timezone: 'Europe/Paris',
            notifications: {
                email: true,
                push: false,
                sms: false
            },
            theme: 'light',
            compactMode: false
        }
    }
];

// Composant de démonstration principal
const UserProfileEnhancedDemo = () => {
    const theme = useTheme();
    const [selectedUser, setSelectedUser] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [demoMode, setDemoMode] = useState('interactive'); // interactive, readonly, batch
    const [saveLog, setSaveLog] = useState([]);

    const handleOpenProfile = (user, mode = 'interactive') => {
        setSelectedUser(user);
        setDemoMode(mode);
        setProfileOpen(true);
    };

    const handleCloseProfile = () => {
        setProfileOpen(false);
        setSelectedUser(null);
    };

    const handleSaveProfile = async (userData, changes) => {
        // Simulation de la sauvegarde
        console.log('Sauvegarde du profil:', { userData, changes });
        
        // Ajouter au log de démonstration
        const logEntry = {
            timestamp: new Date(),
            user: userData.displayName || userData.username,
            changes: Object.keys(changes),
            status: 'success'
        };
        
        setSaveLog(prev => [logEntry, ...prev.slice(0, 4)]); // Garder les 5 dernières entrées
        
        // Simuler un délai d'API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true, message: 'Profil mis à jour avec succès' };
    };

    const renderUserCard = (user, index) => {
        const isAdmin = user.adGroups?.some(group => group.type === 'security');
        
        return (
            <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
            >
                <Card
                    sx={{
                        height: '100%',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
                            borderColor: alpha(theme.palette.primary.main, 0.3)
                        }
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    bgcolor: isAdmin ? theme.palette.error.main : theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem'
                                }}
                            >
                                {(user.displayName || user.username).charAt(0).toUpperCase()}
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    {user.displayName || user.username}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {user.title} • {user.department}
                                </Typography>
                            </Box>
                            
                            {isAdmin && (
                                <Chip
                                    icon={<AdminIcon />}
                                    label="Admin"
                                    color="error"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {user.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {user.phone}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {user.officeLocation}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                size="small"
                                label={`${user.adGroups?.length || 0} groupes`}
                                icon={<GroupIcon />}
                                variant="outlined"
                            />
                            <Chip
                                size="small"
                                label={`Serveur: ${user.server}`}
                                variant="outlined"
                            />
                        </Box>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                        <Grid container spacing={1}>
                            <Grid item xs={12} sm={4}>
                                <ModernButton
                                    size="small"
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => handleOpenProfile(user, 'interactive')}
                                    startIcon={<PersonIcon />}
                                >
                                    Modifier
                                </ModernButton>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                                <ModernButton
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    fullWidth
                                    onClick={() => handleOpenProfile(user, 'readonly')}
                                    startIcon={<AnalyticsIcon />}
                                >
                                    Consulter
                                </ModernButton>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                                <ModernButton
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    fullWidth
                                    onClick={() => handleOpenProfile(user, 'batch')}
                                    startIcon={<AdminIcon />}
                                >
                                    Admin
                                </ModernButton>
                            </Grid>
                        </Grid>
                    </CardActions>
                </Card>
            </motion.div>
        );
    };

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    mb: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderRadius: 3
                }}
            >
                <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                    🏆 UserProfileEnhanced - Démonstration
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                    Composant de profil utilisateur enrichi avec 6 onglets avancés
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                            <Typography variant="h3" fontWeight={700} color="primary.main">
                                6
                            </Typography>
                            <Typography variant="body2">
                                Onglets structurés
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                            <Typography variant="h3" fontWeight={700} color="success.main">
                                ⚡
                            </Typography>
                            <Typography variant="body2">
                                Validation temps réel
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                            <Typography variant="h3" fontWeight={700} color="warning.main">
                                🔍
                            </Typography>
                            <Typography variant="body2">
                                Auto-complétion AD
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                            <Typography variant="h3" fontWeight={700} color="error.main">
                                📸
                            </Typography>
                            <Typography variant="body2">
                                Upload photo profil
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Instructions */}
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>Instructions :</strong> Cliquez sur les boutons des cartes utilisateur pour ouvrir le profil enrichi.
                        Vous pouvez tester différents modes : Modification, Consultation seule, et Administration.
                        Le composant intègre l'API DocuCortex avec validation intelligente et animations Framer Motion.
                    </Typography>
                </Alert>
            </Paper>

            {/* Cartes utilisateur */}
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                Utilisateurs de démonstration
            </Typography>

            <Grid container spacing={3}>
                {DEMO_USERS.map((user, index) => (
                    <Grid item xs={12} sm={6} md={4} key={user.id}>
                        {renderUserCard(user, index)}
                    </Grid>
                ))}
            </Grid>

            {/* Log de sauvegarde */}
            {saveLog.length > 0 && (
                <Paper elevation={0} sx={{ mt: 4, p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        📝 Log de démonstration (5 dernières actions)
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {saveLog.map((entry, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {entry.user}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {entry.timestamp.toLocaleTimeString()}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Modifications : {entry.changes.join(', ') || 'Aucune'}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={entry.status}
                                    color="success"
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Caractéristiques détaillées */}
            <Paper elevation={0} sx={{ mt: 4, p: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                    ✨ Caractéristiques détaillées du composant
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                                📊 6 Onglets structurés
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                <li><strong>Informations générales :</strong> Données personnelles, photo profil, contact</li>
                                <li><strong>Groupes AD :</strong> Auto-complétion intelligente, gestion des groupes</li>
                                <li><strong>Historique activités :</strong> Timeline des actions utilisateur</li>
                                <li><strong>Statistiques usage :</strong> Métriques et graphiques d'utilisation</li>
                                <li><strong>Préférences :</strong> Paramètres personnalisables, notifications</li>
                                <li><strong>Audit trail :</strong> Traçabilité complète et conformité</li>
                            </ul>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'success.main' }}>
                                🔧 Fonctionnalités avancées
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                <li><strong>Validation temps réel :</strong> Email, téléphone, formats</li>
                                <li><strong>Auto-complétion AD :</strong> Recherche intelligente des groupes</li>
                                <li><strong>Upload photo :</strong> Preview, validation, gestion</li>
                                <li><strong>Mode édition/lecture :</strong> Adaptation selon le contexte</li>
                                <li><strong>Animations fluides :</strong> Framer Motion optimisé</li>
                                <li><strong>Intégration API :</strong> apiService.js DocuCortex</li>
                            </ul>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'warning.main' }}>
                        🎨 Interface utilisateur moderne
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Le composant utilise Material-UI v5 avec des animations Framer Motion pour une expérience utilisateur fluide.
                        Design responsive, validation intelligente, et interface adaptative selon le mode d'utilisation.
                    </Typography>
                </Box>
            </Paper>

            {/* Composant de profil */}
            {selectedUser && (
                <UserProfileEnhanced
                    open={profileOpen}
                    onClose={handleCloseProfile}
                    user={selectedUser}
                    onSave={handleSaveProfile}
                    readOnly={demoMode === 'readonly'}
                />
            )}
        </Box>
    );
};

export default UserProfileEnhancedDemo;