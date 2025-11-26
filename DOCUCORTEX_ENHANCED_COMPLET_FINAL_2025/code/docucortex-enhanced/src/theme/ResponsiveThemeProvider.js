// src/theme/ResponsiveThemeProvider.js - Thème optimisé responsive et tactile

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';

/**
 * Configuration des breakpoints étendue pour mobile/tablette
 */
const createResponsiveBreakpoints = () => ({
  values: {
    xs: 0,
    sm: 480,    // Petits écrans (mobiles en portrait)
    md: 768,    // Tablettes et mobiles en paysage
    lg: 1024,   // Petits laptops
    xl: 1280,   // Desktop
    xxl: 1536   // Grand desktop
  },
  unit: 'px',
});

/**
 * Palette de couleurs optimisée pour le tactile
 */
const createTouchOptimizedColors = (mode) => {
  const baseColors = {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
      contrastText: '#ffffff',
    },
    success: {
      50: '#e8f5e8',
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#4caf50',
      600: '#43a047',
      700: '#388e3c',
      800: '#2e7d32',
      900: '#1b5e20',
    },
    warning: {
      50: '#fff3e0',
      100: '#ffe0b2',
      200: '#ffcc80',
      300: '#ffb74d',
      400: '#ffa726',
      500: '#ff9800',
      600: '#fb8c00',
      700: '#f57c00',
      800: '#ef6c00',
      900: '#e65100',
    },
    error: {
      50: '#ffebee',
      100: '#ffcdd2',
      200: '#ef9a9a',
      300: '#e57373',
      400: '#ef5350',
      500: '#f44336',
      600: '#e53935',
      700: '#d32f2f',
      800: '#c62828',
      900: '#b71c1c',
    }
  };

  if (mode === 'dark') {
    return {
      ...baseColors,
      primary: { ...baseColors.primary, main: '#90caf9', contrastText: '#000000' },
      background: {
        default: '#0a0a0a',
        paper: '#1a1a1a',
        elevated: '#252525',
      },
      surface: {
        main: '#1a1a1a',
        variant: '#2a2a2a',
        overlay: '#3a3a3a',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)',
      }
    };
  }

  return {
    ...baseColors,
    primary: { ...baseColors.primary, main: '#1976d2', contrastText: '#ffffff' },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
      elevated: '#f5f5f5',
    },
    surface: {
      main: '#ffffff',
      variant: '#f8f8f8',
      overlay: '#eeeeee',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    }
  };
};

/**
 * Configuration des composants optimisés pour tactile
 */
const createTouchOptimizedComponents = (mode, colors) => {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Taille minimale tactile iOS
          borderRadius: 8,
          fontWeight: 500,
          textTransform: 'none',
          padding: '12px 24px',
          touchAction: 'manipulation',
          userSelect: 'none',
          '&:active': {
            transform: 'scale(0.98)',
            transition: 'transform 0.1s ease',
          },
          // Améliorations pour le tactile
          '&:hover': {
            boxShadow: mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
              : '0 4px 12px rgba(0, 0, 0, 0.15)',
          }
        },
        sizeSmall: {
          minHeight: 36,
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        sizeLarge: {
          minHeight: 52,
          padding: '16px 32px',
          fontSize: '1rem',
        },
        contained: {
          '&:hover': {
            boxShadow: mode === 'dark' 
              ? '0 6px 16px rgba(0, 0, 0, 0.5)' 
              : '0 6px 16px rgba(0, 0, 0, 0.2)',
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          touchAction: 'manipulation',
          '&:active': {
            transform: 'scale(0.95)',
            transition: 'transform 0.1s ease',
          }
        },
        sizeSmall: {
          minWidth: 36,
          minHeight: 36,
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          touchAction: 'manipulation',
          '&:active': {
            transform: 'scale(0.95)',
            transition: 'transform 0.1s ease',
          }
        },
        sizeSmall: {
          width: 40,
          height: 40,
        },
        sizeMedium: {
          width: 56,
          height: 56,
        },
        sizeLarge: {
          width: 64,
          height: 64,
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          touchAction: 'manipulation',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark' 
              ? '0 8px 24px rgba(0, 0, 0, 0.5)'
              : '0 8px 24px rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            transform: 'scale(0.99)',
            transition: 'transform 0.1s ease',
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          touchAction: 'manipulation',
        },
        elevation1: {
          boxShadow: mode === 'dark' 
            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.35)'
            : '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        elevation3: {
          boxShadow: mode === 'dark' 
            ? '0 6px 16px rgba(0, 0, 0, 0.4)'
            : '0 6px 16px rgba(0, 0, 0, 0.2)',
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          touchAction: 'manipulation',
          '& .MuiInputBase-input': {
            touchAction: 'manipulation',
            // Optimisation du clavier virtuel
            fontSize: '16px', // Évite le zoom sur iOS
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          margin: 16,
          maxHeight: 'calc(100vh - 32px)',
          // Optimisations pour mobile
          '@media (max-width: 600px)': {
            margin: 0,
            borderRadius: 0,
            height: '100vh',
            maxHeight: '100vh',
          }
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          touchAction: 'manipulation',
          '&:active': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            transform: 'scale(0.99)',
            transition: 'all 0.1s ease',
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          touchAction: 'manipulation',
          '&:active': {
            transform: 'scale(0.95)',
            transition: 'transform 0.1s ease',
          }
        }
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '16px', // Évite le zoom automatique iOS
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '16px', // Évite le zoom automatique iOS
          }
        }
      }
    }
  };
};

