// src/components/ui/ModernLoanCard.js - Carte de prêt moderne avec animations

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  CardContent,
  Tooltip,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  History,
  Assignment,
  AssignmentReturn,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  Computer,
  AccessTime,
  LocalOffer
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { ModernCard, ModernButton, ModernIconButton } from './ModernUIComponents';
import { useAnimationContext, useReducedMotion } from '../animations/AnimationSystem';

/**
 * Badge de statut moderne
 */
const ModernStatusBadge = ({ status, animated = true }) => {
  const prefersReducedMotion = useReducedMotion();
  
  const statusConfig = {
    active: {
      label: 'Actif',
      color: 'success',
      icon: <CheckCircle />,
      bgColor: 'rgba(76, 175, 80, 0.1)',
      animation: { scale: [1, 1.05, 1] }
    },
    overdue: {
      label: 'En retard',
      color: 'error',
      icon: <Warning />,
      bgColor: 'rgba(244, 67, 54, 0.1)',
      animation: { x: [-2, 2, -2, 2, 0] }
    },
    critical: {
      label: 'Critique',
      color: 'error',
      icon: <Warning />,
      bgColor: 'rgba(244, 67, 54, 0.15)',
      animation: { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
    },
    reserved: {
      label: 'Réservé',
      color: 'warning',
      icon: <Schedule />,
      bgColor: 'rgba(255, 152, 0, 0.1)',
      animation: { scale: [1, 1.02, 1] }
    },
    returned: {
      label: 'Retourné',
      color: 'success',
      icon: <AssignmentReturn />,
      bgColor: 'rgba(76, 175, 80, 0.1)',
      animation: { scale: [1, 1.05, 1] }
    },
    cancelled: {
      label: 'Annulé',
      color: 'default',
      icon: <Delete />,
      bgColor: 'rgba(0, 0, 0, 0.05)',
      animation: { opacity: [0.7, 1, 0.7] }
    }
  };
  
  const config = statusConfig[status] || statusConfig.active;
  
  return (
    <motion.div
      animate={animated && !prefersReducedMotion ? config.animation : undefined}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bgColor,
          color: `${config.color}.main`,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 28,
          '& .MuiChip-icon': {
            fontSize: 16,
            color: `${config.color}.main`
          }
        }}
      />
    </motion.div>
  );
};

/**
 * Barre de progression de temps
 */
