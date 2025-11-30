// src/components/responsive/DesktopSidebar.js - Sidebar optimisée pour desktop

import React, { useState } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
  Paper,
  useTheme
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Assignment as LoansIcon,
  Add as AddIcon,
  Edit as EditIcon,
  AssignmentReturn as ReturnIcon,
  Update as UpdateIcon,
  History as HistoryIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * Sidebar desktop avec navigation contextuelle et actions rapides
 */
const DesktopSidebar = ({
  open = true,
  onClose,
  width = 320,
  position = 'left',
  sections = [],
  currentSection = 'loans',
  onSectionChange,
  statistics = {},
  quickActions = true
}) => {
  const theme = useTheme();
  const { isDesktop, isTablet } = useBreakpoint();
  const [expandedSections, setExpandedSections] = useState(new Set(['loans']));

  // Ne pas afficher sur mobile/tablette
  if (!isDesktop || (!open && !isTablet)) {
    return null;
  }

  // Toggle section expansion
  const handleToggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Actions rapides par défaut
  const defaultQuickActions = [
    {
      id: 'create',
      label: 'Créer un prêt',
      icon: <AddIcon />,
      color: 'primary',
      onClick: () => console.log('Create loan')
    },
    {
      id: 'return',
      label: 'Retour rapide',
      icon: <ReturnIcon />,
      color: 'success',
      onClick: () => console.log('Quick return')
    },
    {
      id: 'filters',
      label: 'Filtres avancés',
      icon: <FilterIcon />,
      color: 'default',
      onClick: () => console.log('Filters')
    }
  ];

  // Sections par défaut
  const defaultSections = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <DashboardIcon />,
      count: statistics.total || 0,
      subSections: [
        { id: 'active', label: 'Prêts actifs', count: statistics.active || 0 },
        { id: 'overdue', label: 'En retard', count: statistics.overdue || 0 },
        { id: 'critical', label: 'Critiques', count: statistics.critical || 0 }
      ]
    },
    {
      id: 'loans',
      label: 'Gestion des prêts',
      icon: <LoansIcon />,
      count: statistics.total || 0,
      subSections: [
        { id: 'create', label: 'Nouveau prêt', action: true },
        { id: 'list', label: 'Liste complète' },
        { id: 'templates', label: 'Modèles' }
      ]
    },
    {
      id: 'returns',
      label: 'Retours',
      icon: <ReturnIcon />,
      count: statistics.returned || 0,
      subSections: [
        { id: 'pending', label: 'Retours en attente' },
        { id: 'completed', label: 'Retours complétés' },
        { id: 'issues', label: 'Problèmes' }
      ]
    },
    {
      id: 'history',
      label: 'Historique',
      icon: <HistoryIcon />,
      subSections: [
        { id: 'all', label: 'Tous les prêts' },
        { id: 'user', label: 'Par utilisateur' },
        { id: 'technician', label: 'Par technicien' }
      ]
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: <SettingsIcon />,
      subSections: [
        { id: 'analytics', label: 'Analyses' },
        { id: 'export', label: 'Exports' },
        { id: 'settings', label: 'Configuration' }
      ]
    }
  ];

  const sidebarSections = sections.length > 0 ? sections : defaultSections;
  const sidebarActions = quickActions ? defaultQuickActions : [];

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'background.paper'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" fontWeight="bold">
          DocuCortex
        </Typography>
        {isTablet && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Actions rapides */}
      {sidebarActions.length > 0 && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Actions rapides
          </Typography>
          {sidebarActions.map((action) => (
            <Paper
              key={action.id}
              elevation={1}
              sx={{
                mb: 1,
                p: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  elevation: 2,
                  transform: 'translateY(-1px)'
                }
              }}
              onClick={action.onClick}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1 
              }}>
                <Box sx={{ 
                  color: `${action.color}.main`,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {action.icon}
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {action.label}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Divider />

      {/* Navigation principale */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ p: 1 }}>
          {sidebarSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const hasSubSections = section.subSections && section.subSections.length > 0;

            return (
              <Box key={section.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={currentSection === section.id}
                    onClick={() => {
                      if (hasSubSections) {
                        handleToggleSection(section.id);
                      } else {
                        onSectionChange?.(section.id);
                      }
                    }}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark'
                        }
                      }
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: currentSection === section.id ? 'primary.contrastText' : 'text.primary'
                      }}
                    >
                      {section.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={section.label}
                      primaryTypographyProps={{ fontWeight: currentSection === section.id ? 600 : 400 }}
                    />
                    {section.count !== undefined && (
                      <Chip 
                        size="small" 
                        label={section.count}
                        color={section.count > 0 ? 'primary' : 'default'}
                        sx={{ 
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    )}
                    {hasSubSections && (
                      <Box sx={{ 
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        <ExpandLess />
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>

                {/* Sous-sections */}
                {hasSubSections && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {section.subSections.map((subSection) => (
                        <ListItemButton
                          key={subSection.id}
                          sx={{
                            pl: 4,
                            py: 0.5,
                            borderRadius: 1,
                            ml: 1,
                            mb: 0.5,
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                          onClick={() => onSectionChange?.(subSection.id)}
                        >
                          <ListItemText 
                            primary={subSection.label}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                          {subSection.count !== undefined && (
                            <Chip 
                              size="small" 
                              label={subSection.count}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 18 }}
                            />
                          )}
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="textSecondary" align="center">
          DocuCortex Enhanced v2.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isTablet ? 'temporary' : 'persistent'}
      anchor={position}
      open={open}
      onClose={onClose}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          border: 'none',
          borderRight: 1,
          borderColor: 'divider'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default DesktopSidebar;