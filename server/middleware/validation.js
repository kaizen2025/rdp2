/**
 * Middleware de validation des entrées
 * Sécurisation et validation des données entrantes avec protection avancée
 */

const { body, validationResult, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Configuration de sécurité
const SECURITY_CONFIG = {
    maxPayloadSize: 10 * 1024 * 1024, // 10MB
    maxDepth: 10, // Profondeur maximale des objets
    forbiddenPatterns: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /union\s+select/gi,
        /drop\s+table/gi,
        /insert\s+into/gi,
        /update\s+set/gi,
        /delete\s+from/gi,
        /\$\{.*?\}/gi, // Template literals
        /\{\{.*?\}\}/gi, // Template engines
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi,
        /vbscript:/gi,
        /data:text\/html/gi
    ]
};

/**
 * Middleware pour gérer les erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

/**
 * Validation pour l'upload de documents
 */
const validateDocumentUpload = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Le titre doit contenir entre 1 et 255 caractères'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La description ne peut pas dépasser 1000 caractères'),

    body('tags')
        .optional()
        .isArray()
        .withMessage('Les tags doivent être un tableau'),

    handleValidationErrors
];

/**
 * Validation pour les requêtes de chat
 */
const validateChatMessage = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Le message ne peut pas être vide')
        .isLength({ min: 1, max: 5000 })
        .withMessage('Le message doit contenir entre 1 et 5000 caractères'),

    body('sessionId')
        .trim()
        .notEmpty()
        .withMessage('Session ID requis')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Session ID invalide'),

    body('userId')
        .optional()
        .trim()
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('User ID invalide'),

    handleValidationErrors
];

/**
 * Validation pour la recherche de documents
 */
const validateDocumentSearch = [
    body('query')
        .trim()
        .notEmpty()
        .withMessage('La requête de recherche ne peut pas être vide')
        .isLength({ min: 1, max: 500 })
        .withMessage('La requête doit contenir entre 1 et 500 caractères'),

    body('maxResults')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('maxResults doit être entre 1 et 100'),

    body('minScore')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('minScore doit être entre 0 et 1'),

    handleValidationErrors
];

/**
 * Validation pour les IDs de documents
 */
const validateDocumentId = [
    param('id')
        .trim()
        .notEmpty()
        .isInt({ min: 1 })
        .withMessage('ID de document invalide'),

    handleValidationErrors
];

/**
 * Validation pour les paramètres de pagination
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Le numéro de page doit être >= 1'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('La limite doit être entre 1 et 100'),

    handleValidationErrors
];

/**
 * Validation pour les paramètres utilisateur
 */
const validateUserUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),

    body('permissions')
        .optional()
        .isArray()
        .withMessage('Les permissions doivent être un tableau'),

    handleValidationErrors
];

/**
 * Sanitization générique pour les chaînes de caractères
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;

    // Supprimer les caractères de contrôle dangereux
    let sanitized = str
        .replace(/[\x00-\x1F\x7F]/g, '') // Caractères de contrôle
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
        .trim();

    // Échapper les caractères potentiellement dangereux
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

    return sanitized;
};

/**
 * Validation avancée contre les patterns malveillants
 */
const validateAgainstMaliciousPatterns = (data) => {
    const checkString = (str) => {
        if (typeof str !== 'string') return true;
        
        for (const pattern of SECURITY_CONFIG.forbiddenPatterns) {
            if (pattern.test(str)) {
                return false;
            }
        }
        return true;
    };

    const checkObject = (obj, depth = 0) => {
        if (depth > SECURITY_CONFIG.maxDepth) {
            return false; // Trop profond
        }

        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                if (!checkString(obj[key])) {
                    return false;
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (!checkObject(obj[key], depth + 1)) {
                    return false;
                }
            }
        }
        return true;
    };

    if (typeof data === 'string') {
        return checkString(data);
    } else if (typeof data === 'object' && data !== null) {
        return checkObject(data);
    }
    
    return true;
};

/**
 * Validation de la taille du payload
 */
const validatePayloadSize = (req, res, next) => {
    const contentLength = req.get('content-length');
    
    if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.maxPayloadSize) {
        return res.status(413).json({
            success: false,
            error: 'Payload trop volumineux',
            maxSize: `${SECURITY_CONFIG.maxPayloadSize / (1024 * 1024)}MB`
        });
    }
    
    next();
};

