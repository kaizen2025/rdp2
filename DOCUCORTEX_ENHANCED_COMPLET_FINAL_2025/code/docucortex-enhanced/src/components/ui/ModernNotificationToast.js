// src/components/ui/ModernNotificationToast.js - Notifications modernes avec animations

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
  ContentCopy,
  Refresh,
  Download,
  Upload,
  Delete,
  Edit,
  Save,
  Share,
  Print,
  Assignment,
  AssignmentReturn,
  Person,
  Computer,
  AccessTime
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

import { useReducedMotion } from '../animations/AnimationSystem';
import { ModernButton, ModernIconButton } from './ModernUIComponents';

/**
 * Icônes par type de notification
 */
const notificationIcons = {
  success: CheckCircle,
  error: Error,
  warning: Warning,
  info: Info,
  loading: Refresh,
  custom: Info
};

/**
 * Configuration des couleurs par type
 */
const typeConfig = {
  success: {
    color: 'success.main',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'success.main',
    iconColor: 'success.main'
  },
  error: {
    color: 'error.main',
    bgColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'error.main',
    iconColor: 'error.main'
  },
  warning: {
    color: 'warning.main',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    borderColor: 'warning.main',
    iconColor: 'warning.main'
  },
  info: {
    color: 'info.main',
    bgColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: 'info.main',
    iconColor: 'info.main'
  },
  loading: {
    color: 'primary.main',
    bgColor: 'rgba(25, 118, 210, 0.1)',
    borderColor: 'primary.main',
    iconColor: 'primary.main'
  },
  custom: {
    color: 'text.primary',
    bgColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'divider',
    iconColor: 'text.secondary'
  }
};

/**
 * Toast principal moderne
 */
