/**
 * Service de catégorisation automatique des documents
 * Utilise Gemini Vision pour analyser et classifier les documents
 */

const geminiService = require('./geminiService');
const path = require('path');

class DocumentCategorizationService {
    constructor() {
        this.categories = [
            {
                name: 'Factures',
                keywords: ['facture', 'invoice', 'montant', 'ht', 'ttc', 'tva', 'total', 'payer', 'échéance'],
                patterns: /(?:facture|invoice|n[°º]\s*\d+|montant|total)/i,
                confidence: 0
            },
            {
                name: 'Devis',
                keywords: ['devis', 'quote', 'estimation', 'proposition', 'tarif'],
                patterns: /(?:devis|quote|proposition\s+commerciale|estimation)/i,
                confidence: 0
            },
            {
                name: 'Contrats',
                keywords: ['contrat', 'contract', 'accord', 'convention', 'engagement', 'signataire'],
                patterns: /(?:contrat|contract|convention|accord|engagement)/i,
                confidence: 0
            },
            {
                name: 'Rapports',
                keywords: ['rapport', 'report', 'analyse', 'étude', 'bilan', 'synthèse'],
                patterns: /(?:rapport|report|analyse|étude|bilan)/i,
                confidence: 0
            },
            {
                name: 'Correspondance',
                keywords: ['lettre', 'courrier', 'email', 'objet', 'cher', 'cordialement'],
                patterns: /(?:objet\s*:|cher|cordialement|sincères\s+salutations)/i,
                confidence: 0
            },
            {
                name: 'Documents Légaux',
                keywords: ['loi', 'juridique', 'legal', 'tribunal', 'avocat', 'jugement', 'arrêt'],
                patterns: /(?:tribunal|juridique|avocat|jugement|code\s+civil)/i,
                confidence: 0
            },
            {
                name: 'Ressources Humaines',
                keywords: ['rh', 'hr', 'employé', 'salaire', 'congé', 'embauche', 'cv', 'candidature'],
                patterns: /(?:employé|salaire|congé|candidature|curriculum|cv)/i,
                confidence: 0
            },
            {
                name: 'Comptabilité',
                keywords: ['comptable', 'accounting', 'bilan', 'compte', 'débit', 'crédit', 'amortissement'],
                patterns: /(?:bilan\s+comptable|actif|passif|compte\s+de\s+résultat)/i,
                confidence: 0
            },
            {
                name: 'Marketing',
                keywords: ['marketing', 'publicité', 'campagne', 'stratégie', 'client', 'marché'],
                patterns: /(?:campagne|stratégie\s+marketing|publicité|promotion)/i,
                confidence: 0
            },
            {
                name: 'Technique',
                keywords: ['technique', 'technical', 'spécification', 'manuel', 'guide', 'procédure'],
                patterns: /(?:manuel|guide|procédure|spécification\s+technique)/i,
                confidence: 0
            }
        ];

        this.metadataPatterns = {
            date: /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g,
            amount: /(?:€|EUR|euros?)\s*(\d+(?:[.,]\d{2})?)|(\d+(?:[.,]\d{2})?)\s*(?:€|EUR|euros?)/gi,
            email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            phone: /(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}/g,
            reference: /(?:ref|référence|n°|no|num)[\s:]*([A-Z0-9-]+)/gi,
            siret: /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b/g,
            siren: /\b\d{3}\s?\d{3}\s?\d{3}\b/g
        };
    }

