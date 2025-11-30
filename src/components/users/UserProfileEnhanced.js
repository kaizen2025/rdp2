// src/components/users/UserProfileEnhanced.js - Profil utilisateur enrichi avec onglets avancés
// Composant moderne avec 6 onglets, validation temps réel, auto-complétion AD, upload photo

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
    alpha,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Card,
    CardContent,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
    Alert,
    Snackbar,
    Badge,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Autocomplete,
    Switch as SwitchIcon,
    Dialog as UploadDialog,
    Slider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Group as GroupIcon,
    Timeline as TimelineIcon,
    Analytics as AnalyticsIcon,
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    PhotoCamera as PhotoCameraIcon,
    Upload as UploadIcon,
    Clear as ClearIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    History as HistoryIcon,
    TrendingUp as TrendingUpIcon,
    AccessTime as AccessTimeIcon,
    VerifiedUser as VerifiedUserIcon,
    Backup as BackupIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    GroupAdd as GroupAddIcon,
    AdminPanelSettings as AdminIcon,
    AttachFile as AttachFileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon
} from '@mui/icons-material';

// Composants UI modernes
import { ModernButton, ModernIconButton } from '../ui/ModernUIComponents';

// Hooks et services
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import UserColorManagerOptimized, { UserColorBadgeOptimized } from './UserColorManagerOptimized';

// Configuration des onglets
const TAB_PANELS = [
    { 
        id: 'general', 
        label: 'Informations générales', 
        icon: <PersonIcon />,
        description: 'Données personnelles et contact'
    },
    { 
        id: 'adgroups', 
        label: 'Groupes AD', 
        icon: <GroupIcon />,
        description: 'Gestion des groupes Active Directory'
    },
    { 
        id: 'activity', 
        label: 'Historique activités', 
        icon: <TimelineIcon />,
        description: 'Journal des actions et événements'
    },
    { 
        id: 'usage', 
        label: 'Statistiques usage', 
        icon: <AnalyticsIcon />,
        description: 'Métriques d\'utilisation et performance'
    },
    { 
        id: 'preferences', 
        label: 'Préférences', 
        icon: <SettingsIcon />,
        description: 'Paramètres utilisateur et personnalisés'
    },
    { 
        id: 'audit', 
        label: 'Audit trail', 
        icon: <SecurityIcon />,
        description: 'Traçabilité et conformité'
    }
];

// Variantes d'animation
const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: {
            duration: 0.3
        }
    }
};

const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            staggerChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: {
            duration: 0.3
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { 
            duration: 0.3,
            ease: 'easeOut'
        }
    }
};

// Composants de validation intelligente
const FormField = React.memo(({ 
    label, 
    value, 
    onChange, 
    error, 
    helperText, 
    type = 'text',
    required = false,
    disabled = false,
    multiline = false,
    rows = 1,
    icon = null,
    validation = null,
    ...props 
}) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isValid, setIsValid] = useState(true);
    const [validationMessage, setValidationMessage] = useState('');

    // Validation en temps réel
    useEffect(() => {
        if (validation && localValue) {
            const result = validation(localValue);
            setIsValid(result.isValid);
            setValidationMessage(result.message);
        } else {
            setIsValid(true);
            setValidationMessage('');
        }
    }, [localValue, validation]);

    // Synchroniser avec la valeur externe
    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value || '');
        }
    }, [value]);

    const handleChange = useCallback((event) => {
        const newValue = event.target.value;
        setLocalValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    }, [onChange]);

    const hasError = error || (!isValid && validationMessage);

    return (
        <TextField
            {...props}
            label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon && <Box sx={{ display: 'flex', color: 'text.secondary' }}>{icon}</Box>}
                    <span>{label}{required && <span style={{ color: 'error.main' }}>*</span>}</span>
                </Box>
            }
            value={localValue}
            onChange={handleChange}
            error={hasError}
            helperText={hasError ? (error || validationMessage) : helperText}
            type={type}
            required={required}
            disabled={disabled}
            multiline={multiline}
            rows={rows}
            fullWidth
            variant="outlined"
            size="medium"
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                        borderWidth: 2,
                        borderColor: isValid ? 'primary.main' : 'error.main'
                    }
                }
            }}
        />
    );
});

