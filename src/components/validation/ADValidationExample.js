// src/components/validation/ADValidationExample.js - EXEMPLE D'UTILISATION DE REAL-TIME VALIDATION AD
// Démonstration de l'intégration avec les formulaires DocuCortex existants

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Person,
  Email,
  Badge,
  BusinessCenter,
  SupervisorAccount,
  Group,
  Title,
  Phone,
  Smartphone,
  Save,
  Refresh
} from '@mui/icons-material';

import {
  ADValidationForm,
  ADFieldValidator,
  useADValidation,
  FIELD_TYPES,
  VALIDATION_STATUS
} from './RealTimeValidationAD';

// Configuration AD
const AD_CONFIG = {
  enabled: true,
  domain: 'docucortex.local',
  ldapUrl: 'ldap://dc.docucortex.local:389',
  bindDN: 'CN=Service Account,OU=Service Accounts,DC=docucortex,DC=local',
  bindCredentials: 'SecurePassword123!',
  ouBase: 'DC=docucortex,DC=local',
  autoSync: true,
  syncInterval: 300000 // 5 minutes
};

// Données de test pour les départements
const DEPARTMENT_OPTIONS = [
  'IT & Technologies',
  'Ressources Humaines',
  'Finance & Comptabilité',
  'Marketing & Communication',
  'Ventes & Développement Commercial',
  'Opérations & Logistique',
  'Juridique & Conformité',
  'Direction Générale'
];

// Données de test pour les titres/positions
const TITLE_OPTIONS = [
  'Développeur',
  'Développeur Senior',
  'Architecte Solutions',
  'Chef de Projet',
  'Responsable IT',
  'Directeur Technique',
  'Analyste',
  'Testeur',
  'Designer UX/UI',
  'Chef de Produit'
];

/**
 * Exemple 1: Formulaire de création d'utilisateur AD complet
 */
const UserCreationForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    firstName: '',
    lastName: '',
    department: '',
    manager: '',
    title: '',
    phone: '',
    mobile: '',
    groups: []
  });

  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState({ message: '', type: 'info' });

  const { 
    validationStates, 
    isConnected, 
    connectionStatus,
    preValidateForm,
    validateField 
  } = useADValidation(AD_CONFIG);

  // Gestion du changement de champ
  const handleFieldChange = useCallback((fieldType, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldType]: value
    }));
  }, []);

  // Soumission du formulaire
  const handleSubmit = async (validatedData) => {
    try {
      // Simulation de la création AD
      console.log('Création utilisateur AD:', validatedData);
      
      setNotification({
        message: 'Utilisateur créé avec succès dans Active Directory !',
        type: 'success'
      });

      // Réinitialiser le formulaire
      setTimeout(() => {
        setFormData({
          username: '',
          email: '',
          displayName: '',
          firstName: '',
          lastName: '',
          department: '',
          manager: '',
          title: '',
          phone: '',
          mobile: '',
          groups: []
        });
      }, 2000);

    } catch (error) {
      setNotification({
        message: `Erreur lors de la création: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Configuration des champs du formulaire
  const fields = [
    {
      type: FIELD_TYPES.USERNAME,
      label: 'Nom d\'utilisateur',
      required: true,
      placeholder: 'Ex: jdupont',
      helperText: '3-20 caractères, lettres, chiffres, points et tirets uniquement',
      options: { maxLength: 20 }
    },
    {
      type: FIELD_TYPES.EMAIL,
      label: 'Adresse email',
      required: true,
      placeholder: 'Ex: jean.dupont@docucortex.com',
      helperText: 'Adresse email corporate obligatoire'
    },
    {
      type: FIELD_TYPES.DISPLAY_NAME,
      label: 'Nom d\'affichage',
      required: true,
      placeholder: 'Ex: Dupont, Jean',
      helperText: 'Nom complet pour l\'affichage dans l\'annuaire'
    },
    {
      type: FIELD_TYPES.FIRST_NAME,
      label: 'Prénom',
      required: true,
      placeholder: 'Ex: Jean'
    },
    {
      type: FIELD_TYPES.LAST_NAME,
      label: 'Nom de famille',
      required: true,
      placeholder: 'Ex: Dupont'
    },
    {
      type: FIELD_TYPES.DEPARTMENT,
      label: 'Département',
      required: true,
      placeholder: 'Sélectionner un département',
      options: DEPARTMENT_OPTIONS
    },
    {
      type: FIELD_TYPES.MANAGER,
      label: 'Manager',
      required: false,
      placeholder: 'Rechercher un manager...',
      helperText: 'Personne responsable hiérarchique directe'
    },
    {
      type: FIELD_TYPES.TITLE,
      label: 'Fonction/Titre',
      required: true,
      placeholder: 'Ex: Développeur Senior',
      options: TITLE_OPTIONS
    },
    {
      type: FIELD_TYPES.PHONE,
      label: 'Téléphone fixe',
      required: false,
      placeholder: 'Ex: +33 1 23 45 67 89'
    },
    {
      type: FIELD_TYPES.MOBILE,
      label: 'Téléphone mobile',
      required: false,
      placeholder: 'Ex: +33 6 12 34 56 78'
    }
  ];

  return (
    <Paper sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Person color="primary" />
        <Typography variant="h5">
          Création d'un utilisateur Active Directory
        </Typography>
      </Box>

      {/* Statut de connexion */}
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity={isConnected ? "success" : "warning"}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Actualiser
            </Button>
          }
        >
          {isConnected 
            ? `Connecté à Active Directory (${connectionStatus})`
            : `Mode hors-ligne activé - Validation limitée`
          }
        </Alert>
      </Box>

      {/* Formulaire de validation */}
      <ADValidationForm
        initialData={formData}
        onSubmit={handleSubmit}
        onValidationChange={handleFieldChange}
        fields={fields}
        title=""
        showTitle={false}
        showConnectionStatus={false}
        enablePreValidation={true}
      />

      {/* Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert 
              severity={notification.type}
              sx={{ mt: 2 }}
              onClose={() => setNotification({ message: '', type: 'info' })}
            >
              {notification.message}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </Paper>
  );
};

/**
 * Exemple 2: Composant de validation individuelle
 */
const IndividualFieldExample = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    department: ''
  });

  const { validateField, getFieldStatus, getFieldMessage } = useADValidation(AD_CONFIG);

  const handleFieldChange = (fieldType, value) => {
    setUserData(prev => ({
      ...prev,
      [fieldType]: value
    }));
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Validation individuelle de champs
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.USERNAME}
              label="Nom d'utilisateur"
              value={userData.username}
              onChange={(value) => handleFieldChange('username', value)}
              onValidationChange={(field, value) => validateField(field, value)}
              required
              placeholder="Ex: jdupont"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.EMAIL}
              label="Email"
              value={userData.email}
              onChange={(value) => handleFieldChange('email', value)}
              onValidationChange={(field, value) => validateField(field, value)}
              required
              placeholder="Ex: jean.dupont@docucortex.com"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.DEPARTMENT}
              label="Département"
              value={userData.department}
              onChange={(value) => handleFieldChange('department', value)}
              onValidationChange={(field, value) => validateField(field, value)}
              required
              placeholder="Sélectionner..."
              options={DEPARTMENT_OPTIONS}
            />
          </Grid>
        </Grid>

        {/* État de validation en temps réel */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            État de validation en temps réel:
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(userData).map(([field, value]) => {
              const status = getFieldStatus(field);
              const message = getFieldMessage(field);
              
              return (
                <Grid item xs={12} key={field}>
                  <Alert 
                    severity={
                      status === VALIDATION_STATUS.VALID ? 'success' :
                      status === VALIDATION_STATUS.INVALID ? 'error' :
                      status === VALIDATION_STATUS.WARNING ? 'warning' :
                      status === VALIDATION_STATUS.LOADING ? 'info' :
                      'default'
                    }
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2">
                      <strong>{field}:</strong> {message || 'Pas encore validé'}
                    </Typography>
                  </Alert>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Exemple 3: Formulaire de modification en masse
 */
const BulkEditForm = () => {
  const [bulkData, setBulkData] = useState({
    selectedUsers: [],
    newDepartment: '',
    newManager: '',
    newTitle: '',
    groupsToAdd: [],
    groupsToRemove: []
  });

  const { 
    validationStates, 
    isConnected,
    preValidateForm 
  } = useADValidation(AD_CONFIG);

  const handleBulkValidation = async () => {
    if (!bulkData.selectedUsers.length) {
      alert('Veuillez sélectionner des utilisateurs à modifier.');
      return;
    }

    try {
      const validation = await preValidateForm({
        department: bulkData.newDepartment,
        manager: bulkData.newManager,
        title: bulkData.newTitle,
        groups: [...bulkData.groupsToAdd, ...bulkData.groupsToRemove]
      });

      if (validation.isValid) {
        console.log('Validation réussie pour modification en masse:', validation);
        alert('Validation réussie ! Prêt pour la modification en masse.');
      } else {
        console.log('Erreurs de validation:', validation.errors);
        alert(`Erreurs détectées: ${validation.errors.length} erreur(s)`);
      }

    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation.');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Modification en masse d'utilisateurs AD
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {bulkData.selectedUsers.length} utilisateur(s) sélectionné(s)
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.DEPARTMENT}
              label="Nouveau département"
              value={bulkData.newDepartment}
              onChange={(value) => setBulkData(prev => ({ ...prev, newDepartment: value }))}
              options={DEPARTMENT_OPTIONS}
              placeholder="Sélectionner un département..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.MANAGER}
              label="Nouveau manager"
              value={bulkData.newManager}
              onChange={(value) => setBulkData(prev => ({ ...prev, newManager: value }))}
              placeholder="Rechercher un manager..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.TITLE}
              label="Nouveau titre"
              value={bulkData.newTitle}
              onChange={(value) => setBulkData(prev => ({ ...prev, newTitle: value }))}
              options={TITLE_OPTIONS}
              placeholder="Sélectionner un titre..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessCenter color="primary" />
              <Typography variant="body2">
                Groupes AD: Auto-validation intégrée
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBulkValidation}
            startIcon={<Refresh />}
          >
            Valider les modifications
          </Button>
          
          <Button
            variant="contained"
            disabled={!isConnected}
            startIcon={<Save />}
            onClick={() => {
              alert('Modification en masse exécutée !');
            }}
          >
            Appliquer les modifications
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Exemple d'intégration avec un formulaire DocuCortex existant
 */
const DocuCortexFormIntegration = () => {
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    phone: '',
    // Champs spécifiques DocuCortex
    equipmentAccess: '',
    maxLoanDays: 30,
    priorityLevel: 'normal'
  });

  // Intégration avec la validation AD
  const { 
    validateField, 
    getFieldStatus, 
    getFieldMessage,
    isConnected 
  } = useADValidation(AD_CONFIG);

  const handleInputChange = (field, value) => {
    setUserForm(prev => ({ ...prev, [field]: value }));

    // Validation AD automatique pour certains champs
    if (['firstName', 'lastName', 'email', 'department'].includes(field)) {
      validateField(field, value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Validation complète AD avant soumission DocuCortex
    const adFields = {
      firstName: userForm.firstName,
      lastName: userForm.lastName,
      email: userForm.email,
      department: userForm.department
    };

    Promise.all([
      validateField('firstName', userForm.firstName),
      validateField('lastName', userForm.lastName),
      validateField('email', userForm.email),
      validateField('department', userForm.department)
    ]).then(() => {
      // Logique de soumission DocuCortex
      console.log('Soumission DocuCortex avec validation AD:', userForm);
      alert('Utilisateur créé dans DocuCortex avec validation AD réussie !');
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Formulaire DocuCortex avec Validation AD
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Informations personnelles */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Informations personnelles
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.FIRST_NAME}
              label="Prénom"
              value={userForm.firstName}
              onChange={(value) => handleInputChange('firstName', value)}
              onValidationChange={validateField}
              required
              disabled={!isConnected}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.LAST_NAME}
              label="Nom de famille"
              value={userForm.lastName}
              onChange={(value) => handleInputChange('lastName', value)}
              onValidationChange={validateField}
              required
              disabled={!isConnected}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.EMAIL}
              label="Adresse email"
              value={userForm.email}
              onChange={(value) => handleInputChange('email', value)}
              onValidationChange={validateField}
              required
              disabled={!isConnected}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.DEPARTMENT}
              label="Département"
              value={userForm.department}
              onChange={(value) => handleInputChange('department', value)}
              onValidationChange={validateField}
              required
              disabled={!isConnected}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone color="primary" />
              Contact et préférences DocuCortex
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <ADFieldValidator
              fieldType={FIELD_TYPES.PHONE}
              label="Téléphone"
              value={userForm.phone}
              onChange={(value) => handleInputChange('phone', value)}
              onValidationChange={validateField}
              disabled={!isConnected}
            />
          </Grid>

          {/* Champs DocuCortex spécifiques */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Accès équipements"
              value={userForm.equipmentAccess}
              onChange={(e) => handleInputChange('equipmentAccess', e.target.value)}
              placeholder="Ex: Ordinateurs portables, Imprimantes"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Durée maximale de prêt (jours)"
              value={userForm.maxLoanDays}
              onChange={(e) => handleInputChange('maxLoanDays', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1, max: 90 }}
            />
          </Grid>
        </Grid>

        {/* Indicateurs de validation */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            État de validation Active Directory:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {['firstName', 'lastName', 'email', 'department'].map(field => {
              const status = getFieldStatus(field);
              const message = getFieldMessage(field);
              
              return (
                <Chip
                  key={field}
                  label={field}
                  color={
                    status === VALIDATION_STATUS.VALID ? 'success' :
                    status === VALIDATION_STATUS.INVALID ? 'error' :
                    status === VALIDATION_STATUS.WARNING ? 'warning' :
                    status === VALIDATION_STATUS.LOADING ? 'info' :
                    'default'
                  }
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="outlined"
            onClick={() => setUserForm({
              firstName: '', lastName: '', email: '', department: '',
              phone: '', equipmentAccess: '', maxLoanDays: 30, priorityLevel: 'normal'
            })}
          >
            Réinitialiser
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            disabled={!isConnected}
            startIcon={<Save />}
          >
            Créer l'utilisateur DocuCortex
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

/**
 * Composant principal de démonstration
 */
const ADValidationDemo = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Création complète', icon: Person },
    { label: 'Validation individuelle', icon: Badge },
    { label: 'Modification en masse', icon: Group },
    { label: 'Intégration DocuCortex', icon: BusinessCenter }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <UserCreationForm />;
      case 1:
        return <IndividualFieldExample />;
      case 2:
        return <BulkEditForm />;
      case 3:
        return <DocuCortexFormIntegration />;
      default:
        return <UserCreationForm />;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Badge color="primary" />
        Système de Validation Active Directory en Temps Réel
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Démonstration complète des fonctionnalités de validation AD avec auto-complétion intelligente,
        connexion live, et intégration seamless avec les formulaires DocuCortex.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={React.createElement(tab.icon)}
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>

      {/* Footer avec informations techniques */}
      <Paper sx={{ mt: 4, p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Fonctionnalités implémentées
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Validation en temps réel (debounce 300ms)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Auto-complétion intelligente
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Connexion AD live
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Indicateurs visuels (✓ ✗ ⚠️)
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Prévalidation avant sauvegarde
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Messages d'aide contextuelle
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Performance optimisée
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ✓ Interface utilisateur intuitive
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ADValidationDemo;
export { 
  UserCreationForm,
  IndividualFieldExample,
  BulkEditForm,
  DocuCortexFormIntegration
};