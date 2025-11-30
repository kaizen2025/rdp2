// src/components/users/UserInfoDialogEnhanced.js - Modal utilisateur moderne avec métriques et historique

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Chip,
    Avatar,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tab,
    Tabs,
    Paper,
    LinearProgress,
    Button,
    Tooltip,
    Fade,
    useTheme,
    alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Work as WorkIcon,
    Computer as ComputerIcon,
    PhoneIphone as PhoneIcon,
    Security as SecurityIcon,
    Dashboard as DashboardIcon,
    Edit as EditIcon,
    Print as PrintIcon,
    ContentCopy as ContentCopyIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Close as CloseIcon,
    AccessTime as AccessTimeIcon,
    VpnKey as VpnKeyIcon,
    Language as LanguageIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Timeline as TimelineIcon,
    Analytics as AnalyticsIcon
} from '@mui/icons-material';

// Composants UI modernes
import { ModernButton, ModernIconButton } from '../ui/ModernUIComponents';

// Hooks et services
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import UserColorManagerOptimized, { UserColorBadgeOptimized } from './UserColorManagerOptimized';

// Configuration des onglets
const TAB_PANELS = [
    { id: 'overview', label: 'Aperçu', icon: <PersonIcon /> },
    { id: 'equipment', label: 'Équipements', icon: <ComputerIcon /> },
    { id: 'security', label: 'Sécurité', icon: <SecurityIcon /> },
    { id: 'activity', label: 'Activité', icon: <TimelineIcon /> }
];

// Variantes d'animation
const dialogVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        transition: {
            duration: 0.2
        }
    }
};

const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.3,
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.2 }
    }
};

