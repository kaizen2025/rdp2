// src/components/integrations/index.js - INDEX DES COMPOSANTS D'INTÉGRATIONS
// Export centralisé de tous les composants et services d'intégration

// Composants d'interface
export { default as IntegrationDashboard } from './IntegrationDashboard.js';
export { default as ConnectionManager } from './ConnectionManager.js';
export { default as SyncMonitor } from './SyncMonitor.js';
export { default as IntegrationSettings } from './IntegrationSettings.js';
export { default as ErrorHandler } from './ErrorHandler.js';

// Service principal d'intégration
export { default as integrationService } from '../../services/integrationService.js';

// Constantes et configurations
export { 
    INTEGRATION_CONFIG, 
    INTEGRATION_STATUS, 
    SYNC_TYPES 
} from '../../services/integrationService.js';

// Connecteurs
export { default as ActiveDirectoryConnector } from './ActiveDirectoryConnector.js';
export { default as CMDBConnector } from './CMDBConnector.js';
export { default as HelpDeskConnector } from './HelpDeskConnector.js';
export { default as EmailConnector } from './EmailConnector.js';
export { default as CalendarConnector } from './CalendarConnector.js';

// Utilitaires et helpers
export const IntegrationUtils = {
    // Utilitaires pour les formats de données
    formatIntegrationStatus: (status) => {
        const statusMap = {
            connected: { label: 'Connecté', color: 'green' },
            connecting: { label: 'Connexion...', color: 'yellow' },
            error: { label: 'Erreur', color: 'red' },
            disconnected: { label: 'Déconnecté', color: 'gray' }
        };
        return statusMap[status] || { label: 'Inconnu', color: 'gray' };
    },

    // Utilitaire pour formater les durées de synchronisation
    formatSyncDuration: (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    },

    // Utilitaire pour calculer le pourcentage de progression
    calculateProgress: (processed, total) => {
        if (total === 0) return 0;
        return Math.round((processed / total) * 100);
    },

    // Utilitaire pour déterminer la couleur de sévérité
    getSeverityColor: (severity) => {
        const colors = {
            critical: 'red',
            high: 'orange',
            medium: 'yellow',
            low: 'blue'
        };
        return colors[severity] || 'gray';
    },

    // Utilitaire pour valider les configurations
    validateConnectionConfig: (integration, config) => {
        const validators = {
            activeDirectory: (cfg) => {
                const required = ['ldapUrl', 'domain', 'bindDN', 'bindCredentials'];
                return required.every(field => cfg[field]);
            },
            cmdb: (cfg) => {
                return cfg.apiUrl && cfg.apiKey;
            },
            helpDesk: (cfg) => {
                return cfg.apiUrl && (cfg.apiKey || (cfg.username && cfg.password));
            },
            email: (cfg) => {
                return cfg.smtp?.host && cfg.smtp?.auth?.user;
            },
            calendar: (cfg) => {
                return cfg.clientId && cfg.clientSecret;
            }
        };
        
        const validator = validators[integration];
        return validator ? validator(config) : true;
    }
};

// Composant de route d'intégration (optionnel)
export const IntegrationRoutes = [
    {
        path: '/integrations',
        component: IntegrationDashboard,
        name: 'Tableau de bord',
        icon: '🔗',
        description: 'Vue d\'ensemble des intégrations'
    },
    {
        path: '/integrations/connections',
        component: ConnectionManager,
        name: 'Connexions',
        icon: '🔌',
        description: 'Gestion des connexions'
    },
    {
        path: '/integrations/monitor',
        component: SyncMonitor,
        name: 'Moniteur',
        icon: '🔄',
        description: 'Surveillance des synchronisations'
    },
    {
        path: '/integrations/settings',
        component: IntegrationSettings,
        name: 'Paramètres',
        icon: '⚙️',
        description: 'Configuration des intégrations'
    },
    {
        path: '/integrations/errors',
        component: ErrorHandler,
        name: 'Erreurs',
        icon: '⚠️',
        description: 'Gestion des erreurs'
    }
];

// Hook personnalisé pour les intégrations (optionnel)
export const useIntegrations = () => {
    const [integrations, setIntegrations] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const loadIntegrations = async () => {
            try {
                setLoading(true);
                const status = await integrationService.getIntegrationStatus();
                setIntegrations(Object.entries(status).map(([key, value]) => ({
                    name: key,
                    ...value
                })));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadIntegrations();
    }, []);

    return { integrations, loading, error };
};