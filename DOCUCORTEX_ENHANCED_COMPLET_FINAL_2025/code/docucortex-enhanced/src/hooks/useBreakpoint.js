// src/hooks/useBreakpoint.js - Hook pour détecter le breakpoint actuel

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Hook personnalisé pour détecter le breakpoint actuel et les capacités de l'appareil
 */
export const useBreakpoint = () => {
  const theme = useTheme();
  
  // Détection des breakpoints
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Détection mobile/tablette/desktop
  const isMobile = isXs || isSm;
  const isTablet = isMd;
  const isDesktop = isLg || isXl;
  
  // Détection des capacités tactiles
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)');
  const isHoverCapable = useMediaQuery('(hover: hover) and (pointer: fine)');
  
  // Détection orientation
  const [orientation, setOrientation] = useState('portrait');
  
  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);
  
  // Breakpoint actuel
  const currentBreakpoint = isXs ? 'xs' : 
                           isSm ? 'sm' : 
                           isMd ? 'md' : 
                           isLg ? 'lg' : 'xl';
  
  // Direction de swipe supportée
  const swipeDirections = isTouch ? ['left', 'right', 'up', 'down'] : [];
  
  return {
    // Breakpoints
    isXs, isSm, isMd, isLg, isXl,
    currentBreakpoint,
    
    // Catégories d'appareils
    isMobile, isTablet, isDesktop,
    
    // Capacités tactiles
    isTouch, isHoverCapable,
    
    // Orientation
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    
    // Capacités de swipe
    swipeDirections,
    
    // Helpers
    matches: (breakpoint) => {
      switch (breakpoint) {
        case 'xs': return isXs;
        case 'sm': return isSm;
        case 'md': return isMd;
        case 'lg': return isLg;
        case 'xl': return isXl;
        default: return false;
      }
    },
    
    greaterThan: (breakpoint) => {
      switch (breakpoint) {
        case 'xs': return !isXs;
        case 'sm': return isMd || isLg || isXl;
        case 'md': return isLg || isXl;
        case 'lg': return isXl;
        default: return false;
      }
    },
    
    lessThan: (breakpoint) => {
      switch (breakpoint) {
        case 'xs': return false;
        case 'sm': return isXs;
        case 'md': return isXs || isSm;
        case 'lg': return isXs || isSm || isMd;
        default: return isXs || isSm || isMd || isLg;
      }
    }
  };
};

export default useBreakpoint;