// src/components/ui/ModernActionButton.js - Boutons d'action modernes avec animations

import React, { useState, useEffect, forwardRef } from 'react';
import {
  Button,
  Box,
  Typography,
  Tooltip,
  CircularProgress,
  IconButton,
  Fab,
  Badge
} from '@mui/material';
import {
  Add,
  Save,
  Edit,
  Delete,
  Check,
  Close,
  Upload,
  Download,
  Print,
  Share,
  Refresh,
  Settings,
  Search,
  Filter,
  Sort,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  Assignment,
  AssignmentReturn,
  History,
  Warning,
  Info,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

import { useReducedMotion } from '../animations/AnimationSystem';

/**
 * Types de boutons prédéfinis
 */
export const buttonTypes = {
  primary: {
    variant: 'contained',
    color: 'primary',
    size: 'large',
    icon: <Check />,
    label: 'Confirmer'
  },
  secondary: {
    variant: 'outlined',
    color: 'primary',
    size: 'medium',
    icon: <Edit />,
    label: 'Modifier'
  },
  success: {
    variant: 'contained',
    color: 'success',
    size: 'medium',
    icon: <CheckCircle />,
    label: 'Succès'
  },
  danger: {
    variant: 'contained',
    color: 'error',
    size: 'medium',
    icon: <Delete />,
    label: 'Supprimer'
  },
  warning: {
    variant: 'contained',
    color: 'warning',
    size: 'medium',
    icon: <Warning />,
    label: 'Attention'
  },
  info: {
    variant: 'contained',
    color: 'info',
    size: 'medium',
    icon: <Info />,
    label: 'Info'
  },
  floating: {
    variant: 'fab',
    color: 'primary',
    size: 'large',
    icon: <Add />,
    label: 'Ajouter'
  },
  icon: {
    variant: 'icon',
    color: 'primary',
    size: 'medium',
    icon: <MoreVert />,
    label: 'Actions'
  }
};

/**
 * Icônes prédéfinies pour les actions
 */
export const actionIcons = {
  add: Add,
  save: Save,
  edit: Edit,
  delete: Delete,
  confirm: Check,
  cancel: Close,
  upload: Upload,
  download: Download,
  print: Print,
  share: Share,
  refresh: Refresh,
  settings: Settings,
  search: Search,
  filter: Filter,
  sort: Sort,
  more: MoreVert,
  up: ArrowUpward,
  down: ArrowDownward,
  loan: Assignment,
  return: AssignmentReturn,
  history: History,
  success: CheckCircle,
  error: Error,
  warning: Warning,
  info: Info
};

/**
 * Bouton d'action moderne principal
 */
const ModernActionButton = forwardRef(({
  // Props du type de bouton
  type = 'primary',
  customConfig = {},
  
  // Props de contenu
  icon: iconProp,
  label,
  shortLabel,
  
  // Props d'état
  loading = false,
  disabled = false,
  selected = false,
  badge,
  tooltip,
  
  // Props de comportement
  confirm = false,
  confirmMessage = 'Êtes-vous sûr de vouloir continuer ?',
  onClick,
  
  // Props d'apparence
  size = 'medium',
  variant,
  color,
  fullWidth = false,
  
  // Props d'animation
  animated = true,
  pulse = false,
  bounce = false,
  
  // Props de placement
  position = 'relative', // relative, fixed, absolute
  
  // Autres props
  children,
  sx = {},
  ...props
}, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Configuration du bouton
  const baseConfig = buttonTypes[type] || {};
  const config = {
    ...baseConfig,
    ...customConfig,
    variant: variant || baseConfig.variant,
    color: color || baseConfig.color,
    size: size || baseConfig.size
  };
  
  // Icône
  const IconComponent = iconProp || config.icon;
  
  // Animation de confirmation
  const handleClick = async (event) => {
    if (loading || disabled) return;
    
    if (confirm && !isConfirming) {
      setIsConfirming(true);
      
      // Animation de secousse pour demander confirmation
      if (animated && !prefersReducedMotion) {
        await controls.start({
          x: [-5, 5, -5, 5, 0],
          transition: { duration: 0.3, ease: 'easeOut' }
        });
      }
      
      // Auto-confirmation après 2 secondes si pas de réponse
      setTimeout(() => {
        setIsConfirming(false);
      }, 2000);
      
      return;
    }
    
    setIsConfirming(false);
    
    // Animation de feedback
    if (animated && !prefersReducedMotion) {
      await controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.2, ease: 'easeOut' }
      });
    }
    
    if (onClick) {
      onClick(event);
    }
  };
  
  // Animations du bouton
  const buttonVariants = {
    initial: { scale: 1 },
    hover: animated && !prefersReducedMotion ? {
      scale: 1.05,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: { duration: 0.15, ease: 'easeOut' }
    } : {},
    tap: animated && !prefersReducedMotion ? {
      scale: 0.95,
      transition: { duration: 0.1, ease: 'easeOut' }
    } : {},
    pulse: pulse && !prefersReducedMotion ? {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    } : {},
    bounce: bounce && !prefersReducedMotion ? {
      y: [0, -3, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 2,
        ease: 'easeInOut'
      }
    } : {},
    loading: {
      scale: 0.98
    },
    confirming: animated && !prefersReducedMotion ? {
      x: [-2, 2, -2, 2, 0],
      backgroundColor: 'warning.main',
      transition: { 
        duration: 0.3,
        repeat: 2,
        ease: 'easeOut' 
      }
    } : {}
  };
  
  // Styles conditionnels
  const getButtonStyles = () => ({
    position,
    ...(selected && {
      bgcolor: `${config.color}.main`,
      color: 'white',
      '&:hover': {
        bgcolor: `${config.color}.dark`,
      }
    }),
    ...(disabled && {
      opacity: 0.6,
      cursor: 'not-allowed'
    }),
    ...(isConfirming && {
      bgcolor: 'warning.main',
      color: 'white'
    }),
    ...sx
  });
  
  // Contenu du bouton
  const renderButtonContent = () => {
    if (config.variant === 'fab') {
      return (
        <Fab
          ref={ref}
          color={config.color}
          size={config.size}
          onClick={handleClick}
          disabled={disabled || loading}
          sx={getButtonStyles()}
          {...props}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <CircularProgress size={24} color="inherit" />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                {IconComponent}
              </motion.div>
            )}
          </AnimatePresence>
        </Fab>
      );
    }
    
    if (config.variant === 'icon') {
      return (
        <motion.div
          ref={ref}
          variants={buttonVariants}
          initial="initial"
          animate={animated && !prefersReducedMotion ? {
            ...buttonVariants.hover,
            ...(loading && 'loading'),
            ...(isConfirming && 'confirming'),
            ...(pulse && 'pulse'),
            ...(bounce && 'bounce')
          } : undefined}
          whileTap={animated && !prefersReducedMotion ? 'tap' : undefined}
        >
          <Tooltip
            title={tooltip || label || 'Action'}
            open={showTooltip && Boolean(tooltip || label)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            arrow
          >
            <Badge
              badgeContent={badge}
              color={badge?.color || 'error'}
              invisible={!badge}
            >
              <IconButton
                color={config.color}
                size={config.size}
                onClick={handleClick}
                disabled={disabled || loading}
                sx={getButtonStyles()}
                {...props}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CircularProgress size={20} color="inherit" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {IconComponent}
                    </motion.div>
                  )}
                </AnimatePresence>
              </IconButton>
            </Badge>
          </Tooltip>
        </motion.div>
      );
    }
    
    // Bouton standard
    return (
      <motion.div
        ref={ref}
        variants={buttonVariants}
        initial="initial"
        animate={animated && !prefersReducedMotion ? {
          ...buttonVariants.hover,
          ...(loading && 'loading'),
          ...(isConfirming && 'confirming'),
          ...(pulse && 'pulse'),
          ...(bounce && 'bounce')
        } : undefined}
        whileTap={animated && !prefersReducedMotion ? 'tap' : undefined}
        style={{ display: 'inline-block', width: fullWidth ? '100%' : 'auto' }}
      >
        <Button
          fullWidth={fullWidth}
          variant={config.variant}
          color={config.color}
          size={config.size}
          onClick={handleClick}
          disabled={disabled || loading}
          startIcon={IconComponent && !loading && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {IconComponent}
            </motion.span>
          )}
          endIcon={loading ? (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CircularProgress size={16} color="inherit" />
            </motion.span>
          ) : null}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            position: 'relative',
            overflow: 'hidden',
            ...getButtonStyles(),
            // Effet de brillance au hover
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transition: 'left 0.5s',
            },
            '&:hover::before': {
              left: '100%',
            },
            // Animation de confirmation
            ...(isConfirming && {
              animation: !prefersReducedMotion ? 'pulse 0.3s ease-in-out 2' : 'none'
            })
          }}
          {...props}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Chargement...
              </motion.span>
            ) : isConfirming ? (
              <motion.span
                key="confirming"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <motion.div
                  animate={!prefersReducedMotion ? {
                    rotate: [0, 360],
                    transition: { duration: 1, repeat: Infinity, ease: 'linear' }
                  } : undefined}
                >
                  <Warning />
                </motion.div>
                Confirmer ?
              </motion.span>
            ) : (
              <motion.span
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {shortLabel || label || children}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    );
  };
  
  return renderButtonContent();
});

