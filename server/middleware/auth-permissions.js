/**
 * Middleware d'autorisation et de permissions RDS Viewer Anecoop
 * Gestion complète des permissions backend avec audit et sécurité
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration des permissions
const PERMISSION_CONFIG = {
    jwtSecret: process.env.JWT_SECRET || 'rds-viewer-default-secret',
    auditLogEnabled: true,
    sessionTimeout: 3600000, // 1 heure
    maxLoginAttempts: 5,
    lockoutDuration: 900000, // 15 minutes
    
    // Définition des rôles et permissions
    roles: {
        admin: {
            level: 4,
            permissions: [
                'read', 'write', 'delete', 'manage_users', 
                'system_admin', 'audit_logs', 'configuration'
            ],
            rateLimit: 1000
        },
        manager: {
            level: 3,
            permissions: [
                'read', 'write', 'manage_team', 'view_reports'
            ],
            rateLimit: 500
        },
        technician: {
            level: 2,
            permissions: [
                'read', 'write', 'maintenance'
            ],
            rateLimit: 200
        },
        viewer: {
            level: 1,
            permissions: [
                'read'
            ],
            rateLimit: 100
        }
    },

    // Actions sensibles à auditer
    sensitiveActions: [
        'USER_CREATE', 'USER_DELETE', 'USER_UPDATE',
        'SYSTEM_CONFIG_CHANGE', 'BULK_OPERATION',
        'PRIVILEGE_ESCALATION', 'ADMIN_ACCESS'
    ]
};

// Stockage des sessions et tentatives (en production, utiliser Redis)
const sessionStore = new Map();
const loginAttempts = new Map();
const auditLog = [];

// Fonctions utilitaires
const utils = {
    // Génère un hash sécurisé pour les mots de passe
    hashPassword: (password, salt = crypto.randomBytes(16).toString('hex')) => {
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
        return { salt, hash: hash.toString('hex') };
    },

    // Vérifie un mot de passe contre son hash
    verifyPassword: (password, salt, hash) => {
        const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
        return hashToVerify.toString('hex') === hash;
    },

    // Génère un token CSRF
    generateCSRFToken: () => {
        return crypto.randomBytes(32).toString('hex');
    },

    // Log des événements d'audit
    logAudit: (action, user, details = {}) => {
        if (!PERMISSION_CONFIG.auditLogEnabled) return;

        const logEntry = {
            timestamp: Date.now(),
            action,
            user: user?.username || 'anonymous',
            userRole: user?.role || 'unknown',
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown',
            resource: details.resource || 'unknown',
            result: details.result || 'unknown',
            details: details.extra || {}
        };

        auditLog.push(logEntry);

        // Limiter la taille du log en mémoire
        if (auditLog.length > 10000) {
            auditLog.splice(0, 5000); // Garder les 5000 plus récents
        }

        console.log(`🔍 AUDIT: ${action} by ${logEntry.user} (${logEntry.userRole})`);
    },

    // Nettoie les sessions expirées
    cleanupExpiredSessions: () => {
        const now = Date.now();
        for (const [sessionId, session] of sessionStore.entries()) {
            if (now > session.expiresAt) {
                sessionStore.delete(sessionId);
            }
        }
    },

    // Vérifie si une IP est bloquée
    isIPBlocked: (ip) => {
        const attempts = loginAttempts.get(ip);
        if (!attempts) return false;
        
        return attempts.count >= PERMISSION_CONFIG.maxLoginAttempts && 
               Date.now() < attempts.blockedUntil;
    },

    // Enregistre une tentative de connexion
    recordLoginAttempt: (ip, success = false) => {
        const attempts = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
        
        if (success) {
            // Connexion réussie, réinitialiser les tentatives
            loginAttempts.delete(ip);
        } else {
            // Échec de connexion
            attempts.count++;
            if (attempts.count >= PERMISSION_CONFIG.maxLoginAttempts) {
                attempts.blockedUntil = Date.now() + PERMISSION_CONFIG.lockoutDuration;
                utils.logAudit('IP_BLOCKED', null, { 
                    ip, 
                    attempts: attempts.count,
                    blockedUntil: attempts.blockedUntil 
                });
            }
            loginAttempts.set(ip, attempts);
        }
    }
};

// Middleware d'authentification JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        utils.logAudit('AUTH_FAILED', null, { 
            reason: 'NO_TOKEN', 
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        return res.status(401).json({ 
            success: false, 
            error: 'Token d\'accès requis' 
        });
    }

    try {
        const decoded = jwt.verify(token, PERMISSION_CONFIG.jwtSecret);
        
        // Vérifier si la session est valide
        const sessionKey = `${decoded.username}_${decoded.iat}`;
        const session = sessionStore.get(sessionKey);
        
        if (!session) {
            utils.logAudit('AUTH_FAILED', decoded, { 
                reason: 'NO_SESSION',
                ip: req.ip 
            });
            return res.status(401).json({ 
                success: false, 
                error: 'Session invalide ou expirée' 
            });
        }

        // Vérifier expiration de session
        if (Date.now() > session.expiresAt) {
            sessionStore.delete(sessionKey);
            utils.logAudit('SESSION_EXPIRED', decoded, { 
                ip: req.ip 
            });
            return res.status(401).json({ 
                success: false, 
                error: 'Session expirée' 
            });
        }

        req.user = decoded;
        req.sessionId = sessionKey;
        next();

    } catch (error) {
        let errorMessage = 'Token invalide';
        let reason = 'INVALID_TOKEN';

        if (error.name === 'TokenExpiredError') {
            errorMessage = 'Token expiré';
            reason = 'EXPIRED_TOKEN';
        } else if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Token malformé';
            reason = 'MALFORMED_TOKEN';
        }

        utils.logAudit('AUTH_FAILED', null, { 
            reason,
            error: error.message,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        return res.status(401).json({ 
            success: false, 
            error: errorMessage 
        });
    }
};

// Middleware de vérification de rôle
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentification requise' 
            });
        }

        const userRole = req.user.role;
        const userLevel = PERMISSION_CONFIG.roles[userRole]?.level || 0;

        // Vérifier si le rôle de l'utilisateur est autorisé
        const isRoleAllowed = allowedRoles.some(role => {
            const roleLevel = PERMISSION_CONFIG.roles[role]?.level || 0;
            return userLevel >= roleLevel;
        });

        if (!isRoleAllowed) {
            utils.logAudit('ACCESS_DENIED_ROLE', req.user, {
                requiredRoles: allowedRoles,
                userRole: userRole,
                resource: req.originalUrl,
                ip: req.ip
            });

            return res.status(403).json({ 
                success: false, 
                error: 'Rôle insuffisant pour accéder à cette ressource' 
            });
        }

        next();
    };
};

// Middleware de vérification de permission
const checkPermissions = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentification requise' 
            });
        }

        const userPermissions = req.user.permissions || [];
        const hasAllPermissions = requiredPermissions.every(permission => 
            userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
            utils.logAudit('ACCESS_DENIED_PERMISSION', req.user, {
                requiredPermissions,
                userPermissions,
                resource: req.originalUrl,
                ip: req.ip
            });

            return res.status(403).json({ 
                success: false, 
                error: 'Permission insuffisante pour cette action' 
            });
        }

        next();
    };
};

// Middleware d'audit pour les actions sensibles
const auditLog = (action) => {
    return (req, res, next) => {
        // Enregistrer l'action au début de la requête
        req.auditAction = action;
        req.auditStartTime = Date.now();

        // Intercepter la réponse pour enregistrer le résultat
        const originalSend = res.send;
        res.send = function(data) {
            const duration = Date.now() - req.auditStartTime;
            const result = res.statusCode < 400 ? 'SUCCESS' : 'FAILURE';

            utils.logAudit(action, req.user, {
                resource: req.originalUrl,
                method: req.method,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                duration,
                result,
                statusCode: res.statusCode
            });

            originalSend.call(this, data);
        };

        next();
    };
};

// Middleware de rate limiting par rôle
const rateLimitByRole = (roleLimits) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userRole = req.user.role;
        const limit = roleLimits[userRole] || 50; // Limite par défaut
        
        const key = `${req.ip}_${userRole}`;
        const now = Date.now();
        const windowMs = 60000; // 1 minute

        if (!requests.has(key)) {
            requests.set(key, []);
        }

        const userRequests = requests.get(key);
        const recentRequests = userRequests.filter(time => now - time < windowMs);

        if (recentRequests.length >= limit) {
            utils.logAudit('RATE_LIMIT_EXCEEDED', req.user, {
                limit,
                current: recentRequests.length,
                ip: req.ip,
                resource: req.originalUrl
            });

            return res.status(429).json({
                success: false,
                error: 'Limite de requêtes dépassée',
                retryAfter: Math.ceil((recentRequests[0] - (now - windowMs)) / 1000)
            });
        }

        recentRequests.push(now);
        requests.set(key, recentRequests);

        // Nettoyage périodique
        if (Math.random() < 0.01) { // 1% de chance
            const cutoff = now - windowMs;
            for (const [reqKey, reqTimes] of requests.entries()) {
                const recent = reqTimes.filter(time => time > cutoff);
                if (recent.length === 0) {
                    requests.delete(reqKey);
                } else {
                    requests.set(reqKey, recent);
                }
            }
        }

        next();
    };
};

// Middleware de protection CSRF
const csrfProtection = (req, res, next) => {
    const method = req.method.toUpperCase();
    
    // Skip pour GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return next();
    }

    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        utils.logAudit('CSRF_ATTACK', req.user, {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.method,
            resource: req.originalUrl
        });

        return res.status(403).json({
            success: false,
            error: 'Token CSRF manquant ou invalide'
        });
    }

    next();
};

// Middleware de validation de session
const validateSession = (req, res, next) => {
    if (!req.user) {
        return next();
    }

    // Générer un token CSRF pour la session si absent
    if (!req.session) {
        req.session = {};
    }

    if (!req.session.csrfToken) {
        req.session.csrfToken = utils.generateCSRFToken();
    }

    // Marquer la session comme utilisée (slide expiration)
    const sessionKey = req.sessionId;
    if (sessionKey && sessionStore.has(sessionKey)) {
        const session = sessionStore.get(sessionKey);
        session.lastActivity = Date.now();
        session.expiresAt = Date.now() + PERMISSION_CONFIG.sessionTimeout;
        sessionStore.set(sessionKey, session);
    }

    next();
};

// Fonctions utilitaires pour l'API
const authUtils = {
    // Créer une nouvelle session
    createSession: (userData, ip, userAgent) => {
        const sessionId = `${userData.username}_${Date.now()}`;
        const session = {
            id: sessionId,
            userId: userData.username,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + PERMISSION_CONFIG.sessionTimeout,
            ip,
            userAgent
        };

        sessionStore.set(sessionId, session);
        return session;
    },

    // Détruire une session
    destroySession: (sessionId) => {
        sessionStore.delete(sessionId);
    },

    // Vérifier les permissions d'un utilisateur
    hasPermission: (user, permission) => {
        return user?.permissions?.includes(permission) || false;
    },

    // Vérifier le niveau de rôle
    hasRoleLevel: (user, minLevel) => {
        const userLevel = PERMISSION_CONFIG.roles[user?.role]?.level || 0;
        return userLevel >= minLevel;
    },

    // Obtenir les logs d'audit
    getAuditLogs: (filters = {}) => {
        let filteredLogs = [...auditLog];

        if (filters.user) {
            filteredLogs = filteredLogs.filter(log => log.user === filters.user);
        }

        if (filters.action) {
            filteredLogs = filteredLogs.filter(log => log.action === filters.action);
        }

        if (filters.since) {
            filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since);
        }

        return filteredLogs.slice(-1000); // Retourner les 1000 derniers
    },

    // Nettoyer les données en mémoire
    cleanup: () => {
        utils.cleanupExpiredSessions();
        
        // Limiter la taille du log d'audit
        if (auditLog.length > 10000) {
            auditLog.splice(0, 5000);
        }
    }
};

// Export des middlewares et utilitaires
module.exports = {
    // Middlewares
    authenticateToken,
    authorizeRoles,
    checkPermissions,
    auditLog,
    rateLimitByRole,
    csrfProtection,
    validateSession,

    // Configuration
    PERMISSION_CONFIG,

    // Utilitaires
    utils,
    authUtils,

    // Pour les tests
    _sessionStore: sessionStore,
    _loginAttempts: loginAttempts,
    _auditLog: auditLog
};