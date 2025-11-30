// components/HeaderPhotoComponent.js - Composant de sélection de photo de technicien dans le header

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Chip,
  Paper,
  Badge,
  Fade,
  useTheme,
  useMediaQuery,
  InputAdornment,
  TextField
} from '@mui/material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  AccountCircle,
  Search,
  CheckCircle,
  Star,
  StarBorder,
  FilterList,
  Close,
  Visibility,
  VisibilityOff,
  Refresh
} from '@mui/icons-material';

// Import des composants d'animation et UI moderne
import { animationConfig, useReducedMotion, StaggerContainer, StaggerItem } from '../src/components/animations/AnimationSystem';
import { ModernCard, ModernButton, ModernIconButton } from '../src/components/ui/ModernUIComponents';

/**
 * Composant de sélection de photo de technicien dans le header
 * Fonctionnalités :
 * - Affichage photo technicien sélectionné
 * - Dropdown avec toutes les photos disponibles
 * - Prévisualisation et sélection rapide
 * - Animation de transition fluide
 * - Persistance sélection utilisateur
 * - Interface moderne Material-UI
 */
const HeaderPhotoComponent = ({
  availableTechnicians = [],
  selectedTechnician = null,
  onTechnicianChange,
  showFavoriteOnly = false,
  enableSearch = true,
  enablePreview = true,
  enableKeyboardShortcuts = true,
  position = 'right', // 'left', 'center', 'right'
  size = 'medium', // 'small', 'medium', 'large'
  showStatus = true,
  persistSelection = true,
  storageKey = 'docucortex_selected_technician',
  customStorage = null, // Fonction de persistance personnalisée
  variant = 'default', // 'default', 'minimal', 'compact'
  ...props
}) => {
  // States
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTech, setPreviewTech] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [animationControls] = useAnimation();
  const [currentTechnician, setCurrentTechnician] = useState(selectedTechnician);
  
  // Theme et responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const prefersReducedMotion = useReducedMotion();

  // Chargement des données persistées au mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Mise à jour du technicien sélectionné
  useEffect(() => {
    if (selectedTechnician) {
      setCurrentTechnician(selectedTechnician);
    }
  }, [selectedTechnician]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event) => {
      // Ctrl/Cmd + K pour ouvrir le dropdown
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
      }
      
      // Échap pour fermer
      if (event.key === 'Escape') {
        setAnchorEl(null);
        setPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts]);

  // Chargement des données persistées
  const loadPersistedData = async () => {
    try {
      let storedData = null;
      
      if (customStorage) {
        storedData = await customStorage.getItem(storageKey);
      } else if (persistSelection && typeof window !== 'undefined') {
        const stored = localStorage.getItem(storageKey);
        storedData = stored ? JSON.parse(stored) : null;
      }

      if (storedData && !selectedTechnician) {
        // Rechercher le technicien correspondant
        const tech = availableTechnicians.find(t => t.id === storedData.id);
        if (tech) {
          setCurrentTechnician(tech);
          onTechnicianChange?.(tech);
        }
      }

      // Charger les favoris
      const storedFavorites = localStorage.getItem(`${storageKey}_favorites`);
      if (storedFavorites) {
        setFavorites(new Set(JSON.parse(storedFavorites)));
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des données persistées:', error);
    }
  };

  // Sauvegarde des données
  const savePersistedData = async (technician) => {
    try {
      if (!persistSelection) return;
      
      const data = {
        id: technician?.id,
        name: technician?.name,
        timestamp: Date.now()
      };

      if (customStorage) {
        await customStorage.setItem(storageKey, data);
      } else if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde:', error);
    }
  };

  // Sauvegarde des favoris
  const saveFavorites = (newFavorites) => {
    try {
      localStorage.setItem(`${storageKey}_favorites`, JSON.stringify([...newFavorites]));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des favoris:', error);
    }
  };

  // Filtrage des techniciens
  const filteredTechnicians = useMemo(() => {
    let filtered = availableTechnicians;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(tech =>
        tech.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par favoris
    if (showFavoriteOnly) {
      filtered = filtered.filter(tech => favorites.has(tech.id));
    }

    return filtered;
  }, [availableTechnicians, searchTerm, showFavoriteOnly, favorites]);

  // Gestion des événements
  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSearchTerm('');
  };

  const handleTechnicianSelect = async (technician) => {
    try {
      // Animation de feedback
      if (!prefersReducedMotion) {
        await animationControls.start({
          scale: [1, 0.9, 1.1, 1],
          transition: { duration: 0.3, ease: 'easeInOut' }
        });
      }

      setCurrentTechnician(technician);
      onTechnicianChange?.(technician);
      await savePersistedData(technician);
      handleMenuClose();
    } catch (error) {
      console.error('Erreur lors de la sélection:', error);
    }
  };

  const handlePreviewOpen = (technician) => {
    setPreviewTech(technician);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewTech(null);
  };

  const toggleFavorite = (technicianId) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(technicianId)) {
      newFavorites.delete(technicianId);
    } else {
      newFavorites.add(technicianId);
    }
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  // Configuration des variantes
  const getAvatarSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 48;
      default: return 40;
    }
  };

  const getMenuPosition = () => {
    switch (position) {
      case 'left':
        return { anchorOrigin: { vertical: 'bottom', horizontal: 'left' } };
      case 'center':
        return { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } };
      default:
        return { anchorOrigin: { vertical: 'bottom', horizontal: 'right' } };
    }
  };

  // Animation des éléments
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: -10,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: -10,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  };

  const technicianCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1, ease: 'easeOut' }
    }
  };

  // Rendu de l'avatar principal
  const renderMainAvatar = () => {
    const avatarSize = getAvatarSize();
    
    const avatarContent = (
      <motion.div
        animate={animationControls}
        whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
        whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Badge
          color="primary"
          variant="dot"
          sx={{
            '& .MuiBadge-badge': {
              right: 2,
              top: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: showStatus ? 'success.main' : 'transparent'
            }
          }}
        >
          <Avatar
            src={currentTechnician?.avatar || currentTechnician?.photo}
            alt={currentTechnician?.name || 'Technicien'}
            sx={{
              width: avatarSize,
              height: avatarSize,
              border: 2,
              borderColor: theme.palette.primary.main,
              boxShadow: theme.shadows[3],
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: theme.shadows[6]
              }
            }}
          >
            <AccountCircle />
          </Avatar>
        </Badge>
      </motion.div>
    );

    if (variant === 'minimal') {
      return avatarContent;
    }

    if (variant === 'compact') {
      return (
        <Tooltip title={currentTechnician?.name || 'Sélectionner un technicien'}>
          {avatarContent}
        </Tooltip>
      );
    }

    return (
      <Box 
        onClick={handleAvatarClick}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          cursor: 'pointer',
          p: 1,
          borderRadius: 2,
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)'
          }
        }}
      >
        {avatarContent}
        
        {!isMobile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                lineHeight: 1.2,
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentTechnician?.name || 'Aucun technicien'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                lineHeight: 1.2,
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentTechnician?.role || 'Sélectionner'}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Rendu des options du menu dropdown
  const renderDropdownOptions = () => {
    if (filteredTechnicians.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Aucun technicien trouvé' : 'Aucun technicien disponible'}
          </Typography>
        </Box>
      );
    }

    return (
      <StaggerContainer>
        {filteredTechnicians.map((technician, index) => (
          <StaggerItem key={technician.id}>
            <motion.div
              variants={technicianCardVariants}
              whileHover={!prefersReducedMotion ? 'hover' : {}}
              whileTap={!prefersReducedMotion ? 'tap' : {}}
            >
              <MenuItem
                onClick={() => handleTechnicianSelect(technician)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={technician.avatar || technician.photo}
                      alt={technician.name}
                      sx={{ width: 40, height: 40 }}
                    >
                      <AccountCircle />
                    </Avatar>
                    {favorites.has(technician.id) && (
                      <Star 
                        color="warning" 
                        sx={{ 
                          position: 'absolute', 
                          top: -4, 
                          right: -4,
                          width: 16,
                          height: 16,
                          bgcolor: 'background.paper',
                          borderRadius: '50%'
                        }} 
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {technician.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {technician.role || 'Technicien'}
                    </Typography>
                    {technician.department && (
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {technician.department}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {enablePreview && (
                      <ModernIconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewOpen(technician);
                        }}
                      >
                        <Visibility />
                      </ModernIconButton>
                    )}
                    
                    <ModernIconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(technician.id);
                      }}
                      color={favorites.has(technician.id) ? 'warning' : 'default'}
                    >
                      {favorites.has(technician.id) ? <Star /> : <StarBorder />}
                    </ModernIconButton>
                  </Box>
                </Box>
                
                {/* Indicateur de sélection */}
                {currentTechnician?.id === technician.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <CheckCircle color="primary" sx={{ fontSize: 20 }} />
                  </motion.div>
                )}
              </MenuItem>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    );
  };

  // Rendu du menu principal
  const renderDropdown = () => (
    <AnimatePresence>
      {anchorEl && (
        <motion.div
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed',
            top: anchorEl.getBoundingClientRect().bottom,
            left: position === 'left' 
              ? anchorEl.getBoundingClientRect().left
              : position === 'center'
              ? anchorEl.getBoundingClientRect().left + (anchorEl.offsetWidth / 2) - 200
              : anchorEl.getBoundingClientRect().right - 200,
            zIndex: 1300,
            width: 400,
            maxWidth: '90vw'
          }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            {/* Header avec recherche */}
            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Sélectionner un technicien
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${filteredTechnicians.length} technicien${filteredTechnicians.length > 1 ? 's' : ''}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  
                  <ModernIconButton 
                    size="small" 
                    onClick={() => setAnchorEl(null)}
                  >
                    <Close />
                  </ModernIconButton>
                </Box>
              </Box>
              
              {enableSearch && (
                <TextField
                  fullWidth
                  placeholder="Rechercher un technicien..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'grey.50'
                      }
                    }
                  }}
                />
              )}
              
              {/* Filtres */}
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="Favoris"
                  size="small"
                  variant={showFavoriteOnly ? 'filled' : 'outlined'}
                  color="warning"
                  onClick={() => {
                    // Logique pour basculer les favoris
                  }}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Tous"
                  size="small"
                  variant={!showFavoriteOnly ? 'filled' : 'outlined'}
                  onClick={() => {
                    // Logique pour afficher tous
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </Box>
            
            {/* Liste des techniciens */}
            <Box sx={{ 
              maxHeight: 400, 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: 6
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 3
              }
            }}>
              {renderDropdownOptions()}
            </Box>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Rendu de la prévisualisation
  const renderPreview = () => (
    <Dialog
      open={previewOpen}
      onClose={handlePreviewClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            Aperçu du technicien
          </Typography>
          <ModernIconButton onClick={handlePreviewClose}>
            <Close />
          </ModernIconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {previewTech && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                src={previewTech.avatar || previewTech.photo}
                alt={previewTech.name}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto',
                  mb: 2,
                  boxShadow: theme.shadows[4]
                }}
              >
                <AccountCircle sx={{ fontSize: 60 }} />
              </Avatar>
              
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {previewTech.name}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {previewTech.role || 'Technicien'}
              </Typography>
              
              {previewTech.department && (
                <Typography variant="body2" color="text.secondary">
                  {previewTech.department}
                </Typography>
              )}
              
              {previewTech.email && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {previewTech.email}
                </Typography>
              )}
              
              {previewTech.phone && (
                <Typography variant="body2" color="text.secondary">
                  {previewTech.phone}
                </Typography>
              )}
            </Box>
            
            {/* Statuts */}
            {previewTech.status && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
                <Chip 
                  label={previewTech.status} 
                  color="primary" 
                  size="small" 
                />
                {favorites.has(previewTech.id) && (
                  <Chip 
                    label="Favori" 
                    color="warning" 
                    size="small" 
                    icon={<Star />}
                  />
                )}
              </Box>
            )}
            
            {/* Informations supplémentaires */}
            {previewTech.bio && (
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary">
                  {previewTech.bio}
                </Typography>
              </Paper>
            )}
          </motion.div>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
          <ModernButton
            variant="outlined"
            onClick={() => previewTech && toggleFavorite(previewTech.id)}
            startIcon={favorites.has(previewTech?.id) ? <Star /> : <StarBorder />}
            sx={{ flex: 1 }}
          >
            {favorites.has(previewTech?.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </ModernButton>
          
          <ModernButton
            variant="contained"
            onClick={() => {
              if (previewTech) {
                handleTechnicianSelect(previewTech);
                handlePreviewClose();
              }
            }}
            sx={{ flex: 1 }}
          >
            Sélectionner
          </ModernButton>
        </Box>
      </DialogActions>
    </Dialog>
  );

  // Affichage
  return (
    <Box {...props}>
      {renderMainAvatar()}
      {renderDropdown()}
      {renderPreview()}
    </Box>
  );
};

export default HeaderPhotoComponent;