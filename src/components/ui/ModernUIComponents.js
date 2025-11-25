// src/components/ui/ModernUIComponents.js - Composants UI modernes avec animations fluides

import React, { useState, forwardRef } from 'react';
import {
  Card,
  CardContent,
  Button,
  IconButton,
  Box,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  Skeleton,
  Fade,
  Zoom,
  Grow,
  Collapse
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  CheckCircle,
  Error,
  Warning,
  Info
} from '@mui/icons-material';

// Import des animations
import {
  animationConfig,
  useReducedMotion,
  StaggerContainer,
  StaggerItem,
  AnimatedFeedback,
  AnimatedLoader,
  AnimatedSkeleton,
  useAnimationContext
} from '../animations/AnimationSystem';

/**
 * Carte moderne avec animations fluides
 */
export const ModernCard = forwardRef(({
  children,
  variant = 'elevated',
  interactive = true,
  animated = true,
  hoverElevation = 8,
  onClick,
  ...props
}, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      boxShadow: interactive ? '0 4px 16px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'
    },
    hover: interactive ? {
      y: -4,
      scale: 1.02,
      boxShadow: `0 8px ${hoverElevation}px rgba(0,0,0,0.2)`,
      transition: { duration: 0.2, ease: 'easeOut' }
    } : {},
    tap: interactive ? {
      scale: 0.98,
      transition: { duration: 0.1, ease: 'easeOut' }
    } : {}
  };
  
  const cardStyles = {
    cursor: interactive ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    ...(variant === 'outlined' && {
      border: '1px solid rgba(0,0,0,0.12)',
    }),
    ...(variant === 'filled' && {
      backgroundColor: 'rgba(0,0,0,0.04)',
    })
  };
  
  return (
    <motion.div
      ref={ref}
      variants={animated && !prefersReducedMotion ? cardVariants : undefined}
      initial={animated && !prefersReducedMotion ? 'initial' : undefined}
      animate={animated && !prefersReducedMotion ? 'animate' : undefined}
      whileHover={animated && !prefersReducedMotion ? 'hover' : undefined}
      whileTap={animated && !prefersReducedMotion ? 'tap' : undefined}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={cardStyles}
      {...props}
    >
      <Card 
        sx={{ 
          height: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          ...(variant === 'glass' && {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          })
        }}
      >
        {children}
      </Card>
      
      {/* Effet de brillance au hover */}
      <AnimatePresence>
        {interactive && isHovered && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 0.1, x: '100%' }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/**
 * Bouton moderne avec micro-animations
 */
export const ModernButton = forwardRef(({
  children,
  variant = 'contained',
  size = 'medium',
  animated = true,
  loading = false,
  icon,
  iconPosition = 'end',
  fullWidth = false,
  ...props
}, ref) => {
  const { controls, animateAction } = useAnimationContext();
  const prefersReducedMotion = useReducedMotion();
  
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
    loading: {
      scale: 0.98
    }
  };
  
  const iconVariants = {
    initial: { x: 0, opacity: 1 },
    loading: {
      x: fullWidth ? -20 : -10,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  };
  
  const spinnerVariants = {
    initial: { x: fullWidth ? 20 : 10, opacity: 0 },
    loading: {
      x: 0,
      opacity: 1,
      rotate: 360,
      transition: { 
        rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
        opacity: { duration: 0.2, ease: 'easeOut' }
      }
    }
  };
  
  const handleClick = (e) => {
    if (loading) return;
    
    // Animation de feedback
    animateAction('success', 0.3);
    
    if (props.onClick) {
      props.onClick(e);
    }
  };
  
  return (
    <motion.div
      ref={ref}
      variants={buttonVariants}
      initial="initial"
      animate={{
        ...(loading && 'loading'),
        ...(animated && !prefersReducedMotion && {
          ...buttonVariants.hover,
          ...buttonVariants.tap
        })
      }}
      whileTap={animated && !prefersReducedMotion ? 'tap' : undefined}
      style={{ display: 'inline-block', width: fullWidth ? '100%' : 'auto' }}
    >
      <Button
        fullWidth={fullWidth}
        size={size}
        variant={variant}
        onClick={handleClick}
        disabled={loading || props.disabled}
        startIcon={
          icon && iconPosition === 'start' && (
            <motion.span
              variants={iconVariants}
              animate={loading ? 'loading' : 'initial'}
            >
              {icon}
            </motion.span>
          )
        }
        endIcon={
          loading ? (
            <motion.span
              variants={spinnerVariants}
              animate="loading"
            >
              <AnimatedLoader type="spinner" size={16} color="inherit" />
            </motion.span>
          ) : icon && iconPosition === 'end' ? (
            <motion.span
              variants={iconVariants}
              animate={loading ? 'loading' : 'initial'}
            >
              {icon}
            </motion.span>
          ) : null
        }
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          position: 'relative',
          overflow: 'hidden',
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
          }
        }}
        {...props}
      >
        <motion.span
          animate={loading && prefersReducedMotion ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>
      </Button>
    </motion.div>
  );
});

