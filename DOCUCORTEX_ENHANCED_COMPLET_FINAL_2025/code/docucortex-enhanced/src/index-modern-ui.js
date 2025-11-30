// src/index-modern-ui.js - Point d'entrée pour la démonstration de l'interface moderne

import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';

// Thème moderne
import { ModernThemeProvider } from './theme/ModernThemeProvider';

// Démonstration complète
import ModernUIDemo from './demo/ModernUIDemo';

// Styles globaux modernes
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    
    /* Améliorations pour les animations */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  }

  /* Améliorations pour les scrolls */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  /* Styles pour les animations de focus */
  .focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }

  /* Amélioration des transitions */
  * {
    transition: background-color 0.2s ease,
                color 0.2s ease,
                border-color 0.2s ease,
                box-shadow 0.2s ease;
  }
`;

// Composant principal
function App() {
  return (
    <ModernThemeProvider 
      mode="light"
      enableAutoDetection={true}
      enableAnimations={true}
    >
      <CssBaseline />
      <GlobalStyles />
      <ModernUIDemo />
    </ModernThemeProvider>
  );
}

// Point d'entrée
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;