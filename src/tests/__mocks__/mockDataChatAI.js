/**
 * Mock data spécifiques aux tests Chat DocuCortex IA
 * Données simulées réalistes pour tous les scénarios de test
 */

// Messages de chat simulés
export const createMockMessage = (overrides = {}) => ({
    id: `msg_${Date.now()}_${Math.random()}`,
    type: 'user', // 'user' | 'assistant'
    content: 'Message de test',
    timestamp: new Date(),
    confidence: 0.9,
    sources: [],
    suggestions: [],
    isWelcome: false,
    isError: false,
    ...overrides
});

// Conversations simulées
export const createMockConversation = (messages = []) => {
    const defaultMessages = [
        {
            user_message: 'Bonjour, quels documents sont disponibles ?',
            ai_response: 'Bonjour ! J\'ai accès à plusieurs types de documents : contrats commerciaux, rapports financiers, documents RH, etc. Que souhaitez-vous rechercher ?',
            confidence_score: 0.95,
            sources: JSON.stringify([
                { documentId: 'doc1', filename: 'contrat_commercial.pdf', score: 92 },
                { documentId: 'doc2', filename: 'rapport_financier.pdf', score: 88 }
            ]),
            created_at: new Date().toISOString()
        },
        {
            user_message: 'Montre-moi les contrats récents',
            ai_response: 'Voici les contrats des 6 derniers mois disponibles dans la base :\n\n1. **Contrat Commercial 2024** (contrat_commercial_2024.pdf)\n   - Date : 15 mars 2024\n   - Client : Entreprise ABC\n   - Montant : 45 000€\n\n2. **Accord de Partenariat** (partenariat_2024.pdf)\n   - Date : 28 février 2024\n   - Partenaire : Société XYZ\n   - Durée : 3 ans',
            confidence_score: 0.91,
            sources: JSON.stringify([
                { documentId: 'doc3', filename: 'contrat_commercial_2024.pdf', score: 98 },
                { documentId: 'doc4', filename: 'partenariat_2024.pdf', score: 94 }
            ]),
            created_at: new Date(Date.now() - 86400000).toISOString() // 1 jour ago
        }
    ];

    return {
        success: true,
        conversations: messages.length > 0 ? messages : defaultMessages
    };
};

// Documents simulés
export const createMockDocument = (overrides = {}) => ({
    id: `doc_${Date.now()}_${Math.random()}`,
    filename: 'document_test.pdf',
    file_type: 'pdf',
    file_size: 2048000, // 2MB
    language: 'fr',
    indexed_at: new Date().toISOString(),
    metadata: JSON.stringify({
        wordCount: 1500,
        pages: 15,
        qualityScore: 95,
        category: 'Commercial',
        tags: ['contrat', 'commercial', '2024']
    }),
    ...overrides
});

// Liste de documents pour tests volumineux
export const createMockDocumentList = (count = 10) => {
    const documentTypes = ['pdf', 'docx', 'xlsx', 'txt'];
    const categories = ['Commercial', 'RH', 'Finance', 'IT', 'Juridique'];
    const languages = ['fr', 'en', 'es'];

    return Array.from({ length: count }, (_, i) => 
        createMockDocument({
            id: `doc_${i + 1}`,
            filename: `document_${i + 1}.${documentTypes[i % documentTypes.length]}`,
            file_type: documentTypes[i % documentTypes.length],
            file_size: Math.floor(Math.random() * 10000000) + 50000, // 50KB à 10MB
            language: languages[i % languages.length],
            indexed_at: new Date(Date.now() - (i * 86400000)).toISOString(), // i jours ago
            metadata: JSON.stringify({
                wordCount: Math.floor(Math.random() * 5000) + 100,
                pages: Math.floor(Math.random() * 50) + 1,
                qualityScore: Math.floor(Math.random() * 20) + 80, // 80-100%
                category: categories[i % categories.length],
                tags: [`tag${i + 1}`, `category${i % 3}`]
            })
        })
    );
};

// Configuration réseau simulée
export const createMockNetworkConfig = (overrides = {}) => ({
    serverPath: '\\\\192.168.1.230\\Donnees',
    workingDirectory: '',
    autoIndex: true,
    scanInterval: 30, // minutes
    maxFileSize: 100, // MB
    ...overrides
});

// Résultat de test réseau simulé
export const createMockNetworkTestResult = (overrides = {}) => ({
    success: true,
    path: '\\\\192.168.1.230\\Donnees',
    responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
    connectionStatus: 'connected',
    accessibleShares: ['Donnees', 'Backup', 'Temp'],
    ...overrides
});

// Résultat d'upload simulé
export const createMockUploadResult = (overrides = {}) => ({
    success: true,
    documentId: `uploaded_${Date.now()}`,
    filename: 'document_uploaded.pdf',
    language: 'fr',
    wordCount: 1250,
    chunksCount: 18,
    processingTime: Math.random() * 5 + 1, // 1-6 secondes
    qualityScore: Math.floor(Math.random() * 15) + 85, // 85-100%
    message: 'Document uploadé et indexé avec succès',
    ...overrides
});

// Statistiques simulées
export const createMockStatistics = (overrides = {}) => ({
    success: true,
    database: {
        totalDocuments: 156,
        totalConversations: 42,
        totalChunks: 2847,
        averageWordsPerChunk: 145,
        lastIndexTime: new Date().toISOString()
    },
    sessions: {
        activeSessions: 3,
        totalSessionsToday: 15,
        averageSessionDuration: 12.5 // minutes
    },
    performance: {
        averageResponseTime: 1.2, // secondes
        totalQueriesToday: 89,
        cacheHitRate: 0.87
    },
    ...overrides
});

