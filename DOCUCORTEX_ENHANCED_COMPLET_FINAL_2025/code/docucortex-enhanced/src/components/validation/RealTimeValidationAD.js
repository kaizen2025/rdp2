// src/components/validation/RealTimeValidationAD.js - VALIDATION ACTIVE DIRECTORY EN TEMPS RÉEL
// Système de validation avancé avec auto-complétion intelligente et connexion AD live

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Popper,
  ClickAwayListener,
  Alert,
  Snackbar,
  Badge,
  Button,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Person,
  Group,
  BusinessCenter,
  SupervisorAccount,
  Search,
  Clear,
  Refresh,
  Info,
  Sync,
  Verified,
  SyncProblem
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';

// Imports des services existants
import ActiveDirectoryConnector from '../../integrations/ActiveDirectoryConnector';
import useElectronAD from '../../hooks/useElectronAD';
import { ModernTextField, ModernSelect } from '../ui/ModernFormField';

// Types de validation
const VALIDATION_STATUS = {
  VALID: 'valid',
  INVALID: 'invalid',
  WARNING: 'warning',
  LOADING: 'loading',
  NOT_CHECKED: 'not_checked'
};

const FIELD_TYPES = {
  USERNAME: 'username',
  EMAIL: 'email',
  DISPLAY_NAME: 'displayName',
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  DEPARTMENT: 'department',
  MANAGER: 'manager',
  GROUPS: 'groups',
  TITLE: 'title',
  PHONE: 'phone',
  MOBILE: 'mobile'
};

/**
 * Hook personnalisé pour la validation AD en temps réel
 */