/**
 * Typographie optimisée pour mobile
 */
const createMobileTypography = () => ({
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  h1: {
    fontSize: '2rem',
    fontWeight: 300,
    lineHeight: 1.2,
    '@media (max-width: 600px)': {
      fontSize: '1.75rem',
    }
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 300,
    lineHeight: 1.3,
    '@media (max-width: 600px)': {
      fontSize: '1.375rem',
    }
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.125rem',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    '@media (max-width: 600px)': {
      fontSize: '0.875rem',
    }
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    textTransform: 'none',
    letterSpacing: '0.5px',
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
  }
});

/**
 * Provider de thème responsive et tactile
 */
export const ResponsiveThemeProvider = ({
  children,
  mode: initialMode = 'light',
  enableAutoDetection = true,
  customColors = {},
  onThemeChange,
  ...props
}) => {
  const [mode, setMode] = React.useState(initialMode);

  // Auto-détection des préférences système
  React.useEffect(() => {
    if (enableAutoDetection && !initialMode) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, [enableAutoDetection, initialMode]);

  // Gestion du changement de thème
  const handleModeChange = React.useCallback((newMode) => {
    setMode(newMode);
    onThemeChange?.(newMode);
    localStorage.setItem('themeMode', newMode);
  }, [onThemeChange]);

  // Création du thème
  const theme = React.useMemo(() => {
    const colors = createTouchOptimizedColors(mode);
    const breakpoints = createResponsiveBreakpoints();
    const components = createTouchOptimizedComponents(mode, colors);
    const typography = createMobileTypography();

    return createTheme({
      palette: {
        mode,
        ...colors,
        ...customColors,
      },
      typography,
      components,
      breakpoints,
      shape: {
        borderRadius: 8,
      },
      spacing: 8,
      zIndex: {
        mobileStepper: 1000,
        speedDial: 1050,
        appBar: 1100,
        drawer: 1200,
        modal: 1300,
        snackbar: 1400,
        tooltip: 1500,
        fab: 1600,
      },
      // Propriétés personnalisées pour le responsive
      custom: {
        breakpoints,
        touch: {
          minTargetSize: 44,
          hitSlop: 8,
          pressDuration: 150,
        }
      }
    });
  }, [mode, customColors]);

  // Styles globaux optimisés
  const globalStyles = React.useMemo(() => (
    <GlobalStyles styles={{
      // Améliorations générales
      '*': {
        boxSizing: 'border-box',
        WebkitTapHighlightColor: 'transparent',
      },
      
      // Scroll optimisé mobile
      'html': {
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
      },
      
      body: {
        margin: 0,
        padding: 0,
        fontFamily: theme.typography.fontFamily,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        // Améliorations tactiles
        touchAction: 'manipulation',
        overscrollBehavior: 'none',
        
        // Éviter la sélection accidentelle sur mobile
        WebkitUserSelect: 'none',
        userSelect: 'none',
        
        // Optimisations pour les widgets tactiles
        '& .MuiInputBase-input': {
          fontSize: '16px !important', // Évite le zoom automatique sur iOS
        },
        
        '& .MuiTextField-root input': {
          fontSize: '16px !important',
        },
        
        '& input, & textarea, & [contenteditable]': {
          WebkitUserSelect: 'text',
          userSelect: 'text',
        },
        
        // Améliorations pour les formulaires
        '& button, & [role="button"], & [tabindex]': {
          touchAction: 'manipulation',
        },
        
        // Animations optimisées
        '& *, & *::before, & *::after': {
          '@media (prefers-reduced-motion: reduce)': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          }
        }
      },
      
      // Améliorations pour les listes scrollables
      '.MuiList-root': {
        WebkitOverflowScrolling: 'touch',
      },
      
      // Optimisations pour les modals
      '.MuiDialog-paper': {
        // Améliorer la visibilité sur mobile
        '@media (max-width: 600px)': {
          margin: 0,
          borderRadius: 0,
          height: '100vh',
        }
      },
      
      // Améliorations pour les cartes
      '.MuiCard-root': {
        // Améliorer les interactions tactiles
        touchAction: 'manipulation',
        '&:active': {
          transform: 'scale(0.99)',
        }
      },
      
      // Styles pour les notifications
      '.MuiSnackbar-root': {
        '@media (max-width: 600px)': {
          bottom: 'env(safe-area-inset-bottom) !important',
        }
      }
    }} />
  ), [theme]);

  return (
    <ThemeProvider theme={theme} {...props}>
      {globalStyles}
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ResponsiveThemeProvider;