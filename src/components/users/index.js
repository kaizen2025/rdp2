// src/components/users/index.js - Point d'entrée centralisé pour les composants utilisateurs

// Composants principaux
export { default as UsersManagementEnhanced } from './UsersManagementEnhanced';
export { default as UserCardModern } from './UserCardModern';
export { default as UserFilters } from './UserFilters';
export { default as UserActions } from './UserActions';
export { default as UserDashboard } from './UserDashboard';
export { default as OptimizedUsersList } from './OptimizedUsersList';

// Composant de recherche intelligente Phase 2
export { default as UsersSmartSearch } from './UsersSmartSearch';
export { default as UsersSmartSearchExample } from './UsersSmartSearchExample';

// Utilitaires de recherche intelligente
export { calculateLevenshteinDistance, calculateSimilarityScore } from './UsersSmartSearch';

// Composants utilitaires
export { 
    default as UserColorManagerOptimized,
    UserColorLegendEnhanced,
    UserColorBadgeOptimized
} from './UserColorManagerOptimized';

// Intégration visuelle des couleurs Phase 2
export {
    UserColorIntegration,
    useUserColorIntegration,
    UserColorLegendEnhanced as InteractiveColorLegend,
    UserColorBadgeOptimized as ColorBadgeOptimized
} from './UserColorIntegration';

export { default as UserColorIntegrationExample } from './UserColorIntegrationExample';

export { default as UserInfoDialogEnhanced } from './UserInfoDialogEnhanced';
export { default as UserProfileEnhanced } from './UserProfileEnhanced';

// Types et interfaces
export const USER_ACTION_TYPES = {
    EDIT: 'edit',
    DELETE: 'delete',
    PRINT: 'print',
    EXPORT: 'export',
    ENABLE_AD: 'enable_ad',
    DISABLE_AD: 'disable_ad',
    RESET_PASSWORD: 'reset_password',
    MANAGE_PHONE: 'manage_phone',
    MANAGE_COMPUTER: 'manage_computer',
    SEND_EMAIL: 'send_email',
    SEND_NOTIFICATION: 'send_notification',
    BULK_EXPORT: 'bulk_export',
    BULK_DELETE: 'bulk_delete',
    BULK_NOTIFY: 'bulk_notify',
    BULK_RESET_PASSWORD: 'bulk_reset_password'
};

export const FILTER_PRESETS = [
    {
        id: 'active_users',
        name: 'Utilisateurs Actifs',
        description: 'Utilisateurs avec AD activé',
        filters: { status: 'enabled' }
    },
    {
        id: 'with_equipment',
        name: 'Avec Équipements',
        description: 'Utilisateurs ayant des prêts actifs',
        filters: { hasLoans: 'yes' }
    },
    {
        id: 'it_department',
        name: 'Département IT',
        description: 'Utilisateurs du service informatique',
        filters: { department: 'IT' }
    },
    {
        id: 'no_recent_login',
        name: 'Inactifs Récents',
        description: 'Utilisateurs sans connexion récente',
        filters: { status: 'all', hasRecentActivity: false }
    },
    {
        id: 'high_privilege',
        name: 'Privilèges Élevés',
        description: 'Administrateurs et utilisateurs VPN',
        filters: { badges: ['vpn', 'admin'] }
    }
];

export const COLOR_PALETTES = {
    primary: [
        '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336',
        '#00BCD4', '#8BC34A', '#FFC107', '#795548', '#607D8B'
    ],
    soft: [
        '#E3F2FD', '#E8F5E8', '#FFF3E0', '#F3E5F5', '#FFEBEE',
        '#E0F7FA', '#F1F8E9', '#FFFDE7', '#EFEBE9', '#ECEFF1'
    ],
    professional: [
        '#1976D2', '#388E3C', '#F57C00', '#7B1FA2', '#D32F2F',
        '#0288D1', '#689F38', '#FF8F00', '#512DA8', '#C62828'
    ]
};

export const ACCESSIBILITY_LEVELS = {
    AA: 4.5,
    AAA: 7
};

// Utilitaires
export const createUserFilters = (baseFilters = {}) => ({
    server: 'all',
    department: 'all',
    status: 'all',
    badges: [],
    hasLoans: 'all',
    hasRecentActivity: 'all',
    ...baseFilters
});

