/**
 * Service OCR Amélioré avec Gemini Vision
 * Pipeline: OCR Tesseract → Gemini Vision pour structuration intelligente
 */

const Tesseract = require('tesseract.js');
const geminiService = require('./geminiService');
const fs = require('fs').promises;
const path = require('path');

class EnhancedOCRService {
    constructor() {
        this.tesseractWorker = null;
        this.initialized = false;
    }

    /**
     * Initialise Tesseract OCR
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('[EnhancedOCR] Initialisation Tesseract...');
            this.tesseractWorker = await Tesseract.createWorker('fra+eng+spa', 1, {
                logger: m => console.log('[Tesseract]', m)
            });
            this.initialized = true;
            console.log('[EnhancedOCR] ✅ Tesseract prêt');
        } catch (error) {
            console.error('[EnhancedOCR] ❌ Erreur init:', error);
            this.initialized = false;
        }
    }

    /**
     * 🎯 PIPELINE COMPLET: OCR + Gemini Vision Structuration
     */
    async analyzeDocumentComplete(imageBuffer, options = {}) {
        try {
            console.log('[EnhancedOCR] 🚀 Début pipeline complet');

            // === ÉTAPE 1: OCR Tesseract (extraction brute) ===
            console.log('[EnhancedOCR] 📝 Étape 1/3: OCR Tesseract...');
            const ocrResult = await this.extractTextOCR(imageBuffer, options);

            if (!ocrResult.success) {
                return {
                    success: false,
                    error: 'Échec extraction OCR',
                    details: ocrResult.error
                };
            }

            const rawText = ocrResult.text;
            const confidence = ocrResult.confidence;

            console.log(`[EnhancedOCR] ✅ OCR terminé: ${rawText.length} caractères (confiance: ${confidence}%)`);

            // === ÉTAPE 2: Gemini Vision (structuration intelligente) ===
            console.log('[EnhancedOCR] 🧠 Étape 2/3: Structuration Gemini Vision...');

            const geminiPrompt = this.buildStructurationPrompt(rawText, options);
            const geminiResult = await geminiService.analyzeImagesWithText(
                geminiPrompt,
                [imageBuffer]
            );

            if (!geminiResult.success) {
                console.warn('[EnhancedOCR] ⚠️ Gemini non disponible, retour OCR brut');
                return {
                    success: true,
                    method: 'ocr_only',
                    rawText: rawText,
                    confidence: confidence,
                    structuredData: null
                };
            }

            // === ÉTAPE 3: Fusion et enrichissement ===
            console.log('[EnhancedOCR] 🔗 Étape 3/3: Fusion résultats...');

            const finalResult = {
                success: true,
                method: 'ocr_gemini_pipeline',
                rawText: rawText,
                ocrConfidence: confidence,
                structuredData: this.parseGeminiResponse(geminiResult.response),
                geminiResponse: geminiResult.response,
                metadata: {
                    imageSize: imageBuffer.length,
                    ocrEngine: 'Tesseract',
                    aiEngine: geminiService.config?.models?.vision || 'gemini-2.0-flash-exp',
                    processedAt: new Date().toISOString()
                }
            };

            console.log('[EnhancedOCR] ✅ Pipeline terminé avec succès');
            return finalResult;

        } catch (error) {
            console.error('[EnhancedOCR] ❌ Erreur pipeline:', error);
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }

    /**
     * Extraction OCR brute avec Tesseract
     */
    async extractTextOCR(imageBuffer, options = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            if (!this.tesseractWorker) {
                throw new Error('Tesseract worker non initialisé');
            }

            const result = await this.tesseractWorker.recognize(imageBuffer);

            return {
                success: true,
                text: result.data.text,
                confidence: result.data.confidence,
                words: result.data.words,
                lines: result.data.lines
            };
        } catch (error) {
            console.error('[EnhancedOCR] Erreur OCR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Construit le prompt de structuration pour Gemini
     */
    buildStructurationPrompt(rawText, options = {}) {
        const documentType = options.documentType || 'auto';

        let prompt = `Tu es un expert en structuration de documents scannés.

**TEXTE BRUT OCR:**
${rawText}

**TÂCHE:**
Analyse ce texte et structure-le intelligemment selon le type de document.

**DÉTECTE LE TYPE:**
- Facture/Devis: Extrais N°, Date, Montant HT/TTC, TVA, Client, Fournisseur
- Bon de livraison: Extrais N°, Date, Expéditeur, Destinataire, Articles, Quantités
- Contrat: Extrais Parties, Dates, Clauses importantes, Montants
- Courrier: Extrais Expéditeur, Destinataire, Date, Objet, Corps
- Tableau Excel: Convertis en tableau structuré avec colonnes/lignes
- Autre: Structure de façon logique

**FORMAT DE SORTIE:**
Renvoie JSON structuré avec:
\`\`\`json
{
  "type": "facture|bon_livraison|contrat|courrier|tableau|autre",
  "champs": {
    // Champs extraits selon type
  },
  "resume": "Résumé court du document",
  "actions_suggerees": ["action1", "action2"]
}
\`\`\`

**IMPORTANT:**
- Sois précis dans l'extraction
- Corrige les erreurs OCR évidentes
- Identifie les montants, dates, numéros
- Propose actions pertinentes (archiver, payer, signer, etc.)`;

        return prompt;
    }

    /**
     * Parse la réponse Gemini en structure JSON
     */
    parseGeminiResponse(response) {
        try {
            // Extraire JSON si présent entre ```json et ```
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // Tentative parse direct
            return JSON.parse(response);
        } catch (error) {
            console.warn('[EnhancedOCR] Impossible de parser JSON, retour texte brut');
            return {
                type: 'texte_non_structure',
                resume: response.substring(0, 200),
                contenu_complet: response
            };
        }
    }

    /**
     * Analyse spécifique pour factures
     */
    async analyzeInvoice(imageBuffer) {
        return await this.analyzeDocumentComplete(imageBuffer, {
            documentType: 'facture'
        });
    }

    /**
     * Analyse spécifique pour tableaux Excel scannés
     */
    async analyzeExcelScan(imageBuffer) {
        return await this.analyzeDocumentComplete(imageBuffer, {
            documentType: 'tableau'
        });
    }

    /**
     * Nettoyage
     */
    async cleanup() {
        if (this.tesseractWorker) {
            await this.tesseractWorker.terminate();
            this.tesseractWorker = null;
            this.initialized = false;
            console.log('[EnhancedOCR] Tesseract worker terminé');
        }
    }
}

module.exports = new EnhancedOCRService();