    /**
     * 🤖 Catégorisation automatique avec Gemini Vision
     */
    async categorizeDocument(filePath, content = null, options = {}) {
        try {
            console.log('[DocCategorization] Analyse du document:', filePath);

            const result = {
                success: true,
                filePath,
                category: null,
                confidence: 0,
                suggestedCategories: [],
                metadata: {},
                suggestedFilename: null,
                tags: []
            };

            // Étape 1: Analyse textuelle si contenu fourni
            if (content) {
                const textAnalysis = this.analyzeTextContent(content);
                result.metadata = textAnalysis.metadata;
                result.tags = textAnalysis.tags;

                // Score de confiance basique par mots-clés
                const categoryScores = this.calculateCategoryScores(content);
                result.suggestedCategories = categoryScores.slice(0, 3);

                if (categoryScores.length > 0 && categoryScores[0].score > 0.5) {
                    result.category = categoryScores[0].category;
                    result.confidence = categoryScores[0].score;
                }
            }

            // Étape 2: Analyse visuelle avec Gemini (si image ou PDF avec OCR)
            const ext = path.extname(filePath).toLowerCase();
            const visualFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.pdf'];

            if (visualFormats.includes(ext) && geminiService.isInitialized()) {
                try {
                    const geminiAnalysis = await this.analyzeWithGemini(filePath, content);

                    if (geminiAnalysis.success) {
                        // Fusionner les résultats
                        result.category = geminiAnalysis.category || result.category;
                        result.confidence = Math.max(result.confidence, geminiAnalysis.confidence);
                        result.metadata = { ...result.metadata, ...geminiAnalysis.metadata };
                        result.tags = [...new Set([...result.tags, ...geminiAnalysis.tags])];

                        // Suggestions de catégories combinées
                        const combinedSuggestions = this.mergeCategorySuggestions(
                            result.suggestedCategories,
                            geminiAnalysis.suggestedCategories
                        );
                        result.suggestedCategories = combinedSuggestions.slice(0, 3);
                    }
                } catch (geminiError) {
                    console.warn('[DocCategorization] Analyse Gemini échouée:', geminiError.message);
                }
            }

            // Étape 3: Génération du nom de fichier standardisé
            if (result.category && result.metadata) {
                result.suggestedFilename = this.generateStandardFilename(
                    result.category,
                    result.metadata,
                    path.basename(filePath)
                );
            }

            console.log('[DocCategorization] ✅ Catégorie:', result.category, `(${Math.round(result.confidence * 100)}%)`);

            return result;

        } catch (error) {
            console.error('[DocCategorization] ❌ Erreur:', error);
            return {
                success: false,
                error: error.message,
                filePath
            };
        }
    }

    /**
     * 📊 Analyse du contenu textuel
     */
    analyzeTextContent(content) {
        const metadata = {};
        const tags = [];

        // Extraction des dates
        const dates = content.match(this.metadataPatterns.date);
        if (dates && dates.length > 0) {
            metadata.dates = [...new Set(dates)].slice(0, 5);
            tags.push('daté');
        }

        // Extraction des montants
        const amounts = content.match(this.metadataPatterns.amount);
        if (amounts && amounts.length > 0) {
            const parsedAmounts = amounts.map(a => {
                const num = parseFloat(a.replace(/[^\d,.-]/g, '').replace(',', '.'));
                return isNaN(num) ? 0 : num;
            }).filter(n => n > 0);

            if (parsedAmounts.length > 0) {
                metadata.amounts = parsedAmounts;
                metadata.totalAmount = Math.max(...parsedAmounts);
                tags.push('montant');
            }
        }

        // Extraction des emails
        const emails = content.match(this.metadataPatterns.email);
        if (emails && emails.length > 0) {
            metadata.emails = [...new Set(emails)];
            tags.push('email');
        }

        // Extraction des téléphones
        const phones = content.match(this.metadataPatterns.phone);
        if (phones && phones.length > 0) {
            metadata.phones = [...new Set(phones)];
            tags.push('téléphone');
        }

        // Extraction des références
        const references = [];
        let refMatch;
        while ((refMatch = this.metadataPatterns.reference.exec(content)) !== null) {
            references.push(refMatch[1]);
        }
        if (references.length > 0) {
            metadata.references = [...new Set(references)];
            tags.push('référencé');
        }

        // Extraction SIRET/SIREN
        const siret = content.match(this.metadataPatterns.siret);
        if (siret && siret.length > 0) {
            metadata.siret = [...new Set(siret)];
            tags.push('SIRET');
        }

        const siren = content.match(this.metadataPatterns.siren);
        if (siren && siren.length > 0 && !siret) {
            metadata.siren = [...new Set(siren)];
            tags.push('SIREN');
        }

        // Longueur du document
        metadata.wordCount = content.split(/\s+/).length;
        metadata.charCount = content.length;

        return { metadata, tags };
    }

