/**
 * Configuration de test pour les permissions backend
 * Utilisé par les tests de validation des permissions
 */

module.exports = {
    // Configuration JWT pour les tests
    jwt: {
        secret: 'test-jwt-secret-key-for-rds-viewer',
        expiresIn: '3600', // 1 heure
        issuer: 'rds-viewer-test',
        audience: 'rds-viewer-api'
    },

    // Configuration de la base de données de test
    database: {
        testDbPath: './test-data/test.sqlite',
        backupDbPath: './test-data/test-backup.sqlite'
    },

    // Configuration des utilisateurs de test
    testUsers: {
        admin: {
            username: 'admin_test',
            password: 'AdminPass123!',
            role: 'admin',
            permissions: [
                'read', 'write', 'delete', 'manage_users', 
                'system_admin', 'audit_logs', 'configuration'
            ],
            displayName: 'Administrateur Test',
            email: 'admin@test.com',
            department: 'IT'
        },
        manager: {
            username: 'manager_test',
            password: 'ManagerPass123!',
            role: 'manager',
            permissions: ['read', 'write', 'manage_team', 'view_reports'],
            displayName: 'Manager Test',
            email: 'manager@test.com',
            department: 'Management'
        },
        technician: {
            username: 'tech_test',
            password: 'TechPass123!',
            role: 'technician',
            permissions: ['read', 'write', 'maintenance'],
            displayName: 'Technicien Test',
            email: 'tech@test.com',
            department: 'Support'
        },
        viewer: {
            username: 'viewer_test',
            password: 'ViewerPass123!',
            role: 'viewer',
            permissions: ['read'],
            displayName: 'Viewer Test',
            email: 'viewer@test.com',
            department: 'Viewer'
        }
    },

    // Endpoints à tester
    endpoints: {
        public: [
            { method: 'GET', path: '/health', description: 'Health check public' },
            { method: 'GET', path: '/version', description: 'Version endpoint' }
        ],
        authenticated: [
            { method: 'GET', path: '/api/stats', roles: ['admin', 'manager', 'technician', 'viewer'] },
            { method: 'GET', path: '/api/profile', roles: ['admin', 'manager', 'technician', 'viewer'] }
        ],
        userManagement: [
            { method: 'GET', path: '/api/users', roles: ['admin'], permissions: ['manage_users'] },
            { method: 'POST', path: '/api/users', roles: ['admin', 'manager', 'technician'], permissions: ['write'] },
            { method: 'PUT', path: '/api/users/:id', roles: ['admin'], permissions: ['write'] },
            { method: 'DELETE', path: '/api/users/:id', roles: ['admin'], permissions: ['delete'] }
        ],
        teamManagement: [
            { method: 'GET', path: '/api/team', roles: ['admin', 'manager'], permissions: ['manage_team'] },
            { method: 'GET', path: '/api/reports', roles: ['admin', 'manager'], permissions: ['view_reports'] },
            { method: 'POST', path: '/api/bulk', roles: ['admin', 'manager'], permissions: ['write'] }
        ],
        systemAdmin: [
            { method: 'GET', path: '/api/system/logs', roles: ['admin'], permissions: ['audit_logs'] },
            { method: 'GET', path: '/api/system/config', roles: ['admin'], permissions: ['configuration'] }
        ]
    },

    // Configuration des tests de sécurité
    securityTests: {
        injectionPayloads: {
            xss: [
                '<script>alert("XSS")</script>',
                '<img src=x onerror=alert("XSS")>',
                'javascript:alert("XSS")',
                '<svg onload=alert("XSS")>'
            ],
            sql: [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "admin' --",
                "' UNION SELECT * FROM users --"
            ],
            command: [
                '&& cat /etc/passwd',
                '| whoami',
                '; ls -la',
                '`id`'
            ],
            template: [
                '{{constructor.constructor("return process")().exit()}}',
                '${7*7}',
                '<% import os; os.system("id") %>'
            ],
            path: [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
                '....//....//....//etc/passwd'
            ]
        },

        maliciousHeaders: [
            { name: 'Authorization', value: 'Bearer <script>alert("XSS")</script>' },
            { name: 'X-Forwarded-For', value: '127.0.0.1"; DROP TABLE users; --' },
            { name: 'User-Agent', value: '<script>alert("XSS")</script>' },
            { name: 'X-Real-IP', value: '10.0.0.1\\nCookie: session=admin' }
        ],

        rateLimitTests: {
            viewer: 105, // Dépasser la limite de 100
            technician: 205, // Dépasser la limite de 200
            manager: 505, // Dépasser la limite de 500
            admin: 1005 // Dépasser la limite de 1000
        }
    },

    // Configuration des métriques de performance
    performanceTests: {
        payloadSizes: {
            small: 1024, // 1KB
            medium: 10240, // 10KB
            large: 102400, // 100KB
            huge: 1048576 // 1MB
        },
        concurrentUsers: {
            light: 10,
            moderate: 50,
            heavy: 100,
            extreme: 500
        },
        responseTimeThresholds: {
            excellent: 100, // 100ms
            good: 500, // 500ms
            acceptable: 1000, // 1s
            poor: 5000 // 5s
        }
    },

    // Configuration de l'audit
    audit: {
        enabled: true,
        retentionDays: 90,
        logLevel: 'INFO', // DEBUG, INFO, WARN, ERROR
        includeRequestBody: false, // Pour des raisons de sécurité
        includeResponseBody: false,
        sensitiveFields: ['password', 'token', 'secret', 'key']
    },

    // Configuration de la base de données simulée
    mockData: {
        users: [
            {
                id: 'user_1',
                username: 'alice',
                displayName: 'Alice Dubois',
                email: 'alice@example.com',
                department: 'Ventes',
                server: 'srv01',
                role: 'viewer',
                createdAt: '2024-01-01T00:00:00Z',
                lastLogin: '2024-11-03T10:30:00Z'
            },
            {
                id: 'user_2',
                username: 'bob',
                displayName: 'Bob Martin',
                email: 'bob@example.com',
                department: 'IT',
                server: 'srv01',
                role: 'technician',
                createdAt: '2024-01-15T00:00:00Z',
                lastLogin: '2024-11-04T08:15:00Z'
            },
            {
                id: 'user_3',
                username: 'carol',
                displayName: 'Carol Durand',
                email: 'carol@example.com',
                department: 'Management',
                server: 'srv02',
                role: 'manager',
                createdAt: '2024-02-01T00:00:00Z',
                lastLogin: '2024-11-04T09:00:00Z'
            }
        ],

        sessions: [
            {
                sessionId: 'sess_123456',
                userId: 'admin_test',
                createdAt: '2024-11-04T07:00:00Z',
                lastActivity: '2024-11-04T07:30:00Z',
                expiresAt: '2024-11-04T08:00:00Z',
                ip: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        ],

        auditLogs: [
            {
                timestamp: '2024-11-04T07:00:00Z',
                action: 'USER_LOGIN',
                user: 'admin_test',
                userRole: 'admin',
                ip: '192.168.1.100',
                result: 'SUCCESS',
                details: { method: 'password' }
            },
            {
                timestamp: '2024-11-04T07:05:00Z',
                action: 'USER_LIST_ACCESS',
                user: 'admin_test',
                userRole: 'admin',
                ip: '192.168.1.100',
                result: 'SUCCESS',
                details: { resource: '/api/users', recordCount: 150 }
            }
        ]
    }
};