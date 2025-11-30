// src/components/loan-management/LoanListResponsive.js - Version responsive complète

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
  Collapse,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  AssignmentReturn as AssignmentReturnIcon,
  Update as UpdateIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  SwipeLeft as SwipeLeftIcon,
  SwipeRight as SwipeRightIcon
} from '@mui/icons-material';

import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';
import ResponsiveGrid from '../responsive/ResponsiveGrid';
import MobileActionBar from '../responsive/MobileActionBar';
import DesktopSidebar from '../responsive/DesktopSidebar';

import SearchInput from '../../components/common/SearchInput';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';

const STATUS_CONFIG = {
  active: { label: 'Actif', color: 'success', priority: 1, icon: '✅' },
  reserved: { label: 'Réservé', color: 'info', priority: 2, icon: '📅' },
  overdue: { label: 'En retard', color: 'warning', priority: 3, icon: '⚠️' },
  critical: { label: 'Critique', color: 'error', priority: 4, icon: '🔴' },
  returned: { label: 'Retourné', color: 'default', priority: 5, icon: '✅' },
  cancelled: { label: 'Annulé', color: 'default', priority: 6, icon: '❌' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatAmount = (amount) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

/**
 * Card responsive pour un prêt - Optimisée mobile
 */
const LoanCard = React.memo(({ 
  loan, 
  onAction,
  getUserColor,
  expanded = false,
  onToggleExpand
}) => {
  const theme = useTheme();
  const { isMobile } = useBreakpoint();
  const cardRef = useRef(null);
  
  const config = STATUS_CONFIG[loan.status] || {};
  const isOverdue = loan.status === 'overdue' || loan.status === 'critical';
  const userColor = getUserColor?.(loan.userId) || '#2196f3';

  // Gestes de swipe pour actions rapides
  const swipeGestures = useSwipeGestures({
    elementRef: cardRef,
    onSwipeLeft: () => onAction('edit', loan),
    onSwipeRight: () => onAction('return', loan),
    onTap: () => onToggleExpand?.(),
    enableSwipe: isMobile,
    enableTap: true
  });

  return (
    <Card 
      ref={cardRef}
      {...swipeGestures.touchHandlers}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: isOverdue ? `2px solid ${theme.palette.error.main}` : '1px solid',
        borderColor: isOverdue ? theme.palette.error.main : 'divider',
        '&:hover': {
          elevation: 3,
          transform: isMobile ? 'none' : 'translateY(-2px)'
        },
        // Améliorer les performances sur mobile
        willChange: 'transform',
        touchAction: isMobile ? 'manipulation' : 'auto'
      }}
      onClick={() => onToggleExpand?.()}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Header avec statut et actions */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={config.label} 
              color={config.color} 
              size="small" 
              icon={<span>{config.icon}</span>}
            />
            {isOverdue && (
              <Badge 
                badgeContent="!" 
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              />
            )}
          </Box>
          
          {/* Menu d'actions */}
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              // Gérer le menu d'actions
            }}
            sx={{ 
              width: 32, 
              height: 32,
              touchAction: 'manipulation'
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Informations principales */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {loan.computerName || 'N/A'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar 
              sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: userColor,
                fontSize: '0.75rem'
              }}
            >
              {(loan.userDisplayName || loan.userName || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" fontWeight={500}>
              {loan.userDisplayName || loan.userName}
            </Typography>
          </Box>
          
          {loan.userDepartment && (
            <Typography variant="caption" color="textSecondary">
              {loan.userDepartment}
            </Typography>
          )}
        </Box>

        {/* Dates */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Prêt: {formatDate(loan.loanDate)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Retour: {formatDate(loan.expectedReturnDate)}
            {isOverdue && (
              <Typography variant="caption" color="error" component="span" sx={{ ml: 1 }}>
                ({Math.ceil((new Date() - new Date(loan.expectedReturnDate)) / (1000 * 60 * 60 * 24))} j)
              </Typography>
            )}
          </Typography>
        </Box>

        {/* Montant */}
        <Typography variant="body2" fontWeight={600}>
          {formatAmount(loan.amount)}
        </Typography>

        {/* Indicateurs visuels pour mobile */}
        {isMobile && (
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            justifyContent: 'space-around',
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="textSecondary">
              ← Modifier
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Retour →
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Actions de base */}
      <Collapse in={expanded}>
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Button 
            size="small" 
            startIcon={<AssignmentReturnIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onAction('return', loan);
            }}
            sx={{ touchAction: 'manipulation' }}
          >
            Retour
          </Button>
          <Button 
            size="small" 
            startIcon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onAction('edit', loan);
            }}
            sx={{ touchAction: 'manipulation' }}
          >
            Modifier
          </Button>
          <Button 
            size="small" 
            startIcon={<HistoryIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onAction('history', loan);
            }}
            sx={{ touchAction: 'manipulation' }}
          >
            Historique
          </Button>
        </CardActions>
      </Collapse>

      {/* Bouton d'expansion pour mobile */}
      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          pb: 1 
        }}>
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            sx={{ touchAction: 'manipulation' }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      )}
    </Card>
  );
});

