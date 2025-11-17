// src/components/alerts/index.js - EXPORT DES COMPOSANTS D'ALERTES
// Point d'entrée centralisé pour tous les composants du système d'alertes

export { default as AlertSystem } from './AlertSystem';
export { default as alertsService } from '../../services/alertsService';

// Export des constantes
export { ALERT_TYPES, ALERT_LEVELS, DEFAULT_ALERT_CONFIG } from '../../services/alertsService';

// Export des types et utilitaires
export { default as apiService } from '../../services/apiService';
export { LOAN_STATUS, SORT_DIRECTION } from '../../services/apiService';