/**
 * Validation stricte des types de données
 */
const validateDataTypes = (schema) => {
    return (req, res, next) => {
        for (const [field, rules] of Object.entries(schema)) {
            const value = req.body[field];
            
            // Vérifier la présence si requis
            if (rules.required && (value === undefined || value === null)) {
                return res.status(400).json({
                    success: false,
                    error: `Le champ ${field} est requis`
                });
            }
            
            if (value !== undefined && value !== null) {
                // Vérifier le type
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (rules.type && actualType !== rules.type) {
                    return res.status(400).json({
                        success: false,
                        error: `Le champ ${field} doit être de type ${rules.type}`
                    });
                }
                
                // Validations spécifiques par type
                if (rules.type === 'string') {
                    if (rules.minLength && value.length < rules.minLength) {
                        return res.status(400).json({
                            success: false,
                            error: `Le champ ${field} doit contenir au moins ${rules.minLength} caractères`
                        });
                    }
                    if (rules.maxLength && value.length > rules.maxLength) {
                        return res.status(400).json({
                            success: false,
                            error: `Le champ ${field} ne peut pas dépasser ${rules.maxLength} caractères`
                        });
                    }
                    if (rules.pattern && !rules.pattern.test(value)) {
                        return res.status(400).json({
                            success: false,
                            error: `Le champ ${field} a un format invalide`
                        });
                    }
                }
                
                if (rules.type === 'number') {
                    if (rules.min !== undefined && value < rules.min) {
                        return res.status(400).json({
                            success: false,
                            error: `Le champ ${field} doit être >= ${rules.min}`
                        });
                    }
                    if (rules.max !== undefined && value > rules.max) {
                        return res.status(400).json({
                            success: false,
                            error: `Le champ ${field} doit être <= ${rules.max}`
                        });
                    }
                }
                
                if (rules.type === 'array') {
                    if (rules.minItems && value.length < rules.minItems) {
                        return res.status(400).json({
                            success: false,
                            error: `Le champ ${field} doit contenir au moins ${rules.minItems} éléments`
                        });
                    }
                    if (rules.maxItems && value.length > rules.maxItems) {
                        return res.status(400).json({
                            success: false,
                            error: `Le champ ${field} ne peut pas contenir plus de ${rules.maxItems} éléments`
                        });
                    }
                }
            }
        }
        
        next();
    };
};

/**
 * Middleware de sanitization générale avec validation avancée
 */
const sanitizeInputs = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const sanitized = Array.isArray(obj) ? [] : {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                
                // Sanitiser la clé
                const sanitizedKey = sanitizeString(key);
                
                if (typeof value === 'string') {
                    sanitized[sanitizedKey] = sanitizeString(value);
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    sanitized[sanitizedKey] = value;
                } else if (Array.isArray(value)) {
                    sanitized[sanitizedKey] = value.map(item => {
                        if (typeof item === 'string') {
                            return sanitizeString(item);
                        } else if (typeof item === 'object') {
                            return sanitizeObject(item);
                        }
                        return item;
                    });
                } else if (typeof value === 'object' && value !== null) {
                    sanitized[sanitizedKey] = sanitizeObject(value);
                } else {
                    sanitized[sanitizedKey] = value;
                }
            }
        }

        return sanitized;
    };

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }

    next();
};

/**
 * Validation de sécurité complète
 */
