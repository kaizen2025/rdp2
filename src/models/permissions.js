/**
 * Modèle de permissions et rôles
 * Définit tous les modules, actions et profils utilisateurs
 */

// ==================== PERMISSIONS ====================

export const PERMISSIONS = {
  // Modules principaux
  DASHBOARD: 'dashboard',
  SESSIONS: 'sessions',
  COMPUTERS: 'computers',
  SERVERS: 'servers',             // 🔄 RESTAURÉ
  LOANS: 'loans',
  USERS: 'users',
  AD_MANAGEMENT: 'ad_management',
  AD_GROUPS: 'ad_groups',         // 🔄 RESTAURÉ
  CHAT_GED: 'chat_ged',
  AI_ASSISTANT: 'ai_assistant',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  CONFIG: 'config',

  // Actions
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  EXPORT: 'export',
  ADMIN: 'admin',

  // Permissions spéciales GED
  GED_UPLOAD: 'ged_upload',
  GED_DELETE: 'ged_delete',
  GED_NETWORK_SCAN: 'ged_network_scan',
  GED_INDEX_MANAGE: 'ged_index_manage',
  GED_STATS_VIEW: 'ged_stats_view'
};

// ==================== RÔLES ====================

export const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: ['*'], // Wildcard = tout
    icon: '👑',
    color: '#d32f2f',
    priority: 100
  },

  ADMIN: {
    id: 'admin',
    name: 'Administrateur',
    description: 'Gestion complète de l\'application',
    permissions: [
      'dashboard:*',
      'sessions:*',
      'computers:*',
      'loans:*',
      'users:*',
      'ad_management:*',
      'chat_ged:*',
      'ai_assistant:*',
      'reports:*',
      'settings:*',
      'config:view'
    ],
    icon: '👨‍💼',
    color: '#f57c00',
    priority: 90
  },

  GED_SPECIALIST: {
    id: 'ged_specialist',
    name: 'Spécialiste GED',
    description: 'Expert en gestion documentaire et IA',
    permissions: [
      'dashboard:view',
      'chat_ged:*',
      'ai_assistant:*',
      'ged_upload:create',
      'ged_delete:delete',
      'ged_network_scan:admin',
      'ged_index_manage:admin',
      'ged_stats_view:view',
      'reports:view',
      'reports:export'
    ],
    icon: '📚',
    color: '#9c27b0',
    priority: 85
  },

  MANAGER: {
    id: 'manager',
    name: 'Manager',
    description: 'Gestionnaire avec droits étendus',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'computers:*',
      'loans:*',
      'users:view',
      'chat_ged:view',
      'chat_ged:create',
      'ai_assistant:view',
      'reports:view',
      'reports:export'
    ],
    icon: '👔',
    color: '#1976d2',
    priority: 70
  },

  TECHNICIAN: {
    id: 'technician',
    name: 'Technicien',
    description: 'Support technique',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'sessions:edit',
      'computers:view',
      'loans:view',
      'loans:create',
      'chat_ged:view',
      'ai_assistant:view',
      'reports:view'
    ],
    icon: '🔧',
    color: '#388e3c',
    priority: 50
  },

  VIEWER: {
    id: 'viewer',
    name: 'Observateur',
    description: 'Consultation uniquement',
    permissions: [
      'dashboard:view',
      'sessions:view',
      'computers:view',
      'loans:view',
      'reports:view'
    ],
    icon: '👁️',
    color: '#757575',
    priority: 10
  }
};

// ==================== MODULES ====================

