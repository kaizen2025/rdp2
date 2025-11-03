/**
 * Mock data spécialisés pour les tests de performance
 * Génère des données volumineuses et réalistes pour les benchmarks
 */

import {
    createMockDocument,
    createMockMessage,
    createMockConversation,
    createMockUploadResult,
    createMockStatistics,
    createMockResponse,
    generateRandomText
} from './mockDataChatAI';

// ==================== GÉNÉRATION DE DONNÉES VOLUMINEUSES ====================

/**
 * Générer un historique de conversation volumineux
 */
export const generateLargeHistory = (messageCount = 100, options = {}) => {
    const {
        includeSources = true,
        includeSuggestions = true,
        confidenceRange = [0.7, 0.98],
        includeMetadata = true
    } = options;

    const messages = Array.from({ length: messageCount }, (_, i) => {
        const questionNumber = i + 1;
        const baseConfidence = confidenceRange[0] + (Math.random() * (confidenceRange[1] - confidenceRange[0]));
        
        // Types de questions réalistes
        const questionTypes = [
            `Quels sont les documents concernant le projet ${questionNumber} ?`,
            `Peux-tu me faire un résumé du contrat ${questionNumber} ?`,
            `cherche-moi les factures du mois ${questionNumber % 12 + 1}`,
            `Quelles sont les spécifications techniques du document ${questionNumber} ?`,
            `Montre-moi l'historique des modifications pour le fichier ${questionNumber}`,
            `Compare les documents ${questionNumber} et ${questionNumber + 1}`,
            `Quels sont les échéances importantes mentionnées dans le document ${questionNumber} ?`,
            `Extrais les informations clés du rapport ${questionNumber}`,
            `Peux-tu analyser la tendances dans le document ${questionNumber} ?`,
            `Quels sont les points d'action identifiés dans le document ${questionNumber} ?`
        ];
        
        const responseTemplates = [
            `Voici les informations demandées pour le document ${questionNumber}. Basé sur l'analyse, je peux vous fournir les détails suivants :\n\n${generateRandomText(50)}\n\nLes points clés incluent :\n- Information principale ${questionNumber}\n- Détails techniques\n- Recommandations`,
            `J'ai analysé les documents relatifs à votre demande. Pour le document ${questionNumber}, voici ce que j'ai trouvé :\n\n${generateRandomText(75)}\n\nConfiance de l'analyse : ${Math.round(baseConfidence * 100)}%`,
            `D'après ma recherche dans la base documentaire, voici les résultats pour votre requête concernant le document ${questionNumber} :\n\n${generateRandomText(60)}\n\nSouhaitez-vous que je vous donne plus de détails sur un aspect spécifique ?`,
            `Analyse du document ${questionNumber} terminée. Voici le résumé des éléments principaux :\n\n${generateRandomText(80)}\n\nLe document semble être de qualité ${baseConfidence > 0.9 ? 'excellente' : 'bonne'} avec un score de confiance de ${Math.round(baseConfidence * 100)}%.`,
            `Recherche effectuée avec succès pour le document ${questionNumber}. Les informations extraites sont :\n\n${generateRandomText(65)}\n\nSources analysées : ${Math.floor(Math.random() * 10) + 5} documents similaires`
        ];

        const sources = includeSources ? Array.from({ 
            length: Math.floor(Math.random() * 5) + 1 
        }, (_, j) => ({
            documentId: `doc_large_${questionNumber}_${j}`,
            filename: `document_performance_${questionNumber}_${j}.pdf`,
            score: Math.floor(Math.random() * 20) + 80 // 80-100%
        })) : [];

        const suggestions = includeSuggestions ? [
            `Voir plus de détails sur le document ${questionNumber}`,
            `Analyser les documents similaires`,
            `Exporter ces informations`,
            `Créer un rapport basé sur ces données`
        ].slice(0, Math.floor(Math.random() * 3) + 1) : [];

        const metadata = includeMetadata ? {
            processingTime: Math.random() * 3 + 0.5, // 0.5-3.5s
            documentsSearched: Math.floor(Math.random() * 50) + 10,
            chunksAnalyzed: Math.floor(Math.random() * 100) + 20,
            modelUsed: 'docucortex-v2-performance',
            tokensGenerated: Math.floor(Math.random() * 500) + 100,
            cacheHit: Math.random() > 0.3
        } : {};

        return {
            user_message: questionTypes[i % questionTypes.length],
            ai_response: responseTemplates[i % responseTemplates.length],
            confidence_score: baseConfidence,
            sources: JSON.stringify(sources),
            created_at: new Date(Date.now() - (messageCount - i) * 60000).toISOString(),
            metadata: JSON.stringify(metadata)
        };
    });

    return {
        success: true,
        conversations: messages
    };
};

/**
 * Générer une liste de documents volumineux
 */
