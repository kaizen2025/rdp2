// src/components/validation/index.js - INDEX PRINCIPAL DU SYSTÈME DE VALIDATION AD
// Point d'entrée unique pour tous les composants et hooks de validation Active Directory

// Export principal des composants
export {
  ADFieldValidator,
  ADValidationForm,
  useADValidation,
  useADAutoComplete,
  VALIDATION_STATUS,
  FIELD_TYPES
} from './RealTimeValidationAD';

// Export des exemples et démonstrations
export {
  default as ADValidationDemo,
  UserCreationForm,
  IndividualFieldExample,
  BulkEditForm,
  DocuCortexFormIntegration
} from './ADValidationExample';

// Configuration par défaut
export const DEFAULT_AD_CONFIG = {
  // Connexion AD
  domain: 'docucortex.local',
  ldapUrl: 'ldap://dc.docucortex.local:389',
  bindDN: 'CN=Service Account,OU=Service Accounts,DC=docucortex,DC=local',
  bindCredentials: '', // À configurer selon l'environnement
  ouBase: 'DC=docucortex,DC=local',
  
  // Options de validation
  enableAutoComplete: true,
  debounceMs: 300,
  maxSuggestions: 10,
  enableLiveSearch: true,
  
  // Synchronisation
  autoSync: false,
  syncInterval: 300000, // 5 minutes
  
  // Performance
  retryAttempts: 3,
  timeout: 30000,
  
  // Mode développement
  mockData: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development'
};

// Configuration par environnement
export const ENVIRONMENTS = {
  development: {
    ...DEFAULT_AD_CONFIG,
    mockData: true,
    debug: true,
    ldapUrl: 'ldap://localhost:389'
  },
  
  staging: {
    ...DEFAULT_AD_CONFIG,
    mockData: false,
    debug: true,
    ldapUrl: 'ldap://staging-dc.docucortex.local:389'
  },
  
  production: {
    ...DEFAULT_AD_CONFIG,
    mockData: false,
    debug: false,
    ldapUrl: 'ldap://dc.docucortex.local:389'
  }
};

// Helper pour obtenir la configuration selon l'environnement
export const getEnvironmentConfig = (env = process.env.NODE_ENV) => {
  return ENVIRONMENTS[env] || ENVIRONMENTS.development;
};

// Messages d'erreur personnalisables
export const ERROR_MESSAGES = {
  [FIELD_TYPES.USERNAME]: {
    required: 'Le nom d\'utilisateur est obligatoire',
    tooShort: 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
    tooLong: 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères',
    invalidFormat: 'Caractères autorisés: lettres, chiffres, points et tirets uniquement',
    alreadyExists: 'Ce nom d\'utilisateur existe déjà dans Active Directory',
    reserved: 'Ce nom d\'utilisateur est réservé par le système'
  },
  
  [FIELD_TYPES.EMAIL]: {
    required: 'L\'adresse email est obligatoire',
    invalidFormat: 'Format d\'adresse email invalide',
    alreadyExists: 'Cette adresse email existe déjà dans Active Directory',
    domainRequired: 'Domaine corporate requis'
  },
  
  [FIELD_TYPES.DISPLAY_NAME]: {
    required: 'Le nom d\'affichage est obligatoire',
    tooShort: 'Le nom d\'affichage doit contenir au moins 2 caractères',
    tooLong: 'Le nom d\'affichage ne peut pas dépasser 100 caractères',
    duplicate: 'Plusieurs utilisateurs portent ce nom dans Active Directory'
  },
  
  [FIELD_TYPES.DEPARTMENT]: {
    required: 'Le département est obligatoire',
    notExists: 'Ce département n\'existe pas dans Active Directory',
    invalid: 'Nom de département invalide'
  },
  
  [FIELD_TYPES.MANAGER]: {
    notExists: 'L\'utilisateur spécifié n\'existe pas dans Active Directory',
    notManager: 'La personne sélectionnée ne semble pas être un manager',
    selfReference: 'Un utilisateur ne peut pas être son propre manager',
    circularReference: 'Référence circulaire détectée dans la hiérarchie'
  },
  
  [FIELD_TYPES.TITLE]: {
    required: 'Le titre/fonction est obligatoire',
    invalid: 'Titre/fonction invalide'
  },
  
  [FIELD_TYPES.PHONE]: {
    invalidFormat: 'Format de numéro de téléphone invalide',
    alreadyExists: 'Ce numéro de téléphone existe déjà'
  },
  
  [FIELD_TYPES.MOBILE]: {
    invalidFormat: 'Format de numéro de mobile invalide',
    alreadyExists: 'Ce numéro de mobile existe déjà'
  }
};

// Helper pour obtenir le message d'erreur
export const getErrorMessage = (fieldType, errorKey, defaultMessage = '') => {
  return ERROR_MESSAGES[fieldType]?.[errorKey] || defaultMessage;
};

