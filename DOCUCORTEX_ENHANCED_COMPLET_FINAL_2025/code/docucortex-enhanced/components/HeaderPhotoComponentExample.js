// components/HeaderPhotoComponentExample.js - Exemple d'utilisation du HeaderPhotoComponent

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Chip,
  Alert,
  Stack,
  Button
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  AccountCircle,
  Work,
  Email,
  Phone,
  LocationOn,
  Schedule
} from '@mui/icons-material';

// Import du composant
import HeaderPhotoComponent from './HeaderPhotoComponent';
import { ModernCard } from '../src/components/ui/ModernUIComponents';

/**
 * Exemple d'utilisation du HeaderPhotoComponent
 * 
 * Ce fichier démontre :
 * 1. Configuration basique et avancée
 * 2. Gestion d'état avec les techniciens
 * 3. Intégration avec un système d'authentification simulé
 * 4. Persistance des données
 * 5. Différentes variantes d'affichage
 */

// Données de démonstration des techniciens
const DEMO_TECHNICIANS = [
  {
    id: 'tech-001',
    name: 'Jean Dupont',
    role: 'Technicien Principal',
    department: 'Infrastructure IT',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    email: 'jean.dupont@docucortex.com',
    phone: '+33 1 23 45 67 89',
    status: 'Disponible',
    bio: 'Spécialiste en systèmes informatiques avec 10 ans d\'expérience. Expert en réseaux et sécurité.',
    location: 'Paris, France',
    schedule: 'Lun-Ven 8h-18h'
  },
  {
    id: 'tech-002',
    name: 'Marie Martin',
    role: 'Technicienne Réseau',
    department: 'Télécommunications',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
    email: 'marie.martin@docucortex.com',
    phone: '+33 1 23 45 67 90',
    status: 'En intervention',
    bio: 'Experte en configurations réseau et solutions Wi-Fi. Certification Cisco CCNP.',
    location: 'Lyon, France',
    schedule: 'Lun-Ven 9h-17h'
  },
  {
    id: 'tech-003',
    name: 'Pierre Durand',
    role: 'Technicien Support',
    department: 'Assistance Utilisateurs',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    email: 'pierre.durand@docucortex.com',
    phone: '+33 1 23 45 67 91',
    status: 'En formation',
    bio: 'Support technique niveau 2. Spécialisé en matériel et logiciels métier.',
    location: 'Marseille, France',
    schedule: 'Lun-Sam 8h-16h'
  },
  {
    id: 'tech-004',
    name: 'Sophie Dubois',
    role: 'Technicienne Système',
    department: 'Infrastructure IT',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    email: 'sophie.dubois@docucortex.com',
    phone: '+33 1 23 45 67 92',
    status: 'Disponible',
    bio: 'Administratrice système Linux/Windows. Automatisation et DevOps.',
    location: 'Toulouse, France',
    schedule: 'Lun-Ven 7h-19h'
  },
  {
    id: 'tech-005',
    name: 'Antoine Bernard',
    role: 'Technicien Mobilité',
    department: 'Solutions Mobiles',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    email: 'antoine.bernard@docucortex.com',
    phone: '+33 1 23 45 67 93',
    status: 'En vacation',
    bio: 'Spécialiste smartphones et tablettes. Déploiement d\'applications mobiles.',
    location: 'Nice, France',
    schedule: 'Mar-Sam 10h-18h'
  }
];

/**
 * Hook personnalisé pour la gestion des techniciens
 */
const useTechnicianManager = () => {
  const [technicians, setTechnicians] = useState(DEMO_TECHNICIANS);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Simuler le chargement depuis une API
  useEffect(() => {
    const loadTechnicians = async () => {
      setLoading(true);
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      setTechnicians(DEMO_TECHNICIANS);
      setLoading(false);
    };

    loadTechnicians();
  }, []);

  const handleTechnicianChange = (technician) => {
    setSelectedTechnician(technician);
    
    // Logique métier : sauvegarde, analytics, notifications, etc.
    console.log('✅ Technicien sélectionné:', {
      id: technician.id,
      name: technician.name,
      timestamp: new Date().toISOString()
    });

    // Ici vous pouvez ajouter :
    // - Envoi d'événements analytics
    // - Mise à jour du contexte utilisateur
    // - Notifications aux autres utilisateurs
    // - Logs d'audit
  };

  const addTechnician = (technician) => {
    setTechnicians(prev => [...prev, { ...technician, id: `tech-${Date.now()}` }]);
  };

  const updateTechnician = (id, updates) => {
    setTechnicians(prev => 
      prev.map(tech => tech.id === id ? { ...tech, ...updates } : tech)
    );
  };

  return {
    technicians,
    selectedTechnician,
    setSelectedTechnician,
    handleTechnicianChange,
    loading,
    addTechnician,
    updateTechnician
  };
};

/**
 * Exemple d'authentification simulée
 */
const useAuth = () => {
  const [user, setUser] = useState({
    id: 'user-123',
    name: 'Administrateur DocuCortex',
    role: 'Admin',
    department: 'IT Management'
  });

  const logout = () => {
    console.log('🚪 Déconnexion utilisateur');
    // Logique de déconnexion
  };

  return { user, logout };
};

/**
 * Exemple de header avec le composant
 */
const ExampleHeader = ({ selectedTech, onTechnicianChange, technicians }) => {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary">
          DocuCortex Enhanced
        </Typography>
        <Chip label="Demo" size="small" color="secondary" />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Intégration du HeaderPhotoComponent */}
        <HeaderPhotoComponent
          availableTechnicians={technicians}
          selectedTechnician={selectedTech}
          onTechnicianChange={onTechnicianChange}
          
          // Options d'interface
          variant="default"
          size="medium"
          position="right"
          showStatus={true}
          
          // Fonctionnalités
          enableSearch={true}
          enablePreview={true}
          enableKeyboardShortcuts={true}
          showFavoriteOnly={false}
          
          // Persistance
          persistSelection={true}
          storageKey="docucortex_demo_technician"
          
          // Callback personnalisé pour analytics
          onAnalytics={(event, data) => {
            console.log('📊 Analytics:', event, data);
          }}
        />
      </Box>
    </Box>
  );
};

