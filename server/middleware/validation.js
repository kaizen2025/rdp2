/**
 * Middleware de validation des entrées
 * Sécurisation et validation des données entrantes
 */

const { body, validationResult, param, query } = require('express-validator');

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
    return str
        .replace(/[\x00-\x1F\x7F]/g, '') // Caractères de contrôle
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
        .trim();
};

/**
 * Middleware de sanitization générale
 */
const sanitizeInputs = (req, res, next) => {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        });
    }

    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        });
    }

    next();
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
    validateDocumentUpload,
    validateChatMessage,
    validateDocumentSearch,
    validateDocumentId,
    validatePagination,
    validateUserUpdate,
    sanitizeInputs,
    sanitizeString,
    rateLimit,
    handleValidationErrors
};
