#!/usr/bin/env node

/**
 * Script de validation des permissions backend RDS Viewer Anecoop
 * Vérification complète de la sécurité des API et des permissions
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');

// Configuration
const CONFIG = {
    baseUrl: 'http://localhost:3001',
    jwtSecret: 'production-jwt-secret-key-rds-viewer',
    testTimeout: 30000,
    apiPrefix: '/api',
    
    // Rôles et permissions de test
    roles: {
        admin: {
            permissions: ['read', 'write', 'delete', 'manage_users', 'system_admin'],
            rateLimit: 1000
        },
        manager: {
            permissions: ['read', 'write', 'manage_team'],
            rateLimit: 500
        },
        technician: {
            permissions: ['read', 'write'],
            rateLimit: 200
        },
        viewer: {
            permissions: ['read'],
            rateLimit: 100
        }
    },

    // Endpoints à tester
    endpoints: {
        public: ['/health', '/version'],
        authenticated: ['/stats', '/profile'],
        userManagement: ['/users', '/users/:id'],
        teamManagement: ['/team', '/team/:id'],
        systemAdmin: ['/system/logs', '/system/config']
    },

    // Risques de sécurité à vérifier
    securityRisks: [
        'injection_sql',
        'xss',
        'csrf',
        'token_hijacking',
        'privilege_escalation',
        'rate_limit_bypass',
        'information_disclosure',
        'session_fixation'
    ]
};

// Données de test
const testUsers = {
    admin: {
        username: 'admin_validation',
        role: 'admin',
        password: 'AdminPass123!',
        permissions: CONFIG.roles.admin.permissions
    },
    manager: {
        username: 'manager_validation',
        role: 'manager',
        password: 'ManagerPass123!',
        permissions: CONFIG.roles.manager.permissions
    },
    technician: {
        username: 'technician_validation',
        role: 'technician',
        password: 'TechPass123!',
        permissions: CONFIG.roles.technician.permissions
    },
    viewer: {
        username: 'viewer_validation',
        role: 'viewer',
        password: 'ViewerPass123!',
        permissions: CONFIG.roles.viewer.permissions
    }
};

// Résultats de validation
const validationResults = {
    timestamp: new Date().toISOString(),
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    criticalIssues: [],
    warnings: [],
    recommendations: [],
    securityScore: 0,
    details: {}
};

// Générateur de tokens de test
function generateTestToken(userData) {
    return jwt.sign(
        {
            username: userData.username,
            role: userData.role,
            permissions: userData.permissions,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600 // 1 heure
        },
        CONFIG.jwtSecret
    );
}

// Test d'authentification
async function testAuthentication(endpoint, token, expectedStatus = 200) {
    try {
        const response = await request(CONFIG.baseUrl)
            .get(`${CONFIG.apiPrefix}${endpoint}`)
            .set('Authorization', `Bearer ${token}`)
            .timeout(CONFIG.testTimeout)
            .expect(expectedStatus);

        validationResults.testsRun++;
        if (response.status === expectedStatus) {
            validationResults.testsPassed++;
            return true;
        } else {
            validationResults.testsFailed++;
            validationResults.criticalIssues.push({
                type: 'AUTHENTICATION_BYPASS',
                endpoint,
                expected: expectedStatus,
                actual: response.status,
                severity: 'CRITICAL'
            });
            return false;
        }
    } catch (error) {
        validationResults.testsRun++;
        validationResults.testsFailed++;
        validationResults.criticalIssues.push({
            type: 'CONNECTION_ERROR',
            endpoint,
            error: error.message,
            severity: 'HIGH'
        });
        return false;
    }
}

// Test de validation des permissions
async function testAuthorization(endpoint, role, permission, shouldPass = true) {
    const token = generateTestToken(testUsers[role]);
    
    try {
        const response = await request(CONFIG.baseUrl)
            .get(`${CONFIG.apiPrefix}${endpoint}`)
            .set('Authorization', `Bearer ${token}`)
            .timeout(CONFIG.testTimeout);

        const passed = shouldPass ? response.status === 200 : response.status === 403;
        
        validationResults.testsRun++;
        if (passed) {
            validationResults.testsPassed++;
        } else {
            validationResults.testsFailed++;
            validationResults.criticalIssues.push({
                type: 'AUTHORIZATION_BYPASS',
                endpoint,
                role,
                permission,
                shouldPass,
                actualStatus: response.status,
                severity: 'CRITICAL'
            });
        }
        
        return passed;
    } catch (error) {
        validationResults.testsRun++;
        validationResults.testsFailed++;
        validationResults.warnings.push({
            type: 'TEST_EXECUTION_ERROR',
            endpoint,
            error: error.message
        });
        return false;
    }
}

// Test des attaques par injection
async function testInjectionAttacks(endpoint, token) {
    const injectionPayloads = [
        "<script>alert('xss')</script>",
        "'; DROP TABLE users; --",
        "admin' OR '1'='1",
        "../../etc/passwd",
        "{{constructor.constructor('return process.env')()}}"
    ];

    let injectionTestsPassed = 0;
    
    for (const payload of injectionPayloads) {
        try {
            const response = await request(CONFIG.baseUrl)
                .post(`${CONFIG.apiPrefix}${endpoint}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ query: payload, search: payload, input: payload })
                .timeout(CONFIG.testTimeout);

            validationResults.testsRun++;
            
            // Vérifier que le payload n'est pas exécuté
            const responseText = JSON.stringify(response.body);
            const payloadExecuted = responseText.includes('process.env') || 
                                   responseText.includes('DROP TABLE') ||
                                   responseText.includes('<script>');

            if (!payloadExecuted && response.status !== 500) {
                injectionTestsPassed++;
                validationResults.testsPassed++;
            } else {
                validationResults.testsFailed++;
                validationResults.criticalIssues.push({
                    type: 'INJECTION_VULNERABILITY',
                    endpoint,
                    payload,
                    response: response.body,
                    severity: 'CRITICAL'
                });
            }
        } catch (error) {
            validationResults.testsRun++;
            validationResults.testsFailed++;
            validationResults.warnings.push({
                type: 'INJECTION_TEST_ERROR',
                endpoint,
                payload,
                error: error.message
            });
        }
    }

    return injectionTestsPassed === injectionPayloads.length;
}

// Test du rate limiting
async function testRateLimiting(role, endpoint, limit) {
    const token = generateTestToken(testUsers[role]);
    const requests = [];
    
    // Envoyer plus de requêtes que la limite
    const requestCount = limit + 10;
    
    for (let i = 0; i < requestCount; i++) {
        requests.push(
            request(CONFIG.baseUrl)
                .get(`${CONFIG.apiPrefix}${endpoint}`)
                .set('Authorization', `Bearer ${token}`)
                .timeout(5000) // Timeout plus court pour les tests de rate limiting
        );
    }

    try {
        const responses = await Promise.all(requests);
        const successCount = responses.filter(r => r.status === 200).length;
        const rateLimitedCount = responses.filter(r => r.status === 429).length;
        
        validationResults.testsRun++;
        
        if (successCount <= limit && rateLimitedCount > 0) {
            validationResults.testsPassed++;
            return true;
        } else {
            validationResults.testsFailed++;
            validationResults.criticalIssues.push({
                type: 'RATE_LIMIT_BYPASS',
                role,
                endpoint,
                limit,
                allowed: successCount,
                rateLimited: rateLimitedCount,
                severity: 'HIGH'
            });
            return false;
        }
    } catch (error) {
        validationResults.testsRun++;
        validationResults.testsFailed++;
        validationResults.warnings.push({
            type: 'RATE_LIMIT_TEST_ERROR',
            role,
            endpoint,
            error: error.message
        });
        return false;
    }
}

// Test des tokens JWT
async function testJWTSecurity() {
    const tests = [
        {
            name: 'Token expiré',
            token: jwt.sign(
                { username: 'test', role: 'admin', permissions: ['read'] },
                CONFIG.jwtSecret,
                { expiresIn: '-1h' }
            ),
            shouldFail: true
        },
        {
            name: 'Token malformé',
            token: 'malformed.token.here',
            shouldFail: true
        },
        {
            name: 'Signature invalide',
            token: jwt.sign(
                { username: 'test', role: 'admin', permissions: ['read'] },
                'wrong-secret',
                { expiresIn: '1h' }
            ),
            shouldFail: true
        },
        {
            name: 'Claims manquants',
            token: jwt.sign({}, CONFIG.jwtSecret, { expiresIn: '1h' }),
            shouldFail: true
        }
    ];

    let jwtTestsPassed = 0;
    
    for (const test of tests) {
        try {
            const response = await request(CONFIG.baseUrl)
                .get(`${CONFIG.apiPrefix}/stats`)
                .set('Authorization', `Bearer ${test.token}`)
                .timeout(CONFIG.testTimeout);

            validationResults.testsRun++;
            
            const failedAsExpected = test.shouldFail && response.status === 401;
            const passedAsExpected = !test.shouldFail && response.status === 200;
            
            if (failedAsExpected || passedAsExpected) {
                jwtTestsPassed++;
                validationResults.testsPassed++;
            } else {
                validationResults.testsFailed++;
                validationResults.criticalIssues.push({
                    type: 'JWT_SECURITY_ISSUE',
                    test: test.name,
                    expectedToFail: test.shouldFail,
                    actualStatus: response.status,
                    severity: 'CRITICAL'
                });
            }
        } catch (error) {
            validationResults.testsRun++;
            validationResults.testsFailed++;
            validationResults.warnings.push({
                type: 'JWT_TEST_ERROR',
                test: test.name,
                error: error.message
            });
        }
    }

    return jwtTestsPassed === tests.length;
}

// Test des en-têtes de sécurité
async function testSecurityHeaders(endpoint, token) {
    try {
        const response = await request(CONFIG.baseUrl)
            .get(`${CONFIG.apiPrefix}${endpoint}`)
            .set('Authorization', `Bearer ${token}`)
            .timeout(CONFIG.testTimeout);

        const requiredHeaders = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security'
        ];

        validationResults.testsRun++;
        
        const missingHeaders = requiredHeaders.filter(header => 
            !response.headers[header.toLowerCase()]
        );

        if (missingHeaders.length === 0) {
            validationResults.testsPassed++;
            return true;
        } else {
            validationResults.testsFailed++;
            validationResults.warnings.push({
                type: 'MISSING_SECURITY_HEADERS',
                endpoint,
                missingHeaders,
                severity: 'MEDIUM'
            });
            return false;
        }
    } catch (error) {
        validationResults.testsRun++;
        validationResults.testsFailed++;
        validationResults.warnings.push({
            type: 'SECURITY_HEADERS_TEST_ERROR',
            endpoint,
            error: error.message
        });
        return false;
    }
}

// Générateur de rapport
function generateReport() {
    validationResults.securityScore = Math.round(
        (validationResults.testsPassed / validationResults.testsRun) * 100
    );

    // Recommandations basées sur les résultats
    if (validationResults.criticalIssues.length > 0) {
        validationResults.recommendations.push(
            'CRITIQUE: Corriger immédiatement les vulnérabilités de sécurité détectées'
        );
    }
    
    if (validationResults.testsPassed / validationResults.testsRun < 0.8) {
        validationResults.recommendations.push(
            'IMPORTANT: Améliorer la robustesse du système de permissions'
        );
    }

    if (validationResults.warnings.length > 0) {
        validationResults.recommendations.push(
            'INFO: Examiner les avertissements pour améliorer la sécurité'
        );
    }

    return validationResults;
}

// Fonction principale de validation
async function runPermissionValidation() {
    console.log('🔐 Démarrage de la validation des permissions backend RDS Viewer...\n');

    try {
        // 1. Test d'authentification de base
        console.log('1. Test d\'authentification...');
        for (const role of Object.keys(testUsers)) {
            const token = generateTestToken(testUsers[role]);
            await testAuthentication('/stats', token, 200);
        }

        // 2. Test des autorisations par rôle
        console.log('2. Test des autorisations...');
        await testAuthorization('/users', 'viewer', 'manage_users', false);
        await testAuthorization('/users', 'admin', 'manage_users', true);
        await testAuthorization('/team', 'viewer', 'manage_team', false);
        await testAuthorization('/team', 'manager', 'manage_team', true);

        // 3. Test des injections
        console.log('3. Test des vulnérabilités d\'injection...');
        const adminToken = generateTestToken(testUsers.admin);
        await testInjectionAttacks('/search', adminToken);

        // 4. Test du rate limiting
        console.log('4. Test du rate limiting...');
        for (const [role, config] of Object.entries(CONFIG.roles)) {
            await testRateLimiting(role, '/stats', config.rateLimit);
        }

        // 5. Test de sécurité JWT
        console.log('5. Test de sécurité JWT...');
        await testJWTSecurity();

        // 6. Test des en-têtes de sécurité
        console.log('6. Test des en-têtes de sécurité...');
        await testSecurityHeaders('/stats', adminToken);

        // Générer et sauvegarder le rapport
        const report = generateReport();
        const reportPath = path.join(__dirname, '..', 'docs', 'VALIDATION_PERMISSIONS_BACKEND_REPORT.json');
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 Rapport de validation généré:', reportPath);
        console.log(`Score de sécurité: ${report.securityScore}%`);
        console.log(`Tests passés: ${report.testsPassed}/${report.testsRun}`);
        console.log(`Issues critiques: ${report.criticalIssues.length}`);
        console.log(`Avertissements: ${report.warnings.length}`);

        // Code de sortie basé sur les résultats
        if (report.criticalIssues.length > 0 || report.securityScore < 70) {
            console.log('\n❌ VALIDATION ÉCHOUÉE - Problèmes de sécurité détectés');
            process.exit(1);
        } else {
            console.log('\n✅ VALIDATION RÉUSSIE - Système de permissions sécurisé');
            process.exit(0);
        }

    } catch (error) {
        console.error('❌ Erreur lors de la validation:', error);
        validationResults.criticalIssues.push({
            type: 'VALIDATION_SCRIPT_ERROR',
            error: error.message,
            severity: 'CRITICAL'
        });
        process.exit(1);
    }
}

// Exécution si appelé directement
if (require.main === module) {
    runPermissionValidation();
}

module.exports = {
    runPermissionValidation,
    generateTestToken,
    testAuthentication,
    testAuthorization,
    testInjectionAttacks,
    testRateLimiting,
    testJWTSecurity,
    testSecurityHeaders,
    generateReport
};