FormField.displayName = 'FormField';

// Composant d'upload de photo avec preview
const ProfilePhotoUpload = React.memo(({ 
    currentPhoto, 
    onPhotoChange, 
    disabled = false 
}) => {
    const [preview, setPreview] = useState(currentPhoto);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setPreview(currentPhoto);
    }, [currentPhoto]);

    const handleFileSelect = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validation du fichier
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image valide');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            alert('La taille de l\'image ne doit pas dépasser 5MB');
            return;
        }

        setUploading(true);
        try {
            // Créer un preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
            };
            reader.readAsDataURL(file);

            // Simuler l'upload
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (onPhotoChange) {
                onPhotoChange(file);
            }
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            alert('Erreur lors de l\'upload de l\'image');
        } finally {
            setUploading(false);
        }
    }, [onPhotoChange]);

    const handleClearPhoto = useCallback(() => {
        setPreview(null);
        if (onPhotoChange) {
            onPhotoChange(null);
        }
    }, [onPhotoChange]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                    uploading ? (
                        <CircularProgress size={20} color="primary" />
                    ) : (
                        <Box>
                            {!disabled && (
                                <IconButton
                                    component="label"
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        width: 32,
                                        height: 32
                                    }}
                                >
                                    <PhotoCameraIcon fontSize="small" />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </IconButton>
                            )}
                        </Box>
                    )
                }
            >
                <Avatar
                    src={preview}
                    sx={{
                        width: 120,
                        height: 120,
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        bgcolor: 'primary.main',
                        border: `3px solid ${alpha('#000', 0.1)}`,
                        boxShadow: `0 8px 24px ${alpha('#000', 0.15)}`
                    }}
                >
                    {!preview && <PersonIcon fontSize="inherit" />}
                </Avatar>
            </Badge>

            {!disabled && preview && (
                <ModernButton
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<ClearIcon />}
                    onClick={handleClearPhoto}
                >
                    Supprimer la photo
                </ModernButton>
            )}
        </Box>
    );
});

ProfilePhotoUpload.displayName = 'ProfilePhotoUpload';