const securityValidation = (req, res, next) => {
    // Vérifier la taille du payload
    const contentLength = req.get('content-length');
    if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.maxPayloadSize) {
        return res.status(413).json({
            success: false,
            error: 'Payload trop volumineux'
        });
    }

    // Vérifier les patterns malveillants
    const checkForMaliciousContent = (data) => {
        if (!validateAgainstMaliciousPatterns(data)) {
            throw new Error('Contenu potentiellement malveillant détecté');
        }
    };

    try {
        if (req.body) checkForMaliciousContent(req.body);
        if (req.query) checkForMaliciousContent(req.query);
        if (req.params) checkForMaliciousContent(req.params);
        
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: 'Données d\'entrée invalides',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Schémas de validation prédéfinis
 */
const VALIDATION_SCHEMAS = {
    // Schéma pour création/édition d'utilisateur
    userCreate: {
        username: { type: 'string', required: true, minLength: 3, maxLength: 50, pattern: /^[a-zA-Z0-9_.-]+$/ },
        displayName: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        email: { type: 'string', required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        department: { type: 'string', required: false, maxLength: 100 },
        server: { type: 'string', required: false, maxLength: 100 },
        password: { type: 'string', required: false, minLength: 8 },
        officePassword: { type: 'string', required: false, minLength: 4 },
        notes: { type: 'string', required: false, maxLength: 1000 }
    },

    // Schéma pour recherche
    search: {
        query: { type: 'string', required: true, minLength: 1, maxLength: 500 },
        maxResults: { type: 'number', required: false, min: 1, max: 100 },
        minScore: { type: 'number', required: false, min: 0, max: 1 },
        filters: { type: 'object', required: false }
    },

    // Schéma pour chat
    chatMessage: {
        message: { type: 'string', required: true, minLength: 1, maxLength: 5000 },
        sessionId: { type: 'string', required: true, pattern: /^[a-zA-Z0-9_-]+$/ },
        userId: { type: 'string', required: false, pattern: /^[a-zA-Z0-9_-]+$/ },
        context: { type: 'object', required: false }
    },

    // Schéma pour pagination
    pagination: {
        page: { type: 'number', required: false, min: 1 },
        limit: { type: 'number', required: false, min: 1, max: 100 },
        sortBy: { type: 'string', required: false, pattern: /^[a-zA-Z_]+$/ },
        sortOrder: { type: 'string', required: false, pattern: /^(asc|desc)$/ }
    }
};

/**
 * Middleware de validation par schéma
 */
const validateWithSchema = (schemaName) => {
    const schema = VALIDATION_SCHEMAS[schemaName];
    if (!schema) {
        throw new Error(`Schéma de validation '${schemaName}' non trouvé`);
    }

    return validateDataTypes(schema);
};

/**
 * Rate limiting personnalisé par endpoint
 */
const createRateLimit = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requêtes par fenêtre
        message: {
            success: false,
            error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        ...options
    };

    return rateLimit(defaultOptions);
};

// Rate limits prédéfinis
const RATE_LIMITS = {
    strict: createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 req/15min
    moderate: createRateLimit({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 req/15min
    generous: createRateLimit({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 req/15min
    public: createRateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }) // 1000 req/15min
};

/**
 * Middleware de rate limiting simple
 * (Pour production, utiliser redis-rate-limiter ou similar)
 */
const rateLimit = () => {
    const requests = new Map();

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowMs = 60000; // 1 minute
        const maxRequests = 100; // 100 requêtes par minute

        if (!requests.has(ip)) {
            requests.set(ip, []);
        }

        const ipRequests = requests.get(ip);
        const recentRequests = ipRequests.filter(time => now - time < windowMs);

        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Trop de requêtes',
                message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.'
            });
        }

        recentRequests.push(now);
        requests.set(ip, recentRequests);

        // Nettoyage périodique
        if (Math.random() < 0.01) { // 1% de chance
            const cutoff = now - windowMs;
            for (const [key, times] of requests.entries()) {
                const recent = times.filter(time => time > cutoff);
                if (recent.length === 0) {
                    requests.delete(key);
                } else {
                    requests.set(key, recent);
                }
            }
        }

        next();
    };
};

module.exports = {
    // Validations prédéfinies
    validateDocumentUpload,
    validateChatMessage,
    validateDocumentSearch,
    validateDocumentId,
    validatePagination,
    validateUserUpdate,
    
    // Sanitization et sécurité
    sanitizeInputs,
    sanitizeString,
    securityValidation,
    validateAgainstMaliciousPatterns,
    validatePayloadSize,
    validateDataTypes,
    
    // Schémas de validation
    VALIDATION_SCHEMAS,
    validateWithSchema,
    
    // Rate limiting
    rateLimit,
    createRateLimit,
    RATE_LIMITS,
    
    // Gestion d'erreurs
    handleValidationErrors,
    
    // Configuration
    SECURITY_CONFIG
};