const ModernToast = ({
  // État
  open = false,
  onClose,
  
  // Contenu
  title,
  message,
  type = 'info',
  icon: customIcon,
  
  // Actions
  action,
  persistent = false,
  autoHideDuration = 4000,
  
  // Position
  position = 'bottom-right',
  
  // États spéciaux
  loading = false,
  progress = false,
  
  // Avancé
  showTimestamp = false,
  showAvatar = false,
  avatar,
  metadata,
  
  // Animations
  animated = true,
  enterAnimation = 'slideIn',
  
  // Configuration visuelle
  variant = 'default', // default, compact, detailed, card
  maxWidth = 400,
  
  // Callbacks
  onAction,
  onTimeout,
  
  // Props supplémentaires
  sx = {},
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimation();
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  
  // Configuration du toast
  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = customIcon || notificationIcons[type] || notificationIcons.info;
  
  // Position du toast
  const positionStyles = {
    'top-right': { top: 24, right: 24, maxWidth },
    'top-left': { top: 24, left: 24, maxWidth },
    'top-center': { top: 24, left: '50%', transform: 'translateX(-50%)', maxWidth },
    'bottom-right': { bottom: 24, right: 24, maxWidth },
    'bottom-left': { bottom: 24, left: 24, maxWidth },
    'bottom-center': { bottom: 24, left: '50%', transform: 'translateX(-50%)', maxWidth },
    'center': { 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)', 
      maxWidth: Math.min(maxWidth, 500) 
    }
  };
  
  // Gestion du timeout automatique
  useEffect(() => {
    if (open && !persistent && autoHideDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, autoHideDuration);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, persistent, autoHideDuration]);
  
  // Animation d'entrée
  const getEnterAnimation = () => {
    const animations = {
      slideIn: {
        initial: { opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.9 }
      },
      fadeIn: {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
      },
      bounceIn: {
        initial: { opacity: 0, scale: 0.3, y: -100 },
        animate: { 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20
          }
        },
        exit: { opacity: 0, scale: 0.3, y: 100 }
      },
      zoomIn: {
        initial: { opacity: 0, scale: 0 },
        animate: { 
          opacity: 1, 
          scale: 1,
          rotate: [0, 5, -5, 0],
          transition: {
            duration: 0.4,
            ease: 'easeOut'
          }
        },
        exit: { opacity: 0, scale: 0 }
      }
    };
    
    return animations[enterAnimation] || animations.slideIn;
  };
  
  // Gestion de la fermeture
  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onClose?.();
  };
  
  // Gestion des actions
  const handleAction = () => {
    handleClose();
    onAction?.();
    if (action?.onClick) {
      action.onClick();
    }
  };
  
  // Progression du toast
  const [progressValue, setProgressValue] = useState(100);
  
  useEffect(() => {
    if (open && progress && !persistent && autoHideDuration > 0 && !prefersReducedMotion) {
      const startTime = Date.now();
      const duration = autoHideDuration;
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const progressPercent = (remaining / duration) * 100;
        
        setProgressValue(progressPercent);
        
        if (remaining > 0) {
          requestAnimationFrame(updateProgress);
        }
      };
      
      updateProgress();
    }
  }, [open, progress, persistent, autoHideDuration, prefersReducedMotion]);
  
  // Formatage du timestamp
  const getTimestamp = () => {
    if (!showTimestamp) return null;
    const now = new Date();
    return now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Rendu du contenu selon le variant
  const renderContent = () => {
    const baseContent = (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
        {/* Icône */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minWidth: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: config.bgColor,
          color: config.iconColor,
          flexShrink: 0
        }}>
          {loading ? (
            <motion.div
              animate={!prefersReducedMotion ? {
                rotate: 360,
                transition: { duration: 1, repeat: Infinity, ease: 'linear' }
              } : undefined}
            >
              <Refresh />
            </motion.div>
          ) : (
            <IconComponent />
          )}
        </Box>
        
        {/* Contenu principal */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {(title || showAvatar) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {showAvatar && avatar && (
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: avatar.color || 'primary.main',
                    fontSize: '0.75rem'
                  }}
                >
                  {avatar.name?.charAt(0) || avatar.charAt(0) || 'U'}
                </Avatar>
              )}
              {title && (
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary',
                    flex: 1
                  }}
                  noWrap
                >
                  {title}
                </Typography>
              )}
              {showTimestamp && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  {getTimestamp()}
                </Typography>
              )}
            </Box>
          )}
          
          {message && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                lineHeight: 1.4,
                ...(variant === 'compact' && { fontSize: '0.8rem' })
              }}
            >
              {message}
            </Typography>
          )}
          
          {/* Métadonnées */}
          {metadata && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {metadata.map((meta, index) => (
                <Chip
                  key={index}
                  label={meta.label}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 20,
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
        
        {/* Bouton de fermeture */}
        {!persistent && (
          <ModernIconButton
            size="small"
            onClick={handleClose}
            sx={{ 
              minWidth: 32,
              height: 32,
              flexShrink: 0
            }}
          >
            <Close />
          </ModernIconButton>
        )}
      </Box>
    );
    
    // Variant détaillé avec actions supplémentaires
    if (variant === 'detailed') {
      return (
        <Box>
          {baseContent}
          
          {/* Actions rapides */}
          {action && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {action.secondary && (
                  <ModernButton
                    variant="outlined"
                    size="small"
                    onClick={action.secondary.onClick}
                  >
                    {action.secondary.label}
                  </ModernButton>
                )}
                <ModernButton
                  variant="contained"
                  size="small"
                  onClick={handleAction}
                >
                  {action.label || 'Confirmer'}
                </ModernButton>
              </Box>
            </>
          )}
        </Box>
      );
    }
    
    return baseContent;
  };
  
  if (!open) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={animated && !prefersReducedMotion ? getEnterAnimation().initial : { opacity: 1 }}
        animate={animated && !prefersReducedMotion ? getEnterAnimation().animate : { opacity: 1 }}
        exit={animated && !prefersReducedMotion ? getEnterAnimation().exit : { opacity: 0 }}
        transition={animated && !prefersReducedMotion ? {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        } : {}}
        style={{
          position: 'fixed',
          zIndex: 9999,
          ...positionStyles[position],
          pointerEvents: 'auto'
        }}
        {...props}
      >
        <Paper
          elevation={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: variant === 'compact' ? 2 : 3,
            backgroundColor: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            borderRadius: variant === 'card' ? 2 : 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
            position: 'relative',
            minWidth: Math.min(maxWidth, 320),
            maxWidth: maxWidth,
            ...sx
          }}
        >
          {/* Barre de progression */}
          {progress && !persistent && (
            <motion.div
              initial={animated && !prefersReducedMotion ? { width: '100%' } : undefined}
              animate={animated && !prefersReducedMotion ? { 
                width: `${progressValue}%` 
              } : undefined}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: 2,
                backgroundColor: config.color,
                borderRadius: '0 0 2px 0'
              }}
            />
          )}
          
          {/* Contenu selon le variant */}
          {variant === 'card' ? (
            <Box sx={{ width: '100%' }}>
              {renderContent()}
            </Box>
          ) : (
            renderContent()
          )}
          
          {/* Action unique */}
          {action && variant === 'default' && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              ml: 2,
              borderLeft: '1px solid',
              borderColor: 'divider',
              pl: 2
            }}>
              <ModernButton
                variant="text"
                size="small"
                onClick={handleAction}
                sx={{ 
                  minWidth: 'auto',
                  px: 1
                }}
              >
                {action.label || 'Action'}
              </ModernButton>
            </Box>
          )}
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Container de toasts avec gestion de multiple notifications
 */
