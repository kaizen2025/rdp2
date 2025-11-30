// src/config/alertsConfig.js - CONFIGURATION DU SYSTÈME D'ALERTES
// Configuration centralisée pour l'intégration du système d'alertes DocuCortex

// 📋 CONFIGURATION DES SEUILS D'ALERTES
export const ALERT_THRESHOLDS = {
    // Seuils en jours avant expiration
    CRITICAL: 3,        // Alertes critiques (<= 3 jours)
    WARNING: 7,         // Avertissements (<= 7 jours)
    UPCOMING_24H: 1,    // Urgence 24h (1 jour)
    UPCOMING_48H: 2,    // Rappel 48h (2 jours)
    
    // Seuils personnalisés (peuvent être modifiés par l'utilisateur)
    CUSTOM_CRITICAL: 3,
    CUSTOM_WARNING: 7
};

// 🔔 CONFIGURATION DES NOTIFICATIONS
export const NOTIFICATION_CONFIG = {
    // Types de notifications activées par défaut
    ENABLE_BROWSER_NOTIFICATIONS: true,
    ENABLE_IN_APP_NOTIFICATIONS: true,
    ENABLE_EMAIL_NOTIFICATIONS: false, // Future intégration
    
    // Comportement des notifications
    AUTO_CLOSE_DELAY: 10000, // 10 secondes pour les non-critiques
    REQUIRE_INTERACTION: true, // Pour les alertes critiques
    SHOW_BADGE: true,
    
    // Limites de stockage
    MAX_NOTIFICATIONS: 100,
    MAX_HISTORY: 500,
    MAX_SENT_NOTIFICATIONS: 1000,
    
    // Fréquence de nettoyage (en jours)
    CLEANUP_INTERVAL_DAYS: 30
};

// 🎨 CONFIGURATION DE L'INTERFACE UTILISATEUR
export const UI_CONFIG = {
    // Tailles des composants
    COMPACT_MODE: false,
    SHOW_STATISTICS: true,
    SHOW_GLOBAL_STATUS: true,
    
    // Options d'affichage
    ENABLE_ANIMATIONS: true,
    ENABLE_SOUND_NOTIFICATIONS: false, // Future fonctionnalité
    THEME_COLOR: 'primary',
    
    // Responsive design
    MOBILE_BREAKPOINT: 768, // px
    TABLET_BREAKPOINT: 1024, // px
    
    // Performance
    VIRTUALIZATION_THRESHOLD: 100, // Nombre d'éléments pour activer la virtualisation
    SEARCH_DEBOUNCE_MS: 300,
    REFRESH_INTERVAL_MS: 300000 // 5 minutes
};

// 📊 CONFIGURATION DES MÉTRIQUES ET ANALYTICS
export const ANALYTICS_CONFIG = {
    // Métriques à calculer
    CALCULATE_TRENDS: true,
    CALCULATE_RISK_LEVELS: true,
    CALCULATE_USER_BEHAVIOR: true,
    
    // Périodes d'analyse
    LAST_24H: 24 * 60 * 60 * 1000,
    LAST_7D: 7 * 24 * 60 * 60 * 1000,
    LAST_30D: 30 * 24 * 60 * 60 * 1000,
    
    // Seuils pour les alertes de performance
    PERFORMANCE_THRESHOLDS: {
        RENDER_TIME: 16, // ms (60fps)
        MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
        NOTIFICATION_FREQUENCY: 10 // max notifications par heure
    }
};

// 🌐 CONFIGURATION API
export const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    TIMEOUT: 30000,
    RETRIES: 3,
    
    // Endpoints spécifiques aux alertes
    ENDPOINTS: {
        LOANS: '/loans',
        LOANS_STATISTICS: '/loans/statistics',
        LOANS_OVERDUE: '/loans/overdue',
        LOANS_EXPIRING: '/loans/expiring',
        NOTIFICATIONS: '/notifications',
        USERS: '/users',
        BULK_ACTIONS: '/loans/bulk'
    },
    
    // Cache configuration
    CACHE_ENABLED: true,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    CACHE_KEY_PREFIX: 'docucortex_'
};

// 🔐 CONFIGURATION DES PERMISSIONS ET SÉCURITÉ
export const SECURITY_CONFIG = {
    // Permissions requises
    REQUIRE_USER_AUTHENTICATION: true,
    ALLOW_ANONYMOUS_VIEW: false,
    
    // Actions nécessitant des permissions spéciales
    ADMIN_ONLY_ACTIONS: ['bulk_delete', 'system_settings'],
    USER_ACTIONS: ['view', 'extend', 'recall', 'return'],
    
    // Validation des données
    VALIDATE_DATES: true,
    MAX_EXTENSION_DAYS: 30,
    ALLOW_BACKDATED_LOANS: false
};

// 📱 CONFIGURATION MOBILE ET PWA
export const MOBILE_CONFIG = {
    // Support PWA
    ENABLE_PWA: true,
    ENABLE_SERVICE_WORKER: true,
    CACHE_STRATEGY: 'cache-first',
    
    // Notifications push (Future)
    ENABLE_PUSH_NOTIFICATIONS: true,
    VAPID_PUBLIC_KEY: process.env.REACT_APP_VAPID_PUBLIC_KEY,
    
    // Optimisations mobiles
    REDUCE_ANIMATIONS_ON_MOBILE: true,
    OPTIMIZE_FOR_TOUCH: true,
    ENABLE_OFFLINE_MODE: true
};

// 🎯 CONFIGURATION DES ACTIONS AUTOMATIQUES
export const AUTOMATION_CONFIG = {
    // Actions automatiques basées sur les règles
    ENABLE_AUTO_EXTENSIONS: false,
    AUTO_EXTENSION_DAYS: 7,
    
    // Rappels automatiques
    ENABLE_AUTO_REMINDERS: true,
    REMINDER_SCHEDULE: [24, 48], // heures avant expiration
    
    // Escalade automatique
    ENABLE_ESCALATION: true,
    ESCALATION_THRESHOLDS: {
        FIRST_ESCALATION: 1, // jour de retard
        SECOND_ESCALATION: 3, // 3 jours de retard
        MANAGER_NOTIFICATION: 7 // 7 jours de retard
    }
};

// 📧 CONFIGURATION EMAIL (FUTUR)
export const EMAIL_CONFIG = {
    ENABLE_EMAIL_INTEGRATION: false,
    SMTP_CONFIG: {
        HOST: process.env.SMTP_HOST,
        PORT: process.env.SMTP_PORT || 587,
        SECURE: process.env.SMTP_SECURE === 'true',
        AUTH: {
            USER: process.env.SMTP_USER,
            PASS: process.env.SMTP_PASS
        }
    },
    
    // Templates d'emails
    EMAIL_TEMPLATES: {
        REMINDER_24H: 'reminder-24h-template',
        REMINDER_48H: 'reminder-48h-template',
        OVERDUE: 'overdue-template',
        ESCALATION: 'escalation-template'
    },
    
    // Fréquence d'envoi
    BATCH_SIZE: 50,
    DELAY_BETWEEN_BATCHES: 1000 // ms
};

// 🌍 CONFIGURATION INTERNATIONNALISATION
export const I18N_CONFIG = {
    DEFAULT_LOCALE: 'fr',
    SUPPORTED_LOCALES: ['fr', 'en', 'es'],
    
    // Formats de date selon la locale
    DATE_FORMATS: {
        fr: 'dd/MM/yyyy à HH:mm',
        en: 'MM/dd/yyyy at HH:mm',
        es: 'dd/MM/yyyy a las HH:mm'
    },
    
    // Traductions des types d'alertes
    ALERT_TYPES_TRANSLATIONS: {
        fr: {
            upcoming_24h: 'Expire demain',
            upcoming_48h: 'Expire dans 2 jours',
            critical: 'Critique',
            overdue: 'En retard'
        },
        en: {
            upcoming_24h: 'Expires tomorrow',
            upcoming_48h: 'Expires in 2 days',
            critical: 'Critical',
            overdue: 'Overdue'
        }
    }
};

// 🔧 CONFIGURATION DES DÉVELOPPEURS
export const DEV_CONFIG = {
    // Mode debug
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    
    // Fonctionnalités de développement
    ENABLE_MOCK_DATA: process.env.REACT_APP_USE_MOCK_DATA === 'true',
    ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
    
    // URLs de test
    TEST_DATA_URLS: {
        MOCK_LOANS: '/mock-data/loans.json',
        MOCK_USERS: '/mock-data/users.json',
        MOCK_DOCUMENTS: '/mock-data/documents.json'
    }
};

// 🎨 CONFIGURATION DU THÈME MATERIAL-UI
export const THEME_CONFIG = {
    // Couleurs des alertes selon le niveau
    ALERT_COLORS: {
        LOW: 'info',
        MEDIUM: 'warning',
        HIGH: 'error',
        CRITICAL: 'error'
    },
    
    // Icônes par type d'alerte
    ALERT_ICONS: {
        upcoming_24h: 'Warning',
        upcoming_48h: 'Schedule',
        critical: 'NotificationsActive',
        overdue: 'Error'
    },
    
    // Animations
    ENABLE_PULSE_ANIMATION: true,
    PULSE_DURATION: 2000,
    
    // Transitions
    TRANSITION_DURATION: 300
};

