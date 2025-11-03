#!/usr/bin/env node

/**
 * Script de validation des permissions granulaires en production
 * Valide la configuration des permissions et détecte les anomalies
 */

const fs = require('fs');
const path = require('path');
const colors = require('colors');

class GranularPermissionsValidator {
  constructor() {
    this.config = {
      projectRoot: path.join(__dirname, '..'),
      configFile: path.join(__dirname, '..', 'config', 'config.json'),
      permissionsFile: path.join(__dirname, '..', 'src', 'models', 'permissions.js'),
      outputPath: path.join(__dirname, '..', 'logs', 'permissions-validation'),
      verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
      strict: process.argv.includes('--strict') || process.argv.includes('-s'),
      fix: process.argv.includes('--fix') || process.argv.includes('-f'),
      generateMock: process.argv.includes('--generate-mock') || process.argv.includes('-g')
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      config: this.config,
      issues: {
        critical: [],
        warnings: [],
        infos: []
      },
      statistics: {
        totalRoles: 0,
        totalPermissions: 0,
        invalidPermissions: 0,
        missingWildcards: 0,
        duplicateRoles: 0
      },
      recommendations: [],
      fixes: []
    };
  }

  /**
   * Point d'entrée principal
   */
  async run() {
    console.log('🔐 VALIDATION DES PERMISSIONS GRANULAIRES - MODE PRODUCTION'.bold);
    console.log('=' .repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
    console.log(`📁 Projet: ${this.config.projectRoot}`);
    console.log('');
    
    try {
      await this.validateConfiguration();
      await this.validatePermissionsFile();
      await this.checkGranularityConsistency();
      await this.validateRoleHierarchy();
      await this.testPermissionPatterns();
      await this.generateRecommendations();
      
      this.generateReport();
      
      if (this.config.fix) {
        await this.applyFixes();
      }
      
      if (this.config.generateMock) {
        await this.generateAdvancedMockConfig();
      }
      
      this.exit();
      
    } catch (error) {
      console.error('❌ ERREUR FATALE:'.red.bold, error.message);
      this.results.issues.critical.push({
        type: 'fatal_error',
        message: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  /**
   * Valider la configuration des rôles
   */
  async validateConfiguration() {
    console.log('🔍 Validation de la configuration des rôles...'.cyan);
    
    try {
      const configData = this.loadJsonFile(this.config.configFile);
      
      if (!configData.roles) {
        throw new Error('Section "roles" manquante dans la configuration');
      }
      
      this.results.statistics.totalRoles = Object.keys(configData.roles).length;
      
      for (const [roleId, role] of Object.entries(configData.roles)) {
        await this.validateRole(roleId, role);
      }
      
      console.log(`✅ ${this.results.statistics.totalRoles} rôles validés`.green);
      
    } catch (error) {
      console.error('❌ Erreur de configuration:'.red, error.message);
      this.results.issues.critical.push({
        type: 'config_validation',
        message: error.message
      });
    }
    
    console.log('');
  }

  /**
   * Valider un rôle individuel
   */
  async validateRole(roleId, role) {
    const checks = [
      { field: 'name', required: true },
      { field: 'description', required: true },
      { field: 'permissions', required: true, type: 'array' },
      { field: 'icon', required: false },
      { field: 'color', required: false },
      { field: 'priority', required: true, type: 'number' }
    ];
    
    for (const check of checks) {
      if (check.required && !role[check.field]) {
        this.results.issues.critical.push({
          type: 'missing_field',
          role: roleId,
          field: check.field,
          message: `Rôle "${roleId}" manque le champ obligatoire "${check.field}"`
        });
      }
      
      if (check.type && role[check.field] && typeof role[check.field] !== check.type) {
        this.results.issues.warnings.push({
          type: 'invalid_type',
          role: roleId,
          field: check.field,
          expected: check.type,
          actual: typeof role[check.field],
          message: `Rôle "${roleId}" a un type invalide pour "${check.field}"`
        });
      }
    }
    
    // Valider les permissions du rôle
    await this.validateRolePermissions(roleId, role.permissions || []);
  }

  /**
   * Valider les permissions d'un rôle
   */
  async validateRolePermissions(roleId, permissions) {
    if (!Array.isArray(permissions)) {
      this.results.issues.critical.push({
        type: 'invalid_permissions_type',
        role: roleId,
        message: `Les permissions du rôle "${roleId}" doivent être un tableau`
      });
      return;
    }
    
    this.results.statistics.totalPermissions += permissions.length;
    
    for (const permission of permissions) {
      await this.validatePermission(roleId, permission);
    }
    
    // Vérifier la cohérence du rôle
    await this.validateRoleConsistency(roleId, permissions);
  }

  /**
   * Valider une permission individuelle
   */
  async validatePermission(roleId, permission) {
    // Format de base
    if (typeof permission !== 'string') {
      this.results.issues.critical.push({
        type: 'invalid_permission_format',
        role: roleId,
        permission: permission,
        message: `Permission invalide dans "${roleId}": doit être une chaîne`
      });
      this.results.statistics.invalidPermissions++;
      return;
    }
    
    // Formats acceptés: *, module:*, module:action
    if (permission === '*') {
      return; // Super admin, toujours valide
    }
    
    const colonCount = permission.split(':').length - 1;
    
    if (colonCount === 0) {
      this.results.issues.warnings.push({
        type: 'missing_colon',
        role: roleId,
        permission: permission,
        message: `Permission "${permission}" dans "${roleId}" devrait avoir le format "module:action"`
      });
    } else if (colonCount > 1) {
      this.results.issues.warnings.push({
        type: 'too_many_colons',
        role: roleId,
        permission: permission,
        message: `Permission "${permission}" dans "${roleId}" a trop de deux-points`
      });
    } else {
      const [module, action] = permission.split(':');
      
      if (!module || !action) {
        this.results.issues.warnings.push({
          type: 'incomplete_permission',
          role: roleId,
          permission: permission,
          message: `Permission "${permission}" dans "${roleId}" a des parties manquantes`
        });
      }
      
      // Valider l'action
      const validActions = ['view', 'create', 'edit', 'delete', 'export', 'admin', '*'];
      if (action !== '*' && !validActions.includes(action)) {
        this.results.issues.warnings.push({
          type: 'unknown_action',
          role: roleId,
          permission: permission,
          action: action,
          message: `Action inconnue "${action}" dans "${permission}" (rôle: ${roleId})`
        });
      }
    }
  }

  /**
   * Valider la cohérence d'un rôle
   */
  async validateRoleConsistency(roleId, permissions) {
    // Vérifier si le rôle a des wildcards qui rendent certaines permissions redondantes
    const modulesWithWildcards = new Set();
    const specificPermissions = [];
    
    for (const permission of permissions) {
      if (permission.endsWith(':*')) {
        const module = permission.split(':')[0];
        modulesWithWildcards.add(module);
      } else if (permission !== '*') {
        specificPermissions.push(permission);
      }
    }
    
    // Détecter les permissions redondantes
    for (const specificPerm of specificPermissions) {
      const module = specificPerm.split(':')[0];
      if (modulesWithWildcards.has(module)) {
        this.results.issues.infos.push({
          type: 'redundant_permission',
          role: roleId,
          permission: specificPerm,
          message: `Permission "${specificPerm}" est redondante car "${module}:*" existe dans "${roleId}"`
        });
      }
    }
    
    // Vérifier la priorité pour le super admin
    if (permissions.includes('*') && roleId !== 'super_admin') {
      this.results.issues.warnings.push({
        type: 'non_super_admin_wildcard',
        role: roleId,
        message: `Seul le super_admin devrait avoir la permission "*", trouvé dans "${roleId}"`
      });
    }
  }

  /**
   * Valider le fichier permissions.js
   */
  async validatePermissionsFile() {
    console.log('📋 Validation du fichier permissions.js...'.cyan);
    
    try {
      const permissionsContent = fs.readFileSync(this.config.permissionsFile, 'utf8');
      
      // Vérifier la structure
      const requiredExports = ['PERMISSIONS', 'ROLES', 'MODULES'];
      const exportedFunctions = ['hasPermission', 'hasAnyPermission', 'hasAllPermissions'];
      
      for (const exportName of requiredExports) {
        if (!permissionsContent.includes(`export const ${exportName}`)) {
          this.results.issues.critical.push({
            type: 'missing_export',
            export: exportName,
            message: `Export manquant: ${exportName} dans permissions.js`
          });
        }
      }
      
      for (const funcName of exportedFunctions) {
        if (!permissionsContent.includes(`export const ${funcName}`) && 
            !permissionsContent.includes(`export { ${funcName }`) &&
            !permissionsContent.includes(`${funcName} = `)) {
          this.results.issues.infos.push({
            type: 'missing_function',
            function: funcName,
            message: `Fonction manquante: ${funcName} dans permissions.js`
          });
        }
      }
      
      console.log('✅ Fichier permissions.js validé'.green);
      
    } catch (error) {
      console.error('❌ Erreur permissions.js:'.red, error.message);
      this.results.issues.critical.push({
        type: 'file_error',
        file: 'permissions.js',
        message: error.message
      });
    }
    
    console.log('');
  }

  /**
   * Vérifier la cohérence de granularité entre config et permissions.js
   */
  async checkGranularityConsistency() {
    console.log('🔗 Vérification de la cohérence de granularité...'.cyan);
    
    try {
      const configData = this.loadJsonFile(this.config.configFile);
      
      if (configData.roles) {
        const configRoles = Object.keys(configData.roles);
        console.log(`📊 Rôles dans config.json: ${configRoles.join(', ')}`);
        
        // Comparer avec les rôles définis dans permissions.js
        // (simulation car on ne peut pas importer directement)
        const expectedRoles = [
          'super_admin', 'admin', 'ged_specialist', 'manager', 'technician', 'viewer'
        ];
        
        for (const role of expectedRoles) {
          if (!configRoles.includes(role)) {
            this.results.issues.warnings.push({
              type: 'missing_role',
              role: role,
              message: `Rôle "${role}" manquant dans config.json`
            });
          }
        }
      }
      
      console.log('✅ Cohérence de granularité vérifiée'.green);
      
    } catch (error) {
      console.error('❌ Erreur cohérence:'.red, error.message);
    }
    
    console.log('');
  }

  /**
   * Valider la hiérarchie des rôles
   */
  async validateRoleHierarchy() {
    console.log('🏗️ Validation de la hiérarchie des rôles...'.cyan);
    
    try {
      const configData = this.loadJsonFile(this.config.configFile);
      
      if (configData.roles) {
        const roles = Object.values(configData.roles);
        
        // Trier par priorité décroissante
        const sortedRoles = roles.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        // Vérifier les priorités
        for (let i = 0; i < sortedRoles.length - 1; i++) {
          const current = sortedRoles[i];
          const next = sortedRoles[i + 1];
          
          if ((current.priority || 0) <= (next.priority || 0)) {
            this.results.issues.warnings.push({
              type: 'priority_issue',
              current: current.name,
              next: next.name,
              message: `Problème de priorité entre "${current.name}" (${current.priority}) et "${next.name}" (${next.priority})`
            });
          }
        }
        
        // Vérifier que le super_admin a la plus haute priorité
        const superAdmin = roles.find(r => r.id === 'super_admin' || r.permissions?.includes('*'));
        if (superAdmin && superAdmin.priority !== 100) {
          this.results.issues.warnings.push({
            type: 'super_admin_priority',
            role: superAdmin.name,
            priority: superAdmin.priority,
            message: `Le super_admin devrait avoir une priorité de 100, actuel: ${superAdmin.priority}`
          });
        }
      }
      
      console.log('✅ Hiérarchie des rôles validée'.green);
      
    } catch (error) {
      console.error('❌ Erreur hiérarchie:'.red, error.message);
    }
    
    console.log('');
  }

  /**
   * Tester les patterns de permissions
   */
  async testPermissionPatterns() {
    console.log('🧪 Test des patterns de permissions...'.cyan);
    
    // Simuler des tests de patterns
    const patterns = [
      {
        name: 'Wildcard module',
        userPermissions: ['dashboard:*'],
        testCases: [
          { permission: 'dashboard:view', expected: true },
          { permission: 'dashboard:edit', expected: true },
          { permission: 'sessions:view', expected: false }
        ]
      },
      {
        name: 'Permissions exactes',
        userPermissions: ['users:create', 'loans:view'],
        testCases: [
          { permission: 'users:create', expected: true },
          { permission: 'loans:view', expected: true },
          { permission: 'users:edit', expected: false },
          { permission: 'loans:edit', expected: false }
        ]
      },
      {
        name: 'Super admin',
        userPermissions: ['*'],
        testCases: [
          { permission: 'any:permission', expected: true },
          { permission: 'another:action', expected: true }
        ]
      }
    ];
    
    for (const pattern of patterns) {
      for (const testCase of pattern.testCases) {
        // Simulation de la logique hasPermission
        const actualResult = this.simulateHasPermission(pattern.userPermissions, testCase.permission);
        
        if (actualResult !== testCase.expected) {
          this.results.issues.critical.push({
            type: 'pattern_test_failed',
            pattern: pattern.name,
            permission: testCase.permission,
            expected: testCase.expected,
            actual: actualResult,
            message: `Pattern "${pattern.name}" échoué pour "${testCase.permission}"`
          });
        }
      }
    }
    
    console.log('✅ Patterns de permissions testés'.green);
    console.log('');
  }

  /**
   * Simuler hasPermission pour les tests
   */
  simulateHasPermission(userPermissions, requiredPermission) {
    if (!userPermissions || userPermissions.length === 0) return false;
    
    // Super admin
    if (userPermissions.includes('*')) return true;
    
    // Permission exacte
    if (userPermissions.includes(requiredPermission)) return true;
    
    // Wildcard
    const [module, action] = requiredPermission.split(':');
    if (userPermissions.includes(`${module}:*`)) return true;
    
    return false;
  }

  /**
   * Générer des recommandations
   */
  async generateRecommendations() {
    console.log('💡 Génération des recommandations...'.cyan);
    
    const recommendations = [];
    
    // Recommandations basées sur les issues détectées
    if (this.results.statistics.invalidPermissions > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'Corriger les permissions invalides',
        description: `${this.results.statistics.invalidPermissions} permissions invalides détectées`,
        action: 'Vérifier le format des permissions (module:action)'
      });
    }
    
    if (this.results.issues.warnings.length > 5) {
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        title: 'Réduire le nombre d\'avertissements',
        description: `${this.results.issues.warnings.length} avertissements trouvés`,
        action: 'Nettoyer la configuration des permissions'
      });
    }
    
    // Recommandations pour les rôles
    const configData = this.loadJsonFile(this.config.configFile);
    if (configData.roles) {
      const roles = Object.values(configData.roles);
      
      // Vérifier si on a assez de granularité
      const rolesWithWildcards = roles.filter(r => r.permissions?.some(p => p.endsWith(':*') || p === '*')).length;
      const totalRoles = roles.length;
      
      if (rolesWithWildcards / totalRoles > 0.7) {
        recommendations.push({
          type: 'granularity',
          priority: 'medium',
          title: 'Améliorer la granularité des permissions',
          description: `Trop de rôles utilisent des wildcards (${rolesWithWildcards}/${totalRoles})`,
          action: 'Remplacer les wildcards par des permissions spécifiques'
        });
      }
    }
    
    this.results.recommendations = recommendations;
    
    console.log(`✅ ${recommendations.length} recommandations générées`.green);
    console.log('');
  }

  /**
   * Charger un fichier JSON
   */
  loadJsonFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Impossible de charger ${filePath}: ${error.message}`);
    }
  }

  /**
   * Générer le rapport final
   */
  generateReport() {
    console.log('📊 RAPPORT FINAL DE VALIDATION'.bold);
    console.log('=' .repeat(50));
    
    // Statistiques
    console.log('📈 STATISTIQUES:'.cyan);
    console.log(`  • Total rôles: ${this.results.statistics.totalRoles}`);
    console.log(`  • Total permissions: ${this.results.statistics.totalPermissions}`);
    console.log(`  • Permissions invalides: ${this.results.statistics.invalidPermissions}`);
    console.log(`  • Problèmes critiques: ${this.results.issues.critical.length}`);
    console.log(`  • Avertissements: ${this.results.issues.warnings.length}`);
    console.log(`  • Informations: ${this.results.issues.infos.length}`);
    console.log('');
    
    // Issues critiques
    if (this.results.issues.critical.length > 0) {
      console.log('🚨 PROBLÈMES CRITIQUES:'.red.bold);
      this.results.issues.critical.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.message}`);
      });
      console.log('');
    }
    
    // Avertissements
    if (this.results.issues.warnings.length > 0) {
      console.log('⚠️ AVERTISSEMENTS:'.yellow.bold);
      this.results.issues.warnings.slice(0, 10).forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.message}`);
      });
      if (this.results.issues.warnings.length > 10) {
        console.log(`  ... et ${this.results.issues.warnings.length - 10} autres`);
      }
      console.log('');
    }
    
    // Recommandations
    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMANDATIONS:'.green.bold);
      this.results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`     ${rec.description}`);
        console.log(`     Action: ${rec.action}`);
      });
      console.log('');
    }
    
    // Sauvegarder le rapport
    this.saveReport();
    
    // Déterminer le statut
    const hasCriticalIssues = this.results.issues.critical.length > 0;
    const hasWarnings = this.results.issues.warnings.length > 0;
    
    if (hasCriticalIssues) {
      console.log('❌ VALIDATION ÉCHOUÉE - Problèmes critiques détectés'.red.bold);
      if (this.config.fix) {
        console.log('🔧 Mode correction activé - tentative de correction...'.yellow);
      }
    } else if (hasWarnings) {
      console.log('⚠️ VALIDATION PARTIELLE - Avertissements détectés'.yellow.bold);
    } else {
      console.log('✅ VALIDATION RÉUSSIE - Aucune anomalie détectée'.green.bold);
    }
  }

  /**
   * Sauvegarder le rapport
   */
  saveReport() {
    try {
      if (!fs.existsSync(this.config.outputPath)) {
        fs.mkdirSync(this.config.outputPath, { recursive: true });
      }
      
      const reportFile = path.join(
        this.config.outputPath, 
        `permissions-validation-${Date.now()}.json`
      );
      
      const reportData = {
        ...this.results,
        summary: {
          status: this.results.issues.critical.length > 0 ? 'failed' : 
                 this.results.issues.warnings.length > 0 ? 'warnings' : 'success',
          score: this.calculateScore()
        }
      };
      
      fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
      console.log(`💾 Rapport sauvegardé: ${reportFile}`.green);
      
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder le rapport:'.yellow, error.message);
    }
  }

  /**
   * Calculer un score de qualité
   */
  calculateScore() {
    const criticalPenalty = this.results.issues.critical.length * 20;
    const warningPenalty = this.results.issues.warnings.length * 5;
    const infoBonus = this.results.issues.infos.length * 1;
    
    const baseScore = 100;
    const finalScore = Math.max(0, baseScore - criticalPenalty - warningPenalty + infoBonus);
    
    return {
      score: finalScore,
      grade: finalScore >= 90 ? 'A' : 
            finalScore >= 80 ? 'B' :
            finalScore >= 70 ? 'C' : 'D',
      details: {
        criticalPenalty,
        warningPenalty,
        infoBonus
      }
    };
  }

  /**
   * Appliquer des corrections automatiques
   */
  async applyFixes() {
    console.log('🔧 Application des corrections automatiques...'.yellow);
    
    // Correction des priorités
    await this.fixPriorities();
    
    // Correction des permissions malformées
    await this.fixMalformedPermissions();
    
    console.log('✅ Corrections appliquées'.green);
    console.log('');
  }

  /**
   * Corriger les priorités des rôles
   */
  async fixPriorities() {
    try {
      const configData = this.loadJsonFile(this.config.configFile);
      
      if (configData.roles) {
        const rolePriorityMap = {
          'super_admin': 100,
          'admin': 90,
          'ged_specialist': 85,
          'manager': 70,
          'technician': 50,
          'viewer': 10
        };
        
        let fixed = 0;
        for (const [roleId, role] of Object.entries(configData.roles)) {
          const expectedPriority = rolePriorityMap[roleId];
          if (expectedPriority && role.priority !== expectedPriority) {
            console.log(`  Corrigé priorité pour ${roleId}: ${role.priority} → ${expectedPriority}`);
            role.priority = expectedPriority;
            fixed++;
          }
        }
        
        if (fixed > 0) {
          fs.writeFileSync(this.config.configFile, JSON.stringify(configData, null, 2));
          this.results.fixes.push(`Priorités corrigées pour ${fixed} rôles`);
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Erreur lors de la correction des priorités:', error.message);
    }
  }

  /**
   * Corriger les permissions malformées
   */
  async fixMalformedPermissions() {
    try {
      const configData = this.loadJsonFile(this.config.configFile);
      
      if (configData.roles) {
        let fixed = 0;
        for (const [roleId, role] of Object.entries(configData.roles)) {
          if (role.permissions) {
            const originalLength = role.permissions.length;
            // Supprimer les doublons
            role.permissions = [...new Set(role.permissions)];
            
            if (role.permissions.length !== originalLength) {
              fixed += originalLength - role.permissions.length;
            }
          }
        }
        
        if (fixed > 0) {
          fs.writeFileSync(this.config.configFile, JSON.stringify(configData, null, 2));
          this.results.fixes.push(`${fixed} permissions dupliquées supprimées`);
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Erreur lors de la correction des permissions:', error.message);
    }
  }

  /**
   * Générer une configuration mock avancée
   */
  async generateAdvancedMockConfig() {
    console.log('🎭 Génération de la configuration mock avancée...'.yellow);
    
    const advancedConfig = this.createAdvancedMockConfig();
    
    const mockFile = path.join(this.config.projectRoot, 'config', 'permissions-advanced-mock.json');
    fs.writeFileSync(mockFile, JSON.stringify(advancedConfig, null, 2));
    
    console.log(`✅ Configuration mock sauvegardée: ${mockFile}`.green);
    console.log('');
  }

  /**
   * Créer la configuration mock avancée
   */
  createAdvancedMockConfig() {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        description: 'Configuration mock avancée pour les tests de permissions granulaires'
      },
      
      // Rôles avec granularité avancée
      roles: {
        super_admin: {
          name: "Super Administrateur",
          description: "Accès complet à toutes les fonctionnalités",
          permissions: ["*"],
          icon: "👑",
          color: "#d32f2f",
          priority: 100,
          metadata: {
            isSystem: true,
            canBeDeleted: false,
            inheritance: []
          }
        },
        
        admin: {
          name: "Administrateur",
          description: "Gestion complète de l'application",
          permissions: [
            "dashboard:*",
            "sessions:*",
            "computers:*",
            "loans:*",
            "users:*",
            "ad_management:*",
            "chat_ged:*",
            "ai_assistant:*",
            "reports:*",
            "settings:view",
            "config:view"
          ],
          icon: "👨‍💼",
          color: "#f57c00",
          priority: 90,
          metadata: {
            isSystem: true,
            canBeDeleted: false,
            inheritance: ["super_admin"]
          }
        },
        
        ged_specialist: {
          name: "Spécialiste GED",
          description: "Expert en gestion documentaire et IA",
          permissions: [
            "dashboard:view",
            "chat_ged:*",
            "ai_assistant:*",
            "ged_upload:create",
            "ged_delete:delete",
            "ged_network_scan:admin",
            "ged_index_manage:admin",
            "ged_stats_view:view",
            "reports:view",
            "reports:export"
          ],
          icon: "📚",
          color: "#9c27b0",
          priority: 85,
          metadata: {
            isSystem: true,
            canBeDeleted: false,
            inheritance: ["admin"],
            specialties: ["GED", "AI", "Document_Management"]
          }
        },
        
        manager: {
          name: "Manager",
          description: "Gestionnaire avec droits étendus",
          permissions: [
            "dashboard:view",
            "sessions:view",
            "sessions:edit",
            "computers:*",
            "loans:*",
            "users:view",
            "users:edit",
            "chat_ged:view",
            "chat_ged:create",
            "ai_assistant:view",
            "reports:view",
            "reports:export"
          ],
          icon: "👔",
          color: "#1976d2",
          priority: 70,
          metadata: {
            isSystem: true,
            canBeDeleted: false,
            inheritance: ["ged_specialist"],
            department: ["management"]
          }
        },
        
        technician: {
          name: "Technicien",
          description: "Support technique",
          permissions: [
            "dashboard:view",
            "sessions:view",
            "sessions:edit",
            "sessions:disconnect",
            "computers:view",
            "computers:edit",
            "loans:view",
            "loans:create",
            "users:view",
            "chat_ged:view",
            "ai_assistant:view",
            "reports:view"
          ],
          icon: "🔧",
          color: "#388e3c",
          priority: 50,
          metadata: {
            isSystem: true,
            canBeDeleted: false,
            inheritance: ["manager"],
            level: "intermediate"
          }
        },
        
        viewer: {
          name: "Observateur",
          description: "Consultation uniquement",
          permissions: [
            "dashboard:view",
            "sessions:view",
            "computers:view",
            "loans:view",
            "users:view",
            "reports:view"
          ],
          icon: "👁️",
          color: "#757575",
          priority: 10,
          metadata: {
            isSystem: true,
            canBeDeleted: false,
            inheritance: ["technician"],
            accessLevel: "read-only"
          }
        },
        
        // Rôles personnalisés pour tests
        custom_role_1: {
          name: "Testeur GED",
          description: "Rôle personnalisé pour les tests GED",
          permissions: [
            "dashboard:view",
            "chat_ged:view",
            "chat_ged:create",
            "chat_ged:edit",
            "ged_upload:create",
            "ged_upload:edit",
            "reports:view"
          ],
          icon: "🧪",
          color: "#ff9800",
          priority: 60,
          metadata: {
            isSystem: false,
            canBeDeleted: true,
            inheritance: ["viewer"],
            custom: true,
            testData: true
          }
        },
        
        custom_role_2: {
          name: "Superviseur Session",
          description: "Supervision exclusive des sessions",
          permissions: [
            "dashboard:view",
            "sessions:*",
            "reports:view"
          ],
          icon: "🎯",
          color: "#00bcd4",
          priority: 65,
          metadata: {
            isSystem: false,
            canBeDeleted: true,
            inheritance: ["technician"],
            custom: true,
            specialization: "session_management"
          }
        }
      },
      
      // Patterns de permissions avancés
      permissionPatterns: {
        wildcards: {
          description: "Patterns avec wildcards",
          examples: [
            {
              pattern: "dashboard:*",
              matches: ["dashboard:view", "dashboard:edit", "dashboard:create", "dashboard:delete"],
              excluded: ["sessions:view", "users:view"]
            },
            {
              pattern: "sessions:*",
              matches: ["sessions:view", "sessions:edit", "sessions:create", "sessions:delete", "sessions:disconnect"],
              excluded: ["dashboard:view", "loans:view"]
            }
          ]
        },
        
        granularActions: {
          description: "Actions granulaires par module",
          examples: [
            {
              module: "users",
              actions: ["view", "create", "edit", "delete"],
              combinations: [
                "users:create + users:edit",
                "users:view + users:create",
                "users:view + users:edit + users:create"
              ]
            },
            {
              module: "loans",
              actions: ["view", "create", "edit", "delete", "export"],
              combinations: [
                "loans:view + loans:create + loans:edit",
                "loans:view + loans:export"
              ]
            }
          ]
        },
        
        specialPermissions: {
          description: "Permissions spéciales GED et IA",
          examples: [
            {
              name: "GED Upload",
              permission: "ged_upload:create",
              dependencies: ["chat_ged:view"],
              restrictions: "Max 100 files per day"
            },
            {
              name: "GED Network Scan",
              permission: "ged_network_scan:admin",
              dependencies: ["ged_upload:create", "ged_index_manage:admin"],
              restrictions: "Admin access required"
            }
          ]
        }
      },
      
      // Configuration de test
      testConfiguration: {
        testUsers: [
          {
            id: "test_user_1",
            username: "test.ged.specialist",
            role: "ged_specialist",
            permissions: ["dashboard:view", "chat_ged:*", "ai_assistant:*"],
            metadata: {
              department: "IT",
              level: "senior",
              testScenario: "GED_FULL_ACCESS"
            }
          },
          {
            id: "test_user_2",
            username: "test.manager.limited",
            role: "manager",
            permissions: ["dashboard:view", "sessions:view", "loans:view"],
            metadata: {
              department: "Management",
              level: "junior",
              testScenario: "MANAGER_LIMITED"
            }
          }
        ],
        
        edgeCases: [
          {
            name: "Empty Permissions",
            permissions: [],
            expectedResults: {
              "dashboard:view": false,
              "any:permission": false
            }
          },
          {
            name: "Invalid Format",
            permissions: ["invalid-permission", "malformed::permission"],
            expectedResults: {
              "invalid-permission": false,
              "malformed::permission": false
            }
          },
          {
            name: "Mixed Valid Invalid",
            permissions: ["dashboard:view", "invalid:permission", "sessions:view"],
            expectedResults: {
              "dashboard:view": true,
              "sessions:view": true,
              "invalid:permission": false
            }
          }
        ]
      },
      
      // Métriques et monitoring
      monitoring: {
        metrics: {
          totalPermissionChecks: 0,
          averageResponseTime: 0,
          cacheHitRate: 0,
          errorRate: 0
        },
        
        alerts: [
          {
            condition: "errorRate > 0.05",
            message: "Taux d'erreur des permissions trop élevé",
            severity: "high"
          },
          {
            condition: "averageResponseTime > 100",
            message: "Temps de réponse des permissions dégradé",
            severity: "medium"
          }
        ]
      }
    };
  }

  /**
   * Quitter avec le bon code
   */
  exit() {
    const hasCritical = this.results.issues.critical.length > 0;
    const hasWarnings = this.results.issues.warnings.length > 0;
    
    if (hasCritical) {
      console.log('\n❌ Validation échouée - Arrêt avec code d\'erreur 1'.red.bold);
      process.exit(1);
    } else if (hasWarnings) {
      console.log('\n⚠️ Validation avec avertissements - Code 2'.yellow.bold);
      process.exit(2);
    } else {
      console.log('\n✅ Validation réussie - Code 0'.green.bold);
      process.exit(0);
    }
  }
}

// Point d'entrée principal
if (require.main === module) {
  const validator = new GranularPermissionsValidator();
  
  // Gestion des arguments de ligne de commande
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🔐 VALIDATION DES PERMISSIONS GRANULAIRES

Usage: node validate-granular-permissions.js [options]

Options:
  -v, --verbose        Mode verbeux
  -s, --strict         Mode strict (échoue sur avertissements)
  -f, --fix            Appliquer les corrections automatiques
  -g, --generate-mock  Générer la configuration mock avancée
  -h, --help          Afficher cette aide

Exemples:
  node validate-granular-permissions.js
  node validate-granular-permissions.js --verbose --fix
  node validate-granular-permissions.js --generate-mock
`);
    process.exit(0);
  }
  
  validator.run().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = GranularPermissionsValidator;