/**
 * Tableau responsive pour desktop
 */
const ResponsiveTable = React.memo(({ 
  loans, 
  onAction, 
  getUserColor, 
  selectedLoans,
  onSelectLoan,
  onSelectAll
}) => {
  const theme = useTheme();
  const { isDesktop } = useBreakpoint();
  
  if (!isDesktop) return null;

  return (
    <Paper elevation={2} sx={{ overflow: 'auto' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        <Box sx={{ 
          p: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6">
            Liste des prêts ({loans.length})
          </Typography>
        </Box>
        
        {/* Tableau desktop ici - version simplifiée pour l'exemple */}
        <Box sx={{ p: 2 }}>
          {loans.map(loan => (
            <Box 
              key={loan.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 150px',
                gap: 2,
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box>
                <Typography variant="subtitle2">{loan.computerName}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {STATUS_CONFIG[loan.status]?.label}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2">{loan.userDisplayName}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {loan.userDepartment}
                </Typography>
              </Box>
              
              <Typography variant="body2">{formatDate(loan.loanDate)}</Typography>
              <Typography variant="body2">{formatDate(loan.expectedReturnDate)}</Typography>
              <Typography variant="body2">{formatAmount(loan.amount)}</Typography>
              
              <Box>
                <IconButton size="small" onClick={() => onAction('return', loan)}>
                  <AssignmentReturnIcon />
                </IconButton>
                <IconButton size="small" onClick={() => onAction('edit', loan)}>
                  <EditIcon />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
});

/**
 * Composant principal LoanListResponsive
 */
const LoanListResponsive = ({
  loans = [],
  onSaveLoan,
  onReturnLoan,
  onEditLoan,
  onExtendLoan,
  onCancelLoan,
  onHistoryLoan,
  getUserColor,
  statistics = {},
  loading = false
}) => {
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop, currentBreakpoint } = useBreakpoint();
  
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [viewMode, setViewMode] = useState('auto'); // 'auto', 'cards', 'table'
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [selectedLoans, setSelectedLoans] = useState(new Set());

  // Gestion des expanded cards
  const toggleCardExpansion = useCallback((loanId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(loanId)) {
        newSet.delete(loanId);
      } else {
        newSet.add(loanId);
      }
      return newSet;
    });
  }, []);

  // Filtrage
  const filteredLoans = useMemo(() => {
    if (!searchTerm) return loans;
    
    const term = searchTerm.toLowerCase();
    return loans.filter(loan =>
      loan.computerName?.toLowerCase().includes(term) ||
      loan.userDisplayName?.toLowerCase().includes(term) ||
      loan.userName?.toLowerCase().includes(term) ||
      loan.userDepartment?.toLowerCase().includes(term)
    );
  }, [loans, searchTerm]);

  // Déterminer le mode d'affichage
  const effectiveViewMode = viewMode === 'auto' 
    ? (isMobile || isTablet ? 'cards' : 'table')
    : viewMode;

  // Actions
  const handleAction = useCallback((action, loan) => {
    switch (action) {
      case 'return':
        onReturnLoan?.(loan);
        break;
      case 'edit':
        onEditLoan?.(loan);
        break;
      case 'extend':
        onExtendLoan?.(loan);
        break;
      case 'history':
        onHistoryLoan?.(loan);
        break;
      case 'cancel':
        onCancelLoan?.(loan);
        break;
      default:
        break;
    }
  }, [onReturnLoan, onEditLoan, onExtendLoan, onHistoryLoan, onCancelLoan]);

  // Actions rapides mobile
  const handleQuickAction = useCallback((action) => {
    switch (action) {
      case 'add':
        // Ouvrir dialog de création
        break;
      case 'refresh':
        // Rafraîchir les données
        break;
      case 'filter':
        // Ouvrir filtres
        break;
      default:
        break;
    }
  }, []);

  // Loading state
  if (loading) {
    return <LoadingScreen type="list" />;
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column'
    }}>
      {/* Sidebar desktop */}
      <DesktopSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        statistics={statistics}
        currentSection="loans"
      />

      {/* Contenu principal */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {/* Header avec recherche et filtres */}
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <ResponsiveGrid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Rechercher..."
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {}}
              >
                Filtres
              </Button>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={effectiveViewMode === 'cards' ? 'contained' : 'outlined'}
                  startIcon={<ViewModuleIcon />}
                  onClick={() => setViewMode('cards')}
                  size="small"
                >
                  Cards
                </Button>
                {isDesktop && (
                  <Button
                    variant={effectiveViewMode === 'table' ? 'contained' : 'outlined'}
                    startIcon={<ViewListIcon />}
                    onClick={() => setViewMode('table')}
                    size="small"
                  >
                    Tableau
                  </Button>
                )}
              </Box>
            </Grid>
          </ResponsiveGrid>

          {/* Statistiques */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Total: ${statistics.total || 0}`} color="primary" />
            <Chip label={`Actifs: ${statistics.active || 0}`} color="success" />
            <Chip label={`En retard: ${statistics.overdue || 0}`} color="warning" />
            <Chip label={`Critiques: ${statistics.critical || 0}`} color="error" />
          </Box>
        </Paper>

        {/* Contenu selon le mode */}
        <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {effectiveViewMode === 'cards' ? (
            <ResponsiveGrid container spacing={2}>
              {filteredLoans.length === 0 ? (
                <Grid item xs={12}>
                  <EmptyState 
                    type="search"
                    title="Aucun prêt trouvé"
                    description="Aucun prêt ne correspond à vos critères."
                  />
                </Grid>
              ) : (
                filteredLoans.map(loan => (
                  <Grid key={loan.id} item xs={12} sm={6} md={4} lg={3}>
                    <LoanCard
                      loan={loan}
                      onAction={handleAction}
                      getUserColor={getUserColor}
                      expanded={expandedCards.has(loan.id)}
                      onToggleExpand={() => toggleCardExpansion(loan.id)}
                    />
                  </Grid>
                ))
              )}
            </ResponsiveGrid>
          ) : (
            <ResponsiveTable
              loans={filteredLoans}
              onAction={handleAction}
              getUserColor={getUserColor}
              selectedLoans={selectedLoans}
              onSelectLoan={(loanId) => {
                setSelectedLoans(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(loanId)) {
                    newSet.delete(loanId);
                  } else {
                    newSet.add(loanId);
                  }
                  return newSet;
                });
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedLoans(new Set(filteredLoans.map(l => l.id)));
                } else {
                  setSelectedLoans(new Set());
                }
              }}
            />
          )}
        </Box>
      </Box>

      {/* Barre d'actions mobile */}
      <MobileActionBar
        visible={isMobile}
        onAdd={() => handleQuickAction('add')}
        onReturn={() => handleQuickAction('return')}
        onFilter={() => handleQuickAction('filter')}
        onRefresh={() => handleQuickAction('refresh')}
        selectedCount={selectedLoans.size}
        showBulkActions={selectedLoans.size > 0}
        onBulkAction={(action) => {
          if (action === 'clear') {
            setSelectedLoans(new Set());
          }
        }}
      />
    </Box>
  );
};

export default LoanListResponsive;