/**
 * Icône bouton moderne
 */
export const ModernIconButton = forwardRef(({
  children,
  size = 'medium',
  animated = true,
  pulse = false,
  badge,
  ...props
}, ref) => {
  const prefersReducedMotion = useReducedMotion();
  
  const iconButtonVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: animated && !prefersReducedMotion ? {
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.15, ease: 'easeOut' }
    } : {},
    tap: animated && !prefersReducedMotion ? {
      scale: 0.9,
      transition: { duration: 0.1, ease: 'easeOut' }
    } : {},
    pulse: pulse && !prefersReducedMotion ? {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    } : {}
  };
  
  return (
    <motion.div
      ref={ref}
      variants={iconButtonVariants}
      initial="initial"
      animate={{
        ...(animated && !prefersReducedMotion && iconButtonVariants.hover),
        ...(pulse && 'pulse')
      }}
      whileTap={animated && !prefersReducedMotion ? 'tap' : undefined}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      <IconButton
        size={size}
        sx={{
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)',
          }
        }}
        {...props}
      >
        {children}
        
        {/* Badge */}
        {badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: badge.color || 'error.main',
              color: 'white',
              borderRadius: '50%',
              minWidth: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 1
            }}
          >
            {badge.content}
          </motion.div>
        )}
      </IconButton>
    </motion.div>
  );
});

/**
 * Carte de statistique moderne avec animation
 */
export const ModernStatsCard = forwardRef(({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  trend = 'neutral',
  animated = true,
  ...props
}, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const { controls } = useAnimationContext();
  
  const trendConfig = {
    up: { 
      icon: <TrendingUp />, 
      color: 'success.main',
      bgColor: 'rgba(76, 175, 80, 0.1)'
    },
    down: { 
      icon: <TrendingDown />, 
      color: 'error.main',
      bgColor: 'rgba(244, 67, 54, 0.1)'
    },
    neutral: { 
      icon: <TrendingFlat />, 
      color: 'text.secondary',
      bgColor: 'rgba(0, 0, 0, 0.04)'
    }
  };
  
  const currentTrend = trendConfig[trend];
  
  return (
    <ModernCard
      ref={ref}
      animated={animated}
      interactive={false}
      {...props}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 1, fontWeight: 500 }}
            >
              {title}
            </Typography>
            
            <motion.div
              initial={animated && !prefersReducedMotion ? { scale: 0.5, opacity: 0 } : undefined}
              animate={animated && !prefersReducedMotion ? { scale: 1, opacity: 1 } : undefined}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  mb: 1
                }}
              >
                {value}
              </Typography>
            </motion.div>
            
            {change && (
              <motion.div
                initial={animated && !prefersReducedMotion ? { x: -20, opacity: 0 } : undefined}
                animate={animated && !prefersReducedMotion ? { x: 0, opacity: 1 } : undefined}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Chip
                  icon={currentTrend.icon}
                  label={change}
                  size="small"
                  sx={{
                    bgcolor: currentTrend.bgColor,
                    color: currentTrend.color,
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: currentTrend.color
                    }
                  }}
                />
              </motion.div>
            )}
          </Box>
          
          {icon && (
            <motion.div
              initial={animated && !prefersReducedMotion ? { scale: 0, rotate: -180 } : undefined}
              animate={animated && !prefersReducedMotion ? { scale: 1, rotate: 0 } : undefined}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                color: 'primary.main'
              }}
            >
              {icon}
            </motion.div>
          )}
        </Box>
      </CardContent>
    </ModernCard>
  );
});

