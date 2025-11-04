/**
 * Configuration globale des tests de performance backend
 * @file config.js
 */

const path = require('path');

module.exports = {
    // Configuration des serveurs
    servers: {
        api: {
            baseUrl: process.env.API_BASE_URL || 'http://localhost:3002',
            port: process.env.API_PORT || 3002,
            timeout: 30000
        },
        websocket: {
            port: process.env.WS_PORT || 3003,
            timeout: 10000
        },
        database: {
            path: process.env.DB_PATH || path.join(__dirname, '../../data/rds_viewer_data.sqlite')
        }
    },

    // Configuration des tests de charge
    load: {
        durations: {
            short: 30,   // 30 secondes
            medium: 300, // 5 minutes
            long: 600    // 10 minutes
        },
        concurrency: {
            low: 10,
            medium: 50,
            high: 100,
            veryHigh: 200
        }
    },

    // Seuils de performance
    thresholds: {
        responseTime: {
            excellent: 100,  // ms
            good: 500,       // ms
            acceptable: 1000, // ms
            poor: 2000       // ms
        },
        throughput: {
            minimum: 100,   // req/s
            good: 500,      // req/s
            excellent: 1000 // req/s
        },
        errorRate: {
            maximum: 1,     // %
            good: 0.1,      // %
            excellent: 0.01 // %
        },
        memory: {
            warning: 500 * 1024 * 1024,  // 500MB
            critical: 1024 * 1024 * 1024 // 1GB
        },
        cpu: {
            warning: 70,    // %
            critical: 90    // %
        }
    },

    // Endpoints API à tester
    api: {
        endpoints: [
            // Endpoints de santé et configuration
            {
                path: '/api/health',
                method: 'GET',
                priority: 'critical',
                expectedStatus: 200
            },
            {
                path: '/api/status',
                method: 'GET',
                priority: 'high',
                expectedStatus: 200
            },
            {
                path: '/api/config',
                method: 'GET',
                priority: 'high',
                expectedStatus: 200
            },
            // Endpoints des techniciens
            {
                path: '/api/technicians/connected',
                method: 'GET',
                priority: 'high',
                expectedStatus: 200
            },
            // Endpoints des ordinateurs
            {
                path: '/api/computers',
                method: 'GET',
                priority: 'critical',
                expectedStatus: 200
            },
            // Endpoints des prêts
            {
                path: '/api/loans',
                method: 'GET',
                priority: 'critical',
                expectedStatus: 200
            },
            {
                path: '/api/loans/statistics',
                method: 'GET',
                priority: 'medium',
                expectedStatus: 200
            },
            // Endpoints des accessoires
            {
                path: '/api/accessories',
                method: 'GET',
                priority: 'medium',
                expectedStatus: 200
            },
            // Endpoints des notifications
            {
                path: '/api/notifications',
                method: 'GET',
                priority: 'medium',
                expectedStatus: 200
            },
            {
                path: '/api/notifications/unread',
                method: 'GET',
                priority: 'high',
                expectedStatus: 200
            },
            // Endpoints AD
            {
                path: '/api/ad/users/search/test',
                method: 'GET',
                priority: 'low',
                expectedStatus: 200
            },
            // Endpoints Excel
            {
                path: '/api/excel/users',
                method: 'GET',
                priority: 'medium',
                expectedStatus: 200
            },
            // Endpoints Chat
            {
                path: '/api/chat/channels',
                method: 'GET',
                priority: 'medium',
                expectedStatus: 200
            },
            // Endpoints IA
            {
                path: '/api/ai/health',
                method: 'GET',
                priority: 'high',
                expectedStatus: 200
            },
            {
                path: '/api/ai/documents',
                method: 'GET',
                priority: 'medium',
                expectedStatus: 200
            },
            {
                path: '/api/ai/settings',
                method: 'GET',
                priority: 'medium',
                expectedStatus: 200
            }
        ],
        
        // Tests POST/PUT/DELETE
        mutations: [
            {
                path: '/api/computers',
                method: 'POST',
                payload: {
                    name: 'PERF-TEST-' + Date.now(),
                    brand: 'Test Brand',
                    model: 'Test Model',
                    serialNumber: 'PERF-' + Math.random().toString(36).substr(2, 9),
                    status: 'available'
                },
                priority: 'medium',
                expectedStatus: 201,
                cleanup: true
            }
        ]
    },

    // Tests de base de données
    database: {
        connectionTests: {
            timeout: 5000
        },
        queryTests: [
            {
                name: 'List computers',
                sql: 'SELECT * FROM computers LIMIT 100',
                priority: 'critical',
                maxTime: 50
            },
            {
                name: 'List loans',
                sql: 'SELECT * FROM loans LIMIT 100',
                priority: 'critical',
                maxTime: 50
            },
            {
                name: 'Join loans with computers',
                sql: `
                    SELECT l.*, c.name as computerName, c.brand, c.model 
                    FROM loans l 
                    LEFT JOIN computers c ON l.computerId = c.id 
                    LIMIT 100
                `,
                priority: 'high',
                maxTime: 100
            },
            {
                name: 'Search by status',
                sql: 'SELECT * FROM computers WHERE status = ? LIMIT 50',
                params: ['available'],
                priority: 'high',
                maxTime: 30
            },
            {
                name: 'Complex aggregation',
                sql: `
                    SELECT 
                        status,
                        COUNT(*) as count,
                        AVG(
                            (julianday(COALESCE(actualReturnDate, date('now'))) - julianday(loanDate))
                        ) as avgDuration
                    FROM loans 
                    WHERE loanDate >= date('now', '-30 days')
                    GROUP BY status
                `,
                priority: 'medium',
                maxTime: 200
            },
            {
                name: 'Full-text search simulation',
                sql: 'SELECT * FROM computers WHERE name LIKE ? OR notes LIKE ?',
                params: ['%test%', '%test%'],
                priority: 'medium',
                maxTime: 100
            }
        ],
        
        concurrentQueries: {
            threads: 10,
            queriesPerThread: 50,
            timeout: 30000
        }
    },

    // Tests WebSocket
    websocket: {
        messageTypes: [
            'data_updated',
            'chat_message_new',
            'notification',
            'ai_message',
            'system_status'
        ],
        testScenarios: {
            basic: {
                connections: 10,
                messagesPerConnection: 20,
                interval: 1000
            },
            stress: {
                connections: 100,
                messagesPerConnection: 100,
                interval: 500
            },
            soak: {
                connections: 50,
                messagesPerConnection: 1000,
                interval: 100,
                duration: 600000 // 10 minutes
            }
        }
    },

    // Configuration du profilage mémoire
    memory: {
        intervals: {
            short: 1000,    // 1 seconde
            medium: 5000,   // 5 secondes
            long: 15000     // 15 secondes
        },
        metrics: [
            'heapUsed',
            'heapTotal',
            'external',
            'arrayBuffers',
            'rss',
            'cpuPercent'
        ],
        alerts: {
            heapGrowth: 100 * 1024 * 1024, // 100MB
            rssGrowth: 200 * 1024 * 1024   // 200MB
        }
    },

    // Configuration GED
    ged: {
        testFiles: {
            text: [
                { name: 'test1.txt', size: 1024, type: 'text/plain' },
                { name: 'test2.txt', size: 10 * 1024, type: 'text/plain' },
                { name: 'test3.txt', size: 100 * 1024, type: 'text/plain' }
            ],
            image: [
                { name: 'image1.png', size: 500 * 1024, type: 'image/png' },
                { name: 'image2.jpg', size: 1024 * 1024, type: 'image/jpeg' }
            ],
            pdf: [
                { name: 'doc1.pdf', size: 2 * 1024 * 1024, type: 'application/pdf' },
                { name: 'doc2.pdf', size: 10 * 1024 * 1024, type: 'application/pdf' }
            ]
        },
        operations: [
            'upload',
            'index',
            'search',
            'download',
            'preview'
        ]
    },

    // Configuration des rapports
    reporting: {
        outputDir: path.join(__dirname, 'results'),
        formats: ['json', 'html', 'csv'],
        includeDetails: true,
        includeCharts: true
    },

    // Environnements de test
    environments: {
        development: {
            concurrency: 'low',
            duration: 'short'
        },
        staging: {
            concurrency: 'medium',
            duration: 'medium'
        },
        production: {
            concurrency: 'high',
            duration: 'long'
        }
    }
};

// Fonction pour obtenir la configuration selon l'environnement
function getConfig(env = process.env.NODE_ENV || 'development') {
    const baseConfig = module.exports;
    const envConfig = baseConfig.environments[env] || {};
    
    return {
        ...baseConfig,
        ...envConfig,
        environment: env
    };
}

module.exports.getConfig = getConfig;