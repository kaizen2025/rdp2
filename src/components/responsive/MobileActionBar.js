// src/components/responsive/MobileActionBar.js - Barre d'actions optimisée mobile

import React from 'react';
import {
  Box,
  Paper,
  Fab,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  IconButton,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  AssignmentReturn as ReturnIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * Barre d'actions contextuelle mobile avec animations optimisées
 */
const MobileActionBar = ({
  visible = true,
  onAdd,
  onReturn,
  onEdit,
  onExtend,
  onHistory,
  onCancel,
  onFilter,
  onRefresh,
  selectedCount = 0,
  actions = [],
  position = 'bottom-right',
  showBulkActions = false,
  onBulkAction,
  bulkActions = []
}) => {
  const theme = useTheme();
  const { isMobile, isTouch } = useBreakpoint();
  const [fabOpen, setFabOpen] = React.useState(false);
  const [speedDialOpen, setSpeedDialOpen] = React.useState(false);

  // Ne pas afficher sur desktop
  if (!isMobile || !visible) {
    return null;
  }

  // Position du FAB
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: theme.zIndex.fab,
      pointerEvents: 'none'
    };

    switch (position) {
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: theme.spacing(2),
          left: theme.spacing(2),
          pointerEvents: 'auto'
        };
      case 'bottom-center':
        return {
          ...baseStyles,
          bottom: theme.spacing(2),
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto'
        };
      case 'bottom-right':
      default:
        return {
          ...baseStyles,
          bottom: theme.spacing(2),
          right: theme.spacing(2),
          pointerEvents: 'auto'
        };
    }
  };

  // Actions principales
  const primaryActions = [
    {
      icon: <AddIcon />,
      name: 'Nouveau prêt',
      onClick: onAdd,
      color: 'primary'
    },
    ...(onReturn ? [{
      icon: <ReturnIcon />,
      name: 'Retour rapide',
      onClick: onReturn,
      color: 'success'
    }] : []),
    ...(onFilter ? [{
      icon: <FilterIcon />,
      name: 'Filtres',
      onClick: onFilter,
      color: 'default'
    }] : []),
    ...(onRefresh ? [{
      icon: <RefreshIcon />,
      name: 'Actualiser',
      onClick: onRefresh,
      color: 'default'
    }] : [])
  ];

  // Actions secondaires avec menu étendu
  const secondaryActions = [
    ...(onEdit ? [{
      icon: <EditIcon />,
      name: 'Modifier',
      onClick: onEdit
    }] : []),
    ...(onExtend ? [{
      icon: <EditIcon />,
      name: 'Prolonger',
      onClick: onExtend
    }] : []),
    ...(onHistory ? [{
      icon: <HistoryIcon />,
      name: 'Historique',
      onClick: onHistory
    }] : []),
    ...(onCancel ? [{
      icon: <CancelIcon />,
      name: 'Annuler',
      onClick: onCancel,
      color: 'error'
    }] : []),
    ...actions
  ];

  // Actions en lot
  const bulkActionsMenu = [
    ...(onBulkAction ? [{
      icon: <ReturnIcon />,
      name: 'Retour en lot',
      onClick: () => onBulkAction('bulkReturn')
    }] : []),
    ...bulkActions
  ];

  // Prévenir la fermeture accidentelle
  const handleSpeedDialOpen = () => setSpeedDialOpen(true);
  const handleSpeedDialClose = () => setSpeedDialOpen(false);

  return (
    <Box sx={getPositionStyles()}>
      {/* Actions en lot */}
      {showBulkActions && selectedCount > 0 && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            bottom: isTouch ? 120 : 100,
            right: 0,
            mb: 1,
            borderRadius: 2,
            minWidth: 200,
            maxWidth: 280,
            pointerEvents: 'auto',
            animation: 'slideInUp 0.3s ease-out'
          }}
        >
          <Box sx={{ p: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 1 
            }}>
              <Badge 
                badgeContent={selectedCount} 
                color="primary"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Sélection
                </span>
              </Badge>
              <IconButton
                size="small"
                onClick={() => onBulkAction?.('clear')}
                sx={{ p: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {bulkActionsMenu.map((action, index) => (
              <IconButton
                key={index}
                onClick={action.onClick}
                color={action.color || 'default'}
                sx={{ 
                  width: '100%',
                  justifyContent: 'flex-start',
                  p: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                {action.icon}
                <Box sx={{ ml: 1 }}>
                  <span style={{ fontSize: '0.875rem' }}>
                    {action.name}
                  </span>
                </Box>
              </IconButton>
            ))}
          </Box>
        </Paper>
      )}

      {/* FAB Principal avec SpeedDial pour actions secondaires */}
      <SpeedDial
        ariaLabel="Actions rapides"
        icon={<SpeedDialIcon />}
        onOpen={handleSpeedDialOpen}
        onClose={handleSpeedDialClose}
        open={speedDialOpen}
        direction="up"
        FabProps={{
          color: 'primary',
          sx: {
            pointerEvents: 'auto',
            // Optimisations tactiles
            touchAction: 'manipulation',
            '&:active': {
              transform: 'scale(0.95)'
            }
          }
        }}
        hidden={false}
        sx={{
          // Masquer sur très petits écrans si pas d'actions
          display: secondaryActions.length > 0 ? 'flex' : 'none'
        }}
      >
        {secondaryActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen
            onClick={action.onClick}
            FabProps={{
              color: action.color || 'default',
              size: 'medium'
            }}
          />
        ))}
      </SpeedDial>

      {/* Boutons d'actions directes pour les actions principales */}
      {!speedDialOpen && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1,
          mt: 1 
        }}>
          {primaryActions.map((action, index) => (
            <Tooltip 
              key={index} 
              title={action.name} 
              placement="left"
              arrow
            >
              <Fab
                size={isTouch ? 'large' : 'medium'}
                color={action.color || 'default'}
                onClick={action.onClick}
                sx={{
                  pointerEvents: 'auto',
                  // Optimisations tactiles
                  touchAction: 'manipulation',
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                {action.icon}
              </Fab>
            </Tooltip>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MobileActionBar;