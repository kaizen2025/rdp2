/**
 * Mock du service API pour les tests Chat DocuCortex IA
 * Simule toutes les réponses API nécessaires aux tests
 */

// Import des données mock
import {
    createMockConversation,
    createMockDocumentList,
    createMockNetworkConfig,
    createMockNetworkTestResult,
    createMockUploadResult,
    createMockStatistics,
    createMockResponse,
    createMockError,
    createMockUserPreferences
} from './mockDataChatAI';

// Configuration par défaut des mocks
let mockConfig = {
    delay: 100, // ms de délai simulé
    shouldFail: false,
    failureRate: 0, // Pourcentage d'échec simulé
    customResponses: {}
};

// Fonctions utilitaires pour les mocks
const delay = (ms = mockConfig.delay) => new Promise(resolve => setTimeout(resolve, ms));

const shouldFail = () => {
    if (mockConfig.shouldFail) return true;
    if (mockConfig.failureRate > 0) {
        return Math.random() < (mockConfig.failureRate / 100);
    }
    return false;
};

const getCustomResponse = (method, ...args) => {
    const key = `${method}_${JSON.stringify(args)}`;
    return mockConfig.customResponses[key];
};

// Configuration du mock
export const configureMockApi = (config = {}) => {
    mockConfig = { ...mockConfig, ...config };
};

export const resetMockApi = () => {
    mockConfig = {
        delay: 100,
        shouldFail: false,
        failureRate: 0,
        customResponses: {}
    };
};

// API Chat DocuCortex
export const getAIConversationHistory = async (sessionId) => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Conversation non trouvée');
    }
    
    const customResponse = getCustomResponse('getAIConversationHistory', sessionId);
    if (customResponse) {
        return customResponse;
    }
    
    // Générer un historique en fonction du sessionId
    if (sessionId.includes('empty')) {
        return { success: true, conversations: [] };
    }
    
    if (sessionId.includes('large')) {
        // Générer un historique volumineux pour les tests de performance
        const largeHistory = Array.from({ length: 50 }, (_, i) => ({
            user_message: `Question ${i + 1}`,
            ai_response: `Réponse détaillée ${i + 1} avec beaucoup de contenu pour tester les performances. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
            confidence_score: 0.8 + (Math.random() * 0.2),
            sources: JSON.stringify([]),
            created_at: new Date(Date.now() - (50 - i) * 60000).toISOString()
        }));
        return { success: true, conversations: largeHistory };
    }
    
    return createMockConversation();
};

export const sendAIMessage = async (sessionId, message) => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Service IA indisponible');
    }
    
    const customResponse = getCustomResponse('sendAIMessage', sessionId, message);
    if (customResponse) {
        return customResponse;
    }
    
    // Simuler différents types de réponses en fonction du message
    if (message.toLowerCase().includes('erreur') || message.toLowerCase().includes('erreur')) {
        return createMockError('ai');
    }
    
    if (message.toLowerCase().includes('contrat')) {
        return createMockResponse({
            response: 'Voici les contrats disponibles :\n\n1. Contrat Commercial 2024\n2. Accord de Partenariat\n3. Contrat de Maintenance',
            sources: [
                { documentId: 'doc1', filename: 'contrat_commercial_2024.pdf', score: 98 },
                { documentId: 'doc2', filename: 'partenariat_2024.pdf', score: 94 }
            ],
            suggestions: [
                'Voir les détails du contrat 2024',
                'Consulter les conditions',
                'Télécharger le document'
            ]
        });
    }
    
    return createMockResponse();
};

// API Documents
export const getAIDocuments = async () => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Impossible de charger les documents');
    }
    
    const customResponse = getCustomResponse('getAIDocuments');
    if (customResponse) {
        return customResponse;
    }
    
    return {
        success: true,
        documents: createMockDocumentList(10)
    };
};

export const uploadAIDocument = async (file) => {
    await delay(2000); // Upload plus long
    
    if (shouldFail()) {
        throw new Error('Erreur API: Upload échoué');
    }
    
    const customResponse = getCustomResponse('uploadAIDocument', file);
    if (customResponse) {
        return customResponse;
    }
    
    return createMockUploadResult({
        filename: file.name,
        documentId: `uploaded_${Date.now()}_${Math.random()}`
    });
};

export const deleteAIDocument = async (documentId) => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Suppression échouée');
    }
    
    const customResponse = getCustomResponse('deleteAIDocument', documentId);
    if (customResponse) {
        return customResponse;
    }
    
    return { success: true, message: 'Document supprimé avec succès' };
};

export const downloadDocument = async (documentId) => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Téléchargement échoué');
    }
    
    const customResponse = getCustomResponse('downloadDocument', documentId);
    if (customResponse) {
        return customResponse;
    }
    
    // Simuler un téléchargement
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${btoa('Contenu PDF simulé')}`;
    link.download = `document_${documentId}.pdf`;
    link.click();
    
    return { success: true, message: 'Téléchargement iniciado' };
};

export const getDocumentPreview = async (documentId) => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Aperçu indisponible');
    }
    
    const customResponse = getCustomResponse('getDocumentPreview', documentId);
    if (customResponse) {
        return customResponse;
    }
    
    return {
        success: true,
        preview: {
            content: 'Contenu du document en aperçu...',
            pages: 5,
            format: 'PDF'
        }
    };
};

// API Statistiques
export const getAIStatistics = async () => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Statistiques indisponibles');
    }
    
    const customResponse = getCustomResponse('getAIStatistics');
    if (customResponse) {
        return customResponse;
    }
    
    return createMockStatistics();
};