export const useADValidation = (options = {}) => {
  const {
    enableAutoComplete = true,
    debounceMs = 300,
    maxSuggestions = 10,
    enableLiveSearch = true,
    ...adConfig
  } = options;

  const [validationStates, setValidationStates] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Initialiser le connecteur AD
  const adConnector = useMemo(() => {
    return new ActiveDirectoryConnector(adConfig);
  }, [adConfig]);

  // Hook Electron AD pour les interactions natives
  const {
    searchUsers,
    searchGroups,
    getUserDetails,
    isLoading: electronLoading,
    error: electronError,
    isElectronAPIAvailable
  } = useElectronAD();

  // Test de connexion au démarrage
  useEffect(() => {
    const testConnection = async () => {
      try {
        setConnectionStatus('connecting');
        const health = await adConnector.healthCheck();
        setIsConnected(health.healthy);
        setConnectionStatus(health.healthy ? 'connected' : 'error');
      } catch (error) {
        console.warn('Erreur connexion AD:', error);
        setIsConnected(false);
        setConnectionStatus('error');
      }
    };

    testConnection();
  }, [adConnector]);

  // Fonction de validation avec debounce
  const debouncedValidation = useCallback(
    debounce(async (fieldType, value) => {
      if (!value || !enableLiveSearch) return;

      setValidationStates(prev => ({
        ...prev,
        [fieldType]: { status: VALIDATION_STATUS.LOADING, value }
      }));

      try {
        let validationResult;

        switch (fieldType) {
          case FIELD_TYPES.USERNAME:
            validationResult = await validateUsername(value);
            break;
          case FIELD_TYPES.EMAIL:
            validationResult = await validateEmail(value);
            break;
          case FIELD_TYPES.DISPLAY_NAME:
            validationResult = await validateDisplayName(value);
            break;
          case FIELD_TYPES.DEPARTMENT:
            validationResult = await validateDepartment(value);
            break;
          case FIELD_TYPES.MANAGER:
            validationResult = await validateManager(value);
            break;
          case FIELD_TYPES.GROUPS:
            validationResult = await validateGroups(value);
            break;
          default:
            validationResult = { status: VALIDATION_STATUS.VALID, message: 'Champ valide' };
        }

        setValidationStates(prev => ({
          ...prev,
          [fieldType]: {
            ...validationResult,
            value,
            timestamp: new Date().toISOString()
          }
        }));

      } catch (error) {
        setValidationStates(prev => ({
          ...prev,
          [fieldType]: {
            status: VALIDATION_STATUS.INVALID,
            message: `Erreur de validation: ${error.message}`,
            value,
            timestamp: new Date().toISOString()
          }
        }));
      }
    }, debounceMs),
    [debounceMs, enableLiveSearch]
  );

  // Validation du nom d'utilisateur
  const validateUsername = async (username) => {
    if (!username || username.length < 3) {
      return {
        status: VALIDATION_STATUS.INVALID,
        message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
      };
    }

    // Vérification du format (lettres, chiffres, points et tirets uniquement)
    if (!/^[a-zA-Z0-9.-]+$/.test(username)) {
      return {
        status: VALIDATION_STATUS.INVALID,
        message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, points et tirets'
      };
    }

    // Vérification de l'unicité via AD
    try {
      const users = isElectronAPIAvailable 
        ? await searchUsers(username)
        : await adConnector.searchUsers(`(samAccountName=*${username}*)`);

      if (users && users.length > 0) {
        return {
          status: VALIDATION_STATUS.WARNING,
          message: `Le nom d'utilisateur "${username}" existe déjà dans Active Directory`,
          suggestions: users.slice(0, 3).map(user => ({
            label: user.samAccountName || user.displayName,
            value: user.samAccountName,
            type: 'user'
          }))
        };
      }

      return {
        status: VALIDATION_STATUS.VALID,
        message: 'Le nom d\'utilisateur est disponible'
      };

    } catch (error) {
      return {
        status: VALIDATION_STATUS.VALID,
        message: 'Validation réussie (mode hors-ligne)'
      };
    }
  };

  // Validation de l'email
  const validateEmail = async (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return {
        status: VALIDATION_STATUS.INVALID,
        message: 'L\'adresse email est requise'
      };
    }

    if (!emailRegex.test(email)) {
      return {
        status: VALIDATION_STATUS.INVALID,
        message: 'Format d\'adresse email invalide'
      };
    }

    // Vérification de l'unicité via AD
    try {
      const users = isElectronAPIAvailable 
        ? await searchUsers(email)
        : await adConnector.searchUsers(`(mail=${email})`);

      if (users && users.length > 0) {
        return {
          status: VALIDATION_STATUS.WARNING,
          message: 'Cette adresse email existe déjà dans Active Directory',
          suggestions: users.slice(0, 3)
        };
      }

      return {
        status: VALIDATION_STATUS.VALID,
        message: 'Adresse email valide et disponible'
      };

    } catch (error) {
      return {
        status: VALIDATION_STATUS.VALID,
        message: 'Validation réussie (mode hors-ligne)'
      };
    }
  };

  // Validation du nom d'affichage
  const validateDisplayName = async (displayName) => {
    if (!displayName || displayName.length < 2) {
      return {
        status: VALIDATION_STATUS.INVALID,
        message: 'Le nom d\'affichage est requis'
      };
    }

    // Vérification via AD
    try {
      const users = isElectronAPIAvailable 
        ? await searchUsers(displayName)
        : await adConnector.searchUsers(`(displayName=*${displayName}*)`);

      if (users && users.length > 0) {
        return {
          status: VALIDATION_STATUS.WARNING,
          message: `Plusieurs utilisateurs portent ce nom dans Active Directory`,
          suggestions: users.slice(0, 3).map(user => ({
            label: user.displayName || user.samAccountName,
            value: user.samAccountName,
            detail: user.title || user.department
          }))
        };
      }

      return {
        status: VALIDATION_STATUS.VALID,
        message: 'Nom d\'affichage unique'
      };

    } catch (error) {
      return {
        status: VALIDATION_STATUS.VALID,
        message: 'Validation réussie (mode hors-ligne)'
      };
    }
  };

  // Validation du département
  const validateDepartment = async (department) => {
    if (!department) {
      return {
        status: VALIDATION_STATUS.WARNING,
        message: 'Le département est recommandé'
      };
    }

    // Validation via AD - récupération des départements existants
    try {
      const structure = await adConnector.syncOrganizationalStructure();
      const departments = structure.departments || [];
      
      const exists = departments.some(dept => 
        dept.name.toLowerCase() === department.toLowerCase()
      );

      if (!exists && departments.length > 0) {
        return {
          status: VALIDATION_STATUS.WARNING,
          message: `Le département "${department}" n'existe pas dans AD`,
          suggestions: departments.slice(0, 5).map(dept => ({
            label: dept.name,
            value: dept.name,
            type: 'department'
          }))
        };
      }

      return {
        status: VALIDATION_STATUS.VALID,
        message: 'Département valide'
      };

    } catch (error) {
      // Mode hors-ligne - validation basique
      return {
        status: VALIDATION_STATUS.VALID,
        message: 'Validation réussie (mode hors-ligne)'
      };
    }
  };

  // Validation du manager
  const validateManager = async (manager) => {
    if (!manager) {
      return {
        status: VALIDATION_STATUS.WARNING,
        message: 'La désignation d\'un manager est recommandée'
      };
    }

    // Validation via AD
    try {
      const userDetails = isElectronAPIAvailable 
        ? await getUserDetails(manager)
        : await adConnector.searchUsers(`(samAccountName=${manager})`);

      if (!userDetails || (Array.isArray(userDetails) && userDetails.length === 0)) {
        return {
          status: VALIDATION_STATUS.INVALID,
          message: `L'utilisateur "${manager}" n'existe pas dans Active Directory`
        };
      }

      const user = Array.isArray(userDetails) ? userDetails[0] : userDetails;
      
      if (user.title && !user.title.toLowerCase().includes('manager') && 
          !user.title.toLowerCase().includes('responsable')) {
        return {
          status: VALIDATION_STATUS.WARNING,
          message: `${user.displayName} ne semble pas être un manager`
        };
      }

      return {
        status: VALIDATION_STATUS.VALID,
        message: `Manager validé: ${user.displayName || manager}`,
        data: user
      };

    } catch (error) {
      return {
        status: VALIDATION_STATUS.WARNING,
        message: `Validation mode hors-ligne pour: ${manager}`
      };
    }
  };

  // Validation des groupes
  const validateGroups = async (groups) => {
    if (!groups || groups.length === 0) {
      return {
        status: VALIDATION_STATUS.WARNING,
        message: 'Au moins un groupe est recommandé'
      };
    }

    try {
      const validationPromises = groups.map(async (group) => {
        const result = isElectronAPIAvailable 
          ? await searchGroups(group)
          : await adConnector.searchUsers(`(cn=${group})`);
        
        return {
          group,
          exists: result && result.length > 0,
          valid: true
        };
      });

      const results = await Promise.all(validationPromises);
      const invalidGroups = results.filter(r => !r.exists);

      if (invalidGroups.length > 0) {
        return {
          status: VALIDATION_STATUS.INVALID,
          message: `Groupes inexistants: ${invalidGroups.map(g => g.group).join(', ')}`
        };
      }

      return {
        status: VALIDATION_STATUS.VALID,
        message: `${groups.length} groupe(s) validé(s)`
      };

    } catch (error) {
      return {
        status: VALIDATION_STATUS.WARNING,
        message: 'Validation des groupes en mode hors-ligne'
      };
    }
  };

  // Récupération de suggestions d'auto-complétion
  const getSuggestions = useCallback(async (fieldType, searchTerm) => {
    if (!searchTerm || searchTerm.length < 2 || !enableAutoComplete) return [];

    try {
      let suggestions = [];

      switch (fieldType) {
        case FIELD_TYPES.DEPARTMENT:
          const structure = await adConnector.syncOrganizationalStructure();
          suggestions = (structure.departments || [])
            .filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(dept => ({
              label: dept.name,
              value: dept.name,
              type: 'department',
              description: dept.description
            }));
          break;

        case FIELD_TYPES.MANAGER:
          if (isElectronAPIAvailable) {
            const users = await searchUsers(searchTerm);
            suggestions = users.map(user => ({
              label: user.displayName || user.samAccountName,
              value: user.samAccountName,
              type: 'user',
              description: user.title,
              detail: user.department
            }));
          }
          break;

        case FIELD_TYPES.GROUPS:
          if (isElectronAPIAvailable) {
            const groups = await searchGroups(searchTerm);
            suggestions = groups.map(group => ({
              label: group.name,
              value: group.name,
              type: 'group',
              description: group.description
            }));
          }
          break;

        case FIELD_TYPES.USERNAME:
        case FIELD_TYPES.DISPLAY_NAME:
          if (isElectronAPIAvailable) {
            const users = await searchUsers(searchTerm);
            suggestions = users.slice(0, maxSuggestions).map(user => ({
              label: user.displayName || user.samAccountName,
              value: user.samAccountName,
              type: 'user',
              description: user.title,
              detail: user.department
            }));
          }
          break;
      }

      return suggestions.slice(0, maxSuggestions);

    } catch (error) {
      console.warn('Erreur récupération suggestions:', error);
      return [];
    }
  }, [enableAutoComplete, maxSuggestions, isElectronAPIAvailable, adConnector, searchUsers, searchGroups, getUserDetails]);

  // Fonction de validation manuelle
  const validateField = useCallback((fieldType, value) => {
    debouncedValidation(fieldType, value);
  }, [debouncedValidation]);

  // Fonction de prévalidation complète
  const preValidateForm = useCallback(async (formData) => {
    const validationPromises = Object.entries(formData).map(([fieldType, value]) => 
      validateField(fieldType, value)
    );

    await Promise.all(validationPromises);

    // Analyser les résultats
    const results = validationStates;
    const errors = Object.entries(results).filter(([_, state]) => 
      state.status === VALIDATION_STATUS.INVALID
    );

    const warnings = Object.entries(results).filter(([_, state]) => 
      state.status === VALIDATION_STATUS.WARNING
    );

    return {
      isValid: errors.length === 0,
      errors: errors.map(([field, state]) => ({ field, message: state.message })),
      warnings: warnings.map(([field, state]) => ({ field, message: state.message })),
      results
    };
  }, [validateField, validationStates]);

  // Récupération de suggestions pour l'auto-complétion
  const fetchSuggestions = useCallback(async (fieldType, searchTerm) => {
    const newSuggestions = await getSuggestions(fieldType, searchTerm);
    setSuggestions(prev => ({
      ...prev,
      [fieldType]: newSuggestions
    }));
  }, [getSuggestions]);

  return {
    // État
    validationStates,
    suggestions,
    isConnected,
    connectionStatus,
    isElectronAPIAvailable,
    isLoading: electronLoading,
    error: electronError,

    // Méthodes de validation
    validateField,
    preValidateForm,
    getSuggestions: fetchSuggestions,
    clearValidation: (fieldType) => {
      setValidationStates(prev => {
        const newState = { ...prev };
        delete newState[fieldType];
        return newState;
      });
    },
    clearAllValidations: () => setValidationStates({}),
    
    // Méthodes utilitaires
    getFieldStatus: (fieldType) => validationStates[fieldType]?.status || VALIDATION_STATUS.NOT_CHECKED,
    getFieldMessage: (fieldType) => validationStates[fieldType]?.message || '',
    getFieldSuggestions: (fieldType) => suggestions[fieldType] || []
  };
};