/**
 * Barre de progression animée
 */
export const ModernProgressBar = ({
  value = 0,
  color = 'primary',
  variant = 'determinate',
  animated = true,
  showLabel = false,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <Box sx={{ width: '100%' }}>
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progression
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(value)}%
          </Typography>
        </Box>
      )}
      
      <LinearProgress
        variant={variant}
        value={value}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            ...(animated && !prefersReducedMotion && {
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            })
          }
        }}
        {...props}
      />
    </Box>
  );
};

/**
 * Notification toast moderne
 */
export const ModernToast = ({
  open,
  onClose,
  message,
  severity = 'info',
  action,
  autoHideDuration = 4000,
  position = 'bottom-right',
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const severityConfig = {
    success: { 
      icon: <CheckCircle />, 
      color: 'success.main',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'success.main'
    },
    error: { 
      icon: <Error />, 
      color: 'error.main',
      bgColor: 'rgba(244, 67, 54, 0.1)',
      borderColor: 'error.main'
    },
    warning: { 
      icon: <Warning />, 
      color: 'warning.main',
      bgColor: 'rgba(255, 152, 0, 0.1)',
      borderColor: 'warning.main'
    },
    info: { 
      icon: <Info />, 
      color: 'info.main',
      bgColor: 'rgba(33, 150, 243, 0.1)',
      borderColor: 'info.main'
    }
  };
  
  const config = severityConfig[severity];
  
  const positionStyles = {
    'bottom-right': { bottom: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'top-right': { top: 24, right: 24 },
    'top-left': { top: 24, left: 24 },
    'top-center': { top: 24, left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: 24, left: '50%', transform: 'translateX(-50%)' }
  };
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ 
            opacity: 0, 
            y: 50,
            scale: 0.8
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: 1
          }}
          exit={{ 
            opacity: 0, 
            y: 50,
            scale: 0.8
          }}
          transition={!prefersReducedMotion ? {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          } : {}}
          style={{
            position: 'fixed',
            zIndex: 9999,
            ...positionStyles[position]
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              maxWidth: 400,
              padding: 2,
              backgroundColor: config.bgColor,
              border: `1px solid ${config.borderColor}`,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(8px)'
            }}
            {...props}
          >
            <Box sx={{ color: config.color, display: 'flex' }}>
              {config.icon}
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                {message}
              </Typography>
            </Box>
            
            {action && (
              <ModernButton
                variant="text"
                size="small"
                onClick={action.onClick}
                sx={{ minWidth: 'auto', p: 1 }}
              >
                {action.label}
              </ModernButton>
            )}
            
            <ModernIconButton
              size="small"
              onClick={onClose}
              sx={{ 
                minWidth: 32,
                height: 32,
                ml: 1
              }}
            >
              ×
            </ModernIconButton>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Skeleton moderne pour les loading states
 */
export const ModernSkeleton = ({
  variant = 'rectangular',
  width = '100%',
  height = 40,
  animation = 'wave',
  borderRadius = 2,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      animation={prefersReducedMotion ? false : animation}
      sx={{
        borderRadius,
        bgcolor: 'grey.200',
        '&::after': {
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
        }
      }}
      {...props}
    />
  );
};

export default {
  ModernCard,
  ModernButton,
  ModernIconButton,
  ModernStatsCard,
  ModernProgressBar,
  ModernToast,
  ModernSkeleton
};