// 📋 EXPORT DE LA CONFIGURATION COMPLÈTE
export const ALERTS_CONFIG = {
    THRESHOLDS: ALERT_THRESHOLDS,
    NOTIFICATIONS: NOTIFICATION_CONFIG,
    UI: UI_CONFIG,
    ANALYTICS: ANALYTICS_CONFIG,
    API: API_CONFIG,
    SECURITY: SECURITY_CONFIG,
    MOBILE: MOBILE_CONFIG,
    AUTOMATION: AUTOMATION_CONFIG,
    EMAIL: EMAIL_CONFIG,
    I18N: I18N_CONFIG,
    DEV: DEV_CONFIG,
    THEME: THEME_CONFIG
};

// 🔄 FONCTIONS UTILITAIRES DE CONFIGURATION
export const getConfigValue = (path, defaultValue = null) => {
    const keys = path.split('.');
    let value = ALERTS_CONFIG;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return defaultValue;
        }
    }
    
    return value;
};

export const updateConfig = (path, value) => {
    const keys = path.split('.');
    let config = ALERTS_CONFIG;
    
    // Naviguer jusqu'à l'avant-dernier niveau
    for (let i = 0; i < keys.length - 1; i++) {
        if (!config[keys[i]]) {
            config[keys[i]] = {};
        }
        config = config[keys[i]];
    }
    
    // Assigner la valeur
    config[keys[keys.length - 1]] = value;
    
    // Émettre un événement de mise à jour de configuration
    window.dispatchEvent(new CustomEvent('docucortex-config-updated', {
        detail: { path, value }
    }));
};

export const resetConfig = () => {
    // Réinitialiser aux valeurs par défaut (nécessite re-import)
    console.log('🔄 Configuration réinitialisée aux valeurs par défaut');
    
    window.dispatchEvent(new CustomEvent('docucortex-config-reset', {
        detail: { timestamp: Date.now() }
    }));
};

// 🌍 VALIDATION DE LA CONFIGURATION
export const validateConfig = () => {
    const errors = [];
    
    // Vérifier les seuils
    if (ALERT_THRESHOLDS.CRITICAL >= ALERT_THRESHOLDS.WARNING) {
        errors.push('Le seuil critique doit être inférieur au seuil d\'avertissement');
    }
    
    // Vérifier les URLs API
    if (!API_CONFIG.BASE_URL || !API_CONFIG.BASE_URL.startsWith('http')) {
        errors.push('URL API invalide');
    }
    
    // Vérifier les limites de stockage
    if (NOTIFICATION_CONFIG.MAX_NOTIFICATIONS < 10) {
        errors.push('Le nombre maximum de notifications doit être d\'au moins 10');
    }
    
    // Vérifier les performances
    if (ANALYTICS_CONFIG.PERFORMANCE_THRESHOLDS.RENDER_TIME < 8) {
        errors.push('Le seuil de performance semble trop strict');
    }
    
    if (errors.length > 0) {
        console.error('❌ Erreurs de configuration:', errors);
        return false;
    }
    
    console.log('✅ Configuration valide');
    return true;
};

// 📱 DÉTECTION AUTOMATIQUE DE LA PLATEFORME
export const detectPlatform = () => {
    const userAgent = navigator.userAgent;
    
    return {
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
        isTablet: /iPad|Android(?=.*Tablet)|Windows(?=.*Touch)/i.test(userAgent),
        isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
        isPWA: window.matchMedia('(display-mode: standalone)').matches,
        hasNotificationSupport: 'Notification' in window,
        hasPushSupport: 'serviceWorker' in navigator && 'PushManager' in window
    };
};

// 🚀 INITIALISATION AUTOMATIQUE
export const initializeConfig = () => {
    // Valider la configuration
    if (!validateConfig()) {
        console.warn('⚠️ Configuration avec des avertissements');
    }
    
    // Détecter la plateforme
    const platform = detectPlatform();
    console.log('📱 Plateforme détectée:', platform);
    
    // Appliquer les optimisations mobiles
    if (platform.isMobile && MOBILE_CONFIG.REDUCE_ANIMATIONS_ON_MOBILE) {
        updateConfig('UI.ENABLE_ANIMATIONS', false);
    }
    
    // Configurer les notifications selon la plateforme
    if (!platform.hasNotificationSupport) {
        updateConfig('NOTIFICATIONS.ENABLE_BROWSER_NOTIFICATIONS', false);
        console.log('📵 Notifications navigateur non supportées');
    }
    
    console.log('🚀 Configuration du système d\'alertes initialisée');
    
    return {
        config: ALERTS_CONFIG,
        platform,
        isValid: validateConfig()
    };
};

// Export par défaut de la configuration
export default ALERTS_CONFIG;