/**
 * Service OCR Avancé - DocuCortex
 * Support multi-langues (FR, EN, ES)
 * Extraction de texte depuis images et PDF scannés
 */

const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const { createWorker } = Tesseract;

class OCRService {
    constructor() {
        this.worker = null;
        this.initialized = false;
        this.supportedLanguages = ['fra', 'eng', 'spa']; // Français, Anglais, Espagnol
        this.defaultLanguages = 'fra+eng+spa'; // Toutes langues par défaut
        this.stats = {
            totalProcessed: 0,
            successfulProcessed: 0,
            failedProcessed: 0,
            totalCharactersExtracted: 0,
            averageProcessingTime: 0
        };
    }

    /**
     * Initialise le worker Tesseract avec les langues
     */
    async initialize(languages = this.defaultLanguages) {
        if (this.initialized && this.worker) {
            return { success: true, message: 'OCR déjà initialisé' };
        }

        try {
            console.log('🔧 Initialisation du service OCR avec langues:', languages);

            this.worker = await createWorker({
                logger: m => {
                    if (m.status === 'loading tesseract core') {
                        console.log('📦 Chargement Tesseract Core...');
                    } else if (m.status === 'initializing tesseract') {
                        console.log('⚙️ Initialisation Tesseract...');
                    } else if (m.status === 'loading language traineddata') {
                        console.log(`📚 Chargement données langues: ${m.progress}%`);
                    }
                }
            });

            // Charger les langues
            const langList = languages.split('+');
            for (const lang of langList) {
                await this.worker.loadLanguage(lang);
            }

            await this.worker.initialize(languages);

            this.initialized = true;
            console.log('✅ Service OCR initialisé avec succès');

            return {
                success: true,
                message: 'OCR initialisé',
                languages: langList
            };
        } catch (error) {
            console.error('❌ Erreur initialisation OCR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extrait le texte d'une image avec progression
     */
    async recognizeText(imageBuffer, options = {}) {
        const startTime = Date.now();
        this.stats.totalProcessed++;

        try {
            // Initialiser si nécessaire
            if (!this.initialized) {
                await this.initialize(options.languages || this.defaultLanguages);
            }

            const {
                languages = this.defaultLanguages,
                detectOrientation = true,
                onProgress = null
            } = options;

            console.log(`🔍 Reconnaissance OCR en cours (${languages})...`);

            // Reconnaître le texte avec progression
            const result = await this.worker.recognize(imageBuffer, {
                rotateAuto: detectOrientation
            }, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        if (onProgress) {
                            onProgress(progress);
                        }
                        if (progress % 10 === 0) {
                            console.log(`   📊 Progression: ${progress}%`);
                        }
                    }
                }
            });

            const processingTime = Date.now() - startTime;
            const extractedText = result.data.text;
            const confidence = result.data.confidence;

            // Statistiques
            this.stats.successfulProcessed++;
            this.stats.totalCharactersExtracted += extractedText.length;
            this._updateAverageProcessingTime(processingTime);

            console.log(`✅ OCR terminé: ${extractedText.length} caractères (${processingTime}ms, confiance: ${confidence.toFixed(1)}%)`);

            return {
                success: true,
                text: extractedText,
                confidence: confidence,
                language: this._detectLanguage(extractedText),
                words: result.data.words.length,
                lines: result.data.lines.length,
                blocks: result.data.blocks.length,
                processingTime: processingTime,
                metadata: {
                    languages: languages,
                    orientation: result.data.text_orientation,
                    script: result.data.script || 'latin'
                }
            };

        } catch (error) {
            this.stats.failedProcessed++;
            const processingTime = Date.now() - startTime;

            console.error('❌ Erreur OCR:', error.message);

            return {
                success: false,
                error: error.message,
                processingTime: processingTime
            };
        }
    }

    /**
     * Extrait le texte d'un PDF scanné (image-based PDF)
     */
    async recognizeFromPDF(pdfBuffer, options = {}) {
        try {
            console.log('📄 Traitement PDF scanné...');

            // Note: Pour un vrai PDF multi-pages, il faudrait pdf-poppler ou pdf2pic
            // Ici on traite le PDF comme une image

            const result = await this.recognizeText(pdfBuffer, {
                ...options,
                languages: options.languages || this.defaultLanguages
            });

            return {
                ...result,
                sourceType: 'pdf'
            };

        } catch (error) {
            console.error('❌ Erreur OCR PDF:', error);
            return {
                success: false,
                error: error.message,
                sourceType: 'pdf'
            };
        }
    }

