import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Tabs, 
  Tab,
  Container
} from '@mui/material';
import { 
  Chat, 
  DocumentScanner 
} from '@mui/icons-material';
import DocuCortexChat from './components/DocuCortexChat';
import DocumentProcessor from './components/DocumentProcessor';

// Création du thème DocuCortex
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header avec onglets */}
        <AppBar position="static" elevation={2}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              DocuCortex IA
            </Typography>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange}
              textColor="inherit"
              indicatorColor="secondary"
              sx={{ minHeight: 48 }}
            >
              <Tab 
                icon={<Chat />} 
                label="Chat IA" 
                iconPosition="start"
                sx={{ minHeight: 48, py: 1 }}
              />
              <Tab 
                icon={<DocumentScanner />} 
                label="OCR Document" 
                iconPosition="start"
                sx={{ minHeight: 48, py: 1 }}
              />
            </Tabs>
          </Toolbar>
        </AppBar>

        {/* Contenu des onglets */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {currentTab === 0 && <DocuCortexChat />}
          {currentTab === 1 && <DocumentProcessor />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;