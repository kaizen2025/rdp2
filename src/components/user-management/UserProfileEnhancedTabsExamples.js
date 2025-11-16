import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import UserProfileEnhancedTabs from './UserProfileEnhancedTabs';

/**
 * Exemple d'utilisation du composant UserProfileEnhancedTabs
 * 
 * Ce fichier montre comment intégrer le composant dans une application React
 * avec différentes configurations et cas d'usage.
 */

// Exemple 1 : Utilisation basique
export const BasicUsageExample = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mon Profil Utilisateur
        </Typography>
        <Paper elevation={2}>
          <UserProfileEnhancedTabs />
        </Paper>
      </Box>
    </Container>
  );
};

// Exemple 2 : Avec configuration personnalisée
export const CustomConfigExample = () => {
  const customConfig = {
    // Configuration de l'avatar
    avatarMaxSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    
    // Configuration de l'auto-save
    autoSaveEnabled: true,
    autoSaveDelay: 2000, // 2 secondes
    
    // Configuration des exports
    exportFormats: ['json', 'csv', 'pdf'],
    
    // Configuration des permissions
    defaultPermissions: {
      lecture: true,
      ecriture: true,
      administration: false,
      exports: true
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profil Utilisateur - Configuration Avancée
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Ce profil utilise une configuration personnalisée avec des options avancées.
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }}>
          <UserProfileEnhancedTabs config={customConfig} />
        </Paper>
      </Box>
    </Container>
  );
};

// Exemple 3 : Intégration dans un dashboard
export const DashboardIntegrationExample = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      {/* Sidebar du dashboard */}
      <Paper sx={{ width: 240, p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          DocuCortex Dashboard
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">• Documents</Typography>
          <Typography variant="body2">• Utilisateurs</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>• Mon Profil</Typography>
          <Typography variant="body2">• Paramètres</Typography>
        </Box>
      </Paper>

      {/* Contenu principal */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tableau de Bord
        </Typography>
        
        {/* Intégration du profil utilisateur */}
        <Box sx={{ mt: 3 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <UserProfileEnhancedTabs />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

// Exemple 4 : Mode plein écran pour admin
export const AdminFullScreenExample = () => {
  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: 'background.default',
      zIndex: 9999
    }}>
      {/* Header admin */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          Administration - Profil Utilisateur
        </Typography>
        <Typography variant="body2">
          Mode Administrateur
        </Typography>
      </Box>

      {/* Contenu du profil */}
      <Box sx={{ p: 3, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
        <UserProfileEnhancedTabs />
      </Box>
    </Box>
  );
};

// Exemple 5 : Version mobile
export const MobileExample = () => {
  return (
    <Box sx={{ 
      maxWidth: '100vw',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* Header mobile */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        p: 1,
        textAlign: 'center'
      }}>
        <Typography variant="h6">
          Mon Profil
        </Typography>
      </Box>

      {/* Profil optimisé mobile */}
      <Box sx={{ p: 2 }}>
        <UserProfileEnhancedTabs />
      </Box>
    </Box>
  );
};

// Exemple 6 : With Custom Theme
export const CustomThemeExample = () => {
  // Le thème est appliqué via le ThemeProvider dans l'application parente
  // Ce composant utilisera le thème personnalisé
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'secondary.main' }}>
          Profil avec Thème Personnalisé
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Ce profil utilise un thème personnalisé avec des couleurs et des polices spéciales.
        </Typography>
        <Paper elevation={2} sx={{ 
          borderRadius: 3,
          border: '2px solid',
          borderColor: 'secondary.light'
        }}>
          <UserProfileEnhancedTabs />
        </Paper>
      </Box>
    </Container>
  );
};

// Exemple 7 : Modal/Dialog Version
export const ModalExample = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Exemple d'intégration en modal
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography paragraph>
          Ce profil peut également être utilisé dans une modal ou dialog.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <UserProfileEnhancedTabs />
        </Box>
      </Paper>

      {/* Note: Dans une vraie application, vous utiliseriez une Dialog/Modal component */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          *Pour une version modal, intégrez le composant dans un Dialog Material-UI
        </Typography>
      </Box>
    </Box>
  );
};

// Composant principal démontrant tous les exemples
const UserProfileEnhancedTabsExamples = () => {
  const [activeExample, setActiveExample] = React.useState('basic');

  const examples = [
    { id: 'basic', label: 'Utilisation Basique', component: BasicUsageExample },
    { id: 'custom', label: 'Configuration Avancée', component: CustomConfigExample },
    { id: 'dashboard', label: 'Intégration Dashboard', component: DashboardIntegrationExample },
    { id: 'admin', label: 'Mode Admin Plein Écran', component: AdminFullScreenExample },
    { id: 'mobile', label: 'Version Mobile', component: MobileExample },
    { id: 'theme', label: 'Thème Personnalisé', component: CustomThemeExample },
    { id: 'modal', label: 'Version Modal', component: ModalExample }
  ];

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || BasicUsageExample;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Navigation des exemples */}
      <Box sx={{ 
        bgcolor: 'white', 
        borderBottom: 1, 
        borderColor: 'divider',
        p: 2,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Typography variant="h6" gutterBottom>
          Exemples d'utilisation - UserProfileEnhancedTabs
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {examples.map(example => (
            <Box
              key={example.id}
              onClick={() => setActiveExample(example.id)}
              sx={{
                px: 2,
                py: 1,
                bgcolor: activeExample === example.id ? 'primary.main' : 'grey.100',
                color: activeExample === example.id ? 'white' : 'text.primary',
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: activeExample === example.id ? 'primary.dark' : 'grey.200'
                }
              }}
            >
              <Typography variant="body2">
                {example.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Contenu de l'exemple actif */}
      <Box sx={{ p: 0 }}>
        <ActiveComponent />
      </Box>
    </Box>
  );
};

export default UserProfileEnhancedTabsExamples;