/**
 * Page de démonstration principale
 */
const HeaderPhotoComponentDemo = () => {
  const { user, logout } = useAuth();
  const {
    technicians,
    selectedTechnician,
    handleTechnicianChange,
    loading
  } = useTechnicianManager();

  return (
    <ThemeProvider theme={createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: '#1976d2'
        },
        secondary: {
          main: '#dc004e'
        }
      }
    })}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header avec le composant */}
        <ExampleHeader
          selectedTech={selectedTechnician}
          onTechnicianChange={handleTechnicianChange}
          technicians={technicians}
        />

        {/* Contenu principal */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Démonstration HeaderPhotoComponent
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Ce composant permet de sélectionner un technicien dans le header avec des fonctionnalités avancées :
            recherche, favoris, prévisualisation, animations fluides et persistance des données.
          </Typography>

          {/* Alertes et notifications */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Alert severity="info">
              Utilisez <strong>Ctrl+K</strong> pour ouvrir rapidement la sélection de technicien
            </Alert>
            
            {selectedTechnician && (
              <Alert severity="success">
                ✅ Technicien <strong>{selectedTechnician.name}</strong> sélectionné - 
                {selectedTechnician.role} chez {selectedTechnician.department}
              </Alert>
            )}
          </Stack>

          {/* Variantes d'affichage */}
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
            Variantes d'affichage
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <ModernCard>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Variant Minimal
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Avatar uniquement, parfait pour les espaces restreints
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <HeaderPhotoComponent
                      availableTechnicians={technicians}
                      selectedTechnician={selectedTechnician}
                      onTechnicianChange={handleTechnicianChange}
                      variant="minimal"
                      size="large"
                    />
                  </Box>
                </Box>
              </ModernCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <ModernCard>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Variant Compact
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Avatar avec tooltip au hover
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <HeaderPhotoComponent
                      availableTechnicians={technicians}
                      selectedTechnician={selectedTechnician}
                      onTechnicianChange={handleTechnicianChange}
                      variant="compact"
                      size="medium"
                    />
                  </Box>
                </Box>
              </ModernCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <ModernCard>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Variant Default
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Affichage complet avec nom et rôle
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <HeaderPhotoComponent
                      availableTechnicians={technicians}
                      selectedTechnician={selectedTechnician}
                      onTechnicianChange={handleTechnicianChange}
                      variant="default"
                      size="small"
                    />
                  </Box>
                </Box>
              </ModernCard>
            </Grid>
          </Grid>

          {/* Détails du technicien sélectionné */}
          {selectedTechnician && (
            <ModernCard>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Détails du technicien sélectionné
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <img
                        src={selectedTechnician.avatar}
                        alt={selectedTechnician.name}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                      <Typography variant="h6" fontWeight={600} sx={{ mt: 2 }}>
                        {selectedTechnician.name}
                      </Typography>
                      <Chip 
                        label={selectedTechnician.status}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={9}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work color="action" />
                        <Typography>
                          <strong>Rôle :</strong> {selectedTechnician.role}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn color="action" />
                        <Typography>
                          <strong>Département :</strong> {selectedTechnician.department}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email color="action" />
                        <Typography>
                          <strong>Email :</strong> {selectedTechnician.email}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone color="action" />
                        <Typography>
                          <strong>Téléphone :</strong> {selectedTechnician.phone}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule color="action" />
                        <Typography>
                          <strong>Horaires :</strong> {selectedTechnician.schedule}
                        </Typography>
                      </Box>
                      
                      {selectedTechnician.bio && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            À propos
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedTechnician.bio}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </ModernCard>
          )}

          {/* Liste des techniciens disponibles */}
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
            Techniciens disponibles ({technicians.length})
          </Typography>
          
          <Grid container spacing={2}>
            {technicians.map((tech) => (
              <Grid item xs={12} sm={6} md={4} key={tech.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    },
                    ...(selectedTechnician?.id === tech.id && {
                      border: 2,
                      borderColor: 'primary.main'
                    })
                  }}
                  onClick={() => handleTechnicianChange(tech)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img
                      src={tech.avatar}
                      alt={tech.name}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {tech.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tech.role}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tech.department}
                      </Typography>
                    </Box>
                    <Chip 
                      label={tech.status}
                      size="small"
                      color={
                        tech.status === 'Disponible' ? 'success' :
                        tech.status === 'En intervention' ? 'warning' : 'default'
                      }
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Instructions */}
          <Paper sx={{ p: 3, mt: 4, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              💡 Instructions d'utilisation
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                • <strong>Cliquez sur l'avatar</strong> dans le header pour ouvrir la sélection
              </Typography>
              <Typography variant="body2">
                • <strong>Utilisez la recherche</strong> pour filtrer par nom, rôle ou département
              </Typography>
              <Typography variant="body2">
                • <strong>Cliquez sur l'icône étoile</strong> pour ajouter/retirer des favoris
              </Typography>
              <Typography variant="body2">
                • <strong>Utilisez l'icône œil</strong> pour prévisualiser les détails
              </Typography>
              <Typography variant="body2">
                • <strong>Ctrl+K</strong> pour ouvrir rapidement la sélection
              </Typography>
              <Typography variant="body2">
                • <strong>Escape</strong> pour fermer les modales
              </Typography>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default HeaderPhotoComponentDemo;