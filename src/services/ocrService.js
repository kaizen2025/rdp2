import apiService from './apiService';

/**
 * Service OCR pour l'extraction de texte et l'analyse de documents
 * Fait le lien avec les endpoints backend /ai/documents/upload et /ai/analyze-document
 */

/**
 * Extrait le texte d'un fichier
 * @param {File} file - Le fichier à traiter
 * @returns {Promise<string>} - Le texte extrait
 */
export const extractText = async (file) => {
    try {
        // 1. Upload du document
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await apiService.request('/ai/documents/upload', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.success) {
            throw new Error(uploadResponse.error || 'Erreur lors de l\'upload');
        }

        const documentId = uploadResponse.documentId;

        // 2. Récupération du contenu complet
        const docResponse = await apiService.request(`/ai/documents/${documentId}`);

        if (!docResponse.success || !docResponse.document) {
            throw new Error('Impossible de récupérer le contenu du document');
        }

        return docResponse.document.content || '';
    } catch (error) {
        console.error('Erreur extractText:', error);
        throw error;
    }
};

/**
 * Traite un document (OCR + Analyse optionnelle)
 * @param {File} file - Le fichier à traiter
 * @param {Object} options - Options de traitement
 * @returns {Promise<Object>} - Résultat du traitement
 */
export const processDocument = async (file, options = {}) => {
    const { analyze = false, onProgress } = options;

    try {
        if (onProgress) onProgress(10, 'upload', { filename: file.name });

        // 1. Upload et Extraction
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await apiService.request('/ai/documents/upload', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.success) {
            throw new Error(uploadResponse.error || 'Erreur lors de l\'upload');
        }

        if (onProgress) onProgress(50, 'fetching_content', { filename: file.name });

        const documentId = uploadResponse.documentId;
        const docResponse = await apiService.request(`/ai/documents/${documentId}`);

        if (!docResponse.success || !docResponse.document) {
            throw new Error('Impossible de récupérer le contenu du document');
        }

        const text = docResponse.document.content || '';
        let analysisResult = null;

        // 2. Analyse (si demandée)
        if (analyze && text) {
            if (onProgress) onProgress(70, 'analyzing', { filename: file.name });

            try {
                const analysisResponse = await apiService.request('/ai/analyze-document', {
                    method: 'POST',
                    body: JSON.stringify({
                        text: text,
                        type: file.type,
                        model: options.model
                    })
                });

                if (analysisResponse.success) {
                    analysisResult = analysisResponse.data.analysis;
                }
            } catch (analyzeError) {
                console.warn('Erreur lors de l\'analyse:', analyzeError);
                // On ne bloque pas le processus si l'analyse échoue, on retourne juste le texte
            }
        }

        if (onProgress) onProgress(100, 'completed', { filename: file.name });

        return {
            text: text,
            confidence: 0.95, // Valeur simulée car le backend ne renvoie pas de score global OCR
            analysis: analysisResult,
            processed_at: new Date().toISOString(),
            metadata: docResponse.document
        };

    } catch (error) {
        console.error('Erreur processDocument:', error);
        throw error;
    }
};

/**
 * Traite un lot de documents
 * @param {Array<File>} files - Liste des fichiers
 * @param {Object} options - Options de traitement
 * @returns {Promise<Array>} - Liste des résultats
 */
export const processBatchDocuments = async (files, options = {}) => {
    const results = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
        const file = files[i];
        try {
            // Mise à jour de la progression globale via le callback
            if (options.onProgress) {
                options.onProgress({
                    progress: Math.round((i / total) * 100),
                    filename: file.name,
                    current: i + 1,
                    total: total
                });
            }

            const result = await processDocument(file, {
                ...options,
                onProgress: null // On gère la progression globale ici
            });

            results.push({
                success: true,
                data: result,
                filename: file.name
            });
        } catch (error) {
            results.push({
                success: false,
                error: error.message,
                filename: file.name
            });
        }
    }

    if (options.onProgress) {
        options.onProgress({
            progress: 100,
            filename: '',
            current: total,
            total: total
        });
    }

    return results;
};

const ocrService = {
    extractText,
    processDocument,
    processBatchDocuments
};

export default ocrService;
