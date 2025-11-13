/**
 * 🧠 Moteur de Suggestions Ultra-Intelligentes DocuCortex
 * Génération contextuelle multi-niveaux basée sur :
 * - Type de question (recherche, analyse, comparaison, etc.)
 * - Contexte métier Anecoop (commercial, qualité, production, RH, logistique)
 * - Contexte temporel (matin, après-midi, soir)
 * - Sources trouvées (type fichier, nombre, pertinence)
 * - Historique conversation (patterns, sujets récurrents)
 */

class SmartSuggestionsEngine {
    constructor() {
        // Mots-clés métier Anecoop France
        this.businessKeywords = {
            commercial: ['offre', 'prix', 'devis', 'facture', 'commande', 'client', 'vente', 'marché'],
            qualite: ['qualité', 'norme', 'certification', 'audit', 'contrôle', 'iso', 'haccp'],
            production: ['production', 'récolte', 'stock', 'inventaire', 'palettes', 'emballage'],
            rh: ['formation', 'congé', 'recrutement', 'contrat', 'paie', 'employé', 'équipe'],
            logistique: ['transport', 'livraison', 'expédition', 'réception', 'camion', 'palette']
        };

        // Types de questions
        this.questionTypes = {
            search: ['cherche', 'trouve', 'recherche', 'où est', 'localise', 'search', 'find'],
            analyze: ['résume', 'analyse', 'explique', 'qu\'est-ce', 'comment', 'pourquoi'],
            general: ['météo', 'heure', 'calcul', 'weather', 'time', 'calculate', 'bonjour', 'salut'],
            compare: ['compare', 'différence', 'versus', 'vs', 'entre', 'contraste'],
            list: ['liste', 'tous les', 'affiche', 'montre', 'list', 'show all', 'énumère'],
            create: ['créer', 'générer', 'faire', 'produire', 'create', 'generate', 'build']
        };

        // Suggestions métier par domaine
        this.metierSuggestions = {
            commercial: [
                '💰 Dernières offres de prix',
                '📊 Chiffre d\'affaires mensuel',
                '👥 Nouveaux clients ce mois',
                '📈 Évolution commandes'
            ],
            qualite: [
                '✅ Certifications en cours',
                '📋 Audits récents',
                '🔬 Rapports de contrôle qualité',
                '📊 Indicateurs qualité'
            ],
            production: [
                '🌾 Planning de récolte',
                '📦 État des stocks actuels',
                '🚜 Disponibilité équipements',
                '📊 Production du jour'
            ],
            rh: [
                '👤 Formations planifiées',
                '📅 Calendrier des congés',
                '📄 Contrats à renouveler',
                '📊 Effectifs par service'
            ],
            logistique: [
                '🚚 Expéditions du jour',
                '📍 Suivi des livraisons',
                '📦 Réceptions en attente',
                '🗺️ Planning transport'
            ]
        };
    }

    /**
     * Génère suggestions multi-niveaux ultra-intelligentes
     */
    generate(userQuery, response, conversationHistory = []) {
        const lowerQuery = userQuery.toLowerCase();

        const suggestions = {
            primary: [],    // Actions principales (max 4)
            secondary: [],  // Questions de suivi (max 3)
            quick: [],      // Actions rapides (max 4)
            contextual: []  // Suggestions contextuelles additionnelles
        };

        // === 1. CONTEXTE TEMPOREL ===
        const timeContext = this.getTimeContext();

        // === 2. CONTEXTE MÉTIER ===
        const businessContext = this.detectBusinessContext(lowerQuery);

        // === 3. TYPE DE QUESTION ===
        const questionType = this.detectQuestionType(lowerQuery);

        // === 4. GÉNÉRER SUGGESTIONS PAR TYPE ===
        this.generateByQuestionType(questionType, suggestions, businessContext);

        // === 5. ENRICHIR AVEC SOURCES ===
        if (response.sources && response.sources.length > 0) {
            this.enrichWithSources(response.sources, suggestions);
        }

        // === 6. SUGGESTIONS MÉTIER ANECOOP ===
        if (businessContext && this.metierSuggestions[businessContext]) {
            suggestions.quick = this.metierSuggestions[businessContext];
        }

        // === 7. SUGGESTIONS TEMPORELLES ===
        this.addTimeBasedSuggestions(timeContext, suggestions);

        // === 8. SUGGESTIONS PRÉDICTIVES (historique) ===
        this.addPredictiveSuggestions(conversationHistory, suggestions);

        // === 9. NETTOYER ET LIMITER ===
        return {
            primary: this.unique(suggestions.primary).slice(0, 4),
            secondary: this.unique(suggestions.secondary).slice(0, 3),
            quick: this.unique(suggestions.quick).slice(0, 4),
            contextual: this.unique(suggestions.contextual).slice(0, 2)
        };
    }