export const generateLargeDocumentList = (documentCount = 1000, options = {}) => {
    const {
        includeMetadata = true,
        includeVariousTypes = true,
        sizeRange = [10000, 50 * 1024 * 1024], // 10KB à 50MB
        languageDistribution = { fr: 0.7, en: 0.2, es: 0.1 }
    } = options;

    const documentTypes = includeVariousTypes ? [
        'pdf', 'docx', 'xlsx', 'pptx', 'txt', 'rtf', 'odt', 'csv'
    ] : ['pdf', 'docx', 'txt'];

    const categories = [
        'Commercial', 'RH', 'Finance', 'IT', 'Juridique', 
        'Marketing', 'Opérations', 'Qualité', 'Sécurité', 'Conformité'
    ];

    const languages = Object.keys(languageDistribution);
    const languageWeights = Object.values(languageDistribution);

    return Array.from({ length: documentCount }, (_, i) => {
        const docType = documentTypes[i % documentTypes.length];
        const category = categories[i % categories.length];
        
        // Sélection de langue pondérée
        const languageIndex = Math.random() < languageWeights[0] ? 0 : 
                             Math.random() < (languageWeights[1] / (1 - languageWeights[0])) ? 1 : 2;
        const language = languages[languageIndex];

        const fileSize = Math.floor(
            sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0])
        );

        const wordCount = Math.floor(fileSize / 100); // Estimation grossière
        const pages = Math.floor(wordCount / 250); // Estimation: 250 mots par page

        const metadata = includeMetadata ? {
            wordCount,
            pages,
            qualityScore: Math.floor(Math.random() * 20) + 80,
            category,
            language,
            tags: [
                `category_${category.toLowerCase()}`,
                `type_${docType}`,
                `lang_${language}`,
                `year_2024`,
                `month_${(i % 12) + 1}`
            ],
            author: `Auteur_${i % 50}`,
            lastModified: new Date(Date.now() - (i * 86400000)).toISOString(),
            checksum: `sha256_${Math.random().toString(36).substr(2, 16)}`,
            processingTime: Math.random() * 10 + 1,
            indexedChunks: Math.floor(wordCount / 100) // Chunk de ~100 mots
        } : null;

        return createMockDocument({
            id: `perf_doc_${i + 1}`,
            filename: `document_perf_${category.toLowerCase()}_${i + 1}.${docType}`,
            file_type: docType,
            file_size: fileSize,
            language: language,
            indexed_at: new Date(Date.now() - (i * 3600000)).toISOString(), // i heures ago
            metadata: metadata ? JSON.stringify(metadata) : null
        });
    });
};

/**
 * Générer des statistiques volumineuses
 */
export const generateLargeStatistics = (options = {}) => {
    const {
        documentCount = 10000,
        conversationCount = 5000,
        daysOfHistory = 365
    } = options;

    const now = new Date();
    const dayCount = Math.min(daysOfHistory, 30); // Limiter pour les tests

    // Générer des statistiques par jour
    const dailyStats = Array.from({ length: dayCount }, (_, i) => {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const baseActivity = Math.floor(Math.random() * 100) + 20;
        
        return {
            date: date.toISOString().split('T')[0],
            documentsIndexed: Math.floor(baseActivity * 0.3),
            conversations: Math.floor(baseActivity * 0.5),
            queries: Math.floor(baseActivity * 0.8),
            activeUsers: Math.floor(baseActivity * 0.1)
        };
    });

    return {
        success: true,
        database: {
            totalDocuments: documentCount,
            totalConversations: conversationCount,
            totalChunks: Math.floor(documentCount * 15), // ~15 chunks par doc
            averageWordsPerChunk: Math.floor(Math.random() * 50) + 125,
            lastIndexTime: now.toISOString(),
            storageUsed: documentCount * 2.5 * 1024 * 1024, // ~2.5MB par doc
            compressionRatio: 0.75 + (Math.random() * 0.2)
        },
        sessions: {
            activeSessions: Math.floor(Math.random() * 20) + 5,
            totalSessionsToday: Math.floor(Math.random() * 100) + 50,
            averageSessionDuration: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
            peakConcurrentUsers: Math.floor(Math.random() * 15) + 10,
            totalUniqueUsers: Math.floor(Math.random() * 500) + 200
        },
        performance: {
            averageResponseTime: Math.random() * 2 + 0.5, // 0.5-2.5s
            totalQueriesToday: Math.floor(Math.random() * 1000) + 500,
            cacheHitRate: 0.7 + (Math.random() * 0.25),
            errorRate: Math.random() * 0.05, // <5%
            throughput: Math.floor(Math.random() * 50) + 100, // req/min
            modelAccuracy: 0.85 + (Math.random() * 0.1) // 85-95%
        },
        usage: {
            dailyStats,
            mostActiveHours: [9, 10, 14, 15, 16], // Heures de pointe
            topCategories: [
                { category: 'Commercial', percentage: 35 },
                { category: 'Finance', percentage: 25 },
                { category: 'RH', percentage: 20 },
                { category: 'IT', percentage: 15 },
                { category: 'Autres', percentage: 5 }
            ],
            languageDistribution: [
                { language: 'fr', percentage: 70 },
                { language: 'en', percentage: 20 },
                { language: 'es', percentage: 10 }
            ]
        },
        system: {
            uptime: 99.5 + (Math.random() * 0.4), // 99.5-99.9%
            memoryUsage: 60 + (Math.random() * 30), // 60-90%
            cpuUsage: 20 + (Math.random() * 40), // 20-60%
            diskUsage: 40 + (Math.random() * 30), // 40-70%
            networkLatency: Math.random() * 100 + 10 // 10-110ms
        }
    };
};

