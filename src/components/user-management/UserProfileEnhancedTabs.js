import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Avatar,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip,
  CircularProgress,
  Fab,
  Skeleton,
  useTheme,
  useMediaQuery,
  OutlinedInput
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Person,
  History,
  Security,
  Analytics,
  PhotoCamera,
  Upload,
  Download,
  Save,
  RefreshCw,
  Edit,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Error,
  Delete,
  Add,
  FileCopy,
  Dashboard,
  Schedule,
  Group,
  Settings,
  Notifications,
  Timeline,
  TrendingUp,
  Assessment,
  CloudUpload,
  CloudDownload,
  Autorenew
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Animation variants pour Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

const tabVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
};

// Hook personnalisé pour la gestion du profil utilisateur
const useUserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [autoSave, setAutoSave] = useState(true);

  // Simulation d'API call pour les données utilisateur
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@docucortex.com',
        telephone: '+33 1 23 45 67 89',
        poste: 'Chef de projet',
        departement: 'IT',
        avatar: null,
        dateCreation: '2023-01-15T10:30:00Z',
        derniereConnexion: '2025-11-15T08:15:00Z',
        statut: 'Actif',
        permissions: {
          lecture: true,
          ecriture: true,
          administration: false,
          exports: true
        },
        preferences: {
          notifications: true,
          darkMode: false,
          langue: 'fr',
          frequenceSync: 'quotidien'
        },
        statistiques: {
          documentsTraites: 245,
          espaceUtilise: '1.2 GB',
          dernierUpload: '2025-11-14T16:45:00Z'
        },
        historique: [
          { action: 'Connexion', date: '2025-11-15T08:15:00Z', details: 'Connexion réussie' },
          { action: 'Upload document', date: '2025-11-14T16:45:00Z', details: 'Document_Contrat_001.pdf' },
          { action: 'Modification profil', date: '2025-11-13T14:20:00Z', details: 'Mise à jour informations personnelles' },
          { action: 'Export données', date: '2025-11-12T09:30:00Z', details: 'Export CSV de 45 documents' }
        ]
      };
      
      setUser(mockUser);
      toast.success('Profil utilisateur chargé avec succès');
    } catch (error) {
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sauvegarde automatique
  const saveUser = useCallback(async (userData) => {
    if (!autoSave) return;
    
    setSaving(true);
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(prev => ({ ...prev, ...userData }));
      setErrors({});
      toast.success('Profil sauvegardé automatiquement');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde automatique');
    } finally {
      setSaving(false);
    }
  }, [autoSave]);

  // Validation côté client
  const validateUser = useCallback((userData) => {
    const newErrors = {};
    
    if (!userData.nom || userData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (!userData.prenom || userData.prenom.trim().length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }
    
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!userData.telephone || userData.telephone.length < 10) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  // Upload d'avatar
  const uploadAvatar = useCallback(async (file) => {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        throw new Error('L\'image ne doit pas dépasser 5MB');
      }
      
      // Simulation d'upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUser(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
      
      toast.success('Avatar mis à jour avec succès');
    } catch (error) {
      toast.error(`Erreur upload: ${error.message}`);
    }
  }, []);

  // Export des données
  const exportUserData = useCallback(async (format) => {
    try {
      let content, filename, mimeType;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(user, null, 2);
          filename = `user_profile_${user.id}_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          content = Object.entries(user)
            .map(([key, value]) => `${key},${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('\n');
          filename = `user_profile_${user.id}_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        case 'pdf':
          content = `Profil Utilisateur\n\nNom: ${user.nom} ${user.prenom}\nEmail: ${user.email}\nTéléphone: ${user.telephone}\nPoste: ${user.poste}\nDépartement: ${user.departement}\nDate de création: ${format(parseISO(user.dateCreation), 'dd/MM/yyyy', { locale: fr })}\nStatut: ${user.statut}`;
          filename = `user_profile_${user.id}_${Date.now()}.txt`;
          mimeType = 'text/plain';
          break;
        default:
          throw new Error('Format non supporté');
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Données exportées en format ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Erreur lors de l'export: ${error.message}`);
    }
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    saving,
    errors,
    autoSave,
    setAutoSave,
    saveUser,
    validateUser,
    uploadAvatar,
    exportUserData,
    refetch: fetchUser
  };
};