const ToastContainer = ({
  toasts = [],
  position = 'bottom-right',
  maxToasts = 5,
  spacing = 1,
  animated = true,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const filteredToasts = toasts.slice(0, maxToasts);
  
  // Configuration de position pour les toasts multiples
  const getContainerStyle = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none'
    };
    
    const positionMap = {
      'top-right': { top: 24, right: 24 },
      'top-left': { top: 24, left: 24 },
      'top-center': { top: 24, left: '50%', transform: 'translateX(-50%)' },
      'bottom-right': { bottom: 24, right: 24 },
      'bottom-left': { bottom: 24, left: 24 },
      'bottom-center': { bottom: 24, left: '50%', transform: 'translateX(-50%)' }
    };
    
    return { ...baseStyles, ...positionMap[position] };
  };
  
  return (
    <Box sx={getContainerStyle()}>
      <AnimatePresence>
        {filteredToasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={animated && !prefersReducedMotion ? {
              opacity: 0,
              y: position.includes('top') ? -20 : 20,
              scale: 0.9
            } : { opacity: 1 }}
            animate={animated && !prefersReducedMotion ? {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { delay: index * spacing * 0.1 }
            } : {}}
            exit={animated && !prefersReducedMotion ? {
              opacity: 0,
              y: position.includes('top') ? -20 : 20,
              scale: 0.9,
              transition: { duration: 0.2 }
            } : {}}
            style={{ 
              pointerEvents: 'auto',
              marginBottom: index > 0 ? spacing * 8 : 0
            }}
          >
            <ModernToast
              {...toast}
              position={position}
              animated={animated}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

/**
 * Hook pour gérer les toasts
 */
const useToast = (initialToasts = []) => {
  const [toasts, setToasts] = useState(initialToasts);
  
  const addToast = (toast) => {
    const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const updateToast = (id, updates) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  };
  
  const clearAll = () => {
    setToasts([]);
  };
  
  // Méthodes rapides
  const showSuccess = (message, options = {}) => {
    return addToast({ type: 'success', message, ...options });
  };
  
  const showError = (message, options = {}) => {
    return addToast({ type: 'error', message, autoHideDuration: 6000, ...options });
  };
  
  const showWarning = (message, options = {}) => {
    return addToast({ type: 'warning', message, ...options });
  };
  
  const showInfo = (message, options = {}) => {
    return addToast({ type: 'info', message, ...options });
  };
  
  const showLoading = (message, options = {}) => {
    return addToast({ 
      type: 'loading', 
      message, 
      persistent: true,
      progress: true,
      ...options 
    });
  };
  
  return {
    toasts,
    addToast,
    removeToast,
    updateToast,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };
};

export { ModernToast, ToastContainer, useToast };
export default ModernToast;