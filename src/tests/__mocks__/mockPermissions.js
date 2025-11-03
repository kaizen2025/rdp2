/**
 * Mock du hook usePermissions pour les tests Chat DocuCortex IA
 * Simule les vérifications de permissions utilisateur
 */

// Configuration des permissions pour les tests
let permissionConfig = {
    currentUser: {
        id: 'test_user',
        username: 'testuser',
        role: 'ged_specialist',
        permissions: [
            'ged_upload:create',
            'ged_delete:delete',
            'ged_network_scan:admin',
            'ged_index_manage:admin',
            'ged_stats_view:view',
            'chat_ged:*',
            'ai_assistant:*',
            'dashboard:view',
            'reports:view'
        ]
    },
    mockPermissions: {
        'ged_upload:create': true,
        'ged_delete:delete': true,
        'ged_network_scan:admin': true,
        'ged_index_manage:admin': true,
        'ged_stats_view:view': true,
        'chat_ged:view': true,
        'chat_ged:create': true,
        'chat_ged:*': true,
        'ai_assistant:view': true,
        'ai_assistant:create': true,
        'ai_assistant:*': true,
        'dashboard:view': true,
        'reports:view': true,
        'reports:export': true
    },
    isAdmin: true,
    isSuperAdmin: false
};

// Scénarios de test pré-configurés
export const testPermissionScenarios = {
    // Scénario 1: Utilisateur avec toutes les permissions
    fullAccess: {
        currentUser: {
            id: 'full_access_user',
            username: 'fulluser',
            role: 'ged_specialist',
            permissions: ['*']
        },
        mockPermissions: {
            '*': true
        },
        isAdmin: true,
        isSuperAdmin: false
    },

    // Scénario 2: Utilisateur avec permissions limitées
    limitedAccess: {
        currentUser: {
            id: 'limited_user',
            username: 'limiteduser',
            role: 'viewer',
            permissions: ['dashboard:view', 'chat_ged:view', 'ai_assistant:view']
        },
        mockPermissions: {
            'dashboard:view': true,
            'chat_ged:view': true,
            'chat_ged:create': false,
            'ai_assistant:view': true,
            'ged_upload:create': false,
            'ged_delete:delete': false,
            'ged_network_scan:admin': false
        },
        isAdmin: false,
        isSuperAdmin: false
    },

    // Scénario 3: Utilisateur sans permissions
    noAccess: {
        currentUser: {
            id: 'no_access_user',
            username: 'noaccessuser',
            role: 'restricted',
            permissions: []
        },
        mockPermissions: {},
        isAdmin: false,
        isSuperAdmin: false
    },

    // Scénario 4: Super Admin
    superAdmin: {
        currentUser: {
            id: 'super_admin_user',
            username: 'superadmin',
            role: 'super_admin',
            permissions: ['*']
        },
        mockPermissions: {
            '*': true
        },
        isAdmin: true,
        isSuperAdmin: true
    },

    // Scénario 5: Admin standard
    admin: {
        currentUser: {
            id: 'admin_user',
            username: 'admin',
            role: 'admin',
            permissions: [
                'dashboard:*',
                'chat_ged:*',
                'ai_assistant:*',
                'ged_upload:create',
                'ged_delete:delete'
            ]
        },
        mockPermissions: {
            'dashboard:*': true,
            'chat_ged:*': true,
            'ai_assistant:*': true,
            'ged_upload:create': true,
            'ged_delete:delete': true,
            'ged_network_scan:admin': false
        },
        isAdmin: true,
        isSuperAdmin: false
    }
};

// Configuration du mock
export const configurePermissions = (config = {}) => {
    permissionConfig = { ...permissionConfig, ...config };
};

export const resetPermissions = () => {
    permissionConfig = {
        currentUser: {
            id: 'test_user',
            username: 'testuser',
            role: 'ged_specialist',
            permissions: [
                'ged_upload:create',
                'ged_delete:delete',
                'ged_network_scan:admin',
                'ged_index_manage:admin',
                'ged_stats_view:view',
                'chat_ged:*',
                'ai_assistant:*',
                'dashboard:view',
                'reports:view'
            ]
        },
        mockPermissions: {
            'ged_upload:create': true,
            'ged_delete:delete': true,
            'ged_network_scan:admin': true,
            'ged_index_manage:admin': true,
            'ged_stats_view:view': true,
            'chat_ged:view': true,
            'chat_ged:create': true,
            'chat_ged:*': true,
            'ai_assistant:view': true,
            'ai_assistant:create': true,
            'ai_assistant:*': true,
            'dashboard:view': true,
            'reports:view': true,
            'reports:export': true
        },
        isAdmin: true,
        isSuperAdmin: false
    };
};