// Composant onglet Profil
const ProfileTab = ({ user, loading, errors, onUserChange, onAvatarUpload }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rectangular" height={200} />
        </Grid>
        <Grid item xs={12} md={8}>
          <Skeleton variant="rectangular" height={400} />
        </Grid>
      </Grid>
    );
  }

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box position="relative" display="inline-block">
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: `3px solid ${theme.palette.primary.main}`
                  }}
                >
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onAvatarUpload(file);
                  }}
                />
                <label htmlFor="avatar-upload">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                    size="large"
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
              <Typography variant="h5" gutterBottom>
                {user?.prenom} {user?.nom}
              </Typography>
              <Chip
                label={user?.statut}
                color={user?.statut === 'Actif' ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {user?.poste} - {user?.departement}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Membre depuis {user?.dateCreation && format(parseISO(user.dateCreation), 'MMMM yyyy', { locale: fr })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations personnelles
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={user?.prenom || ''}
                    onChange={(e) => onUserChange({ prenom: e.target.value })}
                    error={!!errors.prenom}
                    helperText={errors.prenom}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={user?.nom || ''}
                    onChange={(e) => onUserChange({ nom: e.target.value })}
                    error={!!errors.nom}
                    helperText={errors.nom}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={user?.email || ''}
                    onChange={(e) => onUserChange({ email: e.target.value })}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: '@'
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={user?.telephone || ''}
                    onChange={(e) => onUserChange({ telephone: e.target.value })}
                    error={!!errors.telephone}
                    helperText={errors.telephone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Poste"
                    value={user?.poste || ''}
                    onChange={(e) => onUserChange({ poste: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Département"
                    value={user?.departement || ''}
                    onChange={(e) => onUserChange({ departement: e.target.value })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
};

// Composant onglet Historique
const HistoryTab = ({ user }) => {
  if (!user?.historique) return null;

  const getActionIcon = (action) => {
    switch (action) {
      case 'Connexion': return <Person color="primary" />;
      case 'Upload document': return <Upload color="success" />;
      case 'Modification profil': return <Edit color="info" />;
      case 'Export données': return <Download color="secondary" />;
      default: return <Timeline color="action" />;
    }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Historique des actions
          </Typography>
          <List>
            {user.historique.map((item, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {getActionIcon(item.action)}
                </ListItemIcon>
                <ListItemText
                  primary={item.action}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.details}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.date && format(parseISO(item.date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                  }
                />
                <Chip
                  label={item.action}
                  size="small"
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Composant onglet Permissions
const PermissionsTab = ({ user, onUserChange }) => {
  const handlePermissionChange = (permission, value) => {
    onUserChange({
      permissions: {
        ...user.permissions,
        [permission]: value
      }
    });
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Permissions utilisateur
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Permissions générales
                  </Typography>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user?.permissions?.lecture || false}
                          onChange={(e) => handlePermissionChange('lecture', e.target.checked)}
                        />
                      }
                      label="Lecture des documents"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user?.permissions?.ecriture || false}
                          onChange={(e) => handlePermissionChange('ecriture', e.target.checked)}
                        />
                      }
                      label="Écriture des documents"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user?.permissions?.administration || false}
                          onChange={(e) => handlePermissionChange('administration', e.target.checked)}
                        />
                      }
                      label="Administration"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user?.permissions?.exports || false}
                          onChange={(e) => handlePermissionChange('exports', e.target.checked)}
                        />
                      }
                      label="Exports de données"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Statistiques
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Documents traités: {user?.statistiques?.documentsTraites || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Espace utilisé: {user?.statistiques?.espaceUtilise || '0 GB'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Dernier upload: {user?.statistiques?.dernierUpload && 
                        format(parseISO(user.statistiques.dernierUpload), 'dd/MM/yyyy', { locale: fr })
                      }
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Composant onglet Statistiques
const StatisticsTab = ({ user }) => {
  const theme = useTheme();

  const statsData = useMemo(() => [
    {
      title: 'Documents traités',
      value: user?.statistiques?.documentsTraites || 0,
      icon: <Assessment color="primary" />,
      color: theme.palette.primary.main,
      change: '+12%'
    },
    {
      title: 'Espace utilisé',
      value: user?.statistiques?.espaceUtilise || '0 GB',
      icon: <Dashboard color="success" />,
      color: theme.palette.success.main,
      change: '+5%'
    },
    {
      title: 'Actions cette semaine',
      value: user?.historique?.filter(h => {
        const date = parseISO(h.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }).length || 0,
      icon: <TrendingUp color="info" />,
      color: theme.palette.info.main,
      change: '+8%'
    },
    {
      title: 'Connexions',
      value: user?.historique?.filter(h => h.action === 'Connexion').length || 0,
      icon: <Group color="secondary" />,
      color: theme.palette.secondary.main,
      change: '+3%'
    }
  ], [user, theme]);

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <Grid container spacing={3}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      {stat.change} ce mois
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activité récente
              </Typography>
              <Box sx={{ height: 200, position: 'relative' }}>
                {/* Graphique simplifié pour la démo */}
                <Box
                  sx={{
                    height: '100%',
                    background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                    opacity: 0.1,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Graphique d'activité (représentation visuelle)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
};

// Composant principal
const UserProfileEnhancedTabs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentTab, setCurrentTab] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const {
    user,
    loading,
    saving,
    errors,
    autoSave,
    setAutoSave,
    saveUser,
    validateUser,
    uploadAvatar,
    exportUserData,
    refetch
  } = useUserProfile();

  // Gestion du changement d'onglet
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Gestion de la modification utilisateur
  const handleUserChange = useCallback((changes) => {
    if (!user) return;
    
    const newUserData = { ...user, ...changes };
    
    if (autoSave && validateUser(newUserData)) {
      saveUser(changes);
    }
  }, [user, autoSave, validateUser, saveUser]);

  // Auto-save sur changement d'onglet
  useEffect(() => {
    if (autoSave && user && Object.keys(errors).length === 0) {
      const timer = setTimeout(() => {
        saveUser(user);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentTab, autoSave, user, saveUser]);

  // Données des onglets
  const tabs = [
    { label: 'Profil', icon: <Person />, component: ProfileTab },
    { label: 'Historique', icon: <History />, component: HistoryTab },
    { label: 'Permissions', icon: <Security />, component: PermissionsTab },
    { label: 'Statistiques', icon: <Analytics />, component: StatisticsTab }
  ];

  const CurrentTabComponent = tabs[currentTab]?.component || ProfileTab;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
          {/* Header avec controls */}
          <Box sx={{ mb: 3 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs>
                <Typography variant="h4" component="h1" gutterBottom>
                  Profil Utilisateur Enrichi
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Gérez votre profil et vos préférences en temps réel
                </Typography>
              </Grid>
              <Grid item xs="auto">
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                    />
                  }
                  label="Sauvegarde auto"
                />
              </Grid>
              <Grid item xs="auto">
                <Tooltip title="Actualiser">
                  <IconButton onClick={refetch} color="primary">
                    <RefreshCw />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item xs="auto">
                <Tooltip title="Exporter">
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => setShowExportDialog(true)}
                  >
                    Exporter
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>

          {/* Indicateur de sauvegarde */}
          <AnimatePresence>
            {saving && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <LinearProgress sx={{ mb: 2 }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Onglets */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons={isMobile ? 'auto' : false}
                aria-label="onglets du profil utilisateur"
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    icon={tab.icon}
                    label={tab.label}
                    iconPosition="start"
                    sx={{ minHeight: 64 }}
                  />
                ))}
              </Tabs>
            </Box>
          </Card>

          {/* Contenu des onglets */}
          <Box sx={{ position: 'relative', minHeight: 400 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <CurrentTabComponent
                  user={user}
                  loading={loading}
                  errors={errors}
                  onUserChange={handleUserChange}
                  onAvatarUpload={uploadAvatar}
                />
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Dialog d'export */}
          <Dialog 
            open={showExportDialog} 
            onClose={() => setShowExportDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Exporter les données utilisateur</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choisissez le format d'export pour vos données personnelles
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Format d'export</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  input={<OutlinedInput label="Format d'export" />}
                >
                  <MenuItem value="json">JSON (recommandé)</MenuItem>
                  <MenuItem value="csv">CSV (tableur)</MenuItem>
                  <MenuItem value="pdf">PDF (impression)</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowExportDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  exportUserData(exportFormat);
                  setShowExportDialog(false);
                }}
                variant="contained"
                startIcon={<Download />}
              >
                Exporter
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar global */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          {/* Toast notifications */}
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </Box>
      </motion.div>
    </LocalizationProvider>
  );
};

export default UserProfileEnhancedTabs;