// Utilitaires de validation
export const VALIDATION_UTILS = {
  // Validation format email
  validateEmailFormat: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validation nom d'utilisateur
  validateUsernameFormat: (username) => {
    return /^[a-zA-Z0-9.-]+$/.test(username) && username.length >= 3 && username.length <= 20;
  },
  
  // Validation téléphone français
  validateFrenchPhone: (phone) => {
    const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },
  
  // Normalisation numéro téléphone
  normalizePhone: (phone) => {
    return phone.replace(/\s/g, '').replace(/^0/, '+33');
  },
  
  // Validation nom d'affichage
  validateDisplayName: (name) => {
    return name && name.trim().length >= 2 && name.trim().length <= 100;
  }
};

// Styles CSS par défaut pour l'intégration
export const DEFAULT_STYLES = {
  fieldContainer: {
    width: '100%',
    mb: 2
  },
  
  validationIcon: {
    fontSize: '1.2rem',
    ml: 1
  },
  
  suggestionList: {
    maxHeight: 200,
    overflow: 'auto',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    mt: 0.5
  },
  
  suggestionItem: {
    px: 2,
    py: 1,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'action.hover'
    }
  },
  
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 2
  },
  
  validationSummary: {
    p: 2,
    borderRadius: 1,
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'divider'
  }
};

// Hook pour la configuration rapide
export const useQuickADValidation = (initialConfig = {}) => {
  const config = {
    ...DEFAULT_AD_CONFIG,
    ...initialConfig,
    // Override environnement si spécifié
    ...(initialConfig.environment && getEnvironmentConfig(initialConfig.environment))
  };
  
  return useADValidation(config);
};

// Helper pour la migration depuis anciens formulaires
export const migrateLegacyForm = (legacyFormData) => {
  const migrationMap = {
    'userName': FIELD_TYPES.USERNAME,
    'emailAddress': FIELD_TYPES.EMAIL,
    'fullName': FIELD_TYPES.DISPLAY_NAME,
    'firstname': FIELD_TYPES.FIRST_NAME,
    'lastname': FIELD_TYPES.LAST_NAME,
    'departmentName': FIELD_TYPES.DEPARTMENT,
    'managerName': FIELD_TYPES.MANAGER,
    'jobTitle': FIELD_TYPES.TITLE,
    'officePhone': FIELD_TYPES.PHONE,
    'mobilePhone': FIELD_TYPES.MOBILE
  };
  
  const migratedData = {};
  
  Object.entries(legacyFormData).forEach(([key, value]) => {
    const newKey = migrationMap[key] || key;
    migratedData[newKey] = value;
  });
  
  return migratedData;
};

// Configuration des champs par défaut pour DocuCortex
export const DEFAULT_DOCUSORTEX_FIELDS = [
  {
    type: FIELD_TYPES.USERNAME,
    label: 'Nom d\'utilisateur',
    required: true,
    placeholder: 'Ex: jdupont',
    helperText: 'Identifiant unique pour l\'authentification'
  },
  
  {
    type: FIELD_TYPES.EMAIL,
    label: 'Adresse email',
    required: true,
    placeholder: 'Ex: jean.dupont@docucortex.com',
    helperText: 'Email corporate pour les communications'
  },
  
  {
    type: FIELD_TYPES.DISPLAY_NAME,
    label: 'Nom d\'affichage',
    required: true,
    placeholder: 'Ex: Dupont, Jean',
    helperText: 'Nom complet pour l\'annuaire'
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
    helperText: 'Département de rattachement principal'
  },
  
  {
    type: FIELD_TYPES.MANAGER,
    label: 'Manager direct',
    required: false,
    placeholder: 'Rechercher un manager...',
    helperText: 'Responsable hiérarchique direct'
  },
  
  {
    type: FIELD_TYPES.TITLE,
    label: 'Fonction/Titre',
    required: true,
    placeholder: 'Ex: Développeur Senior',
    helperText: 'Intitulé du poste occupé'
  },
  
  {
    type: FIELD_TYPES.PHONE,
    label: 'Téléphone fixe',
    required: false,
    placeholder: 'Ex: +33 1 23 45 67 89',
    helperText: 'Numéro de téléphone du bureau'
  },
  
  {
    type: FIELD_TYPES.MOBILE,
    label: 'Téléphone mobile',
    required: false,
    placeholder: 'Ex: +33 6 12 34 56 78',
    helperText: 'Numéro de téléphone mobile'
  }
];

// Export par défaut du module
export default {
  // Composants
  ADFieldValidator,
  ADValidationForm,
  
  // Hooks
  useADValidation,
  useADAutoComplete,
  useQuickADValidation,
  
  // Utilitaires
  VALIDATION_STATUS,
  FIELD_TYPES,
  ERROR_MESSAGES,
  VALIDATION_UTILS,
  DEFAULT_STYLES,
  DEFAULT_AD_CONFIG,
  DEFAULT_DOCUSORTEX_FIELDS,
  
  // Helpers
  getErrorMessage,
  getEnvironmentConfig,
  migrateLegacyForm
};