    /**
     * Extrait le texte avec détection automatique de langue
     */
    async recognizeWithAutoLang(imageBuffer, options = {}) {
        try {
            // Première passe : détecter la langue dominante
            const quickResult = await this.recognizeText(imageBuffer, {
                languages: this.defaultLanguages,
                onProgress: options.onProgress
            });

            if (!quickResult.success) {
                return quickResult;
            }

            const detectedLang = this._detectLanguage(quickResult.text);
            console.log(`🌍 Langue détectée: ${detectedLang}`);

            // Deuxième passe avec la langue détectée pour meilleure précision
            if (detectedLang && this.supportedLanguages.includes(detectedLang)) {
                console.log(`🔄 Re-traitement avec langue optimisée: ${detectedLang}`);

                return await this.recognizeText(imageBuffer, {
                    languages: detectedLang,
                    onProgress: options.onProgress
                });
            }

            return {
                ...quickResult,
                detectedLanguage: detectedLang
            };

        } catch (error) {
            console.error('❌ Erreur reconnaissance auto-lang:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Traitement par lot (batch OCR)
     */
    async recognizeBatch(imageBuffers, options = {}) {
        try {
            console.log(`📚 Traitement batch de ${imageBuffers.length} images...`);

            const results = [];
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < imageBuffers.length; i++) {
                const imageBuffer = imageBuffers[i];

                console.log(`   [${i + 1}/${imageBuffers.length}] Traitement...`);

                const result = await this.recognizeText(imageBuffer, {
                    ...options,
                    onProgress: (progress) => {
                        if (options.onBatchProgress) {
                            options.onBatchProgress(i, imageBuffers.length, progress);
                        }
                    }
                });

                results.push(result);

                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            console.log(`✅ Batch terminé: ${successCount} succès, ${failCount} échecs`);

            return {
                success: true,
                results: results,
                summary: {
                    total: imageBuffers.length,
                    successful: successCount,
                    failed: failCount,
                    totalCharacters: results.reduce((sum, r) => sum + (r.text?.length || 0), 0)
                }
            };

        } catch (error) {
            console.error('❌ Erreur batch OCR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtient les statistiques du service
     */
    getStatistics() {
        const successRate = this.stats.totalProcessed > 0
            ? (this.stats.successfulProcessed / this.stats.totalProcessed * 100).toFixed(1)
            : 0;

        return {
            initialized: this.initialized,
            supportedLanguages: this.supportedLanguages,
            stats: {
                totalProcessed: this.stats.totalProcessed,
                successfulProcessed: this.stats.successfulProcessed,
                failedProcessed: this.stats.failedProcessed,
                successRate: `${successRate}%`,
                totalCharactersExtracted: this.stats.totalCharactersExtracted,
                averageProcessingTime: Math.round(this.stats.averageProcessingTime)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reset les statistiques
     */
    resetStatistics() {
        this.stats = {
            totalProcessed: 0,
            successfulProcessed: 0,
            failedProcessed: 0,
            totalCharactersExtracted: 0,
            averageProcessingTime: 0
        };
        console.log('📊 Statistiques OCR réinitialisées');
        return { success: true };
    }

    /**
     * Termine proprement le worker
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.initialized = false;
            console.log('🔌 Service OCR terminé');
        }
        return { success: true };
    }

    // ==================== MÉTHODES PRIVÉES ====================

    /**
     * Détecte la langue du texte (heuristique simple)
     */
    _detectLanguage(text) {
        if (!text || text.length < 10) return 'fra'; // Défaut français

        const sample = text.toLowerCase().substring(0, 1000);

        // Mots clés typiques par langue
        const frenchWords = ['le', 'la', 'les', 'de', 'des', 'un', 'une', 'et', 'dans', 'pour', 'que', 'qui'];
        const englishWords = ['the', 'and', 'of', 'to', 'in', 'is', 'for', 'on', 'with', 'as', 'that'];
        const spanishWords = ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'en', 'que', 'para', 'con'];

        const frenchCount = frenchWords.filter(word => sample.includes(` ${word} `)).length;
        const englishCount = englishWords.filter(word => sample.includes(` ${word} `)).length;
        const spanishCount = spanishWords.filter(word => sample.includes(` ${word} `)).length;

        // Retourner la langue avec le plus de matches
        if (frenchCount >= englishCount && frenchCount >= spanishCount) return 'fra';
        if (spanishCount >= englishCount) return 'spa';
        return 'eng';
    }

    /**
     * Met à jour le temps de traitement moyen
     */
    _updateAverageProcessingTime(processingTime) {
        if (this.stats.averageProcessingTime === 0) {
            this.stats.averageProcessingTime = processingTime;
        } else {
            this.stats.averageProcessingTime =
                (this.stats.averageProcessingTime + processingTime) / 2;
        }
    }
}

// Export singleton
module.exports = new OCRService();
