// src/components/responsive/ResponsiveGrid.js - Grille adaptative pour tous les appareils

import React from 'react';
import { Box, Grid, useTheme, useMediaQuery } from '@mui/material';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * Configuration des colonnes par breakpoint
 */
const getColumns = (columns, breakpoint) => {
  if (typeof columns === 'number') return columns;
  if (!columns) return 12;
  
  return columns[breakpoint] || columns.md || columns.lg || 12;
};

/**
 * Configuration des espacement par breakpoint
 */
const getSpacing = (spacing, breakpoint) => {
  if (typeof spacing === 'number') return spacing;
  if (!spacing) return 2;
  
  return spacing[breakpoint] || spacing.md || spacing.lg || 2;
};

/**
 * Props par défaut selon le breakpoint
 */
const getDefaultProps = (breakpoint) => {
  const defaults = {
    xs: { columns: 1, spacing: 1 },
    sm: { columns: 2, spacing: 1.5 },
    md: { columns: 3, spacing: 2 },
    lg: { columns: 4, spacing: 2 },
    xl: { columns: 6, spacing: 2 }
  };
  
  return defaults[breakpoint] || defaults.md;
};

/**
 * Composant ResponsiveGrid - Grille intelligente qui s'adapte automatiquement
 */
const ResponsiveGrid = ({
  children,
  columns,
  spacing,
  maxWidth = 'lg',
  container = true,
  item = false,
  ...gridProps
}) => {
  const theme = useTheme();
  const { currentBreakpoint, isMobile, isTablet } = useBreakpoint();
  const isSmallScreen = isMobile || isTablet;
  
  // Configuration responsive
  const gridColumns = getColumns(columns, currentBreakpoint);
  const gridSpacing = getSpacing(spacing, currentBreakpoint);
  const defaultProps = getDefaultProps(currentBreakpoint);
  
  // Ajustements automatiques selon le type de contenu
  const finalColumns = container ? gridColumns : undefined;
  const finalSpacing = container ? gridSpacing : undefined;
  
  // Classes CSS pour optimisations tactiles
  const touchOptimizations = {
    '& .MuiGrid-item': {
      touchAction: isMobile ? 'manipulation' : 'auto',
      userSelect: isMobile ? 'none' : 'auto'
    }
  };
  
  // Styles responsive
  const responsiveStyles = {
    // Container styles
    ...(container && {
      maxWidth: theme.breakpoints.values[maxWidth],
      margin: '0 auto',
      padding: isMobile ? theme.spacing(1) : theme.spacing(2),
      
      // Optimisations mobiles
      ...(isMobile && {
        // Éviter le zoom lors de la rotation
        overflow: 'hidden',
        // Améliorer les performances scroll
        WebkitOverflowScrolling: 'touch'
      })
    }),
    
    // Item styles
    ...(item && {
      // Améliorer la visibilité des éléments interactifs sur mobile
      ...(isMobile && {
        minHeight: 44, // Minimum tactile size iOS
        display: 'flex',
        alignItems: 'center'
      })
    })
  };

  if (container) {
    return (
      <Box 
        sx={{ 
          width: '100%',
          ...responsiveStyles,
          ...(isMobile && touchOptimizations)
        }}
      >
        <Grid 
          container 
          spacing={finalSpacing}
          columns={finalColumns}
          {...gridProps}
        >
          {children}
        </Grid>
      </Box>
    );
  }

  // Si c'est un item, utiliser Grid directement
  return (
    <Grid 
      item 
      xs={12} 
      sm={gridColumns > 1 ? Math.floor(12 / Math.min(gridColumns, 2)) : 12}
      md={gridColumns > 2 ? Math.floor(12 / Math.min(gridColumns, 3)) : 12}
      lg={gridColumns > 3 ? Math.floor(12 / Math.min(gridColumns, 4)) : 6}
      xl={gridColumns > 4 ? Math.floor(12 / Math.min(gridColumns, 6)) : 4}
      {...gridProps}
      sx={{
        ...responsiveStyles,
        ...(isMobile && {
          padding: theme.spacing(1),
          // Améliorer la lisibilité sur petits écrans
          fontSize: '0.875rem'
        })
      }}
    >
      {children}
    </Grid>
  );
};

export default ResponsiveGrid;