// src/components/users/UserCardModern.js - Carte utilisateur moderne avec animations et fonctionnalités avancées

import React, { useState, useCallback, memo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Chip,
    Avatar,
    Tooltip,
    Menu,
    MenuItem,
    Fade,
    Badge,
    useTheme,
    alpha,
    Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Person as PersonIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Print as PrintIcon,
    PhoneIphone as PhoneIcon,
    Computer as ComputerIcon,
    Security as SecurityIcon,
    Email as EmailIcon,
    Work as WorkIcon,
    Circle as CircleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    MoreVert as MoreVertIcon,
    VpnKey as VpnKeyIcon,
    Language as LanguageIcon,
    Dashboard as DashboardIcon
} from '@mui/icons-material';

// Composants UI modernes
import { ModernButton } from '../ui/ModernUIComponents';

// Hooks et services
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import { debounceAsyncLeading } from '../../utils/debounce';

// Variantes d'animation
const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: 'easeOut'
        }
    },
    hover: {
        y: -4,
        scale: 1.02,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        transition: {
            duration: 0.2,
            ease: 'easeOut'
        }
    },
    tap: {
        scale: 0.98,
        transition: { duration: 0.1 }
    }
};

const UserCardModern = memo(({
    user,
    isSelected,
    onSelect,
    viewMode = 'grid',
    userLoans,
    userColor,
    onEdit,
    onDelete,
    onPrint,
    onEditLoans,
    onOpenAdDialog
}) => {
    const theme = useTheme();
    const { showNotification } = useApp();
    const [anchorEl, setAnchorEl] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const open = Boolean(anchorEl);

    // Données utilisateur enrichies
    const adStatus = user.adEnabled === 1 ? 'enabled' : user.adEnabled === 0 ? 'disabled' : 'unknown';
    const statusColor = adStatus === 'enabled' ? 'success.main' : adStatus === 'disabled' ? 'error.main' : 'warning.main';
    const statusIcon = adStatus === 'enabled' ? <CheckCircleIcon /> : adStatus === 'disabled' ? <CancelIcon /> : <CircleIcon />;

    // Prêts utilisateur
    const userPhoneLoans = userLoans.phoneLoans?.filter(loan => loan.userId === user.username) || [];
    const userComputerLoans = userLoans.computerLoans?.filter(loan => loan.userId === user.username) || [];
    const hasActiveLoans = userPhoneLoans.length > 0 || userComputerLoans.length > 0;

    // Gestion du menu d'actions
    const handleMenuOpen = useCallback((event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback((event) => {
        event?.stopPropagation();
        setAnchorEl(null);
    }, []);

    // Actions avec debounce pour éviter les clics multiples
    const handleAction = useCallback(
        debounceAsyncLeading(async (action, actionData) => {
            setIsActionLoading(true);
            try {
                switch (action) {
                    case 'edit':
                        if (onEdit) onEdit(actionData);
                        break;
                    case 'delete':
                        if (window.confirm(`Supprimer ${user.displayName} ?`)) {
                            if (onDelete) await onDelete(actionData);
                        }
                        break;
                    case 'print':
                        if (onPrint) onPrint(actionData);
                        break;
                    case 'loans':
                        if (onEditLoans) onEditLoans(actionData);
                        break;
                    case 'ad':
                        if (onOpenAdDialog) onOpenAdDialog(actionData);
                        break;
                }
                showNotification('success', `Action "${action}" exécutée avec succès`);
            } catch (error) {
                showNotification('error', `Erreur: ${error.message}`);
            } finally {
                setIsActionLoading(false);
                handleMenuClose();
            }
        }, 500),
        [user, onEdit, onDelete, onPrint, onEditLoans, onOpenAdDialog, showNotification, handleMenuClose]
    );

    // Actions rapides
    const quickActions = [
        { icon: <EditIcon />, label: 'Modifier', action: 'edit', color: 'primary' },
        { icon: <PrintIcon />, label: 'Imprimer', action: 'print', color: 'info' },
        { icon: <PhoneIcon />, label: 'Gérer prêts', action: 'loans', color: 'secondary' },
        { icon: <SecurityIcon />, label: 'Actions AD', action: 'ad', color: 'warning' },
        { icon: <DeleteIcon />, label: 'Supprimer', action: 'delete', color: 'error' }
    ];

    if (viewMode === 'list') {
        return (
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
            >
                <Card
                    sx={{
                        mb: 1,
                        cursor: 'pointer',
                        border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                        borderColor: isSelected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.2),
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: theme.shadows[4]
                        }
                    }}
                    onClick={() => onSelect && onSelect()}
                >
                    <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Avatar et info de base */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: userColor?.color || theme.palette.primary.main,
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {(user.displayName || user.username)?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    
                                    {/* Badge de statut */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: -2,
                                            right: -2,
                                            width: 16,
                                            height: 16,
                                            borderRadius: '50%',
                                            bgcolor: theme.palette[statusColor.replace('.main', '')]?.main || theme.palette.grey[500],
                                            border: `2px solid ${theme.palette.background.paper}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <CircleIcon sx={{ fontSize: 8, color: 'white' }} />
                                    </Box>
                                </Box>
                                
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                                        {user.displayName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {user.username}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Informations détaillées */}
                            <Box sx={{ display: 'flex', gap: 3, flex: 2, alignItems: 'center' }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        SERVICE
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500} noWrap>
                                        {user.department || '-'}
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        EMAIL
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500} noWrap>
                                        {user.email || '-'}
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        SERVEUR
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500} noWrap>
                                        {user.server || '-'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Badges et indicateurs */}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {hasActiveLoans && (
                                    <Badge
                                        badgeContent={userPhoneLoans.length + userComputerLoans.length}
                                        color="error"
                                        max={99}
                                    >
                                        <PhoneIcon color="primary" />
                                    </Badge>
                                )}
                                
                                <Chip
                                    size="small"
                                    icon={statusIcon}
                                    label={adStatus === 'enabled' ? 'Actif' : adStatus === 'disabled' ? 'Inactif' : 'Inconnu'}
                                    color={adStatus === 'enabled' ? 'success' : adStatus === 'disabled' ? 'error' : 'warning'}
                                    variant="outlined"
                                />
                                
                                <IconButton
                                    size="small"
                                    onClick={handleMenuOpen}
                                    sx={{ ml: 1 }}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Mode grille
    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
        >
            <Card
                sx={{
                    height: '100%',
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                    borderColor: isSelected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.2),
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: theme.shadows[8]
                    }
                }}
                onClick={() => onSelect && onSelect()}
            >
                {/* Effet de sélection */}
                {isSelected && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -2,
                            left: -2,
                            right: -2,
                            bottom: -2,
                            border: `2px solid ${theme.palette.primary.main}`,
                            borderRadius: 3,
                            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                            pointerEvents: 'none',
                            zIndex: -1
                        }}
                    />
                )}

                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header avec avatar et actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: userColor?.color || theme.palette.primary.main,
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        boxShadow: `0 4px 12px ${alpha(userColor?.color || theme.palette.primary.main, 0.3)}`
                                    }}
                                >
                                    {(user.displayName || user.username)?.charAt(0).toUpperCase()}
                                </Avatar>
                                
                                {/* Badge de statut */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: -2,
                                        right: -2,
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        bgcolor: theme.palette[statusColor.replace('.main', '')]?.main || theme.palette.grey[500],
                                        border: `3px solid ${theme.palette.background.paper}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <CircleIcon sx={{ fontSize: 10, color: 'white' }} />
                                </Box>
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={700} noWrap sx={{ mb: 0.5 }}>
                                    {user.displayName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {user.username}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            sx={{
                                opacity: 0.6,
                                '&:hover': { opacity: 1 }
                            }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Box>

                    {/* Informations principales */}
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {user.department || 'Aucun service'}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {user.email || 'Aucun email'}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DashboardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {user.server || 'Aucun serveur'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Badges de statut et groupes */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip
                                size="small"
                                icon={statusIcon}
                                label={adStatus === 'enabled' ? 'AD Actif' : adStatus === 'disabled' ? 'AD Inactif' : 'AD Inconnu'}
                                color={adStatus === 'enabled' ? 'success' : adStatus === 'disabled' ? 'error' : 'warning'}
                                variant="outlined"
                            />
                            
                            {hasActiveLoans && (
                                <Chip
                                    size="small"
                                    icon={<PhoneIcon />}
                                    label={`${userPhoneLoans.length + userComputerLoans.length} prêt(s)`}
                                    color="info"
                                    variant="outlined"
                                />
                            )}
                        </Box>

                        {/* Indicateurs visuels */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: userColor?.color || theme.palette.primary.main
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Utilisateur ID: {user.username}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Actions rapides */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mt: 'auto' }}>
                        <ModernButton
                            size="small"
                            variant="contained"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction('edit', user);
                            }}
                            sx={{ flex: 1, minWidth: 'auto' }}
                        >
                            Modifier
                        </ModernButton>
                        
                        <ModernButton
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction('loans', user);
                            }}
                            sx={{ minWidth: 'auto', px: 1 }}
                        >
                            <PhoneIcon fontSize="small" />
                        </ModernButton>
                        
                        <ModernButton
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction('print', user);
                            }}
                            sx={{ minWidth: 'auto', px: 1 }}
                        >
                            <PrintIcon fontSize="small" />
                        </ModernButton>
                    </Box>
                </CardContent>

                {/* Menu d'actions */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    TransitionComponent={Fade}
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            boxShadow: theme.shadows[8],
                            minWidth: 200
                        }
                    }}
                >
                    {quickActions.map((action) => (
                        <MenuItem
                            key={action.action}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction(action.action, user);
                            }}
                            disabled={isActionLoading}
                            sx={{ py: 1.5 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ color: `${action.color}.main` }}>
                                    {action.icon}
                                </Box>
                                <Typography variant="body2">
                                    {action.label}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </Menu>
            </Card>
        </motion.div>
    );
});

UserCardModern.displayName = 'UserCardModern';

export default UserCardModern;