// Logique de vérification des permissions
const checkPermission = (permission) => {
    if (!permission) return true;
    
    // Super admin a tout les droits
    if (permissionConfig.isSuperAdmin) return true;
    
    // Vérifier permission exacte
    if (permissionConfig.mockPermissions[permission] !== undefined) {
        return permissionConfig.mockPermissions[permission];
    }
    
    // Vérifier permissions avec wildcard
    const permissionParts = permission.split(':');
    const resource = permissionParts[0];
    const action = permissionParts[1];
    
    // Vérifier permission avec wildcard pour l'action
    if (permissionConfig.mockPermissions[`${resource}:*`]) {
        return true;
    }
    
    // Vérifier permission avec wildcard pour la ressource
    const resourceWildcard = `${resource}:*`;
    if (permissionConfig.mockPermissions[resourceWildcard]) {
        return true;
    }
    
    // Vérifier permission globale
    if (permissionConfig.mockPermissions['*']) {
        return true;
    }
    
    return false;
};

// Hook mock
export const usePermissions = () => {
    return {
        // Utilisateur actuel
        user: permissionConfig.currentUser,
        getUserRole: () => permissionConfig.currentUser.role,
        
        // Vérifications de permissions
        hasPermission: (permission) => {
            return checkPermission(permission);
        },
        
        // Vérifications de rôles
        isAdmin: () => permissionConfig.isAdmin,
        isSuperAdmin: () => permissionConfig.isSuperAdmin,
        
        // Vérifications de modules
        canAccessModule: (moduleId) => {
            const modulePermissions = {
                'dashboard': 'dashboard:view',
                'chat_ged': 'chat_ged:view',
                'ai_assistant': 'ai_assistant:view',
                'upload': 'ged_upload:create',
                'network_config': 'ged_network_scan:admin',
                'documents': 'chat_ged:view',
                'statistics': 'ged_stats_view:view'
            };
            
            const requiredPermission = modulePermissions[moduleId];
            return requiredPermission ? checkPermission(requiredPermission) : false;
        },
        
        // Vérifications spécifiques pour DocuCortex
        canUploadDocuments: () => checkPermission('ged_upload:create'),
        canDeleteDocuments: () => checkPermission('ged_delete:delete'),
        canConfigureNetwork: () => checkPermission('ged_network_scan:admin'),
        canViewStatistics: () => checkPermission('ged_stats_view:view'),
        canManageIndex: () => checkPermission('ged_index_manage:admin'),
        
        // Fonction pour obtenir toutes les permissions
        getAllPermissions: () => {
            return [...permissionConfig.currentUser.permissions];
        },
        
        // Fonction pour vérifier plusieurs permissions
        hasAnyPermission: (permissions) => {
            return permissions.some(permission => checkPermission(permission));
        },
        
        // Fonction pour vérifier toutes les permissions
        hasAllPermissions: (permissions) => {
            return permissions.every(permission => checkPermission(permission));
        },
        
        // Fonction pour simuler un changement d'utilisateur
        setUser: (userConfig) => {
            permissionConfig.currentUser = userConfig;
        },
        
        // Fonction pour ajouter une permission temporairement
        addPermission: (permission) => {
            if (!permissionConfig.currentUser.permissions.includes(permission)) {
                permissionConfig.currentUser.permissions.push(permission);
            }
        },
        
        // Fonction pour retirer une permission temporairement
        removePermission: (permission) => {
            permissionConfig.currentUser.permissions = permissionConfig.currentUser.permissions.filter(
                p => p !== permission
            );
        },
        
        // Fonction utilitaire pour le debugging
        debugPermissions: () => {
            return {
                user: permissionConfig.currentUser,
                isAdmin: permissionConfig.isAdmin,
                isSuperAdmin: permissionConfig.isSuperAdmin,
                permissions: permissionConfig.mockPermissions,
                hasUploadPermission: checkPermission('ged_upload:create'),
                hasDeletePermission: checkPermission('ged_delete:delete'),
                hasNetworkPermission: checkPermission('ged_network_scan:admin')
            };
        }
    };
};

// Configuration par défaut
resetPermissions();

export default usePermissions;