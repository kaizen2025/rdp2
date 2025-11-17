// src/components/dashboard/RealTimeNotifications.js - Système de Notifications Temps Réel
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Snackbar,
    Alert,
    AlertTitle,
    IconButton,
    Typography,
    Button,
    Card,
    CardContent,
    Badge,
    Avatar,
    useTheme,
    ClickAwayListener,
    Slide
} from '@mui/material';
import {
    Close,
    Notifications,
    Warning,
    Error,
    Info,
    CheckCircle,
    Timeline,
    Person,
    Computer,
    Assignment
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Composant de notification individuelle
const NotificationItem = ({ 
    notification, 
    onDismiss, 
    onAction,
    autoHideDuration = 6000,
    position = 'top-right'
}) => {
    const theme = useTheme();
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const timerRef = useRef(null);
    
    // Fonctions utilitaires pour les types de notifications
    const getNotificationConfig = (type) => {
        switch (type) {
            case 'error':
                return {
                    severity: 'error',
                    icon: Error,
                    color: theme.palette.error.main,
                    bgColor: theme.palette.error.light + '20',
                    defaultTitle: 'Erreur'
                };
            case 'warning':
                return {
                    severity: 'warning',
                    icon: Warning,
                    color: theme.palette.warning.main,
                    bgColor: theme.palette.warning.light + '20',
                    defaultTitle: 'Attention'
                };
            case 'success':
                return {
                    severity: 'success',
                    icon: CheckCircle,
                    color: theme.palette.success.main,
                    bgColor: theme.palette.success.light + '20',
                    defaultTitle: 'Succès'
                };
            case 'info':
            default:
                return {
                    severity: 'info',
                    icon: Info,
                    color: theme.palette.info.main,
                    bgColor: theme.palette.info.light + '20',
                    defaultTitle: 'Information'
                };
        }
    };
    
    // Calculs de position
    const getPositionStyles = () => {
        const positions = {
            'top-right': { top: 20, right: 20 },
            'top-left': { top: 20, left: 20 },
            'bottom-right': { bottom: 20, right: 20 },
            'bottom-left': { bottom: 20, left: 20 },
            'top-center': { top: 20, left: '50%', transform: 'translateX(-50%)' }
        };
        return positions[position] || positions['top-right'];
    };
    
    const config = getNotificationConfig(notification.type);
    const IconComponent = config.icon;
    
    // Auto-dismiss pour les notifications non critiques
    useEffect(() => {
        if (notification.persistent || autoHideDuration === 0) return;
        
        timerRef.current = setTimeout(() => {
            handleDismiss();
        }, autoHideDuration);
        
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [notification.persistent, autoHideDuration]);
    
    // Gestionnaires d'événements
    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300);
    };
    
    const handleAction = (action) => {
        if (onAction) {
            onAction(notification, action);
        }
        if (action !== 'keep_open') {
            handleDismiss();
        }
    };
    
    const handleClick = () => {
        setIsExpanded(!isExpanded);
    };
    
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 300, scale: 0.3 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 300, scale: 0.3, transition: { duration: 0.2 } }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 30 
                    }}
                    style={{
                        position: 'fixed',
                        zIndex: 9999,
                        ...getPositionStyles(),
                        maxWidth: 400
                    }}
                >
                    <ClickAwayListener onClickAway={handleDismiss}>
                        <Card
                            elevation={8}
                            sx={{
                                bgcolor: config.bgColor,
                                border: `1px solid ${config.color}40`,
                                borderRadius: 2,
                                overflow: 'visible',
                                backdropFilter: 'blur(10px)',
                                '&:hover': {
                                    boxShadow: `0 8px 32px ${config.color}30`,
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.3s ease'
                                },
                                cursor: notification.actions?.length > 0 ? 'pointer' : 'default'
                            }}
                            onClick={notification.actions?.length > 0 ? handleClick : undefined}
                        >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box display="flex" alignItems="flex-start" gap={1}>
                                    {/* Icône de notification */}
                                    <Avatar
                                        sx={{
                                            bgcolor: config.color,
                                            width: 32,
                                            height: 32,
                                            mt: 0.5
                                        }}
                                    >
                                        <IconComponent sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    
                                    {/* Contenu de la notification */}
                                    <Box flex={1} minWidth={0}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                            <Typography 
                                                variant="subtitle2" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: config.color,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {notification.title || config.defaultTitle}
                                            </Typography>
                                            
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                {notification.timestamp && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatTimestamp(notification.timestamp)}
                                                    </Typography>
                                                )}
                                                
                                                {!notification.persistent && (
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDismiss();
                                                        }}
                                                        sx={{ 
                                                            width: 24, 
                                                            height: 24,
                                                            opacity: 0.7,
                                                            '&:hover': { opacity: 1 }
                                                        }}
                                                    >
                                                        <Close sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Box>
                                        
                                        {/* Message principal */}
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{ 
                                                mb: notification.actions?.length > 0 ? 1 : 0,
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: isExpanded ? 'unset' : 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}
                                        >
                                            {notification.message}
                                        </Typography>
                                        
                                        {/* Métadonnées supplémentaires */}
                                        {isExpanded && notification.metadata && (
                                            <Box mt={1} p={1} sx={{ 
                                                bgcolor: theme.palette.background.paper,
                                                borderRadius: 1,
                                                fontSize: '0.75rem'
                                            }}>
                                                {Object.entries(notification.metadata).map(([key, value]) => (
                                                    <Box key={key} display="flex" justifyContent="space-between" py={0.25}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {key}:
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                            {String(value)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                        
                                        {/* Actions disponibles */}
                                        {notification.actions && notification.actions.length > 0 && (
                                            <Box 
                                                mt={1} 
                                                display="flex" 
                                                gap={1} 
                                                flexWrap="wrap"
                                            >
                                                {notification.actions.map((action, index) => (
                                                    <Button
                                                        key={index}
                                                        size="small"
                                                        variant={index === 0 ? "contained" : "outlined"}
                                                        color={config.severity === 'error' ? 'error' : config.severity}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAction(action.action);
                                                        }}
                                                        sx={{ 
                                                            minWidth: 'auto',
                                                            fontSize: '0.7rem',
                                                            py: 0.5,
                                                            px: 1
                                                        }}
                                                    >
                                                        {action.label}
                                                    </Button>
                                                ))}
                                            </Box>
                                        )}
                                        
                                        {/* Indicateur d'expansion pour les longues notifications */}
                                        {notification.message?.length > 100 && (
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary" 
                                                sx={{ mt: 0.5, cursor: 'pointer' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsExpanded(!isExpanded);
                                                }}
                                            >
                                                {isExpanded ? 'Réduire' : 'Voir plus'}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </ClickAwayListener>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Fonction utilitaire pour formater le timestamp
const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
};

// Composant principal du système de notifications
const RealTimeNotifications = ({
    position = 'top-right',
    maxVisible = 5,
    autoHideDuration = 6000,
    enableSound = true,
    enableVibration = true,
    soundConfig = {
        error: '/sounds/error.mp3',
        warning: '/sounds/warning.mp3',
        success: '/sounds/success.mp3',
        info: '/sounds/info.mp3'
    }
}) => {
    const theme = useTheme();
    
    // États des notifications
    const [notifications, setNotifications] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(enableSound);
    const [vibrationEnabled, setVibrationEnabled] = useState(enableVibration);
    
    // Référence pour les sons
    const audioRefs = useRef({});
    
    // Chargement des sons
    useEffect(() => {
        Object.entries(soundConfig).forEach(([type, src]) => {
            const audio = new Audio(src);
            audio.preload = 'auto';
            audioRefs.current[type] = audio;
        });
        
        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
        };
    }, [soundConfig]);
    
    // Fonction pour jouer un son
    const playSound = useCallback((type) => {
        if (!soundEnabled || !audioRefs.current[type]) return;
        
        try {
            audioRefs.current[type].currentTime = 0;
            audioRefs.current[type].play().catch(console.warn);
        } catch (error) {
            console.warn('Erreur lors de la lecture du son:', error);
        }
    }, [soundEnabled]);
    
    // Fonction pour vibrer
    const vibrate = useCallback((pattern = [200, 100, 200]) => {
        if (!vibrationEnabled || !navigator.vibrate) return;
        
        navigator.vibrate(pattern);
    }, [vibrationEnabled]);
    
    // Fonction pour ajouter une notification
    const addNotification = useCallback((notification) => {
        const id = notification.id || `notification_${Date.now()}_${Math.random()}`;
        const newNotification = {
            id,
            timestamp: Date.now(),
            persistent: false,
            actions: [],
            ...notification
        };
        
        setNotifications(prev => {
            // Ajouter la nouvelle notification au début
            const updated = [newNotification, ...prev];
            
            // Limiter le nombre de notifications visibles
            return updated.slice(0, maxVisible);
        });
        
        // Gestion des alertes sensorielles
        if (newNotification.type === 'error') {
            vibrate([300, 100, 300, 100, 300]);
        } else if (newNotification.type === 'warning') {
            vibrate([200, 100, 200]);
        }
        
        playSound(newNotification.type);
        
        // Auto-dismiss pour les notifications non critiques
        if (!newNotification.persistent && autoHideDuration > 0) {
            setTimeout(() => {
                dismissNotification(id);
            }, autoHideDuration);
        }
        
        return id;
    }, [maxVisible, autoHideDuration, vibrate, playSound]);
    
    // Fonction pour supprimer une notification
    const dismissNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);
    
    // Fonction pour supprimer toutes les notifications
    const dismissAll = useCallback(() => {
        setNotifications([]);
    }, []);
    
    // Fonction pour marquer une notification comme lue
    const markAsRead = useCallback((id) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === id 
                    ? { ...notification, read: true }
                    : notification
            )
        );
    }, []);
    
    // Fonctions de convenance pour différents types
    const showError = useCallback((title, message, options = {}) => {
        return addNotification({
            type: 'error',
            title,
            message,
            ...options
        });
    }, [addNotification]);
    
    const showWarning = useCallback((title, message, options = {}) => {
        return addNotification({
            type: 'warning',
            title,
            message,
            ...options
        });
    }, [addNotification]);
    
    const showSuccess = useCallback((title, message, options = {}) => {
        return addNotification({
            type: 'success',
            title,
            message,
            ...options
        });
    }, [addNotification]);
    
    const showInfo = useCallback((title, message, options = {}) => {
        return addNotification({
            type: 'info',
            title,
            message,
            ...options
        });
    }, [addNotification]);
    
    // Fonctions spécialisées pour les événements du dashboard
    const showLoanAlert = useCallback((loan, type, message) => {
        return addNotification({
            type: type === 'critical' ? 'error' : 'warning',
            title: `Alerte Prêt - ${loan.computerName}`,
            message,
            metadata: {
                'Utilisateur': loan.userDisplayName,
                'Date retour': new Date(loan.expectedReturnDate).toLocaleDateString('fr-FR'),
                'Statut': loan.status
            },
            icon: <Assignment />,
            actions: [
                { label: 'Voir prêt', action: 'view_loan' },
                { label: 'Contacter', action: 'contact_user' }
            ]
        });
    }, [addNotification]);
    
    const showSystemAlert = useCallback((component, message, severity = 'warning') => {
        return addNotification({
            type: severity === 'critical' ? 'error' : severity,
            title: `Alerte Système - ${component}`,
            message,
            metadata: {
                'Composant': component,
                'Heure': new Date().toLocaleTimeString('fr-FR')
            },
            icon: <Computer />,
            actions: [
                { label: 'Détails', action: 'view_system' },
                { label: 'Acknowledge', action: 'acknowledge' }
            ]
        });
    }, [addNotification]);
    
    const showUserActivity = useCallback((user, activity) => {
        return addNotification({
            type: 'info',
            title: `Activité Utilisateur - ${user.name}`,
            message: activity.description,
            metadata: {
                'Utilisateur': user.name,
                'Action': activity.type,
                'Heure': new Date(activity.timestamp).toLocaleTimeString('fr-FR')
            },
            icon: <Person />,
            persistent: false,
            autoHideDuration: 4000
        });
    }, [addNotification]);
    
    // Exposition des méthodes via une API
    const notificationAPI = {
        add: addNotification,
        dismiss: dismissNotification,
        dismissAll,
        markAsRead,
        showError,
        showWarning,
        showSuccess,
        showInfo,
        showLoanAlert,
        showSystemAlert,
        showUserActivity,
        // État
        getNotifications: () => notifications,
        getCount: () => notifications.length,
        getUnreadCount: () => notifications.filter(n => !n.read).length,
        // Paramètres
        setSoundEnabled,
        setVibrationEnabled,
        isSoundEnabled: () => soundEnabled,
        isVibrationEnabled: () => vibrationEnabled
    };
    
    // Fourniture de l'API via contexte global si nécessaire
    useEffect(() => {
        window.DocuCortexNotifications = notificationAPI;
        return () => {
            delete window.DocuCortexNotifications;
        };
    }, [notificationAPI]);
    
    return (
        <>
            {/* Rendu des notifications */}
            <AnimatePresence>
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onDismiss={dismissNotification}
                        onAction={(notification, action) => {
                            if (notificationAPI[action]) {
                                notificationAPI[action](notification);
                            }
                            console.log('Action:', action, notification);
                        }}
                        autoHideDuration={autoHideDuration}
                        position={position}
                    />
                ))}
            </AnimatePresence>
        </>
    );
};

