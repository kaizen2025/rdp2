/**
 * Service de gestion des permissions
 * Singleton pour vérifier les permissions de l'utilisateur courant
 */

import {
  ROLES,
  MODULES,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  inferRoleFromPermissions,
  getAccessibleModules as getModules
} from '../models/permissions';

class PermissionService {
  constructor() {
    this.currentUser = null;
    this.config = null;
  }

  /**
   * Initialiser le service avec l'utilisateur et la config
   */
  init(user, config) {
    this.currentUser = user;
    this.config = config;
  }

  /**
   * Définir l'utilisateur courant
   */
  setCurrentUser(user) {
    this.currentUser = user;
  }

  /**
   * Définir la configuration
   */
  setConfig(config) {
    this.config = config;
  }

  /**
   * Obtenir les permissions de l'utilisateur courant
   */
  getUserPermissions() {
    if (!this.currentUser) return [];

    // Si l'utilisateur a un rôle défini, utiliser les permissions du rôle
    if (this.currentUser.role) {
      const role = this.getRoleFromConfig(this.currentUser.role);
      if (role && role.permissions) {
        return role.permissions;
      }
    }

    // Sinon, utiliser les permissions directes
    return this.currentUser.permissions || [];
  }

  /**
   * Obtenir la configuration d'un rôle depuis config.json
   */
  getRoleFromConfig(roleId) {
    if (!this.config || !this.config.roles) return null;
    return this.config.roles[roleId];
  }

  /**
   * Vérifier une permission
   */
  hasPermission(permission) {
    const userPermissions = this.getUserPermissions();
    return checkPermission(userPermissions, permission);
  }

  /**
   * Vérifier plusieurs permissions (OU logique)
   */
  hasAnyPermission(permissions) {
    const userPermissions = this.getUserPermissions();
    return checkAnyPermission(userPermissions, permissions);
  }

  /**
   * Vérifier plusieurs permissions (ET logique)
   */
  hasAllPermissions(permissions) {
    const userPermissions = this.getUserPermissions();
    return checkAllPermissions(userPermissions, permissions);
  }

  /**
   * Obtenir le rôle de l'utilisateur courant
   */
  getUserRole() {
    if (!this.currentUser) return null;

    // Si le rôle est défini explicitement
    if (this.currentUser.role) {
      // Chercher dans config.json d'abord
      const configRole = this.getRoleFromConfig(this.currentUser.role);
      if (configRole) {
        return {
          id: this.currentUser.role,
          ...configRole,
          ...ROLES[this.currentUser.role.toUpperCase()]
        };
      }

      // Sinon, chercher dans les rôles prédéfinis
      const roleKey = this.currentUser.role.toUpperCase();
      if (ROLES[roleKey]) {
        return ROLES[roleKey];
      }
    }

    // Inférer le rôle depuis les permissions
    const userPermissions = this.getUserPermissions();
    return inferRoleFromPermissions(userPermissions);
  }

  /**
   * Obtenir les modules accessibles
   */
  getAccessibleModules() {
    const userPermissions = this.getUserPermissions();
    return getModules(userPermissions);
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin() {
    return this.hasAnyPermission(['config:*', 'config:admin', '*']);
  }

  /**
   * Vérifier si l'utilisateur est super admin
   */
  isSuperAdmin() {
    return this.hasPermission('*');
  }

  /**
   * Obtenir toutes les informations de l'utilisateur
   */
  getUserInfo() {
    return {
      user: this.currentUser,
      role: this.getUserRole(),
      permissions: this.getUserPermissions(),
      accessibleModules: this.getAccessibleModules(),
      isAdmin: this.isAdmin(),
      isSuperAdmin: this.isSuperAdmin()
    };
  }

  /**
   * Vérifier si l'utilisateur peut accéder à un module
   */
  canAccessModule(moduleId) {
    const module = MODULES[moduleId.toUpperCase()];
    if (!module) return false;

    return this.hasPermission(module.requiredPermission);
  }

  /**
   * Obtenir les actions disponibles pour un module
   */
  getModuleActions(moduleId) {
    const userPermissions = this.getUserPermissions();
    const actions = [];

    // Super admin a toutes les actions
    if (userPermissions.includes('*')) {
      return ['view', 'create', 'edit', 'delete', 'export', 'admin'];
    }

    // Vérifier chaque action
    ['view', 'create', 'edit', 'delete', 'export', 'admin'].forEach(action => {
      if (checkPermission(userPermissions, `${moduleId}:${action}`)) {
        actions.push(action);
      }
    });

    return actions;
  }

  /**
   * Logger les informations de permission (debug)
   */
  logPermissionInfo() {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔐 Permission Info');
      console.log('User:', this.currentUser);
      console.log('Role:', this.getUserRole());
      console.log('Permissions:', this.getUserPermissions());
      console.log('Accessible Modules:', this.getAccessibleModules());
      console.log('Is Admin:', this.isAdmin());
      console.log('Is Super Admin:', this.isSuperAdmin());
      console.groupEnd();
    }
  }
}

// Singleton
const permissionService = new PermissionService();

export default permissionService;
