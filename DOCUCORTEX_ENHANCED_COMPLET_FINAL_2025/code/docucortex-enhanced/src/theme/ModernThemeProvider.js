// src/theme/ModernThemeProvider.js - Thème moderne avec animations avancées

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';

/**
 * Configuration des breakpoints étendue
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
 * Palette de couleurs modernisée avec thème sombre amélioré
 */
const createModernColors = (mode) => {
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
    secondary: {
      50: '#f3e5f5',
      100: '#e1bee7',
      200: '#ce93d8',
      300: '#ba68c8',
      400: '#ab47bc',
      500: '#9c27b0',
      600: '#8e24aa',
      700: '#7b1fa2',
      800: '#6a1b9a',
      900: '#4a148c',
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
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
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
        overlay: 'rgba(255, 255, 255, 0.05)',
        glass: 'rgba(255, 255, 255, 0.1)',
      },
      surface: {
        main: '#1a1a1a',
        variant: '#2a2a2a',
        overlay: '#3a3a3a',
        glass: 'rgba(255, 255, 255, 0.05)',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)',
        hint: 'rgba(255, 255, 255, 0.3)',
      },
      divider: 'rgba(255, 255, 255, 0.12)',
      action: {
        hover: 'rgba(255, 255, 255, 0.04)',
        selected: 'rgba(255, 255, 255, 0.08)',
        disabled: 'rgba(255, 255, 255, 0.26)',
        disabledBackground: 'rgba(255, 255, 255, 0.12)',
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
      overlay: 'rgba(0, 0, 0, 0.02)',
      glass: 'rgba(255, 255, 255, 0.7)',
    },
    surface: {
      main: '#ffffff',
      variant: '#f8f8f8',
      overlay: '#eeeeee',
      glass: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
      hint: 'rgba(0, 0, 0, 0.2)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    action: {
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(25, 118, 210, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    }
  };
};

/**
 * Configuration des composants avec animations et styles modernes
 */
const createModernComponents = (mode, colors) => {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Taille minimale tactile iOS
          borderRadius: 12,
          fontWeight: 500,
          textTransform: 'none',
          padding: '12px 24px',
          touchAction: 'manipulation',
          userSelect: 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
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
          borderRadius: 12,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            transform: 'scale(0.95)',
            transition: 'transform 0.1s ease',
          },
          '&:hover': {
            backgroundColor: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.04)',
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
          borderRadius: 16,
          boxShadow: mode === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.6)' 
            : '0 4px 20px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark' 
              ? '0 6px 24px rgba(0, 0, 0, 0.7)' 
              : '0 6px 24px rgba(0, 0, 0, 0.25)',
          },
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
          borderRadius: 16,
          touchAction: 'manipulation',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.6)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
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
          borderRadius: 12,
          touchAction: 'manipulation',
          transition: 'all 0.2s ease',
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
        },
        elevation4: {
          boxShadow: mode === 'dark' 
            ? '0 8px 24px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(0, 0, 0, 0.25)',
        }
      }
    },
    
    MuiInputBase: {
      styleOverrides: {
        root: {
          touchAction: 'manipulation',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiInputBase-input': {
            touchAction: 'manipulation',
            fontSize: '16px', // Évite le zoom sur iOS
          }
        }
      }
    },
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '16px', // Évite le zoom automatique sur iOS
          },
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderRadius: 12,
              borderWidth: '1.5px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover fieldset': {
              borderWidth: '2px',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
            }
          }
        }
      }
    },
    
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          margin: 16,
          maxHeight: 'calc(100vh - 32px)',
          boxShadow: mode === 'dark' 
            ? '0 20px 60px rgba(0, 0, 0, 0.8)'
            : '0 20px 60px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
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
          borderRadius: 12,
          margin: '2px 8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            backgroundColor: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.04)',
            transform: 'scale(0.99)',
            transition: 'all 0.1s ease',
          },
          '&:hover': {
            backgroundColor: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.04)',
          }
        }
      }
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          touchAction: 'manipulation',
          borderRadius: 20,
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
    
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiSelect-select': {
            borderRadius: 12,
            '&:focus': {
              borderRadius: 12,
            }
          }
        }
      }
    },
    
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: mode === 'dark' 
            ? '0 8px 24px rgba(0, 0, 0, 0.6)'
            : '0 8px 24px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(12px)',
          border: mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          marginTop: 4,
          '& .MuiMenuItem-root': {
            borderRadius: 8,
            margin: '2px 8px',
            '&:hover': {
              borderRadius: 8,
            }
          }
        }
      }
    },
    
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            borderRadius: 12,
            backdropFilter: 'blur(12px)',
            boxShadow: mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.6)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
          }
        }
      }
    },
    
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
        }
      }
    },
    
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableHead-root': {
            '& .MuiTableRow-root': {
              '& .MuiTableCell-head': {
                backgroundColor: mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
                fontWeight: 600,
              }
            }
          }
        }
      }
    },
    
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(224, 224, 224, 0.5)'}`,
          '&:first-child': {
            paddingLeft: 24,
          },
          '&:last-child': {
            paddingRight: 24,
          }
        }
      }
    }
  };
};

/**
 * Typographie modernisée
 */
const createModernTypography = () => ({
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
    fontSize: '2.25rem',
    fontWeight: 300,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    '@media (max-width: 600px)': {
      fontSize: '1.875rem',
    }
  },
  
  h2: {
    fontSize: '1.75rem',
    fontWeight: 300,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    '@media (max-width: 600px)': {
      fontSize: '1.5rem',
    }
  },
  
  h3: {
    fontSize: '1.375rem',
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  },
  
  h4: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '-0.005em',
  },
  
  h5: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0px',
  },
  
  h6: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0.5px',
  },
  
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
    '@media (max-width: 600px)': {
      fontSize: '0.875rem',
    }
  },
  
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    textTransform: 'none',
    letterSpacing: '0.02857em',
  },
  
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 2.66,
    textTransform: 'uppercase',
    letterSpacing: '0.08333em',
  }
});

/**
 * Provider de thème moderne avec animations
 */
export const ModernThemeProvider = ({
  children,
  mode: initialMode = 'light',
  enableAutoDetection = true,
  customColors = {},
  onThemeChange,
  enableAnimations = true,
  ...props
}) => {
  const [mode, setMode] = useState(initialMode);

  // Auto-détection des préférences système
  useEffect(() => {
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
    const colors = createModernColors(mode);
    const breakpoints = createResponsiveBreakpoints();
    const components = createModernComponents(mode, colors);
    const typography = createModernTypography();

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
        borderRadius: 12,
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
      // Propriétés personnalisées pour le responsive et animations
      custom: {
        breakpoints,
        animations: {
          enabled: enableAnimations,
          duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
          },
          easing: {
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
          }
        },
        touch: {
          minTargetSize: 44,
          hitSlop: 8,
          pressDuration: 150,
        },
        motion: {
          prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        }
      }
    });
  }, [mode, customColors, enableAnimations]);

  // Styles globaux modernes
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
        
        // Animations optimisées avec respect de prefers-reduced-motion
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
        backdropFilter: 'blur(20px)',
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
      },
      
      // Améliorations pour les tooltips
      '.MuiTooltip-tooltip': {
        backdropFilter: 'blur(8px)',
      },
      
      // Améliorations pour les menus
      '.MuiMenu-paper': {
        backdropFilter: 'blur(12px)',
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

export default ModernThemeProvider;