/**
 * Composant de validation d'un champ AD en temps réel
 */
export const ADFieldValidator = ({
  fieldType,
  label,
  value,
  onChange,
  onValidationChange,
  options = {},
  disabled = false,
  required = false,
  ...props
}) => {
  const {
    validateField,
    getFieldStatus,
    getFieldMessage,
    getFieldSuggestions,
    isConnected,
    connectionStatus,
    isElectronAPIAvailable
  } = useADValidation();

  const [localValue, setLocalValue] = useState(value || '');
  const [localSuggestions, setLocalSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Synchroniser la valeur locale avec la prop
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Validation en temps réel
  useEffect(() => {
    if (localValue && isConnected) {
      const timeoutId = setTimeout(() => {
        validateField(fieldType, localValue);
        onValidationChange?.(fieldType, localValue);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [localValue, fieldType, isConnected, validateField, onValidationChange]);

  // Récupération des suggestions
  const fetchSuggestions = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setLocalSuggestions([]);
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      const suggestions = getFieldSuggestions(fieldType);
      const filtered = suggestions.filter(suggestion =>
        suggestion.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (suggestion.value && suggestion.value.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setLocalSuggestions(filtered);
    } catch (error) {
      console.warn('Erreur suggestions:', error);
      setLocalSuggestions([]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [fieldType, getFieldSuggestions]);

  // Gestion du changement de valeur
  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange?.(newValue);
    fetchSuggestions(newValue);
  };

  // Gestion de la sélection d'une suggestion
  const handleSuggestionSelect = (suggestion) => {
    const selectValue = suggestion.value || suggestion.label;
    handleChange(selectValue);
    setShowSuggestions(false);
    setLocalSuggestions([]);
  };

  // Gestion des focus/blur pour l'affichage des suggestions
  const handleFocus = () => {
    if (localSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Délai pour permettre la sélection d'une suggestion
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Obtenir les informations de statut et d'icône
  const getStatusInfo = () => {
    const status = getFieldStatus(fieldType);
    const message = getFieldMessage(fieldType);

    switch (status) {
      case VALIDATION_STATUS.VALID:
        return {
          icon: <CheckCircle color="success" fontSize="small" />,
          color: 'success',
          message: message || 'Valide'
        };
      case VALIDATION_STATUS.INVALID:
        return {
          icon: <ErrorIcon color="error" fontSize="small" />,
          color: 'error',
          message: message || 'Invalide'
        };
      case VALIDATION_STATUS.WARNING:
        return {
          icon: <Warning color="warning" fontSize="small" />,
          color: 'warning',
          message: message || 'Attention'
        };
      case VALIDATION_STATUS.LOADING:
        return {
          icon: <CircularProgress size={16} />,
          color: 'info',
          message: 'Validation...'
        };
      default:
        return {
          icon: null,
          color: 'default',
          message: ''
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Déterminer si on utilise l'autocomplete ou un champ simple
  const useAutocomplete = [
    FIELD_TYPES.DEPARTMENT,
    FIELD_TYPES.MANAGER,
    FIELD_TYPES.GROUPS,
    FIELD_TYPES.USERNAME,
    FIELD_TYPES.DISPLAY_NAME
  ].includes(fieldType);

  const renderInput = () => {
    if (useAutocomplete) {
      return (
        <Autocomplete
          value={localValue}
          onChange={(event, newValue) => handleChange(newValue || '')}
          onInputChange={(event, newInputValue) => handleChange(newInputValue)}
          options={localSuggestions}
          getOptionLabel={(option) => 
            typeof option === 'string' ? option : option.label
          }
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          loading={isFetchingSuggestions}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              error={statusInfo.color === 'error'}
              helperText={statusInfo.message}
              required={required}
              disabled={disabled}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isFetchingSuggestions ? (
                      <CircularProgress color="inherit" size={16} />
                    ) : null}
                    {params.InputProps.endAdornment}
                    {!isElectronAPIAvailable && (
                      <Tooltip title="Mode hors-ligne">
                        <SyncProblem color="warning" fontSize="small" />
                      </Tooltip>
                    )}
                  </>
                ),
                startAdornment: statusInfo.icon
              }}
              {...props}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {option.type === 'user' && <Person fontSize="small" color="primary" />}
                {option.type === 'group' && <Group fontSize="small" color="secondary" />}
                {option.type === 'department' && <BusinessCenter fontSize="small" color="info" />}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">
                    {typeof option === 'string' ? option : option.label}
                  </Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                  {option.detail && (
                    <Typography variant="caption" color="text.secondary">
                      {option.detail}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        />
      );
    }

    return (
      <ModernTextField
        label={label}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={statusInfo.color === 'error'}
        success={statusInfo.color === 'success'}
        warning={statusInfo.color === 'warning'}
        helperText={statusInfo.message}
        disabled={disabled}
        required={required}
        endAdornment={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {statusInfo.icon}
            {!isElectronAPIAvailable && (
              <Tooltip title="Mode hors-ligne">
                <SyncProblem color="warning" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        }
        {...props}
      />
    );
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {renderInput()}
      
      {/* Indicateur de connexion */}
      <Box sx={{ 
        position: 'absolute', 
        top: -8, 
        right: 8, 
        zIndex: 1 
      }}>
        <Tooltip title={`Statut AD: ${connectionStatus}`}>
          <Badge
            variant="dot"
            color={isConnected ? 'success' : 'error'}
            sx={{
              '& .MuiBadge-dot': {
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }
            }}
          >
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: isConnected ? 'success.main' : 'error.main' 
            }} />
          </Badge>
        </Tooltip>
      </Box>
    </Box>
  );
};

/**
 * Composant de formulaire de validation AD complet
 */
export const ADValidationForm = ({
  initialData = {},
  onSubmit,
  onValidationChange,
  fields = [],
  title = 'Validation Active Directory',
  showTitle = true,
  showConnectionStatus = true,
  enablePreValidation = true,
  ...props
}) => {
  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);

  const {
    validationStates,
    isConnected,
    connectionStatus,
    preValidateForm,
    validateField,
    isElectronAPIAvailable
  } = useADValidation();

  // Gestion du changement de valeur d'un champ
  const handleFieldChange = (fieldType, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldType]: value
    }));
    
    onValidationChange?.(fieldType, value);
  };

  // Validation individuelle
  const handleValidationChange = (fieldType, value) => {
    validateField(fieldType, value);
  };

  // Prévalidation complète avant soumission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!enablePreValidation) {
      onSubmit?.(formData);
      return;
    }

    setIsSubmitting(true);
    try {
      const validation = await preValidateForm(formData);
      
      if (!validation.isValid) {
        setValidationComplete(true);
        setIsSubmitting(false);
        return;
      }

      // Soumission avec données validées
      onSubmit?.({
        ...formData,
        validation
      });

    } catch (error) {
      console.error('Erreur prévalidation:', error);
    } finally {
      setIsSubmitting(false);
      setValidationComplete(false);
    }
  };

  // Récapitulatif de validation
  const getValidationSummary = () => {
    const totalFields = fields.length;
    const validatedFields = Object.keys(validationStates).length;
    const validFields = Object.values(validationStates).filter(v => v.status === VALIDATION_STATUS.VALID).length;
    const invalidFields = Object.values(validationStates).filter(v => v.status === VALIDATION_STATUS.INVALID).length;
    const warningFields = Object.values(validationStates).filter(v => v.status === VALIDATION_STATUS.WARNING).length;

    return {
      total: totalFields,
      validated: validatedFields,
      valid: validFields,
      invalid: invalidFields,
      warnings: warningFields,
      progress: totalFields > 0 ? Math.round((validatedFields / totalFields) * 100) : 0
    };
  };

  const summary = getValidationSummary();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {showTitle && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          
          {showConnectionStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                icon={<Sync color={isConnected ? 'inherit' : 'error'} />}
                label={`Statut AD: ${connectionStatus}`}
                color={isConnected ? 'success' : 'error'}
                variant="outlined"
                size="small"
              />
              {!isElectronAPIAvailable && (
                <Chip
                  icon={<Info />}
                  label="Mode hors-ligne"
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          )}

          {/* Barre de progression de validation */}
          {fields.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Progression de validation: {summary.progress}%
              </Typography>
              <Box sx={{ 
                height: 4, 
                backgroundColor: 'grey.200', 
                borderRadius: 2, 
                overflow: 'hidden' 
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.progress}%` }}
                  transition={{ duration: 0.5 }}
                  sx={{ 
                    height: '100%', 
                    backgroundColor: summary.invalid > 0 ? 'error.main' : 
                                    summary.warnings > 0 ? 'warning.main' : 
                                    'success.main' 
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {summary.valid > 0 && (
                  <Chip size="small" color="success" label={`${summary.valid} valides`} />
                )}
                {summary.warnings > 0 && (
                  <Chip size="small" color="warning" label={`${summary.warnings} avertissements`} />
                )}
                {summary.invalid > 0 && (
                  <Chip size="small" color="error" label={`${summary.invalid} erreurs`} />
                )}
              </Box>
            </Paper>
          )}
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {fields.map((field) => (
            <ADFieldValidator
              key={field.type}
              fieldType={field.type}
              label={field.label}
              value={formData[field.type] || ''}
              onChange={(value) => handleFieldChange(field.type, value)}
              onValidationChange={handleValidationChange}
              disabled={field.disabled || isSubmitting}
              required={field.required}
              options={field.options}
              placeholder={field.placeholder}
              helperText={field.helperText}
              {...field.props}
            />
          ))}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="outlined"
            disabled={isSubmitting}
            onClick={() => {
              setFormData(initialData);
              setValidationComplete(false);
            }}
          >
            Réinitialiser
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || (!isConnected && !enablePreValidation)}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <Verified />}
          >
            {isSubmitting ? 'Validation...' : 'Valider et continuer'}
          </Button>
        </Box>
      </form>

      {/* Messages de validation */}
      <AnimatePresence>
        {validationComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert 
              severity="error" 
              sx={{ mt: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => setValidationComplete(false)}>
                  Masquer
                </Button>
              }
            >
              <Typography variant="subtitle2">
                Erreurs de validation détectées
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Veuillez corriger les champs marqués en erreur avant de continuer.
              </Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

/**
 * Hook pour l'auto-complétion intelligente des champs AD
 */
export const useADAutoComplete = () => {
  const [cachedSuggestions, setCachedSuggestions] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndCacheSuggestions = useCallback(async (fieldType, searchTerm) => {
    const cacheKey = `${fieldType}_${searchTerm.toLowerCase()}`;
    
    // Vérifier le cache
    if (cachedSuggestions[cacheKey]) {
      return cachedSuggestions[cacheKey];
    }

    setIsLoading(true);
    try {
      // Logique de récupération selon le type de champ
      // Cette fonction peut être étendue selon les besoins
      const suggestions = []; // Implémentation spécifique
      
      // Mettre en cache
      setCachedSuggestions(prev => ({
        ...prev,
        [cacheKey]: suggestions
      }));
      
      return suggestions;
    } finally {
      setIsLoading(false);
    }
  }, [cachedSuggestions]);

  const clearCache = useCallback(() => {
    setCachedSuggestions({});
  }, []);

  return {
    fetchAndCacheSuggestions,
    clearCache,
    isLoading,
    cacheSize: Object.keys(cachedSuggestions).length
  };
};

export default {
  useADValidation,
  ADFieldValidator,
  ADValidationForm,
  useADAutoComplete,
  VALIDATION_STATUS,
  FIELD_TYPES
};