    /**
     * 🎯 Calcul des scores par catégorie (basé sur mots-clés)
     */
    calculateCategoryScores(content) {
        const contentLower = content.toLowerCase();
        const scores = [];

        this.categories.forEach(category => {
            let score = 0;

            // Score basé sur les mots-clés
            const keywordMatches = category.keywords.filter(kw =>
                contentLower.includes(kw.toLowerCase())
            );
            score += keywordMatches.length * 0.1;

            // Score basé sur les patterns regex
            if (category.patterns.test(content)) {
                score += 0.3;
            }

            // Normaliser le score entre 0 et 1
            score = Math.min(score, 1);

            if (score > 0) {
                scores.push({
                    category: category.name,
                    score,
                    matchedKeywords: keywordMatches
                });
            }
        });

        // Trier par score décroissant
        scores.sort((a, b) => b.score - a.score);

        return scores;
    }

    /**
     * 🔮 Analyse avec Gemini Vision (pour images et PDF)
     */
    async analyzeWithGemini(filePath, textContent = null) {
        try {
            const prompt = `Analyse ce document et fournis:
1. **Catégorie principale** parmi: ${this.categories.map(c => c.name).join(', ')}
2. **Confiance** (0-100%)
3. **Métadonnées clés**: dates importantes, montants, références, noms de sociétés
4. **Tags** (3-5 mots-clés descriptifs)
5. **Suggestions de catégories alternatives** (2-3)

${textContent ? `Contenu textuel extrait:\n${textContent.substring(0, 2000)}...` : ''}

Réponds au format JSON:
{
    "category": "Catégorie",
    "confidence": 0.85,
    "metadata": {
        "date": "2025-01-15",
        "amount": 1250.50,
        "reference": "FAC-2025-001",
        "company": "Nom société"
    },
    "tags": ["tag1", "tag2"],
    "suggestedCategories": [
        {"category": "Cat1", "score": 0.7},
        {"category": "Cat2", "score": 0.5}
    ],
    "reasoning": "Explication courte"
}`;

            const response = await geminiService.generateContent(prompt, {
                useJsonMode: true,
                temperature: 0.3
            });

            if (!response.success) {
                throw new Error(response.error || 'Gemini analysis failed');
            }

            // Parser la réponse JSON
            let analysis = {};
            if (typeof response.text === 'string') {
                analysis = JSON.parse(response.text);
            } else {
                analysis = response.text;
            }

            return {
                success: true,
                category: analysis.category || null,
                confidence: (analysis.confidence || 0) / 100,
                metadata: analysis.metadata || {},
                tags: analysis.tags || [],
                suggestedCategories: (analysis.suggestedCategories || []).map(s => ({
                    category: s.category,
                    score: s.score
                })),
                reasoning: analysis.reasoning || ''
            };

        } catch (error) {
            console.error('[DocCategorization] Erreur Gemini Vision:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🔄 Fusion des suggestions de catégories
     */
    mergeCategorySuggestions(suggestions1, suggestions2) {
        const merged = new Map();

        [...suggestions1, ...suggestions2].forEach(sugg => {
            const existing = merged.get(sugg.category);
            if (existing) {
                // Moyenne des scores
                existing.score = (existing.score + sugg.score) / 2;
            } else {
                merged.set(sugg.category, { ...sugg });
            }
        });

        return Array.from(merged.values()).sort((a, b) => b.score - a.score);
    }

    /**
     * 📝 Génération d'un nom de fichier standardisé
     */
    generateStandardFilename(category, metadata, originalFilename) {
        const ext = path.extname(originalFilename);
        const parts = [];

        // Format: [Catégorie]_[Date]_[Référence]_[Description]

        // 1. Catégorie (abrégée)
        const categoryAbbr = {
            'Factures': 'FAC',
            'Devis': 'DEV',
            'Contrats': 'CTR',
            'Rapports': 'RAP',
            'Correspondance': 'COR',
            'Documents Légaux': 'LEG',
            'Ressources Humaines': 'RH',
            'Comptabilité': 'CPT',
            'Marketing': 'MKT',
            'Technique': 'TEC'
        };
        parts.push(categoryAbbr[category] || 'DOC');

        // 2. Date (si disponible)
        if (metadata.dates && metadata.dates.length > 0) {
            const date = metadata.dates[0];
            const normalized = date.replace(/[\/\-\.]/g, '');
            parts.push(normalized);
        } else {
            // Date du jour
            const today = new Date();
            const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
            parts.push(dateStr);
        }

        // 3. Référence (si disponible)
        if (metadata.references && metadata.references.length > 0) {
            const ref = metadata.references[0].replace(/[^A-Z0-9]/gi, '');
            parts.push(ref.substring(0, 20));
        }

        // 4. Montant (si facture/devis)
        if (['Factures', 'Devis'].includes(category) && metadata.totalAmount) {
            parts.push(`${Math.round(metadata.totalAmount)}EUR`);
        }

        // 5. Description (basée sur le nom original)
        const originalBase = path.basename(originalFilename, ext)
            .replace(/[^a-z0-9]+/gi, '_')
            .substring(0, 30);
        parts.push(originalBase);

        // Construction finale
        const filename = parts.join('_') + ext;

        return filename;
    }

    /**
     * 🗂️ Catégorisation par lots (batch)
     */
    async categorizeDocuments(documents, options = {}) {
        console.log(`[DocCategorization] Catégorisation par lots: ${documents.length} documents`);

        const results = [];

        for (const doc of documents) {
            try {
                const result = await this.categorizeDocument(doc.filePath, doc.content, options);
                results.push(result);

                // Petit délai pour ne pas surcharger l'API Gemini
                if (geminiService.isInitialized()) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error(`[DocCategorization] Erreur pour ${doc.filePath}:`, error);
                results.push({
                    success: false,
                    filePath: doc.filePath,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`[DocCategorization] ✅ Terminé: ${successCount}/${documents.length} réussis`);

        return {
            success: true,
            total: documents.length,
            successCount,
            results
        };
    }

    /**
     * 📈 Statistiques de catégorisation
     */
    getCategorizationStats(results) {
        const stats = {
            total: results.length,
            categorized: 0,
            uncategorized: 0,
            byCategory: {},
            avgConfidence: 0,
            highConfidence: 0, // > 80%
            mediumConfidence: 0, // 50-80%
            lowConfidence: 0 // < 50%
        };

        let totalConfidence = 0;

        results.forEach(result => {
            if (result.success && result.category) {
                stats.categorized++;
                totalConfidence += result.confidence;

                // Par catégorie
                if (!stats.byCategory[result.category]) {
                    stats.byCategory[result.category] = 0;
                }
                stats.byCategory[result.category]++;

                // Par niveau de confiance
                if (result.confidence > 0.8) {
                    stats.highConfidence++;
                } else if (result.confidence > 0.5) {
                    stats.mediumConfidence++;
                } else {
                    stats.lowConfidence++;
                }
            } else {
                stats.uncategorized++;
            }
        });

        if (stats.categorized > 0) {
            stats.avgConfidence = totalConfidence / stats.categorized;
        }

        return stats;
    }
}

// Export singleton
const documentCategorizationService = new DocumentCategorizationService();

module.exports = documentCategorizationService;