const TimeProgressBar = ({ startDate, endDate, status }) => {
  const prefersReducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const calculateProgress = () => {
      if (!startDate || !endDate) return;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      
      const totalDuration = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      
      let progressPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
      
      // Si le prêt est en retard
      if (status === 'overdue' || status === 'critical') {
        progressPercent = Math.min(100, progressPercent + 10);
      }
      
      setProgress(progressPercent);
      
      // Calcul du temps restant
      if (now < end) {
        const diff = end.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days}j ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h`);
        } else {
          setTimeLeft('< 1h');
        }
      } else {
        setTimeLeft('Échu');
      }
    };
    
    calculateProgress();
    const interval = setInterval(calculateProgress, 60000); // Mise à jour chaque minute
    
    return () => clearInterval(interval);
  }, [startDate, endDate, status]);
  
  const getProgressColor = () => {
    if (status === 'overdue' || status === 'critical') return 'error';
    if (progress > 80) return 'warning';
    return 'primary';
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Progression
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {timeLeft}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={getProgressColor()}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            ...(prefersReducedMotion ? {} : {
              transition: 'width 0.5s ease'
            })
          }
        }}
      />
    </Box>
  );
};

/**
 * Carte de prêt principale
 */
const ModernLoanCard = ({
  loan,
  user,
  computer,
  onEdit,
  onReturn,
  onExtend,
  onCancel,
  onHistory,
  onDelete,
  animated = true,
  showActions = true,
  compact = false,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { controls, animateAction } = useAnimationContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleAction = async (action, actionFunc) => {
    handleMenuClose();
    
    // Animation de feedback
    await animateAction('success', 0.3);
    
    if (actionFunc) {
      await actionFunc(loan);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const getPriorityLevel = () => {
    if (loan.status === 'critical') return 'critical';
    if (loan.status === 'overdue') return 'high';
    if (loan.status === 'reserved') return 'medium';
    return 'normal';
  };
  
  const priorityConfig = {
    critical: { borderColor: 'error.main', borderWidth: 2 },
    high: { borderColor: 'warning.main', borderWidth: 2 },
    medium: { borderColor: 'info.main', borderWidth: 1 },
    normal: { borderColor: 'transparent', borderWidth: 0 }
  };
  
  const currentPriority = priorityConfig[getPriorityLevel()];
  
  return (
    <motion.div
      initial={animated && !prefersReducedMotion ? {
        opacity: 0,
        y: 20,
        scale: 0.95
      } : undefined}
      animate={animated && !prefersReducedMotion ? {
        opacity: 1,
        y: 0,
        scale: 1
      } : undefined}
      whileHover={animated && !prefersReducedMotion ? {
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2, ease: 'easeOut' }
      } : undefined}
      style={{
        borderLeft: `${currentPriority.borderWidth}px solid ${currentPriority.borderColor}`,
        borderRadius: 8
      }}
    >
      <ModernCard
        interactive
        hoverElevation={12}
        {...props}
      >
        <CardContent sx={{ p: compact ? 2 : 3 }}>
          {/* Header avec avatar et actions */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: loan.status === 'active' ? 'success.main' : 
                               loan.status === 'overdue' ? 'error.main' :
                               loan.status === 'critical' ? 'error.main' : 'grey.500',
                      border: '2px solid white'
                    }}
                  />
                }
              >
                <Avatar
                  sx={{
                    bgcolor: user?.color || 'primary.main',
                    width: 48,
                    height: 48,
                    fontWeight: 'bold'
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </Badge>
              
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {user?.name || 'Utilisateur inconnu'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {loan.loanId || 'PR-000'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ModernStatusBadge status={loan.status} />
              
              {showActions && (
                <ModernIconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <MoreVert />
                </ModernIconButton>
              )}
            </Box>
          </Box>
          
          {/* Informations principales */}
          {!compact && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Computer sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {computer?.name || 'Ordinateur inconnu'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Du {formatDate(loan.startDate)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Au {formatDate(loan.endDate)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          
          {/* Barre de progression du temps */}
          <TimeProgressBar
            startDate={loan.startDate}
            endDate={loan.endDate}
            status={loan.status}
          />
          
          {/* Actions rapides */}
          {showActions && !compact && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mt: 3,
              flexWrap: 'wrap'
            }}>
              {loan.status === 'active' && (
                <>
                  <ModernButton
                    size="small"
                    variant="outlined"
                    onClick={() => handleAction('extend', onExtend)}
                    startIcon={<LocalOffer />}
                  >
                    Prolonger
                  </ModernButton>
                  <ModernButton
                    size="small"
                    variant="contained"
                    onClick={() => handleAction('return', onReturn)}
                    startIcon={<AssignmentReturn />}
                  >
                    Retourner
                  </ModernButton>
                </>
              )}
              
              {loan.status === 'reserved' && (
                <ModernButton
                  size="small"
                  variant="contained"
                  onClick={() => handleAction('activate', onEdit)}
                  startIcon={<Assignment />}
                >
                  Activer
                </ModernButton>
              )}
            </Box>
          )}
        </CardContent>
      </ModernCard>
      
      {/* Menu d'actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1,
            minWidth: 180
          }
        }}
      >
        <MenuItem onClick={() => handleAction('edit', onEdit)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={() => handleAction('history', onHistory)}>
          <History sx={{ mr: 1, fontSize: 20 }} />
          Historique
        </MenuItem>
        
        {loan.status === 'active' && (
          <>
            <MenuItem onClick={() => handleAction('extend', onExtend)}>
              <LocalOffer sx={{ mr: 1, fontSize: 20 }} />
              Prolonger
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleAction('cancel', onCancel)}>
              <Delete sx={{ mr: 1, fontSize: 20 }} />
              Annuler le prêt
            </MenuItem>
          </>
        )}
        
        {(loan.status === 'returned' || loan.status === 'cancelled') && (
          <MenuItem onClick={() => handleAction('delete', onDelete)}>
            <Delete sx={{ mr: 1, fontSize: 20 }} />
            Supprimer
          </MenuItem>
        )}
      </Menu>
    </motion.div>
  );
};

export default ModernLoanCard;
export { ModernLoanCard, ModernStatusBadge, TimeProgressBar };