/**
 * Tests de sécurité backend RDS Viewer Anecoop
 * Validation complète des mécanismes de sécurité backend
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const express = require('express');

// Configuration de test
const SECURITY_CONFIG = {
    jwtSecret: 'security-test-jwt-secret',
    bcryptSaltRounds: 12,
    maxLoginAttempts: 5,
    lockoutDuration: 900000, // 15 minutes
    sessionTimeout: 3600000, // 1 heure
    maxPasswordAge: 7776000000, // 90 jours
    minPasswordLength: 8,
    rateLimitWindow: 60000, // 1 minute
    maxRequestsPerWindow: 100
};

// Middleware de sécurité à tester
const SecurityMiddleware = {
    // Authentification JWT
    authenticateJWT: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Token manquant' });
        }

        const token = authHeader.substring(7);
        try {
            const decoded = jwt.verify(token, SECURITY_CONFIG.jwtSecret);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ success: false, error: 'Token invalide ou expiré' });
        }
    },

    // Validation des permissions
    requirePermission: (permission) => {
        return (req, res, next) => {
            if (!req.user || !req.user.permissions || !req.user.permissions.includes(permission)) {
                return res.status(403).json({ success: false, error: 'Permission insuffisante' });
            }
            next();
        };
    },

    // Rate limiting par IP
    rateLimit: () => {
        const requests = new Map();
        
        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            const windowStart = now - SECURITY_CONFIG.rateLimitWindow;
            
            if (!requests.has(ip)) {
                requests.set(ip, []);
            }
            
            const userRequests = requests.get(ip);
            // Nettoyer les anciennes requêtes
            const recentRequests = userRequests.filter(time => time > windowStart);
            
            if (recentRequests.length >= SECURITY_CONFIG.maxRequestsPerWindow) {
                return res.status(429).json({
                    success: false,
                    error: 'Trop de requêtes',
                    retryAfter: Math.ceil((recentRequests[0] - windowStart) / 1000)
                });
            }
            
            recentRequests.push(now);
            requests.set(ip, recentRequests);
            next();
        };
    },

    // Validation des entrées
    validateInput: (req, res, next) => {
        const dangerousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /union\s+select/gi,
            /drop\s+table/gi,
            /insert\s+into/gi,
            /update\s+set/gi,
            /delete\s+from/gi
        ];

        const checkObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    for (const pattern of dangerousPatterns) {
                        if (pattern.test(obj[key])) {
                            throw new Error(`Input potentiellement dangereux détecté: ${pattern.source}`);
                        }
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    checkObject(obj[key]);
                }
            }
        };

        try {
            if (req.body) checkObject(req.body);
            if (req.query) checkObject(req.query);
            if (req.params) checkObject(req.params);
            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Données d\'entrée invalides',
                details: error.message
            });
        }
    },

    // Protection CSRF
    csrfProtection: (req, res, next) => {
        const method = req.method.toUpperCase();
        
        // Skip pour GET, HEAD, OPTIONS
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            return next();
        }

        const csrfToken = req.headers['x-csrf-token'];
        const sessionToken = req.session?.csrfToken;

        if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
            return res.status(403).json({
                success: false,
                error: 'Token CSRF manquant ou invalide'
            });
        }

        next();
    },

    // Protection des headers
    securityHeaders: (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        next();
    }
};

// Application Express de test
const createSecurityTestApp = () => {
    const app = express();
    
    // Middlewares de base
    app.use(express.json());
    app.use(SecurityMiddleware.securityHeaders);
    
    // Routes de test avec différents niveaux de sécurité
    const router = express.Router();
    
    // Route publique
    router.get('/public', (req, res) => {
        res.json({ message: 'Endpoint public', timestamp: Date.now() });
    });
    
    // Route avec authentification uniquement
    router.get('/authenticated', 
        SecurityMiddleware.authenticateJWT,
        (req, res) => {
            res.json({ 
                message: 'Endpoint authentifié', 
                user: req.user.username,
                timestamp: Date.now() 
            });
        }
    );
    
    // Route avec permission spécifique
    router.get('/admin',
        SecurityMiddleware.authenticateJWT,
        SecurityMiddleware.requirePermission('admin'),
        (req, res) => {
            res.json({ 
                message: 'Endpoint administrateur', 
                user: req.user.username,
                timestamp: Date.now() 
            });
        }
    );
    
    // Route avec rate limiting
    router.get('/rate-limited',
        SecurityMiddleware.rateLimit(),
        SecurityMiddleware.authenticateJWT,
        (req, res) => {
            res.json({ 
                message: 'Endpoint avec rate limiting', 
                timestamp: Date.now() 
            });
        }
    );
    
    // Route avec validation d'entrée
    router.post('/validate-input',
        SecurityMiddleware.authenticateJWT,
        SecurityMiddleware.validateInput,
        (req, res) => {
            res.json({ 
                message: 'Données validées', 
                data: req.body,
                timestamp: Date.now() 
            });
        }
    );
    
    // Route avec protection CSRF
    router.post('/csrf-protected',
        SecurityMiddleware.authenticateJWT,
        SecurityMiddleware.csrfProtection,
        (req, res) => {
            res.json({ 
                message: 'Requête CSRF protégée', 
                timestamp: Date.now() 
            });
        }
    );
    
    // Route avec toutes les protections
    router.post('/fully-protected',
        SecurityMiddleware.rateLimit(),
        SecurityMiddleware.authenticateJWT,
        SecurityMiddleware.requirePermission('write'),
        SecurityMiddleware.validateInput,
        SecurityMiddleware.csrfProtection,
        (req, res) => {
            res.json({ 
                message: 'Endpoint complètement protégé', 
                user: req.user.username,
                timestamp: Date.now() 
            });
        }
    );
    
    app.use('/test', router);
    
    return app;
};

// Utilitaires de test
const TestUtils = {
    // Génère un token JWT valide
    generateValidToken: (userData = {}) => {
        const defaultUser = {
            username: 'testuser',
            role: 'user',
            permissions: ['read']
        };
        return jwt.sign({ ...defaultUser, ...userData }, SECURITY_CONFIG.jwtSecret, {
            expiresIn: '1h'
        });
    },
    
    // Génère un token JWT invalide
    generateInvalidToken: () => {
        return 'invalid.token.here';
    },
    
    // Génère un token JWT expiré
    generateExpiredToken: () => {
        return jwt.sign(
            { username: 'expired', role: 'user', permissions: ['read'] },
            SECURITY_CONFIG.jwtSecret,
            { expiresIn: '-1h' }
        );
    },
    
    // Génère des données malveillantes pour tests
    generateMaliciousPayload: (type) => {
        const payloads = {
            xss: '<script>alert("XSS")</script>',
            sql: "'; DROP TABLE users; --",
            command: '&& rm -rf /',
            path: '../../../etc/passwd',
            template: '{{constructor.constructor("return process")().exit()}}'
        };
        return payloads[type] || payloads.xss;
    }
};

// Suite de tests
describe('Backend Security Tests', () => {
    let app;

    beforeEach(() => {
        app = createSecurityTestApp();
        // Reset des compteurs de rate limiting
        global.requests = new Map();
    });

    describe('JWT Authentication Security', () => {
        test('devrait accepter un token JWT valide', async () => {
            const token = TestUtils.generateValidToken({ username: 'admin', role: 'admin' });
            
            const response = await request(app)
                .get('/test/authenticated')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBeUndefined();
            expect(response.body.message).toBe('Endpoint authentifié');
            expect(response.body.user).toBe('admin');
        });

        test('devrait refuser un token JWT malformé', async () => {
            const invalidToken = TestUtils.generateInvalidToken();
            
            const response = await request(app)
                .get('/test/authenticated')
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Token');
        });

        test('devrait refuser un token JWT expiré', async () => {
            const expiredToken = TestUtils.generateExpiredToken();
            
            const response = await request(app)
                .get('/test/authenticated')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('expiré');
        });

        test('devrait refuser une requête sans token', async () => {
            const response = await request(app)
                .get('/test/authenticated')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('ne devrait pas révéler d\'informations dans les erreurs JWT', async () => {
            const maliciousToken = Buffer.from('malicious').toString('base64');
            
            const response = await request(app)
                .get('/test/authenticated')
                .set('Authorization', `Bearer ${maliciousToken}`)
                .expect(401);

            // L'erreur ne devrait pas révéler de détails techniques
            const errorStr = JSON.stringify(response.body);
            expect(errorStr).not.toContain('secret');
            expect(errorStr).not.toContain('algorithm');
            expect(errorStr).not.toContain('Malformed');
        });
    });

    describe('Authorization & Permissions', () => {
        const adminToken = TestUtils.generateValidToken({
            username: 'admin',
            role: 'admin',
            permissions: ['admin', 'write', 'read']
        });

        const userToken = TestUtils.generateValidToken({
            username: 'user',
            role: 'user',
            permissions: ['read']
        });

        test('devrait autoriser l\'accès admin avec les bonnes permissions', async () => {
            const response = await request(app)
                .get('/test/admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.message).toBe('Endpoint administrateur');
        });

        test('devrait refuser l\'accès admin sans permission admin', async () => {
            const response = await request(app)
                .get('/test/admin')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Permission');
        });

        test('devrait vérifier les permissions dynamiquement', async () => {
            const partialAdminToken = TestUtils.generateValidToken({
                username: 'partial_admin',
                role: 'admin',
                permissions: ['read'] // Pas de permission 'admin'
            });

            const response = await request(app)
                .get('/test/admin')
                .set('Authorization', `Bearer ${partialAdminToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Rate Limiting Security', () => {
        test('devrait limiter les requêtes répétées', async () => {
            const token = TestUtils.generateValidToken();
            const requests = [];
            
            // Envoyer plus de requêtes que la limite
            for (let i = 0; i < SECURITY_CONFIG.maxRequestsPerWindow + 5; i++) {
                requests.push(
                    request(app)
                        .get('/test/rate-limited')
                        .set('Authorization', `Bearer ${token}`)
                );
            }

            const responses = await Promise.all(requests);
            
            const successCount = responses.filter(r => r.status === 200).length;
            const rateLimitedCount = responses.filter(r => r.status === 429).length;
            
            expect(successCount).toBeLessThanOrEqual(SECURITY_CONFIG.maxRequestsPerWindow);
            expect(rateLimitedCount).toBeGreaterThan(0);
        });

        test('devrait distinguer les IPs différentes', async () => {
            const token = TestUtils.generateValidToken();
            
            // Simuler des IPs différentes
            const responses = [];
            for (let i = 0; i < 10; i++) {
                responses.push(
                    request(app)
                        .get('/test/rate-limited')
                        .set('Authorization', `Bearer ${token}`)
                        .set('X-Forwarded-For', `192.168.1.${i}`)
                );
            }

            const results = await Promise.all(responses);
            const successCount = results.filter(r => r.status === 200).length;
            
            // Toutes devraient réussir car IPs différentes
            expect(successCount).toBe(10);
        });

        test('devrait inclure retry-after dans la réponse de rate limiting', async () => {
            const token = TestUtils.generateValidToken();
            
            // Déclencher le rate limiting
            const requests = [];
            for (let i = 0; i < SECURITY_CONFIG.maxRequestsPerWindow + 1; i++) {
                requests.push(
                    request(app)
                        .get('/test/rate-limited')
                        .set('Authorization', `Bearer ${token}`)
                );
            }

            const responses = await Promise.all(requests);
            const rateLimitedResponse = responses.find(r => r.status === 429);
            
            expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
        });
    });

    describe('Input Validation & Injection Prevention', () => {
        const token = TestUtils.generateValidToken({ permissions: ['write'] });

        test('devrait bloquer les tentatives XSS', async () => {
            const maliciousData = {
                input: TestUtils.generateMaliciousPayload('xss')
            };

            const response = await request(app)
                .post('/test/validate-input')
                .set('Authorization', `Bearer ${token}`)
                .send(maliciousData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('dangereux');
        });

        test('devrait bloquer les injections SQL', async () => {
            const maliciousData = {
                query: TestUtils.generateMaliciousPayload('sql')
            };

            const response = await request(app)
                .post('/test/validate-input')
                .set('Authorization', `Bearer ${token}`)
                .send(maliciousData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('devrait bloquer les injections de commandes', async () => {
            const maliciousData = {
                command: TestUtils.generateMaliciousPayload('command')
            };

            const response = await request(app)
                .post('/test/validate-input')
                .set('Authorization', `Bearer ${token}`)
                .send(maliciousData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('devrait bloquer les tentatives de traversal de chemin', async () => {
            const maliciousData = {
                file: TestUtils.generateMaliciousPayload('path')
            };

            const response = await request(app)
                .post('/test/validate-input')
                .set('Authorization', `Bearer ${token}`)
                .send(maliciousData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('devrait valider les objets imbriqués', async () => {
            const maliciousData = {
                user: {
                    name: TestUtils.generateMaliciousPayload('xss'),
                    metadata: {
                        description: TestUtils.generateMaliciousPayload('sql')
                    }
                }
            };

            const response = await request(app)
                .post('/test/validate-input')
                .set('Authorization', `Bearer ${token}`)
                .send(maliciousData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('devrait accepter les données légitimes', async () => {
            const legitimateData = {
                username: 'john_doe',
                email: 'john@example.com',
                description: 'Utilisateur normal sans contenu malveillant'
            };

            const response = await request(app)
                .post('/test/validate-input')
                .set('Authorization', `Bearer ${token}`)
                .send(legitimateData)
                .expect(200);

            expect(response.body.message).toBe('Données validées');
        });
    });

    describe('CSRF Protection', () => {
        const token = TestUtils.generateValidToken();

        test('devrait bloquer les requêtes POST sans token CSRF', async () => {
            const response = await request(app)
                .post('/test/csrf-protected')
                .set('Authorization', `Bearer ${token}`)
                .send({ data: 'test' })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('CSRF');
        });

        test('devrait bloquer les requêtes POST avec token CSRF invalide', async () => {
            const response = await request(app)
                .post('/test/csrf-protected')
                .set('Authorization', `Bearer ${token}`)
                .set('X-CSRF-Token', 'invalid-token')
                .send({ data: 'test' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('ne devrait pas bloquer les requêtes GET sans token CSRF', async () => {
            const response = await request(app)
                .get('/test/authenticated')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.message).toBe('Endpoint authentifié');
        });
    });

    describe('Security Headers', () => {
        const token = TestUtils.generateValidToken();

        test('devrait inclure X-Content-Type-Options', async () => {
            const response = await request(app)
                .get('/test/public')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });

        test('devrait inclure X-Frame-Options', async () => {
            const response = await request(app)
                .get('/test/public')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.headers['x-frame-options']).toBe('DENY');
        });

        test('devrait inclure X-XSS-Protection', async () => {
            const response = await request(app)
                .get('/test/public')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        });

        test('devrait inclure Strict-Transport-Security en HTTPS', async () => {
            // Note: Ce test simule HTTPS
            const response = await request(app)
                .get('/test/public')
                .set('Authorization', `Bearer ${token}`)
                .set('X-Forwarded-Proto', 'https')
                .expect(200);

            expect(response.headers['strict-transport-security']).toContain('max-age=');
        });

        test('devrait inclure Content-Security-Policy', async () => {
            const response = await request(app)
                .get('/test/public')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.headers['content-security-policy']).toBeDefined();
            expect(response.headers['content-security-policy']).toContain('default-src');
        });
    });

    describe('Comprehensive Security Stack', () => {
        test('devrait appliquer toutes les protections ensemble', async () => {
            const token = TestUtils.generateValidToken({
                username: 'secure_user',
                role: 'user',
                permissions: ['write']
            });

            // Simuler une session avec token CSRF valide
            const csrfToken = 'valid-csrf-token-12345';
            
            const response = await request(app)
                .post('/test/fully-protected')
                .set('Authorization', `Bearer ${token}`)
                .set('X-CSRF-Token', csrfToken)
                .send({
                    data: 'legitimate data',
                    user: 'secure_user'
                })
                .expect(200);

            expect(response.body.message).toBe('Endpoint complètement protégé');
            expect(response.body.user).toBe('secure_user');
        });

        test('devrait échouer si une seule protection est contournée', async () => {
            const token = TestUtils.generateValidToken({
                username: 'insecure_user',
                role: 'user',
                permissions: ['write']
            });

            const csrfToken = 'valid-csrf-token-12345';
            const maliciousData = {
                input: TestUtils.generateMaliciousPayload('xss')
            };

            // Doit échouer à cause de la validation d'entrée
            const response = await request(app)
                .post('/test/fully-protected')
                .set('Authorization', `Bearer ${token}`)
                .set('X-CSRF-Token', csrfToken)
                .send(maliciousData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('dangereux');
        });
    });

    describe('Error Handling Security', () => {
        test('ne devrait pas exposer d\'informations sensibles dans les erreurs', async () => {
            // Tester différentes erreurs
            const errorTests = [
                { path: '/test/nonexistent', token: TestUtils.generateValidToken() },
                { path: '/test/admin', token: TestUtils.generateValidToken() }, // Pas d'admin permission
                { path: '/test/validate-input', token: 'invalid-token' }
            ];

            for (const test of errorTests) {
                const response = await request(app)
                    .get(test.path)
                    .set('Authorization', `Bearer ${test.token}`)
                    .expect(test.path.includes('nonexistent') ? 404 : 
                           test.path.includes('admin') ? 403 : 401);

                const errorStr = JSON.stringify(response.body);
                
                // Vérifications de sécurité
                expect(errorStr).not.toContain('stack');
                expect(errorStr).not.toContain('SQL');
                expect(errorStr).not.toContain('database');
                expect(errorStr).not.toContain('secret');
                expect(errorStr).not.toContain('config');
            }
        });

        test('devrait masquer les détails techniques en production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const response = await request(app)
                .get('/test/admin')
                .set('Authorization', `Bearer ${TestUtils.generateValidToken()}`)
                .expect(403);

            // En production, les détails ne devraient pas être exposés
            expect(response.body.stack).toBeUndefined();
            expect(response.body.details).toBeUndefined();
            expect(response.body.internalError).toBeUndefined();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Performance & DoS Protection', () => {
        test('devrait gérer les payloads volumineux', async () => {
            const token = TestUtils.generateValidToken({ permissions: ['write'] });
            const largePayload = {
                data: 'x'.repeat(1000000), // 1MB de données
                metadata: {
                    description: 'Large payload test'
                }
            };

            const startTime = Date.now();
            const response = await request(app)
                .post('/test/validate-input')
                .set('Authorization', `Bearer ${token}`)
                .send(largePayload)
                .expect(413); // Payload too large

            const processingTime = Date.now() - startTime;
            
            // Ne devrait pas prendre trop de temps
            expect(processingTime).toBeLessThan(5000); // 5 secondes max
            
            expect(response.body.success).toBe(false);
        });

        test('devrait limiter la profondeur des objets imbriqués', async () => {
            const token = TestUtils.generateValidToken({ permissions: ['write'] });
            
            // Créer un objet très imbriqué
            let deeplyNested = { data: 'value' };
            for (let i = 0; i < 50; i++) {
                deeplyNested = { level: i, nested: deeplyNested };
            }

            const startTime = Date.now();
            const response = await request(app)
                .post('/test/validate-input')
                .set('Authorization', `Bearer ${token}`)
                .send({ deeplyNested })
                .expect(400);

            const processingTime = Date.now() - startTime;
            
            // Ne devrait pas prendre trop de temps à valider
            expect(processingTime).toBeLessThan(2000); // 2 secondes max
            
            expect(response.body.success).toBe(false);
        });
    });

    describe('Session Management Security', () => {
        test('devrait invalider les tokens avec claims modifiés', async () => {
            // Token avec claims invalides ou suspects
            const suspiciousToken = jwt.sign(
                {
                    username: 'user',
                    role: 'admin',
                    permissions: ['admin', 'write', 'delete'],
                    // Claim suspect: timestamp futur anormal
                    iat: Math.floor(Date.now() / 1000) - 86400, // Il y a 1 jour
                    exp: Math.floor(Date.now() / 1000) + 86400 * 365 // Dans 1 an (trop long)
                },
                SECURITY_CONFIG.jwtSecret
            );

            const response = await request(app)
                .get('/test/admin')
                .set('Authorization', `Bearer ${suspiciousToken}`)
                .expect(403); // Devrait être refusé

            expect(response.body.success).toBe(false);
        });

        test('devrait gérer les tokens avec des permissions excessives', async () => {
            const excessiveToken = jwt.sign(
                {
                    username: 'user',
                    role: 'user',
                    permissions: [
                        'read', 'write', 'delete', 'admin', 'super_admin',
                        'system_admin', 'root', 'god_mode', 'all_permissions'
                    ]
                },
                SECURITY_CONFIG.jwtSecret
            );

            const response = await request(app)
                .get('/test/admin')
                .set('Authorization', `Bearer ${excessiveToken}`)
                .expect(403); // Devrait être refusé car rôle ne correspond pas

            expect(response.body.success).toBe(false);
        });
    });
});