export const MODULES = {
  DASHBOARD: {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: '📊',
    path: '/dashboard',  // ✅ CHANGÉ de '/' vers '/dashboard' pour éviter conflits de routing
    description: 'Vue d\'ensemble de l\'activité',
    requiredPermission: 'dashboard:view'
  },

  SESSIONS: {
    id: 'sessions',
    label: 'Sessions RDS',
    icon: '🖥️',
    path: '/sessions',
    description: 'Gestion des sessions RDS',
    requiredPermission: 'sessions:view'
  },

  SERVERS: {
    id: 'servers',
    label: 'Serveurs',
    icon: '💻',
    path: '/servers',
    description: 'Gestion des serveurs',
    requiredPermission: 'servers:view'
  },

  USERS: {
    id: 'users',
    label: 'Utilisateurs',
    icon: '👤',
    path: '/users',
    description: 'Gestion des utilisateurs',
    requiredPermission: 'users:view'
  },

  AD_GROUPS: {
    id: 'ad_groups',
    label: 'Groupes AD',
    icon: '👥',
    path: '/ad-groups',
    description: 'Gestion des groupes Active Directory',
    requiredPermission: 'ad_groups:view'
  },

  LOANS: {
    id: 'loans',
    label: 'Prêts',
    icon: '📦',
    path: '/loans',
    description: 'Gestion des prêts de matériel',
    requiredPermission: 'loans:view'
  },

  AI_ASSISTANT: {
    id: 'ai_assistant',
    label: 'DocuCortex IA',
    icon: '🤖',
    path: '/ai-assistant',
    description: 'Assistant IA documentaire avec Gemini et OpenRouter',
    requiredPermission: 'ai_assistant:view'
  }

  // ✅ 7 ONGLETS PRINCIPAUX (navigation essentielle):
  // 1. Tableau de bord - Vue d'ensemble
  // 2. Sessions RDS - Gestion des sessions
  // 3. Serveurs - Gestion des serveurs
  // 4. Utilisateurs - Gestion des utilisateurs (LE PLUS IMPORTANT)
  // 5. Groupes AD - Gestion Active Directory
  // 6. Prêts - Gestion des prêts de matériel
  // 7. DocuCortex IA - Assistant documentaire (Gemini + OpenRouter)

  // ❌ SUPPRIMÉS (non utilisés ou doublons):
  // - ASSISTANT: Consolidé dans DocuCortex IA (Gemini intégré)
  // - COMPUTERS: Géré via Serveurs
  // - CHAT_GED: Doublon avec DocuCortex IA
  // - REPORTS: Pas implémenté
  // - SETTINGS: Disponible dans le menu utilisateur
};

// ==================== HELPERS ====================

/**
 * Obtenir un rôle par son ID
 */
export const getRoleById = (roleId) => {
  // ✅ PROTECTION: Vérifier que ROLES est défini
  if (!ROLES || typeof ROLES !== 'object') {
    console.error('❌ ROLES is undefined or invalid in getRoleById');
    return null;
  }
  return Object.values(ROLES).find(role => role.id === roleId);
};

/**
 * Obtenir les rôles triés par priorité
 */
export const getSortedRoles = () => {
  // ✅ PROTECTION: Vérifier que ROLES est défini
  if (!ROLES || typeof ROLES !== 'object') {
    console.error('❌ ROLES is undefined or invalid in getSortedRoles');
    return [];
  }
  return Object.values(ROLES).sort((a, b) => b.priority - a.priority);
};

/**
 * Déterminer le rôle d'un utilisateur basé sur ses permissions
 */
export const inferRoleFromPermissions = (permissions) => {
  if (!permissions || permissions.length === 0) return ROLES.VIEWER;

  // Super admin
  if (permissions.includes('*')) return ROLES.SUPER_ADMIN;

  // Admin
  if (permissions.includes('config:*') || permissions.includes('config:admin')) {
    return ROLES.ADMIN;
  }

  // GED Specialist
  if (permissions.includes('chat_ged:*') && permissions.includes('ged_network_scan:admin')) {
    return ROLES.GED_SPECIALIST;
  }

  // Manager
  if (permissions.includes('loans:*') && permissions.includes('computers:*')) {
    return ROLES.MANAGER;
  }

  // Technician
  if (permissions.includes('sessions:edit')) {
    return ROLES.TECHNICIAN;
  }

  return ROLES.VIEWER;
};

/**
 * Obtenir les modules accessibles pour des permissions données
 */
export const getAccessibleModules = (permissions) => {
  if (!permissions || permissions.length === 0) return [];

  // ✅ PROTECTION: Vérifier que MODULES est défini
  if (!MODULES || typeof MODULES !== 'object') {
    console.error('❌ MODULES is undefined or invalid in getAccessibleModules');
    return [];
  }

  return Object.values(MODULES).filter(module => {
    // Si super admin, tout est accessible
    if (permissions.includes('*')) return true;

    // Vérifier la permission exacte
    if (permissions.includes(module.requiredPermission)) return true;

    // Vérifier avec wildcard (ex: "dashboard:*")
    const [moduleName] = module.requiredPermission.split(':');
    if (permissions.includes(`${moduleName}:*`)) return true;

    return false;
  });
};

/**
 * Vérifier si des permissions incluent une permission spécifique
 */
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || userPermissions.length === 0) return false;

  // Super admin a tout
  if (userPermissions.includes('*')) return true;

  // Permission exacte
  if (userPermissions.includes(requiredPermission)) return true;

  // Wildcard (ex: "sessions:*" permet "sessions:view", "sessions:edit", etc.)
  const [module, action] = requiredPermission.split(':');
  if (userPermissions.includes(`${module}:*`)) return true;

  return false;
};

/**
 * Vérifier plusieurs permissions (OU logique)
 */
export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
};

/**
 * Vérifier plusieurs permissions (ET logique)
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
};

export default {
  PERMISSIONS,
  ROLES,
  MODULES,
  getRoleById,
  getSortedRoles,
  inferRoleFromPermissions,
  getAccessibleModules,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
};