export const getUserStats = (users, userLoans) => {
    if (!users || users.length === 0) {
        return {
            total: 0,
            activeAD: 0,
            inactiveAD: 0,
            withLoans: 0,
            departmentStats: {},
            serverStats: {}
        };
    }

    const total = users.length;
    const activeAD = users.filter(u => u.adEnabled === 1).length;
    const inactiveAD = users.filter(u => u.adEnabled === 0).length;
    
    const usersWithLoans = new Set([
        ...(userLoans?.phoneLoans || []).map(l => l.userId),
        ...(userLoans?.computerLoans || []).map(l => l.userId)
    ]).size;

    // Statistiques par département
    const departmentStats = {};
    users.forEach(user => {
        const dept = user.department || 'Non défini';
        if (!departmentStats[dept]) {
            departmentStats[dept] = { total: 0, active: 0 };
        }
        departmentStats[dept].total++;
        if (user.adEnabled === 1) departmentStats[dept].active++;
    });

    // Statistiques par serveur
    const serverStats = {};
    users.forEach(user => {
        const server = user.server || 'Non assigné';
        if (!serverStats[server]) {
            serverStats[server] = { total: 0, active: 0 };
        }
        serverStats[server].total++;
        if (user.adEnabled === 1) serverStats[server].active++;
    });

    return {
        total,
        activeAD,
        inactiveAD,
        withLoans: usersWithLoans,
        departmentStats,
        serverStats
    };
};

export const validateUserData = (user) => {
    const errors = [];
    
    if (!user.username || user.username.trim() === '') {
        errors.push('Le nom d\'utilisateur est requis');
    }
    
    if (!user.displayName || user.displayName.trim() === '') {
        errors.push('Le nom complet est requis');
    }
    
    if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push('L\'adresse email n\'est pas valide');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const formatUserDisplayName = (user) => {
    if (user.displayName) return user.displayName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.username || 'Utilisateur inconnu';
};

export const getUserInitials = (user) => {
    const displayName = formatUserDisplayName(user);
    return displayName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
};

// Configuration par défaut
export const DEFAULT_USER_CONFIG = {
    pagination: {
        pageSize: 50,
        pageSizeOptions: [25, 50, 100, 200]
    },
    filters: {
        debounceTime: 300,
        maxFilters: 10
    },
    colors: {
        palette: 'primary',
        algorithm: 'deterministic',
        accessibility: 'AA'
    },
    actions: {
        confirmDelete: true,
        bulkActionThreshold: 10,
        maxConcurrentActions: 5
    },
    ui: {
        animationDuration: 300,
        theme: 'light',
        compactMode: false
    }
};

// Hooks personnalisés réutilisables
export { useUserColorManagerOptimized } from './UserColorManagerOptimized';
export { useUserColorIntegration } from './UserColorIntegration';

// Composants de démonstration
export const DemoUserComponents = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h2>Composants Utilisateur DocuCortex Enhanced</h2>
            <p>Tous les composants sont maintenant disponibles :</p>
            <ul>
                <li>UsersManagementEnhanced - Interface principale modernisée</li>
                <li>UserCardModern - Cartes utilisateur interactives</li>
                <li>UserFilters - Filtres avancés avec sauvegarde</li>
                <li>UserActions - Gestion d'actions avec validation</li>
                <li>UserDashboard - Statistiques temps réel</li>
                <li>OptimizedUsersList - Liste virtualisée optimisée 500+ utilisateurs</li>
                <li>UsersSmartSearch - Recherche intelligente avec fuzzy matching Phase 2</li>
                <li>UsersSmartSearchExample - Démonstration complète du composant</li>
                <li>UserColorManagerOptimized - Système de couleurs enrichi</li>
                <li>UserColorIntegration - Intégration visuelle complète Phase 2 (nouveau!)</li>
                <li>UserColorIntegrationExample - Démonstration interactive complète</li>
                <li>UserInfoDialogEnhanced - Modal utilisateur moderne</li>
            </ul>
            <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                backgroundColor: '#e8f5e8', 
                borderRadius: '6px',
                border: '1px solid #4caf50'
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>✨ Phase 2 - Couleurs Intégrées Visuellement</h3>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                    Le nouveau système d'intégration visuelle des couleurs offre : 
                    palette intelligente par contexte, accessibilité daltonisme complète, 
                    animations fluides, filtres avancés, export/import configuration et analytics couleurs.
                </p>
            </div>
        </div>
    );
};