// Export des hooks pour utilisation facile
export const useNotifications = () => {
    return window.DocuCortexNotifications || {
        showInfo: (title, msg) => console.log('Info:', title, msg),
        showError: (title, msg) => console.error('Error:', title, msg),
        showWarning: (title, msg) => console.warn('Warning:', title, msg),
        showSuccess: (title, msg) => console.log('Success:', title, msg)
    };
};

// Export des fonctions spécialisées pour les prêts
export const useLoanNotifications = () => {
    const notifications = useNotifications();
    
    return {
        loanCreated: (loan) => notifications.showSuccess(
            'Nouveau prêt créé',
            `Le prêt de ${loan.computerName} pour ${loan.userDisplayName} a été créé avec succès.`,
            {
                metadata: {
                    'Prêt ID': loan.id,
                    'Ordinateur': loan.computerName,
                    'Utilisateur': loan.userDisplayName,
                    'Date début': new Date(loan.startDate).toLocaleDateString('fr-FR')
                },
                actions: [
                    { label: 'Voir prêt', action: 'view_loan' },
                    { label: 'OK', action: 'dismiss' }
                ]
            }
        ),
        
        loanReturned: (loan) => notifications.showInfo(
            'Prêt retourné',
            `${loan.computerName} a été retourné par ${loan.userDisplayName}.`,
            {
                metadata: {
                    'Prêt ID': loan.id,
                    'Ordinateur': loan.computerName,
                    'Utilisateur': loan.userDisplayName,
                    'Date retour': new Date(loan.returnDate).toLocaleDateString('fr-FR')
                },
                actions: [
                    { label: 'Historique', action: 'view_history' },
                    { label: 'OK', action: 'dismiss' }
                ]
            }
        ),
        
        overdueLoan: (loan) => notifications.showLoanAlert(
            loan,
            loan.daysOverdue > 3 ? 'critical' : 'warning',
            `Le prêt de ${loan.computerName} est en retard de ${loan.daysOverdue} jour(s).`
        ),
        
        systemCapacity: (stats) => {
            if (stats.utilizationRate > 90) {
                return notifications.showSystemAlert(
                    'Capacité',
                    `Capacité d'utilisation critique: ${stats.utilizationRate}%`,
                    'critical'
                );
            } else if (stats.utilizationRate > 80) {
                return notifications.showSystemAlert(
                    'Capacité',
                    `Capacité d'utilisation élevée: ${stats.utilizationRate}%`,
                    'warning'
                );
            }
        }
    };
};

export default RealTimeNotifications;