// ==================== UTILITAIRES DE PERFORMANCE ====================

/**
 * Mesurer le temps d'exécution d'une fonction
 */
export const measureExecutionTime = async (fn, ...args) => {
    const startTime = performance.now();
    const result = await fn(...args);
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    return {
        result,
        executionTime,
        timestamp: new Date().toISOString()
    };
};

/**
 * Simuler une charge serveur
 */
export const simulateServerLoad = (concurrentRequests = 10, duration = 1000) => {
    const requests = Array.from({ length: concurrentRequests }, (_, i) => 
        measureExecutionTime(async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            return `Response ${i} at ${Date.now()}`;
        })
    );

    const startTime = performance.now();
    
    return Promise.all(requests).then(results => {
        const endTime = performance.now();
        const totalDuration = endTime - startTime;
        
        return {
            totalRequests: concurrentRequests,
            totalDuration,
            averageResponseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / concurrentRequests,
            requestsPerSecond: concurrentRequests / (totalDuration / 1000),
            minResponseTime: Math.min(...results.map(r => r.executionTime)),
            maxResponseTime: Math.max(...results.map(r => r.executionTime)),
            results
        };
    });
};

/**
 * Générer des données de test pour la mémoire
 */
export const generateMemoryTestData = (sizeMB = 10) => {
    const targetBytes = sizeMB * 1024 * 1024;
    const chunks = [];
    const chunkSize = 1024 * 1024; // 1MB chunks
    
    for (let i = 0; i < Math.floor(targetBytes / chunkSize); i++) {
        chunks.push({
            id: `chunk_${i}`,
            data: generateRandomText(chunkSize / 10), // Estimation rough
            timestamp: new Date().toISOString(),
            metadata: {
                size: chunkSize,
                checksum: Math.random().toString(36).substr(2, 16)
            }
        });
    }
    
    return {
        totalChunks: chunks.length,
        totalSizeMB: (chunks.length * chunkSize) / (1024 * 1024),
        chunks
    };
};

// ==================== PROFILS DE PERFORMANCE ====================

export const performanceProfiles = {
    // Profil léger pour tests rapides
    light: {
        messageCount: 10,
        documentCount: 50,
        historySize: 'small',
        loadTest: { concurrentRequests: 5, duration: 500 }
    },
    
    // Profil moyen pour tests standards
    medium: {
        messageCount: 50,
        documentCount: 200,
        historySize: 'medium',
        loadTest: { concurrentRequests: 10, duration: 1000 }
    },
    
    // Profil lourd pour tests de charge
    heavy: {
        messageCount: 200,
        documentCount: 1000,
        historySize: 'large',
        loadTest: { concurrentRequests: 25, duration: 2000 }
    },
    
    // Profil extrême pour tests de stress
    extreme: {
        messageCount: 500,
        documentCount: 5000,
        historySize: 'extreme',
        loadTest: { concurrentRequests: 50, duration: 5000 }
    }
};

// ==================== BENCHMARKS STANDARDS ====================

export const benchmarkThresholds = {
    render: {
        excellent: 50,   // ms
        good: 100,       // ms
        acceptable: 200, // ms
        poor: 500        // ms
    },
    
    interaction: {
        excellent: 16,   // ms (60fps)
        good: 50,        // ms
        acceptable: 100, // ms
        poor: 200        // ms
    },
    
    memory: {
        excellent: 10,   // MB
        good: 50,        // MB
        acceptable: 100, // MB
        poor: 200        // MB
    },
    
    throughput: {
        excellent: 20,   // ops/sec
        good: 10,        // ops/sec
        acceptable: 5,   // ops/sec
        poor: 2          // ops/sec
    }
};

/**
 * Évaluer une performance contre les seuils
 */
export const evaluatePerformance = (metric, value, thresholds = benchmarkThresholds) => {
    const metricThresholds = thresholds[metric];
    if (!metricThresholds) {
        return { level: 'unknown', value };
    }
    
    let level = 'poor';
    if (value <= metricThresholds.excellent) level = 'excellent';
    else if (value <= metricThresholds.good) level = 'good';
    else if (value <= metricThresholds.acceptable) level = 'acceptable';
    
    return { level, value, thresholds: metricThresholds };
};

export default {
    generateLargeHistory,
    generateLargeDocumentList,
    generateLargeStatistics,
    measureExecutionTime,
    simulateServerLoad,
    generateMemoryTestData,
    performanceProfiles,
    benchmarkThresholds,
    evaluatePerformance
};