// API Préférences
export const getUserPreferences = async () => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Préférences indisponibles');
    }
    
    const customResponse = getCustomResponse('getUserPreferences');
    if (customResponse) {
        return customResponse;
    }
    
    return {
        success: true,
        preferences: createMockUserPreferences()
    };
};

export const updateUserPreferences = async (preferences) => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Mise à jour échouée');
    }
    
    const customResponse = getCustomResponse('updateUserPreferences', preferences);
    if (customResponse) {
        return customResponse;
    }
    
    return { success: true, message: 'Préférences mises à jour' };
};

// API Configuration réseau
export const configureNetwork = async (config) => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Configuration réseau échouée');
    }
    
    const customResponse = getCustomResponse('configureNetwork', config);
    if (customResponse) {
        return customResponse;
    }
    
    return { success: true, message: 'Configuration sauvegardée' };
};

export const testNetworkConnection = async () => {
    await delay(500);
    
    if (shouldFail()) {
        throw new Error('Erreur API: Test connexion échoué');
    }
    
    const customResponse = getCustomResponse('testNetworkConnection');
    if (customResponse) {
        return customResponse;
    }
    
    return createMockNetworkTestResult();
};

export const startNetworkWatch = async () => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Démarrage surveillance échoué');
    }
    
    const customResponse = getCustomResponse('startNetworkWatch');
    if (customResponse) {
        return customResponse;
    }
    
    return { success: true, message: 'Surveillance démarrée' };
};

export const stopNetworkWatch = async () => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Arrêt surveillance échoué');
    }
    
    const customResponse = getCustomResponse('stopNetworkWatch');
    if (customResponse) {
        return customResponse;
    }
    
    return { success: true, message: 'Surveillance arrêtée' };
};

// API Conversations
export const exportConversation = async (sessionId, mode) => {
    await delay();
    
    if (shouldFail()) {
        throw new Error('Erreur API: Export échoué');
    }
    
    const customResponse = getCustomResponse('exportConversation', sessionId, mode);
    if (customResponse) {
        return customResponse;
    }
    
    const conversationHistory = await getAIConversationHistory(sessionId);
    const content = conversationHistory.conversations
        .map(conv => `Q: ${conv.user_message}\nA: ${conv.ai_response}\n`)
        .join('\n---\n\n');
    
    return {
        success: true,
        content,
        filename: `conversation_${mode}_${sessionId}.txt`
    };
};

// API Authentification (mock basique)
export const getCurrentUser = async () => {
    await delay(50);
    
    if (shouldFail()) {
        throw new Error('Erreur API: Authentification échouée');
    }
    
    const customResponse = getCustomResponse('getCurrentUser');
    if (customResponse) {
        return customResponse;
    }
    
    return {
        success: true,
        user: {
            id: 'user_123',
            username: 'testuser',
            role: 'ged_specialist',
            permissions: [
                'ged_upload:create',
                'ged_delete:delete',
                'ged_network_scan:admin',
                'chat_ged:*',
                'ai_assistant:*'
            ]
        }
    };
};

// Configuration export pour les tests
export const mockApiService = {
    // Chat DocuCortex
    getAIConversationHistory,
    sendAIMessage,
    
    // Documents
    getAIDocuments,
    uploadAIDocument,
    deleteAIDocument,
    downloadDocument,
    getDocumentPreview,
    
    // Statistiques
    getAIStatistics,
    
    // Préférences
    getUserPreferences,
    updateUserPreferences,
    
    // Réseau
    configureNetwork,
    testNetworkConnection,
    startNetworkWatch,
    stopNetworkWatch,
    
    // Conversations
    exportConversation,
    
    // Auth
    getCurrentUser,
    
    // Configuration
    configureMockApi,
    resetMockApi
};

export default mockApiService;