// Auto-complétion AD avec recherche intelligente
const ADGroupAutocomplete = React.memo(({ 
    selectedGroups = [], 
    onGroupsChange, 
    disabled = false 
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debounceRef = useRef();

    // Recherche des groupes AD avec debouncing
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!searchQuery) {
            setOptions([]);
            return;
        }

        debounceRef.current = setTimeout(() => {
            searchADGroups(searchQuery);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery]);

    const searchADGroups = useCallback(async (query) => {
        setLoading(true);
        try {
            // Simulation d'une recherche AD
            const mockGroups = [
                { id: 1, name: 'IT-Admins', description: 'Administrateurs IT', type: 'security' },
                { id: 2, name: 'Finance-Users', description: 'Utilisateurs Finance', type: 'distribution' },
                { id: 3, name: 'HR-Management', description: 'Direction RH', type: 'security' },
                { id: 4, name: 'Sales-Team', description: 'Équipe Commerciale', type: 'distribution' },
                { id: 5, name: 'Tech-Support', description: 'Support Technique', type: 'security' }
            ].filter(group => 
                group.name.toLowerCase().includes(query.toLowerCase()) ||
                group.description.toLowerCase().includes(query.toLowerCase())
            );

            setOptions(mockGroups);
        } catch (error) {
            console.error('Erreur lors de la recherche de groupes:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleGroupAdd = useCallback((group) => {
        if (!selectedGroups.find(g => g.id === group.id)) {
            const newGroups = [...selectedGroups, group];
            onGroupsChange(newGroups);
        }
    }, [selectedGroups, onGroupsChange]);

    const handleGroupRemove = useCallback((groupId) => {
        const newGroups = selectedGroups.filter(g => g.id !== groupId);
        onGroupsChange(newGroups);
    }, [selectedGroups, onGroupsChange]);

    return (
        <Box>
            <Autocomplete
                options={options}
                loading={loading}
                disabled={disabled}
                value={null}
                onInputChange={(event, newValue) => setSearchQuery(newValue || '')}
                getOptionLabel={(option) => `${option.name} - ${option.description}`}
                renderOption={(props, option) => (
                    <li {...props}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <Typography variant="body1" fontWeight={600}>
                                {option.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {option.description}
                            </Typography>
                            <Chip 
                                size="small" 
                                label={option.type} 
                                color={option.type === 'security' ? 'error' : 'info'}
                                sx={{ mt: 0.5, alignSelf: 'flex-start' }}
                            />
                        </Box>
                    </li>
                )}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Rechercher un groupe AD"
                        placeholder="Tapez pour rechercher..."
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            )
                        }}
                        variant="outlined"
                        size="medium"
                    />
                )}
                onChange={(event, newValue) => {
                    if (newValue) {
                        handleGroupAdd(newValue);
                        setSearchQuery('');
                    }
                }}
            />

            {/* Groupes sélectionnés */}
            {selectedGroups.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Groupes sélectionnés ({selectedGroups.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedGroups.map((group) => (
                            <Chip
                                key={group.id}
                                label={group.name}
                                onDelete={() => handleGroupRemove(group.id)}
                                color="primary"
                                variant="outlined"
                                icon={<GroupIcon />}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
});

ADGroupAutocomplete.displayName = 'ADGroupAutocomplete';

// Composant principal du profil utilisateur enrichi
const UserProfileEnhanced = React.memo(({ 
    open, 
    onClose, 
    user,
    onSave,
    onCancel,
    readOnly = false
}) => {
    const theme = useTheme();
    const { showNotification } = useApp();
    
    // États principaux
    const [activeTab, setActiveTab] = useState(0);
    const [isEditing, setIsEditing] = useState(!readOnly);
    const [isLoading, setIsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [changes, setChanges] = useState({});

    // États des données
    const [userData, setUserData] = useState({});
    const [activityHistory, setActivityHistory] = useState([]);
    const [usageStats, setUsageStats] = useState({});
    const [preferences, setPreferences] = useState({});
    const [auditTrail, setAuditTrail] = useState([]);
    const [selectedADGroups, setSelectedADGroups] = useState([]);

    // États UI
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Gestionnaire de couleurs optimisé
    const { getUserColor } = UserColorManagerOptimized.useUserColorManagerOptimized([userData], {
        accessibility: 'AA',
        includeVariants: true
    });
    const userColor = getUserColor(userData?.username, userData?.username);

    // Validation des formulaires
    const validationRules = {
        email: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return {
                isValid: !value || emailRegex.test(value),
                message: value && !emailRegex.test(value) ? 'Format d\'email invalide' : ''
            };
        },
        phone: (value) => {
            const phoneRegex = /^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/;
            return {
                isValid: !value || phoneRegex.test(value.replace(/\s/g, '')),
                message: value && !phoneRegex.test(value.replace(/\s/g, '')) ? 'Format de téléphone invalide' : ''
            };
        }
    };

    // Chargement initial des données
    useEffect(() => {
        if (open && user) {
            loadUserProfile();
        }
    }, [open, user]);

    const loadUserProfile = async () => {
        setIsLoading(true);
        try {
            // Simulation du chargement des données
            const profileData = {
                ...user,
                photo: user.photo || null,
                phone: user.phone || '',
                mobile: user.mobile || '',
                department: user.department || '',
                title: user.title || '',
                officeLocation: user.officeLocation || '',
                manager: user.manager || '',
                hireDate: user.hireDate || '',
                lastLogin: user.lastLogin || '',
                adGroups: user.adGroups || [],
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
            };

            setUserData(profileData);
            setSelectedADGroups(profileData.adGroups);

            // Charger les données des autres onglets
            await Promise.all([
                loadActivityHistory(),
                loadUsageStats(),
                loadPreferences(),
                loadAuditTrail()
            ]);

        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
            showNotification('error', 'Erreur lors du chargement du profil utilisateur');
        } finally {
            setIsLoading(false);
        }
    };

    const loadActivityHistory = async () => {
        // Simulation des données d'activité
        const activities = [
            {
                id: 1,
                type: 'login',
                description: 'Connexion au système',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            {
                id: 2,
                type: 'profile_update',
                description: 'Modification des informations personnelles',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                details: 'Téléphone mis à jour'
            },
            {
                id: 3,
                type: 'password_change',
                description: 'Changement de mot de passe',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                details: 'Mot de passe Windows modifié'
            },
            {
                id: 4,
                type: 'group_change',
                description: 'Ajout au groupe IT-Admins',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
                details: 'Nouveau groupe ajouté par l\'administrateur'
            }
        ];
        setActivityHistory(activities);
    };

    const loadUsageStats = async () => {
        // Simulation des statistiques d'usage
        const stats = {
            totalLogins: 156,
            averageSessionTime: 245, // minutes
            documentsAccessed: 89,
            activeProjects: 3,
            monthlyTrends: {
                logins: [12, 18, 15, 22, 19, 25, 28],
                documents: [5, 8, 12, 15, 18, 22, 25],
                sessions: [180, 220, 200, 260, 240, 280, 300]
            }
        };
        setUsageStats(stats);
    };

    const loadPreferences = async () => {
        // Les préférences sont déjà chargées avec userData
    };

    const loadAuditTrail = async () => {
        // Simulation des données d'audit
        const audits = [
            {
                id: 1,
                action: 'login_success',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                ipAddress: '192.168.1.100',
                result: 'success',
                details: 'Authentification réussie'
            },
            {
                id: 2,
                action: 'profile_modification',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                modifiedBy: 'Utilisateur',
                result: 'success',
                details: 'Champ téléphone modifié: "0123456789" → "0987654321"'
            },
            {
                id: 3,
                action: 'password_reset',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                modifiedBy: 'Administrateur',
                result: 'success',
                details: 'Réinitialisation du mot de passe Windows'
            },
            {
                id: 4,
                action: 'group_membership_change',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
                modifiedBy: 'Administrateur IT',
                result: 'success',
                details: 'Ajout au groupe "IT-Admins"'
            }
        ];
        setAuditTrail(audits);
    };

    // Gestion des changements
    const handleFieldChange = useCallback((field, value) => {
        setUserData(prev => ({ ...prev, [field]: value }));
        setChanges(prev => ({ ...prev, [field]: { from: prev[field], to: value } }));
        
        // Validation en temps réel
        if (validationRules[field]) {
            const validation = validationRules[field](value);
            setErrors(prev => ({
                ...prev,
                [field]: validation.isValid ? '' : validation.message
            }));
        }
    }, []);

    const handlePhotoChange = useCallback((photoFile) => {
        if (photoFile) {
            const photoUrl = URL.createObjectURL(photoFile);
            setUserData(prev => ({ ...prev, photo: photoUrl }));
        } else {
            setUserData(prev => ({ ...prev, photo: null }));
        }
        setChanges(prev => ({ ...prev, photo: { action: photoFile ? 'upload' : 'remove' } }));
    }, []);

    const handleGroupsChange = useCallback((groups) => {
        setSelectedADGroups(groups);
        setUserData(prev => ({ ...prev, adGroups: groups }));
        setChanges(prev => ({ 
            ...prev, 
            adGroups: { from: prev.adGroups, to: groups } 
        }));
    }, []);

    const handlePreferencesChange = useCallback((category, field, value) => {
        setUserData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [category]: {
                    ...prev.preferences[category],
                    [field]: value
                }
            }
        }));
    }, []);

    // Actions
    const handleSave = async () => {
        if (!isEditing) {
            setIsEditing(true);
            return;
        }

        setSaving(true);
        try {
            // Validation finale
            const validationErrors = {};
            Object.keys(userData).forEach(field => {
                if (validationRules[field]) {
                    const validation = validationRules[field](userData[field]);
                    if (!validation.isValid) {
                        validationErrors[field] = validation.message;
                    }
                }
            });

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                showNotification('error', 'Veuillez corriger les erreurs avant de sauvegarder');
                setSaving(false);
                return;
            }

            // Simuler la sauvegarde
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (onSave) {
                await onSave(userData, changes);
            }

            showNotification('success', 'Profil mis à jour avec succès');
            setIsEditing(false);
            setChanges({});
            setErrors({});
            setShowSaveDialog(false);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            showNotification('error', 'Erreur lors de la sauvegarde du profil');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (isEditing) {
            setShowSaveDialog(true);
        } else {
            if (onCancel) onCancel();
            else if (onClose) onClose();
        }
    };

    const handleReset = () => {
        loadUserProfile();
        setIsEditing(false);
        setChanges({});
        setErrors({});
        showNotification('info', 'Modifications annulées');
    };

    // Rendu des onglets

    // 1. Onglet Informations générales
    const renderGeneralTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={4}>
                {/* Photo de profil */}
                <Grid item xs={12}>
                    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ProfilePhotoUpload
                                currentPhoto={userData.photo}
                                onPhotoChange={handlePhotoChange}
                                disabled={!isEditing}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Informations de base */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Informations personnelles
                        </Typography>
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormField
                                    label="Nom d'utilisateur"
                                    value={userData.username || ''}
                                    disabled={true}
                                    icon={<PersonIcon />}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField
                                    label="Nom complet"
                                    value={userData.displayName || ''}
                                    onChange={(value) => handleFieldChange('displayName', value)}
                                    disabled={!isEditing}
                                    required
                                    icon={<PersonIcon />}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField
                                    label="Titre/Fonction"
                                    value={userData.title || ''}
                                    onChange={(value) => handleFieldChange('title', value)}
                                    disabled={!isEditing}
                                    icon={<PersonIcon />}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField
                                    label="Service/Département"
                                    value={userData.department || ''}
                                    onChange={(value) => handleFieldChange('department', value)}
                                    disabled={!isEditing}
                                    icon={<PersonIcon />}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField
                                    label="Date d'embauche"
                                    value={userData.hireDate || ''}
                                    onChange={(value) => handleFieldChange('hireDate', value)}
                                    disabled={!isEditing}
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    icon={<AccessTimeIcon />}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Informations de contact */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Informations de contact
                        </Typography>
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormField
                                    label="Email professionnel"
                                    value={userData.email || ''}
                                    onChange={(value) => handleFieldChange('email', value)}
                                    disabled={!isEditing}
                                    type="email"
                                    validation={validationRules.email}
                                    icon={<EmailIcon />}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField
                                    label="Téléphone fixe"
                                    value={userData.phone || ''}
                                    onChange={(value) => handleFieldChange('phone', value)}
                                    disabled={!isEditing}
                                    validation={validationRules.phone}
                                    icon={<PhoneIcon />}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField
                                    label="Téléphone mobile"
                                    value={userData.mobile || ''}
                                    onChange={(value) => handleFieldChange('mobile', value)}
                                    disabled={!isEditing}
                                    validation={validationRules.phone}
                                    icon={<PhoneIcon />}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField
                                    label="Bureau/Emplacement"
                                    value={userData.officeLocation || ''}
                                    onChange={(value) => handleFieldChange('officeLocation', value)}
                                    disabled={!isEditing}
                                    icon={<PersonIcon />}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField
                                    label="Manager"
                                    value={userData.manager || ''}
                                    onChange={(value) => handleFieldChange('manager', value)}
                                    disabled={!isEditing}
                                    icon={<PersonIcon />}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // 2. Onglet Groupes AD
    const renderADGroupsTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Gestion des groupes Active Directory
                        </Typography>
                        
                        {isEditing ? (
                            <ADGroupAutocomplete
                                selectedGroups={selectedADGroups}
                                onGroupsChange={handleGroupsChange}
                                disabled={!isEditing}
                            />
                        ) : (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                    Groupes affectés ({selectedADGroups.length})
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {selectedADGroups.length > 0 ? (
                                        selectedADGroups.map((group) => (
                                            <Chip
                                                key={group.id}
                                                label={group.name}
                                                color="primary"
                                                variant="outlined"
                                                icon={<GroupIcon />}
                                            />
                                        ))
                                    ) : (
                                        <Typography color="text.secondary">
                                            Aucun groupe assigné
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>
                
                {/* Historique des modifications de groupes */}
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Historique des modifications
                        </Typography>
                        
                        <List>
                            {auditTrail
                                .filter(entry => entry.action.includes('group'))
                                .map((audit) => (
                                    <ListItem key={audit.id} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 1, mb: 1 }}>
                                        <ListItemIcon>
                                            <GroupAddIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={audit.details}
                                            secondary={`${audit.timestamp.toLocaleString()} par ${audit.modifiedBy}`}
                                        />
                                        <Chip
                                            size="small"
                                            label={audit.result}
                                            color={audit.result === 'success' ? 'success' : 'error'}
                                            variant="outlined"
                                        />
                                    </ListItem>
                                ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // 3. Onglet Historique activités
    const renderActivityTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Historique des activités
                            </Typography>
                            <ModernButton
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                            >
                                Exporter
                            </ModernButton>
                        </Box>
                        
                        <List>
                            {activityHistory.map((activity) => (
                                <ListItem key={activity.id} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 1, mb: 1 }}>
                                    <ListItemIcon>
                                        <Box sx={{ color: 'primary.main' }}>
                                            {activity.type === 'login' && <CheckCircleIcon />}
                                            {activity.type === 'profile_update' && <EditIcon />}
                                            {activity.type === 'password_change' && <SecurityIcon />}
                                            {activity.type === 'group_change' && <GroupIcon />}
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={activity.description}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {activity.timestamp.toLocaleString()}
                                                </Typography>
                                                {activity.details && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {activity.details}
                                                    </Typography>
                                                )}
                                                {activity.ipAddress && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        IP: {activity.ipAddress}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // 4. Onglet Statistiques usage
    const renderUsageTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={4}>
                {/* Métriques principales */}
                <Grid item xs={12} md={3}>
                    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <TrendingUpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight={700} color="primary.main">
                                {usageStats.totalLogins || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Connexions totales
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AccessTimeIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight={700} color="secondary.main">
                                {usageStats.averageSessionTime || 0}min
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Durée moyenne de session
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PersonIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight={700} color="success.main">
                                {usageStats.documentsAccessed || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Documents consultés
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <GroupIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight={700} color="warning.main">
                                {usageStats.activeProjects || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Projets actifs
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Graphique de tendances */}
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Tendances mensuelles
                        </Typography>
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Connexions (7 derniers jours)
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="primary.main">
                                        28
                                    </Typography>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Documents consultés (7 derniers jours)
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="success.main">
                                        25
                                    </Typography>
                                </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Temps de session moyen (minutes)
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="secondary.main">
                                        300
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // 5. Onglet Préférences
    const renderPreferencesTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Préférences générales
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Langue</InputLabel>
                                <Select
                                    value={userData.preferences?.language || 'fr'}
                                    onChange={(e) => handlePreferencesChange('', 'language', e.target.value)}
                                    disabled={!isEditing}
                                    label="Langue"
                                >
                                    <MenuItem value="fr">Français</MenuItem>
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="es">Español</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Fuseau horaire</InputLabel>
                                <Select
                                    value={userData.preferences?.timezone || 'Europe/Paris'}
                                    onChange={(e) => handlePreferencesChange('', 'timezone', e.target.value)}
                                    disabled={!isEditing}
                                    label="Fuseau horaire"
                                >
                                    <MenuItem value="Europe/Paris">Europe/Paris</MenuItem>
                                    <MenuItem value="Europe/London">Europe/London</MenuItem>
                                    <MenuItem value="America/New_York">America/New_York</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Thème</InputLabel>
                                <Select
                                    value={userData.preferences?.theme || 'auto'}
                                    onChange={(e) => handlePreferencesChange('', 'theme', e.target.value)}
                                    disabled={!isEditing}
                                    label="Thème"
                                >
                                    <MenuItem value="auto">Automatique</MenuItem>
                                    <MenuItem value="light">Clair</MenuItem>
                                    <MenuItem value="dark">Sombre</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Notifications
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={userData.preferences?.notifications?.email || false}
                                        onChange={(e) => handlePreferencesChange('notifications', 'email', e.target.checked)}
                                        disabled={!isEditing}
                                    />
                                }
                                label="Notifications par email"
                            />
                            
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={userData.preferences?.notifications?.push || false}
                                        onChange={(e) => handlePreferencesChange('notifications', 'push', e.target.checked)}
                                        disabled={!isEditing}
                                    />
                                }
                                label="Notifications push"
                            />
                            
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={userData.preferences?.notifications?.sms || false}
                                        onChange={(e) => handlePreferencesChange('notifications', 'sms', e.target.checked)}
                                        disabled={!isEditing}
                                    />
                                }
                                label="Notifications SMS"
                            />
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                            Options d'affichage
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={userData.preferences?.compactMode || false}
                                        onChange={(e) => handlePreferencesChange('', 'compactMode', e.target.checked)}
                                        disabled={!isEditing}
                                    />
                                }
                                label="Mode compact"
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // 6. Onglet Audit trail
    const renderAuditTab = () => (
        <motion.div variants={contentVariants}>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Journal d'audit et traçabilité
                            </Typography>
                            <ModernButton
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                            >
                                Exporter l'audit
                            </ModernButton>
                        </Box>
                        
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Action</TableCell>
                                        <TableCell>Timestamp</TableCell>
                                        <TableCell>Utilisateur</TableCell>
                                        <TableCell>Détails</TableCell>
                                        <TableCell>Résultat</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditTrail.map((audit) => (
                                        <TableRow key={audit.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {audit.action === 'login_success' && <CheckCircleIcon color="success" />}
                                                    {audit.action === 'profile_modification' && <EditIcon color="primary" />}
                                                    {audit.action === 'password_reset' && <SecurityIcon color="warning" />}
                                                    {audit.action === 'group_membership_change' && <GroupIcon color="info" />}
                                                    <Typography variant="body2">
                                                        {audit.action.replace('_', ' ').toUpperCase()}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {audit.timestamp.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {audit.modifiedBy || 'Système'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {audit.details}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={audit.result}
                                                    color={audit.result === 'success' ? 'success' : 'error'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );

    // Rendu du contenu selon l'onglet actif
    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return renderGeneralTab();
            case 1:
                return renderADGroupsTab();
            case 2:
                return renderActivityTab();
            case 3:
                return renderUsageTab();
            case 4:
                return renderPreferencesTab();
            case 5:
                return renderAuditTab();
            default:
                return renderGeneralTab();
        }
    };

    if (isLoading) {
        return (
            <Dialog open={open} maxWidth="md" fullWidth>
                <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress size={60} sx={{ mb: 2 }} />
                        <Typography variant="h6">
                            Chargement du profil utilisateur...
                        </Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog
                open={open}
                onClose={handleCancel}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '95vh'
                    }
                }}
                TransitionComponent={motion.div}
            >
                <motion.div variants={dialogVariants}>
                    {/* Header */}
                    <DialogTitle sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        pb: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <UserColorBadgeOptimized
                                userId={userData.username}
                                userName={userData.username}
                                displayName={userData.displayName}
                                size="large"
                                palette="primary"
                            />
                            <Box>
                                <Typography variant="h5" fontWeight={700}>
                                    {userData.displayName || userData.username}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {userData.department} • {userData.title}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {/* Indicateur de modification */}
                            {Object.keys(changes).length > 0 && (
                                <Chip
                                    label={`${Object.keys(changes).length} modification(s)`}
                                    color="warning"
                                    size="small"
                                    icon={<EditIcon />}
                                />
                            )}
                            
                            {/* Actions */}
                            {!readOnly && (
                                <Tooltip title={isEditing ? 'Enregistrer' : 'Modifier'}>
                                    <ModernIconButton
                                        size="small"
                                        onClick={handleSave}
                                        disabled={saving}
                                        color="primary"
                                    >
                                        {saving ? (
                                            <CircularProgress size={20} />
                                        ) : isEditing ? (
                                            <SaveIcon />
                                        ) : (
                                            <EditIcon />
                                        )}
                                    </ModernIconButton>
                                </Tooltip>
                            )}
                            
                            <Tooltip title="Fermer">
                                <ModernIconButton
                                    size="small"
                                    onClick={handleCancel}
                                    color="inherit"
                                >
                                    <CancelIcon />
                                </ModernIconButton>
                            </Tooltip>
                        </Box>
                    </DialogTitle>

                    {/* Barre d'onglets */}
                    <Box sx={{ px: 3 }}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, newValue) => setActiveTab(newValue)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': {
                                    minWidth: 140,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: '0.9rem'
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

                    {/* Contenu avec animations */}
                    <DialogContent sx={{ p: 3, overflow: 'auto', maxHeight: '70vh' }}>
                        <LayoutGroup>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    {renderTabContent()}
                                </motion.div>
                            </AnimatePresence>
                        </LayoutGroup>
                    </DialogContent>

                    {/* Actions */}
                    {!readOnly && (
                        <>
                            <Divider />
                            <DialogActions sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'space-between' }}>
                                    <Box>
                                        {isEditing && Object.keys(changes).length > 0 && (
                                            <ModernButton
                                                variant="outlined"
                                                color="warning"
                                                onClick={handleReset}
                                                disabled={saving}
                                                startIcon={<RefreshIcon />}
                                            >
                                                Annuler les modifications
                                            </ModernButton>
                                        )}
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button onClick={handleCancel} disabled={saving}>
                                            Fermer
                                        </Button>
                                        <ModernButton
                                            variant="contained"
                                            onClick={handleSave}
                                            disabled={saving || (isEditing && Object.keys(changes).length === 0)}
                                            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                        >
                                            {saving ? 'Sauvegarde...' : isEditing ? 'Enregistrer' : 'Modifier'}
                                        </ModernButton>
                                    </Box>
                                </Box>
                            </DialogActions>
                        </>
                    )}
                </motion.div>
            </Dialog>

            {/* Dialogue de confirmation d'annulation */}
            <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
                <DialogTitle>Modifications non sauvegardées</DialogTitle>
                <DialogContent>
                    <Typography>
                        Vous avez des modifications non sauvegardées. Voulez-vous les enregistrer avant de fermer ?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSaveDialog(false)}>
                        Continuer sans sauvegarder
                    </Button>
                    <ModernButton
                        variant="contained"
                        onClick={() => {
                            handleSave();
                            setShowSaveDialog(false);
                        }}
                    >
                        Sauvegarder
                    </ModernButton>
                </DialogActions>
            </Dialog>
        </>
    );
});

UserProfileEnhanced.displayName = 'UserProfileEnhanced';

export default UserProfileEnhanced;