/**
 * Groupe de boutons d'action avec animations fluides
 */
export const ModernActionGroup = ({
  buttons = [],
  direction = 'row', // row, column
  spacing = 1,
  fullWidth = false,
  animated = true,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const groupVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div
      variants={animated && !prefersReducedMotion ? groupVariants : undefined}
      initial={animated && !prefersReducedMotion ? 'initial' : undefined}
      animate={animated && !prefersReducedMotion ? 'animate' : undefined}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: direction,
          gap: spacing,
          ...(fullWidth && { width: '100%' }),
          ...props.sx
        }}
        {...props}
      >
        {buttons.map((button, index) => (
          <motion.div
            key={button.key || index}
            variants={animated && !prefersReducedMotion ? itemVariants : undefined}
          >
            <ModernActionButton {...button} />
          </motion.div>
        ))}
      </Box>
    </motion.div>
  );
};

/**
 * Barre d'actions flottante
 */
export const ModernFloatingActionBar = ({
  actions = [],
  position = 'bottom-right', // bottom-right, bottom-left, top-right, top-left
  spacing = 1,
  animated = true,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const positionStyles = {
    'bottom-right': { bottom: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'top-right': { top: 24, right: 24 },
    'top-left': { top: 24, left: 24 }
  };
  
  const barVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: position.includes('bottom') ? 20 : -20
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };
  
  return (
    <motion.div
      variants={animated && !prefersReducedMotion ? barVariants : undefined}
      initial={animated && !prefersReducedMotion ? 'initial' : undefined}
      animate={animated && !prefersReducedMotion ? 'animate' : undefined}
      style={{
        position: 'fixed',
        zIndex: 1000,
        ...positionStyles[position],
        ...props.sx
      }}
      {...props}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing,
          backgroundColor: 'background.paper',
          borderRadius: 3,
          padding: 1,
          boxShadow: 4,
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        {actions.map((action, index) => (
          <ModernActionButton
            key={action.key || index}
            type="icon"
            size="small"
            {...action}
          />
        ))}
      </Box>
    </motion.div>
  );
};

export default ModernActionButton;
export {
  ModernActionButton,
  ModernActionGroup,
  ModernFloatingActionBar,
  buttonTypes,
  actionIcons
};