// Composant InfoRow amélioré
const InfoRow = React.memo(({ 
    label, 
    value, 
    isPassword = false, 
    isEmail = false,
    isUrl = false,
    copyable = true,
    sensitive = false,
    icon = null,
    onCopy,
    ...props 
}) => {
    const theme = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        if (value && copyable) {
            try {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                if (onCopy) onCopy(value);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error('Erreur lors de la copie:', error);
            }
        }
    }, [value, copyable, onCopy]);

    const getDisplayValue = () => {
        if (isPassword && !showPassword) {
            return '••••••••';
        }
        return value || '-';
    };

    const getFieldIcon = () => {
        if (isEmail) return <EmailIcon />;
        if (isUrl) return <DashboardIcon />;
        return icon;
    };

    return (
        <motion.div variants={itemVariants}>
            <Grid container item xs={12} alignItems="center" sx={{ mb: 2 }} {...props}>
                <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFieldIcon() && (
                            <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                                {getFieldIcon()}
                            </Box>
                        )}
                        <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                            {label}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                fontFamily: 'monospace',
                                bgcolor: sensitive ? alpha(theme.palette.warning.main, 0.1) : 'transparent',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                border: sensitive ? `1px solid ${alpha(theme.palette.warning.main, 0.3)}` : 'none'
                            }}
                        >
                            {getDisplayValue()}
                        </Typography>
                        
                        {value && copyable && (
                            <Tooltip title={copied ? 'Copié !' : 'Copier'}>
                                <IconButton 
                                    onClick={handleCopy} 
                                    size="small" 
                                    disabled={!value}
                                    sx={{
                                        color: copied ? 'success.main' : 'text.secondary',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <ContentCopyIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                        )}
                        
                        {isPassword && value && (
                            <Tooltip title={showPassword ? 'Masquer' : 'Afficher'}>
                                <IconButton 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    size="small"
                                    sx={{ color: 'text.secondary' }}
                                >
                                    {showPassword ? <VisibilityOffIcon fontSize="inherit" /> : <VisibilityIcon fontSize="inherit" />}
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </motion.div>
    );
});

InfoRow.displayName = 'InfoRow';

// Composant principal du dialogue
const UserInfoDialogEnhanced = React.memo(({ 
    open, 
    onClose, 
    user,
    userLoans = { phoneLoans: [], computerLoans: [] },
    onEdit,
    onPrint,
    onManageEquipment 
}) => {
    const theme = useTheme();
    const { showNotification } = useApp();
    const [activeTab, setActiveTab] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [userActivity, setUserActivity] = useState([]);
    const [securityMetrics, setSecurityMetrics] = useState({});

    // Données enrichies de l'utilisateur
    const userData = useMemo(() => {
        if (!user) return null;

        const adStatus = user.adEnabled === 1 ? 'enabled' : user.adEnabled === 0 ? 'disabled' : 'unknown';
        const phoneLoans = userLoans.phoneLoans?.filter(loan => loan.userId === user.username) || [];
        const computerLoans = userLoans.computerLoans?.filter(loan => loan.userId === user.username) || [];
        
        return {
            ...user,
            adStatus,
            phoneLoans,
            computerLoans,
            hasActiveLoans: phoneLoans.length > 0 || computerLoans.length > 0,
            totalEquipment: phoneLoans.length + computerLoans.length
        };
    }, [user, userLoans]);

    // Gestionnaire de couleurs optimisé
    const { getUserColor } = UserColorManagerOptimized.useUserColorManagerOptimized([userData], {
        accessibility: 'AA',
        includeVariants: true
    });
    const userColor = getUserColor(userData?.username, userData?.username);

    // Chargement des données d'activité
    useEffect(() => {
        if (open && userData) {
            loadUserActivity();
            loadSecurityMetrics();
        }
    }, [open, userData]);

    const loadUserActivity = async () => {
        if (!userData) return;
        
        setIsLoading(true);
        try {
            // Simuler le chargement de l'historique d'activité
            const activity = [
                {
                    id: 1,
                    type: 'login',
                    description: 'Connexion au domaine',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    icon: <CheckCircleIcon />
                },
                {
                    id: 2,
                    type: 'equipment',
                    description: 'Attribution d\'un téléphone',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    icon: <PhoneIcon />
                },
                {
                    id: 3,
                    type: 'security',
                    description: 'Changement de mot de passe',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                    icon: <SecurityIcon />
                }
            ];
            setUserActivity(activity);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'activité:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSecurityMetrics = async () => {
        if (!userData) return;
        
        try {
            // Simuler les métriques de sécurité
            const metrics = {
                lastPasswordChange: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                failedLoginAttempts: 0,
                accountLocked: false,
                mfaEnabled: true,
                securityScore: 85
            };
            setSecurityMetrics(metrics);
        } catch (error) {
            console.error('Erreur lors du chargement des métriques:', error);
        }
    };

    // Gestion de la fermeture optimisée
    const handleClose = useCallback(() => {
        setActiveTab(0);
        setUserActivity([]);
        setSecurityMetrics({});
        onClose();
    }, [onClose]);

    // Actions rapides
    const handleQuickAction = useCallback(async (action) => {
        if (!userData) return;

        try {
            switch (action) {
                case 'edit':
                    if (onEdit) onEdit(userData);
                    break;
                case 'print':
                    if (onPrint) onPrint(userData);
                    break;
                case 'manage-phone':
                    if (onManageEquipment) onManageEquipment(userData, 'phone');
                    break;
                case 'manage-computer':
                    if (onManageEquipment) onManageEquipment(userData, 'computer');
                    break;
            }
            showNotification('success', `Action "${action}" exécutée`);
        } catch (error) {
            showNotification('error', `Erreur: ${error.message}`);
        }
    }, [userData, onEdit, onPrint, onManageEquipment, showNotification]);

    if (!userData) return null;

    // Rendu de l'onglet Aperçu
    const renderOverviewTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={3}>
                {/* Informations de base */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: userColor.color,
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    boxShadow: `0 4px 12px ${alpha(userColor.color, 0.3)}`
                                }}
                            >
                                {userData.displayName?.charAt(0).toUpperCase() || 'U'}
                            </Avatar>
                            
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                                    {userData.displayName}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                    {userData.username}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={userData.adStatus === 'enabled' ? <CheckCircleIcon /> : <ErrorIcon />}
                                        label={userData.adStatus === 'enabled' ? 'AD Activé' : userData.adStatus === 'disabled' ? 'AD Désactivé' : 'Statut Inconnu'}
                                        color={userData.adStatus === 'enabled' ? 'success' : userData.adStatus === 'disabled' ? 'error' : 'warning'}
                                        variant="outlined"
                                    />
                                    
                                    {userData.hasActiveLoans && (
                                        <Chip
                                            icon={<PhoneIcon />}
                                            label={`${userData.totalEquipment} équipement(s)`}
                                            color="info"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Informations détaillées */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                            Informations Générales
                        </Typography>
                        
                        <Grid container spacing={0}>
                            <InfoRow 
                                label="Nom d'utilisateur" 
                                value={userData.username} 
                                icon={<PersonIcon />}
                                copyable 
                            />
                            <InfoRow 
                                label="Nom complet" 
                                value={userData.displayName} 
                                icon={<PersonIcon />}
                                copyable 
                            />
                            <InfoRow 
                                label="Service" 
                                value={userData.department} 
                                icon={<WorkIcon />}
                            />
                            <InfoRow 
                                label="Email" 
                                value={userData.email} 
                                isEmail
                                copyable 
                            />
                            <InfoRow 
                                label="Serveur RDS" 
                                value={userData.server} 
                                icon={<DashboardIcon />}
                                copyable 
                            />
                            <InfoRow 
                                label="Mot de passe Windows" 
                                value={userData.password} 
                                isPassword
                                sensitive
                                copyable 
                            />
                            <InfoRow 
                                label="Mot de passe Office" 
                                value={userData.officePassword} 
                                isPassword
                                sensitive
                                copyable 
                            />
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // Rendu de l'onglet Équipements
    const renderEquipmentTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Gestion des Équipements
                        </Typography>
                        
                        {/* Statistiques des équipements */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Box
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <PhoneIcon color="primary" />
                                    <Typography variant="h6" fontWeight={700}>
                                        {userData.phoneLoans.length}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Téléphones
                                </Typography>
                            </Box>
                            
                            <Box
                                sx={{
                                    flex: 1,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <ComputerIcon color="secondary" />
                                    <Typography variant="h6" fontWeight={700}>
                                        {userData.computerLoans.length}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Ordinateurs
                                </Typography>
                            </Box>
                        </Box>
                        
                        {/* Actions rapides */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <ModernButton
                                size="small"
                                variant="outlined"
                                startIcon={<PhoneIcon />}
                                onClick={() => handleQuickAction('manage-phone')}
                            >
                                Gérer Téléphones
                            </ModernButton>
                            <ModernButton
                                size="small"
                                variant="outlined"
                                startIcon={<ComputerIcon />}
                                onClick={() => handleQuickAction('manage-computer')}
                            >
                                Gérer Ordinateurs
                            </ModernButton>
                        </Box>
                        
                        {/* Liste des équipements */}
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                            Équipements Actifs ({userData.totalEquipment})
                        </Typography>
                        
                        <List>
                            {[...userData.phoneLoans, ...userData.computerLoans].map((loan, index) => (
                                <ListItem key={index} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 1, mb: 1 }}>
                                    <ListItemIcon>
                                        {loan.type === 'phone' ? <PhoneIcon color="primary" /> : <ComputerIcon color="secondary" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={loan.device || 'Équipement'}
                                        secondary={`Type: ${loan.type} • Attribué le: ${new Date(loan.assignedDate).toLocaleDateString()}`}
                                    />
                                    <Chip
                                        size="small"
                                        label={loan.status || 'Actif'}
                                        color={loan.status === 'active' ? 'success' : 'warning'}
                                        variant="outlined"
                                    />
                                </ListItem>
                            ))}
                            
                            {userData.totalEquipment === 0 && (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                    <Typography variant="body1">
                                        Aucun équipement attribué
                                    </Typography>
                                </Box>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // Rendu de l'onglet Sécurité
    const renderSecurityTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Métriques de Sécurité
                        </Typography>
                        
                        {/* Score de sécurité */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Score de Sécurité
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="primary.main">
                                    {securityMetrics.securityScore}/100
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={securityMetrics.securityScore}
                                color={securityMetrics.securityScore >= 80 ? 'success' : securityMetrics.securityScore >= 60 ? 'warning' : 'error'}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>
                        
                        {/* Indicateurs de sécurité */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Box sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 1, textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight={700} color="success.main">
                                        {securityMetrics.mfaEnabled ? 'Activé' : 'Désactivé'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        MFA
                                    </Typography>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={6}>
                                <Box sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 1, textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight={700} color={securityMetrics.failedLoginAttempts === 0 ? 'success.main' : 'warning.main'}>
                                        {securityMetrics.failedLoginAttempts}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Échecs de Connexion
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        
                        {/* Informations de sécurité */}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                Détails de Sécurité
                            </Typography>
                            
                            <InfoRow 
                                label="Dernier changement MDP" 
                                value={securityMetrics.lastPasswordChange?.toLocaleDateString()} 
                                icon={<AccessTimeIcon />}
                            />
                            <InfoRow 
                                label="Compte verrouillé" 
                                value={securityMetrics.accountLocked ? 'Oui' : 'Non'} 
                                icon={<SecurityIcon />}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // Rendu de l'onglet Activité
    const renderActivityTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Historique d'Activité
                        </Typography>
                        
                        {isLoading ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">
                                    Chargement de l'historique...
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {userActivity.map((activity) => (
                                    <ListItem key={activity.id} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 1, mb: 1 }}>
                                        <ListItemIcon>
                                            <Box sx={{ color: 'primary.main' }}>
                                                {activity.icon}
                                            </Box>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={activity.description}
                                            secondary={activity.timestamp.toLocaleString()}
                                        />
                                    </ListItem>
                                ))}
                                
                                {userActivity.length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                        <Typography variant="body1">
                                            Aucune activité récente
                                        </Typography>
                                    </Box>
                                )}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // Rendu du contenu selon l'onglet actif
    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return renderOverviewTab();
            case 1:
                return renderEquipmentTab();
            case 2:
                return renderSecurityTab();
            case 3:
                return renderActivityTab();
            default:
                return renderOverviewTab();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh'
                }
            }}
            TransitionComponent={motion.div}
        >
            {/* Header */}
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                pb: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <UserColorBadgeOptimized
                        userId={userData.username}
                        userName={userData.username}
                        displayName={userData.displayName}
                        size="medium"
                        palette="primary"
                    />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Modifier">
                        <ModernIconButton
                            size="small"
                            onClick={() => handleQuickAction('edit')}
                            color="primary"
                        >
                            <EditIcon />
                        </ModernIconButton>
                    </Tooltip>
                    
                    <Tooltip title="Imprimer">
                        <ModernIconButton
                            size="small"
                            onClick={() => handleQuickAction('print')}
                            color="info"
                        >
                            <PrintIcon />
                        </ModernIconButton>
                    </Tooltip>
                    
                    <Tooltip title="Fermer">
                        <ModernIconButton
                            size="small"
                            onClick={handleClose}
                            color="inherit"
                        >
                            <CloseIcon />
                        </ModernIconButton>
                    </Tooltip>
                </Box>
            </DialogTitle>

            {/* Navigation par onglets */}
            <Box sx={{ px: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': {
                            minWidth: 120,
                            textTransform: 'none',
                            fontWeight: 500
                        }
                    }}
                >
                    {TAB_PANELS.map((panel) => (
                        <Tab
                            key={panel.id}
                            icon={panel.icon}
                            label={panel.label}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>
            </Box>

            <Divider />

            {/* Contenu */}
            <DialogContent sx={{ p: 3, overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </DialogContent>

            <Divider />

            {/* Actions */}
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose}>
                    Fermer
                </Button>
                <ModernButton
                    variant="contained"
                    onClick={() => handleQuickAction('edit')}
                    startIcon={<EditIcon />}
                >
                    Modifier
                </ModernButton>
            </DialogActions>
        </Dialog>
    );
});

UserInfoDialogEnhanced.displayName = 'UserInfoDialogEnhanced';

export default UserInfoDialogEnhanced;