// Réponse AI simulée
export const createMockResponse = (overrides = {}) => ({
    success: true,
    response: 'Réponse générée par DocuCortex basée sur les documents analysés.',
    confidence: 0.92,
    sources: [
        { documentId: 'doc1', filename: 'document_source_1.pdf', score: 95 },
        { documentId: 'doc2', filename: 'document_source_2.pdf', score: 87 }
    ],
    suggestions: [
        'Voir les détails du premier document',
        'Comparer avec d\'autres documents similaires',
        'Exporter cette information'
    ],
    metadata: {
        processingTime: 1.5,
        documentsSearched: 23,
        chunksAnalyzed: 45,
        modelUsed: 'docucortex-v2',
        tokensGenerated: 256
    },
    attachments: [
        {
            documentId: 'doc1',
            filename: 'document_source_1.pdf',
            canPreview: true,
            canDownload: true
        }
    ],
    ...overrides
});

// Fichiers réseau simulés pour scan
export const createMockNetworkFiles = (count = 10) => {
    const fileTypes = [
        { extension: 'pdf', type: 'Document PDF', color: 'error' },
        { extension: 'docx', type: 'Document Word', color: 'primary' },
        { extension: 'xlsx', type: 'Feuille Excel', color: 'success' },
        { extension: 'txt', type: 'Fichier Texte', color: 'action' },
        { extension: 'pptx', type: 'Présentation', color: 'warning' }
    ];

    const categories = ['Commercial', 'RH', 'Finance', 'IT', 'Juridique', 'Marketing'];
    const languages = ['fr', 'en', 'es'];

    return Array.from({ length: count }, (_, i) => {
        const fileType = fileTypes[i % fileTypes.length];
        const fileName = `${categories[i % categories.length]}_${fileType.type.replace(/\s+/g, '_')}_2024.${fileType.extension}`;
        const fileSize = Math.floor(Math.random() * 5000000) + 100000; // 100KB à 5MB
        
        return {
            name: fileName,
            path: `\\\\192.168.1.230\\Donnees\\${fileName}`,
            size: fileSize,
            extension: fileType.extension,
            modified: new Date(Date.now() - (Math.random() * 30 * 86400000)).toISOString(), // 0-30 jours ago
            metadata: {
                type: fileType.type,
                category: categories[i % categories.length],
                language: languages[i % languages.length],
                wordCount: Math.floor(Math.random() * 3000) + 200,
                qualityScore: Math.floor(Math.random() * 20) + 80, // 80-100%
                pages: Math.floor(Math.random() * 30) + 1
            }
        };
    });
};

// Erreurs simulées
export const createMockError = (type = 'network', overrides = {}) => {
    const errors = {
        network: {
            message: 'Erreur de connexion réseau',
            code: 'NETWORK_ERROR',
            details: 'Impossible de se connecter au serveur réseau'
        },
        upload: {
            message: 'Échec de l\'upload du document',
            code: 'UPLOAD_ERROR',
            details: 'Le fichier est trop volumineux ou invalide'
        },
        ai: {
            message: 'Service IA indisponible',
            code: 'AI_SERVICE_ERROR',
            details: 'Le service DocuCortex ne répond pas'
        },
        auth: {
            message: 'Erreur d\'authentification',
            code: 'AUTH_ERROR',
            details: 'Session expirée ou permissions insuffisantes'
        },
        database: {
            message: 'Erreur base de données',
            code: 'DB_ERROR',
            details: 'Impossible d\'accéder aux données'
        }
    };

    return {
        success: false,
        error: errors[type] || errors.network,
        ...overrides
    };
};

// Préférences utilisateur simulées
export const createMockUserPreferences = (overrides = {}) => ({
    theme: 'light', // 'light' | 'dark'
    chatSound: true,
    autoSave: true,
    language: 'fr',
    model: 'default', // 'default' | 'advanced' | 'specialized'
    notifications: {
        email: false,
        desktop: true,
        sound: true
    },
    interface: {
        compactView: false,
        showTimestamps: true,
        showConfidence: true,
        showSources: true
    },
    privacy: {
        saveHistory: true,
        shareAnalytics: false,
        allowTraining: true
    },
    ...overrides
});

// Utilitaires de génération
export const generateRandomText = (length = 100) => {
    const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat'.split(' ');
    const text = [];
    
    for (let i = 0; i < length; i++) {
        text.push(words[Math.floor(Math.random() * words.length)]);
    }
    
    return text.join(' ');
};

export const generateRandomDate = (daysAgo = 30) => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - (Math.random() * daysAgo * 24 * 60 * 60 * 1000));
    return pastDate.toISOString();
};

export const generateMockFile = (name, size = 1024 * 1024, type = 'application/pdf') => {
    const content = generateRandomText(size / 10); // Estimation rough
    return new File([content], name, { type });
};

// Constantes pour les tests
export const TEST_CONSTANTS = {
    MAX_RENDER_TIME: 100, // ms
    MAX_INTERACTION_TIME: 50, // ms
    MAX_MEMORY_INCREASE: 10 * 1024 * 1024, // 10MB
    TEST_FILE_SIZES: {
        SMALL: 1024, // 1KB
        MEDIUM: 1024 * 1024, // 1MB
        LARGE: 10 * 1024 * 1024 // 10MB
    },
    PERFORMANCE_THRESHOLDS: {
        RENDER: 200, // ms
        INTERACTION: 100, // ms
        MEMORY: 50 * 1024 * 1024, // 50MB
        THROUGHPUT: 10 // messages/seconde
    }
};