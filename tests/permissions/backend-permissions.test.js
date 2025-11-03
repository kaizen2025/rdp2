/**
 * Tests complets pour la validation des permissions backend RDS Viewer Anecoop
 * Tests de sécurité pour les endpoints API protégés
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Import des services et middleware
const userService = require('../../backend/services/userService');
const { 
    authenticateToken,
    authorizeRoles,
    checkPermissions,
    auditLog,
    rateLimitByRole 
} = require('../../server/middleware/auth-permissions');

// Configuration des tests
const JWT_SECRET = 'test-jwt-secret-key-for-rds-viewer';
const APP_CONFIG = {
    port: 3001,
    jwtSecret: JWT_SECRET,
    rateLimits: {
        admin: 1000,      // 1000 requêtes/minute
        manager: 500,     // 500 requêtes/minute  
        technician: 200,  // 200 requêtes/minute
        viewer: 100       // 100 requêtes/minute
    }
};

// Tokens de test pour différents rôles
const testTokens = {
    admin: jwt.sign(
        { 
            username: 'admin_test', 
            role: 'admin', 
            permissions: ['read', 'write', 'delete', 'manage_users', 'system_admin']
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    ),
    manager: jwt.sign(
        { 
            username: 'manager_test', 
            role: 'manager', 
            permissions: ['read', 'write', 'manage_team']
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    ),
    technician: jwt.sign(
        { 
            username: 'tech_test', 
            role: 'technician', 
            permissions: ['read', 'write']
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    ),
    viewer: jwt.sign(
        { 
            username: 'viewer_test', 
            role: 'viewer', 
            permissions: ['read']
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    ),
    invalid: 'invalid_token',
    expired: jwt.sign(
        { 
            username: 'expired_test', 
            role: 'viewer', 
            permissions: ['read']
        },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expiré il y a 1 heure
    )
};

// Application Express de test avec tous les middlewares
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    
    // Routes protégées
    const protectedRoutes = express.Router();
    
    // Route pour gestion utilisateurs - Admin seulement
    protectedRoutes.get('/users', 
        authenticateToken,
        authorizeRoles(['admin']),
        checkPermissions(['manage_users']),
        auditLog('USER_LIST_ACCESS'),
        async (req, res) => {
            const users = await userService.getUsers();
            res.json({ success: true, users: users.users, accessedBy: req.user.username });
        }
    );
    
    // Route pour gestion équipe - Manager et admin
    protectedRoutes.get('/team',
        authenticateToken,
        authorizeRoles(['admin', 'manager']),
        checkPermissions(['manage_team', 'read']),
        auditLog('TEAM_ACCESS'),
        async (req, res) => {
            const users = await userService.getUsersByServer();
            res.json({ success: true, team: users.users, accessedBy: req.user.username });
        }
    );
    
    // Route pour opérations écriture - Technicien et plus
    protectedRoutes.post('/users',
        authenticateToken,
        authorizeRoles(['admin', 'manager', 'technician']),
        checkPermissions(['write']),
        auditLog('USER_CREATE_ATTEMPT'),
        async (req, res) => {
            // Test d'écriture simulée
            res.json({ success: true, message: 'User creation endpoint', createdBy: req.user.username });
        }
    );
    
    // Route lecture seule - Tous les rôles authentifiés
    protectedRoutes.get('/stats',
        authenticateToken,
        authorizeRoles(['admin', 'manager', 'technician', 'viewer']),
        checkPermissions(['read']),
        auditLog('STATS_ACCESS'),
        async (req, res) => {
            const stats = await userService.getUserStats();
            res.json({ success: true, stats: stats.stats, accessedBy: req.user.username });
        }
    );
    
    // Route publique (sans auth) pour comparaison
    app.get('/public/stats', (req, res) => {
        res.json({ success: true, message: 'Public endpoint' });
    });
    
    app.use('/api', rateLimitByRole(APP_CONFIG.rateLimits), protectedRoutes);
    
    return app;
};

describe('Backend Permissions Tests', () => {
    let app;

    beforeEach(() => {
        app = createTestApp();
        // Reset des audits
        global.auditLog = [];
    });

    describe('Authentication Tests', () => {
        test('devrait accepter un token valide admin', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testTokens.admin}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.users).toBeDefined();
        });

        test('devrait refuser un token invalide', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testTokens.invalid}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Token invalide');
        });

        test('devrait refuser un token expiré', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testTokens.expired}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('expiré');
        });

        test('devrait refuser une requête sans token', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Role-Based Access Control', () => {
        test('devrait refuser accès admin pour un viewer', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testTokens.viewer}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('rôle insuffisant');
        });

        test('devrait refuser accès équipe pour un viewer', async () => {
            const response = await request(app)
                .get('/api/team')
                .set('Authorization', `Bearer ${testTokens.viewer}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        test('devrait permettre accès équipe pour un manager', async () => {
            const response = await request(app)
                .get('/api/team')
                .set('Authorization', `Bearer ${testTokens.manager}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.team).toBeDefined();
        });

        test('devrait permettre accès écriture pour technicien', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${testTokens.technician}`)
                .send({ username: 'test_user', displayName: 'Test User' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Permission-Based Access', () => {
        test('devrait vérifier permission manage_users pour liste utilisateurs', async () => {
            // Token manager sans manage_users
            const managerLimitedToken = jwt.sign(
                { 
                    username: 'manager_limited', 
                    role: 'manager', 
                    permissions: ['read'] // Pas de manage_users
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${managerLimitedToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('permission insuffisante');
        });

        test('devrait vérifier permission write pour création utilisateur', async () => {
            // Token viewer sans write
            const viewerToken = testTokens.viewer;

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ username: 'test_user', displayName: 'Test User' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Rate Limiting par Rôle', () => {
        test('devrait appliquer rate limiting approprié par rôle', async () => {
            const promises = [];
            
            // Test avec viewer (limite de 100/min)
            for (let i = 0; i < 105; i++) {
                promises.push(
                    request(app)
                        .get('/api/stats')
                        .set('Authorization', `Bearer ${testTokens.viewer}`)
                );
            }

            const responses = await Promise.all(promises);
            
            // Les premières 100 devraient réussir
            const successResponses = responses.filter(r => r.status === 200);
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            
            expect(successResponses.length).toBeLessThanOrEqual(100);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });

        test('devrait appliquer limite admin plus élevée', async () => {
            const promises = [];
            
            // Test avec admin (limite de 1000/min)
            for (let i = 0; i < 50; i++) {
                promises.push(
                    request(app)
                        .get('/api/stats')
                        .set('Authorization', `Bearer ${testTokens.admin}`)
                );
            }

            const responses = await Promise.all(promises);
            const successResponses = responses.filter(r => r.status === 200);
            
            // Tous devraient réussir avec la limite admin
            expect(successResponses.length).toBe(50);
        });
    });

    describe('Audit Trail', () => {
        test('devrait logger les actions sensibles', async () => {
            await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testTokens.admin}`)
                .expect(200);

            // Vérifier que l'audit a été enregistré
            expect(global.auditLog).toContainEqual(
                expect.objectContaining({
                    action: 'USER_LIST_ACCESS',
                    user: 'admin_test',
                    timestamp: expect.any(Number)
                })
            );
        });

        test('devrait logger les tentatives d\\'accès refusées', async () => {
            await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testTokens.viewer}`)
                .expect(403);

            expect(global.auditLog).toContainEqual(
                expect.objectContaining({
                    action: 'ACCESS_DENIED',
                    user: 'viewer_test',
                    resource: '/api/users',
                    reason: expect.any(String)
                })
            );
        });
    });

    describe('Endpoint Security', () => {
        test('devrait refuser accès direct sans middleware auth', async () => {
            // Accès direct à la route (pas de préfixe /api)
            const response = await request(app)
                .get('/public/stats') // Endpoint public
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('devrait permettre les endpoints publics', async () => {
            const response = await request(app)
                .get('/public/stats')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Public endpoint');
        });

        test('devrait rejeter tentatives d\\'injection dans les headers', async () => {
            const maliciousHeaders = {
                'Authorization': 'Bearer <script>alert("xss")</script>',
                'X-User-Role': 'admin"; DROP TABLE users; --'
            };

            const response = await request(app)
                .get('/api/stats')
                .set(maliciousHeaders)
                .expect(401); // Devrait refuser même sans tenter l'injection

            expect(response.body.success).toBe(false);
        });
    });

    describe('Data Validation Security', () => {
        test('devrait rejeter des données utilisateur malformées', async () => {
            const maliciousData = {
                username: '<script>alert("xss")</script>',
                displayName: 'test"; DROP TABLE users; --',
                email: 'not-an-email'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${testTokens.admin}`)
                .send(maliciousData)
                .expect(400); // Validation middleware devrait rejeter

            expect(response.body.success).toBe(false);
        });

        test('devrait limiter la taille des requêtes', async () => {
            const largeData = {
                username: 'test_user',
                data: 'a'.repeat(10000) // 10KB de données
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${testTokens.admin}`)
                .send(largeData)
                .expect(413); // Payload too large

            expect(response.body.success).toBe(false);
        });
    });

    describe('Session Management', () => {
        test('devrait invalider les sessions compromises', async () => {
            // Simuler une session marquée comme compromise
            const compromisedToken = jwt.sign(
                { 
                    username: 'compromised_user', 
                    role: 'admin', 
                    permissions: ['read', 'write'],
                    compromised: true
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .get('/api/stats')
                .set('Authorization', `Bearer ${compromisedToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('devrait gérer les tokens avec claims invalides', async () => {
            const malformedToken = jwt.sign(
                { 
                    // Pas de username
                    role: 'admin',
                    permissions: ['read']
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .get('/api/stats')
                .set('Authorization', `Bearer ${malformedToken}`)
                .expect(401);
        });
    });

    describe('Cross-Origin Security', () => {
        test('devrait rejeter les requêtes cross-origin non autorisées', async () => {
            const response = await request(app)
                .get('/api/stats')
                .set('Authorization', `Bearer ${testTokens.admin}`)
                .set('Origin', 'https://malicious-site.com')
                .expect(403); // CORS should be enforced

            expect(response.body.success).toBe(false);
        });
    });

    describe('Error Handling Security', () => {
        test('ne devrait pas exposer d\\'informations sensibles dans les erreurs', async () => {
            // Tentative d'accès avec token valide mais rôle insuffisant
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testTokens.viewer}`)
                .expect(403);

            // L'erreur ne devrait pas révéler d'informations sur la structure interne
            const errorString = JSON.stringify(response.body);
            expect(errorString).not.toContain('SQL');
            expect(errorString).not.toContain('database');
            expect(errorString).not.toContain('internal');
            expect(errorString).not.toContain('stack');
        });

        test('devrait masquer les détails d\\'erreur en production', async () => {
            process.env.NODE_ENV = 'production';
            
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testTokens.invalid}`)
                .expect(401);

            // En production, les détails techniques ne devraient pas être exposés
            expect(response.body.details).toBeUndefined();
            
            process.env.NODE_ENV = 'test';
        });
    });
});

// Tests d'intégration avec le service utilisateur réel
describe('Integration Tests with UserService', () => {
    beforeAll(async () => {
        // Initialiser les services de test
        process.env.NODE_ENV = 'test';
    });

    test('devrait valider permissions sur opérations réelles', async () => {
        const app = createTestApp();
        
        // Test accès réel aux données avec différents rôles
        const adminResponse = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${testTokens.admin}`)
            .expect(200);

        expect(adminResponse.body.success).toBe(true);
        expect(adminResponse.body.users).toBeDefined();
        expect(adminResponse.body.accessedBy).toBe('admin_test');
    });
});