    /**
     * Détecte le contexte temporel
     */
    getTimeContext() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    }

    /**
     * Détecte le contexte métier Anecoop
     */
    detectBusinessContext(query) {
        for (const [domain, keywords] of Object.entries(this.businessKeywords)) {
            if (keywords.some(kw => query.includes(kw))) {
                return domain;
            }
        }
        return null;
    }

    /**
     * Détecte le type de question
     */
    detectQuestionType(query) {
        for (const [type, keywords] of Object.entries(this.questionTypes)) {
            if (keywords.some(kw => query.includes(kw))) {
                return type;
            }
        }
        return 'general';
    }

    /**
     * Génère suggestions par type de question
     */
    generateByQuestionType(type, suggestions, businessContext) {
        switch (type) {
            case 'search':
                suggestions.primary = [
                    '🔍 Affiner recherche avancée',
                    '📊 Statistiques résultats',
                    '📁 Grouper par catégorie',
                    '⏰ Filtrer par période'
                ];
                suggestions.secondary = [
                    'Documents similaires trouvés',
                    'Exporter liste résultats CSV',
                    'Créer alerte nouveaux documents'
                ];
                break;

            case 'analyze':
                suggestions.primary = [
                    '📝 Synthèse détaillée complète',
                    '🔗 Documents connexes',
                    '📊 Visualiser graphiquement',
                    '💾 Exporter rapport PDF'
                ];
                suggestions.secondary = [
                    'Comparer version précédente',
                    'Extraire tableaux chiffres',
                    'Générer PowerPoint résumé'
                ];
                break;

            case 'compare':
                suggestions.primary = [
                    '📊 Tableau comparatif détaillé',
                    '🎯 Différences principales',
                    '✅ Points communs identifiés',
                    '📈 Évolution dans le temps'
                ];
                suggestions.secondary = [
                    'Ajouter 3ème document',
                    'Historique versions complètes',
                    'Export Excel comparaison'
                ];
                break;

            case 'list':
                suggestions.primary = [
                    '📋 Liste complète triée',
                    '🎯 Filtrer critères',
                    '📊 Vue tableau détaillé',
                    '📥 Export Excel complet'
                ];
                break;

            case 'create':
                suggestions.primary = [
                    '✨ Générer automatiquement',
                    '📝 Utiliser modèle type',
                    '🔧 Personnaliser format',
                    '💾 Sauvegarder brouillon'
                ];
                break;

            case 'general':
            default:
                suggestions.primary = [
                    '📂 Rechercher documents GED',
                    '📤 Upload nouveau fichier',
                    '📊 Tableau de bord activité',
                    '⚡ Raccourcis disponibles'
                ];
                break;
        }
    }

    /**
     * Enrichit avec informations des sources trouvées
     */
    enrichWithSources(sources, suggestions) {
        const firstSource = sources[0];
        const fileExt = firstSource.filename?.split('.').pop()?.toLowerCase();

        suggestions.quick = [
            `📂 Ouvrir ${this.truncate(firstSource.filename, 20)}`,
            '🗂️ Voir dossier parent',
            '📥 Télécharger tout (ZIP)',
            '🔗 Copier chemin réseau'
        ];

        // Suggestions spécifiques par type de fichier
        const fileTypeSuggestions = {
            'pdf': ['📖 OCR extraction texte', '✂️ Découper par pages', '🖼️ Extraire images'],
            'xlsx': ['📊 Créer graphiques', '🔢 Analyser données', '📈 Tendances détectées'],
            'xls': ['📊 Créer graphiques', '🔢 Analyser données', '📈 Tendances détectées'],
            'docx': ['📝 Convertir PDF', '✏️ Extraire citations', '📋 Plan du document'],
            'doc': ['📝 Convertir PDF', '✏️ Extraire citations', '📋 Plan du document'],
            'jpg': ['🖼️ Analyser image OCR', '🎨 Améliorer qualité', '📐 Redimensionner'],
            'jpeg': ['🖼️ Analyser image OCR', '🎨 Améliorer qualité', '📐 Redimensionner'],
            'png': ['🖼️ Analyser image OCR', '🎨 Améliorer qualité', '📐 Redimensionner']
        };

        if (fileTypeSuggestions[fileExt]) {
            suggestions.secondary.push(...fileTypeSuggestions[fileExt]);
        }

        // Si plusieurs sources, ajouter suggestions de groupe
        if (sources.length > 1) {
            suggestions.contextual.push(
                `📚 Comparer les ${sources.length} documents`,
                '🔀 Fusionner en un seul',
                '📊 Analyse croisée complète'
            );
        }
    }

    /**
     * Ajoute suggestions basées sur l'heure
     */
    addTimeBasedSuggestions(timeContext, suggestions) {
        const timeBasedSuggestions = {
            morning: [
                '☕ Documents reçus cette nuit',
                '📅 Planning de la journée',
                '🔔 Rappels urgents du jour'
            ],
            afternoon: [
                '📊 Rapport activité matinée',
                '✅ Tâches restantes à faire',
                '📥 Nouveaux documents reçus'
            ],
            evening: [
                '✅ Résumé de la journée',
                '📋 Préparer demain',
                '📊 Indicateurs du jour'
            ],
            night: [
                '🌙 Documents pour demain',
                '📋 Checklist matinale',
                '💤 Activer mode nuit'
            ]
        };

        if (timeBasedSuggestions[timeContext]) {
            suggestions.contextual.push(...timeBasedSuggestions[timeContext]);
        }
    }

    /**
     * Ajoute suggestions prédictives basées sur l'historique
     */
    addPredictiveSuggestions(history, suggestions) {
        if (!history || history.length < 3) return;

        const recentTopics = history
            .slice(-10)
            .filter(m => m.type === 'user')
            .map(m => m.content?.toLowerCase() || '');

        // Détection de patterns
        const patterns = {
            'prix': '📈 Évolution prix 3 derniers mois',
            'stock': '📊 État global stocks temps réel',
            'client': '👥 Liste clients actifs',
            'facture': '💰 Factures en attente paiement',
            'commande': '📦 Commandes en cours',
            'transport': '🚚 Planning livraisons semaine',
            'qualité': '✅ Derniers rapports qualité',
            'formation': '👤 Catalogue formations disponibles'
        };

        for (const [keyword, suggestion] of Object.entries(patterns)) {
            const count = recentTopics.filter(t => t.includes(keyword)).length;
            if (count >= 2) {
                suggestions.contextual.push(suggestion);
            }
        }
    }

    /**
     * Utilitaires
     */
    unique(arr) {
        return [...new Set(arr)];
    }

    truncate(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }
}

// Export singleton
export default new SmartSuggestionsEngine();
